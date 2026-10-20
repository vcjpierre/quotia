import { Calculator, FileText, LogIn, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuotiaLogo } from "@/components/brand";
import { useTheme } from "@/components/theme-provider";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/use-auth";
import { authClient } from "@/lib/auth-client";
import { clearAuthToken, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/calculator",
    label: "Calculadora",
    icon: Calculator,
    isActive: (location: string) => location === "/" || location === "/calculator",
  },
  {
    href: "/quotes",
    label: "Presupuestos",
    icon: FileText,
    isActive: (location: string) => location === "/quotes",
  },
];

function navLinkClass(active: boolean, compact = false) {
  return cn(
    "inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-colors duration-200",
    compact ? "w-full px-3 py-2.5" : "px-3 py-2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  );
}

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

  const displayName = user?.name || user?.email || "";
  const initials = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 md:gap-8">
          <Link
            href="/calculator"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Quotia — ir a la calculadora"
          >
            <QuotiaLogo markClassName="h-8 w-8" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            {links.map(({ href, label, icon: Icon, isActive }) => {
              const active = isActive(location);
              return (
                <Link
                  key={href}
                  href={href}
                  className={navLinkClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!isPending && user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-secondary-foreground"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <span className="max-w-[160px] truncate text-sm font-medium text-foreground">
                  {displayName}
                </span>
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Salir</span>
              </Button>
            </div>
          ) : null}

          {!isPending && !user ? (
            <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
              <Link href="/login">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Iniciar sesión</span>
              </Link>
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
            className="h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav
        className="border-t border-border bg-background md:hidden"
        aria-label="Navegación principal móvil"
      >
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-2 sm:px-6">
          {links.map(({ href, label, icon: Icon, isActive }) => {
            const active = isActive(location);
            return (
              <Link
                key={href}
                href={href}
                className={navLinkClass(active, true)}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="mt-1 space-y-2 border-t border-border pt-2">
            {!isPending && user ? (
              <>
                <p className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-secondary-foreground"
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <span className="truncate">{displayName}</span>
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Cerrar sesión</span>
                </Button>
              </>
            ) : null}

            {!isPending && !user ? (
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/login">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Iniciar sesión</span>
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
