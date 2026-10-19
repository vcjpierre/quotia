import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-primary text-white rounded-lg p-3 w-fit">
            <Calculator className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>
            Accedé a tus presupuestos guardados y continuá donde lo dejaste.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
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
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isGoogleSubmitting}
            >
              {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-slate-500 dark:text-slate-400">
                o continuá con
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleSubmitting}
          >
            {isGoogleSubmitting ? "Redirigiendo..." : "Continuar con Google"}
          </Button>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            ¿No tenés cuenta?{" "}
            <Link
              href={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="text-primary font-medium hover:underline"
            >
              Creá una
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
