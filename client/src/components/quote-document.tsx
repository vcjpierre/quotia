import { type Task } from "@shared/schema";
import { formatCurrency, type Currency } from "@/lib/currency";

interface QuoteDocumentProps {
  freelancerInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  clientInfo: {
    name: string;
    email: string;
    address: string;
  };
  tasks: Task[];
  summary: {
    subtotal: number;
    tax: number;
    total: number;
  };
  currency: Currency;
  terms: string;
  reference: string;
  issuedAt: Date;
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Static, print-ready version of the quote. It renders plain text nodes (no
 * inputs) and uses the `.force-light` paper scope, so the PDF is always a white
 * document regardless of the app theme.
 */
export function QuoteDocument({
  freelancerInfo,
  clientInfo,
  tasks,
  summary,
  currency,
  terms,
  reference,
  issuedAt,
}: QuoteDocumentProps) {
  const issueDate = new Date(issuedAt);
  const displayDate = issueDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initials = initialsOf(freelancerInfo.name);
  const hasAuthor = freelancerInfo.name.trim().length > 0;
  const hasClient =
    clientInfo.name.trim().length > 0 || clientInfo.address.trim().length > 0;
  const hasTerms = terms.trim().length > 0;

  return (
    <article
      className="force-light w-full bg-background p-12 font-sans text-foreground"
    >
      {/* Document header: author on the left, document metadata on the right */}
      <header className="avoid-break flex items-start justify-between gap-6 break-inside-avoid">
        {hasAuthor ? (
          <div className="flex items-start gap-4">
            {initials ? (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground"
                aria-hidden="true"
              >
                {initials}
              </div>
            ) : null}
            <div className="min-w-0 space-y-1">
              <p className="text-xl font-bold tracking-tight text-foreground">
                {freelancerInfo.name}
              </p>
              {freelancerInfo.title.trim() ? (
                <p className="text-sm text-muted-foreground">
                  {freelancerInfo.title}
                </p>
              ) : null}
              {freelancerInfo.email.trim() || freelancerInfo.phone.trim() ? (
                <div className="space-y-0.5 pt-1 text-xs text-muted-foreground">
                  {freelancerInfo.email.trim() ? (
                    <p>{freelancerInfo.email}</p>
                  ) : null}
                  {freelancerInfo.phone.trim() ? (
                    <p>{freelancerInfo.phone}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Presupuesto
          </p>
          <p className="mt-1 text-sm font-semibold tabular text-foreground">
            {reference}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{displayDate}</p>
        </div>
      </header>

      <div className="my-8 h-px bg-border" />

      {hasClient ? (
        <section className="rounded-lg border border-border bg-muted/50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Preparado para
          </p>
          <div className="mt-2 space-y-1">
            {clientInfo.name.trim() ? (
              <p className="text-sm font-semibold text-foreground">
                {clientInfo.name}
              </p>
            ) : null}
            {clientInfo.address.trim() ? (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {clientInfo.address}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Task breakdown */}
      <div className="mt-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="avoid-break border-b border-border break-inside-avoid">
              <th
                scope="col"
                className="py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Descripción
              </th>
              <th
                scope="col"
                className="py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Horas
              </th>
              <th
                scope="col"
                className="py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Tarifa
              </th>
              <th
                scope="col"
                className="py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Importe
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr key={task.id} className="avoid-break break-inside-avoid">
                <td className="py-3 pr-4 text-foreground">{task.description}</td>
                <td className="py-3 text-right tabular text-muted-foreground">
                  {task.hours}
                </td>
                <td className="py-3 text-right tabular text-muted-foreground">
                  {task.hours > 0
                    ? formatCurrency(task.cost / task.hours, currency)
                    : "—"}
                </td>
                <td className="py-3 text-right font-semibold tabular text-foreground">
                  {formatCurrency(task.cost, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tasks.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Aún no hay tareas agregadas.
        </div>
      ) : null}

      {/* Totals */}
      <div className="avoid-break mt-6 flex justify-end break-inside-avoid">
        <div className="w-80 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular text-foreground">
              {formatCurrency(summary.subtotal, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Impuestos</span>
            <span className="font-medium tabular text-foreground">
              {formatCurrency(summary.tax, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-foreground px-4 py-3 text-background">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
              Total
            </span>
            <span className="text-xl font-bold tabular">
              {formatCurrency(summary.total, currency)}
            </span>
          </div>
        </div>
      </div>

      {hasTerms ? (
        <section className="mt-8 border-t border-border pt-6">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Términos y condiciones
          </h4>
          <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
            {terms}
          </p>
        </section>
      ) : null}
    </article>
  );
}
