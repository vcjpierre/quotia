import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { authUrl } from "./auth-client";

let cached: { token: string; expiresAt: number } | null = null;

export function clearAuthToken(): void {
  cached = null;
}

export async function getAuthToken(force = false): Promise<string | null> {
  if (!force && cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  if (!authUrl) {
    return null;
  }

  try {
    const res = await fetch(`${authUrl}/token`, { credentials: "include" });

    if (!res.ok) {
      console.warn(`[auth] token fetch failed (${res.status})`);
      return null;
    }

    const data = await res.json();
    if (typeof data?.token === "string") {
      cached = { token: data.token, expiresAt: Date.now() + 10 * 60_000 };
      return data.token;
    }

    console.warn("[auth] token fetch failed (invalid-payload)");
  } catch {
    console.warn("[auth] token fetch failed (network)");
  }

  return null;
}

function withAuthHeaders(
  headers: Record<string, string>,
  token: string | null,
): Record<string, string> {
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

async function fetchWithAuth(url: string, init: RequestInit): Promise<Response> {
  const baseHeaders = (init.headers as Record<string, string> | undefined) ?? {};
  const token = await getAuthToken();
  const response = await fetch(url, {
    ...init,
    headers: withAuthHeaders(baseHeaders, token),
  });

  if (response.status !== 401) {
    return response;
  }

  clearAuthToken();
  const freshToken = await getAuthToken(true);
  if (!freshToken) {
    return response;
  }

  return fetch(url, {
    ...init,
    headers: withAuthHeaders(baseHeaders, freshToken),
  });
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetchWithAuth(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetchWithAuth(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
