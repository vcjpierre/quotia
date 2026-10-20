import { Calculator, FileText, LogIn, LogOut, Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/use-auth";
import { authClient } from "@/lib/auth-client";
import { clearAuthToken, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const { user, isPending } = useAuth();

  const handleSignOut = async () => {
    let failed = false;

    try {
      const { error } = await authClient.signOut();
      failed = Boolean(error);
    } catch {
      failed = true;
    } finally {
      if (failed) {
        toast({
          title: "No se pudo cerrar la sesión",
          description:
            "Se restableció el estado local. Volvé a intentarlo si el problema persiste.",
          variant: "destructive",
        });
      }
      clearAuthToken();
      queryClient.clear();
      navigate("/login");
    }
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-primary text-white rounded-lg p-2">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Quotia
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Facturación profesional sin complicaciones
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/calculator"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === "/" || location === "/calculator"
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Calculator className="h-4 w-4" />
                <span>Calculadora</span>
              </Link>

              <Link
                href="/quotes"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === "/quotes"
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Presupuestos guardados</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {!isPending && user ? (
              <div className="hidden md:flex items-center space-x-3">
                <span className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.name || user.email}</span>
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </Button>
              </div>
            ) : null}

            {!isPending && !user ? (
              <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  <span>Iniciar sesión</span>
                </Link>
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 space-y-1">
          <Link
            href="/calculator"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location === "/" || location === "/calculator"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Calculadora</span>
          </Link>

          <Link
            href="/quotes"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location === "/quotes"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Presupuestos guardados</span>
          </Link>

          {!isPending && user ? (
            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <p className="flex items-center space-x-2 px-3 text-sm text-slate-600 dark:text-slate-300 truncate">
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{user.name || user.email}</span>
              </p>
              <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </Button>
            </div>
          ) : null}

          {!isPending && !user ? (
            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  <span>Iniciar sesión</span>
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
