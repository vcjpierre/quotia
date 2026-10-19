import { authClient } from "./auth-client";

export function useAuth() {
  const { data, isPending, error, refetch } = authClient.useSession();

  return {
    session: data,
    user: data?.user ?? null,
    isPending,
    error,
    refetch,
    isAuthenticated: !!data?.user,
  };
}
