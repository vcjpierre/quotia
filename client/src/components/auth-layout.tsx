import type { ReactNode } from "react";
import { FileText, Link2, Lock } from "lucide-react";
import { QuotiaMark } from "@/components/brand";

const highlights = [
  { icon: FileText, text: "Presupuestos detallados por tarea y por hora." },
  { icon: Link2, text: "Un enlace de solo lectura para tu cliente, sin registro." },
  { icon: Lock, text: "Vos decidís cuándo el enlace deja de funcionar." },
];

/**
 * Shared shell for the auth pages: brand panel on desktop, focused form column
 * on mobile. No navigation here on purpose — signing in should have one exit.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-slate-100 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.32),transparent_58%),radial-gradient(ellipse_at_bottom_left,rgba(194,65,12,0.18),transparent_52%)]"
        />

        <span className="relative flex items-center gap-2.5">
          <QuotiaMark className="h-9 w-9 text-primary" />
          <span className="text-[19px] font-bold tracking-tight text-white">Quotia</span>
        </span>

        <div className="relative max-w-md">
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white">
            Presupuestos que se ven tan profesionales como tu trabajo.
          </h2>
          <ul className="mt-9 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs font-medium tracking-wide text-slate-500">
          Quotia · Presupuestos para freelancers
        </p>
      </aside>

      <main className="flex min-h-screen flex-col justify-center px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <span className="mb-10 flex items-center gap-2.5 lg:hidden">
            <QuotiaMark className="h-8 w-8 text-primary" />
            <span className="text-[19px] font-bold tracking-tight text-foreground">Quotia</span>
          </span>
          {children}
        </div>
      </main>
    </div>
  );
}
