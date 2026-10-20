import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth-layout";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/use-auth";
import { clearAuthToken, queryClient } from "@/lib/queryClient";

function getRedirectTarget(search: string): string {
  const value = new URLSearchParams(search).get("redirect");
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/calculator";
}

export default function LoginPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const { user, isPending, refetch } = useAuth();

  const redirect = getRedirectTarget(search);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && user) {
      navigate(redirect);
    }
  }, [user, isPending, redirect, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Credenciales inválidas");
        return;
      }

      clearAuthToken();
      queryClient.clear();
      await refetch();
      navigate(redirect);
    } catch {
      setError("No se pudo completar la operación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleSubmitting(true);

    try {
      const { error: socialError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}${redirect}`,
      });

      if (socialError) {
        setError(socialError.message || "No se pudo iniciar sesión con Google");
      }
    } catch {
      setError("No se pudo completar la operación");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Iniciar sesión</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Accedé a tus presupuestos guardados y continuá donde lo dejaste.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vos@estudio.com"
            className="h-11"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-11"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || isGoogleSubmitting}
        >
          {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            o continuá con
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting || isGoogleSubmitting}
      >
        {isGoogleSubmitting ? "Redirigiendo..." : "Continuar con Google"}
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <Link
          href={`/register?redirect=${encodeURIComponent(redirect)}`}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Creá una
        </Link>
      </p>
    </AuthLayout>
  );
}
