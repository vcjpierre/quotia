import type { ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Task } from "@shared/schema";
import { formatCurrency, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface ReceiptPreviewProps {
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
  onUpdateFreelancerInfo?: (info: Partial<ReceiptPreviewProps["freelancerInfo"]>) => void;
  onUpdateClientInfo?: (info: Partial<ReceiptPreviewProps["clientInfo"]>) => void;
  onUpdateTerms?: (terms: string) => void;
  /**
   * Renders the quote as a read-only document: this is exactly what a client sees
   * through a share link, so the freelancer preview cannot drift from it.
   */
  readOnly?: boolean;
  /** Stable reference shown instead of the random per-render number. */
  reference?: string;
  /** Issue date to display; defaults to today. */
  issuedAt?: string | Date;
}

interface FieldProps {
  readOnly: boolean;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

function Field({
  readOnly,
  value,
  onChange,
  placeholder,
  className = "",
  multiline = false,
  rows,
}: FieldProps) {
  if (readOnly) {
    return (
      <div className={className}>
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </div>
    );
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => onChange?.(event.target.value);

  if (multiline) {
    return (
      <Textarea
        value={value}
        onChange={handleChange}
        className={className}
        placeholder={placeholder}
        rows={rows ?? 2}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function ReceiptPreview({
  freelancerInfo,
  clientInfo,
  tasks,
  summary,
  currency,
  terms,
  onUpdateFreelancerInfo,
  onUpdateClientInfo,
  onUpdateTerms,
  readOnly = false,
  reference,
  issuedAt,
}: ReceiptPreviewProps) {
  const issueDate = issuedAt ? new Date(issuedAt) : new Date();

  const currentDate = issueDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const quoteNumber =
    reference ?? `QT-${issueDate.getFullYear()}-${String(Date.now()).slice(-6)}`;

  const initials = initialsOf(freelancerInfo.name);

  return (
    <Card
      className={cn("overflow-hidden", readOnly && "rounded-none border-0 shadow-none")}
    >
      {readOnly ? null : (
        <CardHeader className="border-b bg-muted/60">
          <CardTitle>Vista previa del presupuesto</CardTitle>
        </CardHeader>
      )}

      <CardContent id="receipt-content" className="bg-card p-6 sm:p-10">
        {/* Document header: author on the left, document metadata on the right */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
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
              <Field
                readOnly={readOnly}
                value={freelancerInfo.name}
                onChange={(name) => onUpdateFreelancerInfo?.({ name })}
                className="h-auto border-none bg-transparent p-0 text-xl font-bold tracking-tight text-foreground"
                placeholder="Tu nombre"
              />
              <Field
                readOnly={readOnly}
                value={freelancerInfo.title}
                onChange={(title) => onUpdateFreelancerInfo?.({ title })}
                className="h-auto border-none bg-transparent p-0 text-sm text-muted-foreground"
                placeholder="Tu cargo"
              />
              <div className="space-y-0.5 pt-1 text-xs text-muted-foreground">
                <Field
                  readOnly={readOnly}
                  value={freelancerInfo.email}
                  onChange={(email) => onUpdateFreelancerInfo?.({ email })}
                  className="h-auto border-none bg-transparent p-0 text-xs"
                  placeholder="tu.correo@ejemplo.com"
                />
                <Field
                  readOnly={readOnly}
                  value={freelancerInfo.phone}
                  onChange={(phone) => onUpdateFreelancerInfo?.({ phone })}
                  className="h-auto border-none bg-transparent p-0 text-xs"
                  placeholder="+54 11 5555 5555"
                />
              </div>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Presupuesto
            </p>
            <p className="mt-1 text-sm font-semibold tabular text-foreground">{quoteNumber}</p>
            <p className="mt-1 text-xs text-muted-foreground">{currentDate}</p>
          </div>
        </div>

        <div className="my-8 h-px bg-border" />

        {/* Client */}
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Preparado para
          </p>
          <div className="mt-2 space-y-1">
            <Field
              readOnly={readOnly}
              value={clientInfo.name}
              onChange={(name) => onUpdateClientInfo?.({ name })}
              className="h-auto border-none bg-transparent p-0 text-sm font-semibold text-foreground"
              placeholder="Nombre del cliente"
            />
            <Field
              readOnly={readOnly}
              value={clientInfo.address}
              onChange={(address) => onUpdateClientInfo?.({ address })}
              className="resize-none border-none bg-transparent p-0 text-sm text-muted-foreground"
              placeholder="Dirección del cliente"
              multiline
              rows={2}
            />
          </div>
        </div>

        {/* Task breakdown */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
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
                <tr key={task.id}>
                  <td className="py-3 pr-4 text-foreground">{task.description}</td>
                  <td className="py-3 text-right tabular text-muted-foreground">{task.hours}</td>
                  <td className="py-3 text-right tabular text-muted-foreground">
                    {task.hours > 0 ? formatCurrency(task.cost / task.hours, currency) : "—"}
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
        <div className="mt-6 flex justify-end">
          <div className="w-full space-y-2 sm:w-80">
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

        {/* Terms */}
        <div className="mt-8 border-t border-border pt-6">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Términos y condiciones
          </h4>
          <div className="mt-3">
            <Field
              readOnly={readOnly}
              value={terms}
              onChange={(value) => onUpdateTerms?.(value)}
              className="resize-none whitespace-pre-line border-none bg-transparent p-0 text-sm text-muted-foreground"
              placeholder="Ingresá los términos y condiciones..."
              multiline
              rows={4}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
