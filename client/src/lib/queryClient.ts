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

function isJsonResponse(res: Response): boolean {
  return (res.headers.get("content-type") ?? "").includes("application/json");
}

/**
 * A static build served without the API (for example `vite preview`) answers
 * `/api/*` with the SPA shell. Without this guard the only symptom is a cryptic
 * "Unexpected token '<'" and a generic error card.
 */
function nonJsonError(): Error {
  return new Error(
    "El servidor devolvió una respuesta inesperada. Si estás en desarrollo, verificá que la API esté corriendo (npm run dev).",
  );
}

async function throwIfResNotOk(res: Response) {
  if (res.ok) {
    return;
  }

  let detail = res.statusText;

  if (isJsonResponse(res)) {
    try {
      const body: unknown = await res.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof (body as { message?: unknown }).message === "string"
      ) {
        detail = (body as { message: string }).message;
      }
    } catch {
      // Keep the status text when the body cannot be parsed.
    }
  }

  throw new Error(`${res.status}: ${detail}`);
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

    if (!isJsonResponse(res)) {
      throw nonJsonError();
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      // Lists used to go stale never, so a cached empty result survived the
      // whole SPA session. A short window keeps navigation instant while still
      // picking up changes made in another tab.
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
