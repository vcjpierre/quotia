import type { ChangeEvent } from "react";
import { Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Task } from "@shared/schema";
import { formatCurrency, type Currency } from "@/lib/currency";

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
        {value || (
          <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}
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

  const currentDate = issueDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const quoteNumber =
    reference ?? `QT-${issueDate.getFullYear()}-${String(Date.now()).slice(-6)}`;

  return (
    <Card className="overflow-hidden">
      {readOnly ? null : (
        <CardHeader className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
          <CardTitle>Vista previa del recibo</CardTitle>
        </CardHeader>
      )}

      <CardContent id="receipt-content" className="p-6 bg-white dark:bg-slate-800">
        {/* Receipt Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="bg-primary text-white rounded-lg p-3">
              <Code2 className="h-8 w-8" />
            </div>
            <div className="text-left">
              <Field
                readOnly={readOnly}
                value={freelancerInfo.name}
                onChange={(name) => onUpdateFreelancerInfo?.({ name })}
                className="text-2xl font-bold border-none p-0 h-auto bg-transparent"
                placeholder="Tu nombre"
              />
              <Field
                readOnly={readOnly}
                value={freelancerInfo.title}
                onChange={(title) => onUpdateFreelancerInfo?.({ title })}
                className="text-slate-600 dark:text-slate-400 border-none p-0 h-auto bg-transparent"
                placeholder="Tu cargo"
              />
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <Field
              readOnly={readOnly}
              value={freelancerInfo.email}
              onChange={(email) => onUpdateFreelancerInfo?.({ email })}
              className="text-center border-none p-0 h-auto bg-transparent"
              placeholder="tu.correo@ejemplo.com"
            />
            <Field
              readOnly={readOnly}
              value={freelancerInfo.phone}
              onChange={(phone) => onUpdateFreelancerInfo?.({ phone })}
              className="text-center border-none p-0 h-auto bg-transparent"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Facturar a:</h4>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <Field
              readOnly={readOnly}
              value={clientInfo.name}
              onChange={(name) => onUpdateClientInfo?.({ name })}
              className="font-medium text-slate-900 dark:text-white border-none p-0 h-auto bg-transparent"
              placeholder="Nombre del cliente"
            />
            <Field
              readOnly={readOnly}
              value={clientInfo.address}
              onChange={(address) => onUpdateClientInfo?.({ address })}
              className="border-none p-0 bg-transparent resize-none"
              placeholder="Dirección del cliente"
              multiline
              rows={2}
            />
          </div>
        </div>

        {/* Quote Details */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-white">Detalles del presupuesto</h4>
            <div className="text-right text-sm text-slate-500">
              <p>Presupuesto n.º: <span>{quoteNumber}</span></p>
              <p>Fecha: <span>{currentDate}</span></p>
            </div>
          </div>
        </div>

        {/* Task Breakdown Table */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-3 font-semibold text-slate-900 dark:text-white">
                    Descripción
                  </th>
                  <th className="text-right py-3 font-semibold text-slate-900 dark:text-white">
                    Horas
                  </th>
                  <th className="text-right py-3 font-semibold text-slate-900 dark:text-white">
                    Tarifa
                  </th>
                  <th className="text-right py-3 font-semibold text-slate-900 dark:text-white">
                    Importe
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="py-3 text-slate-900 dark:text-white">
                      {task.description}
                    </td>
                    <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                      {task.hours}
                    </td>
                    <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(task.cost / task.hours, currency)}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(task.cost, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>Aún no hay tareas agregadas.</p>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(summary.subtotal, currency)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600 dark:text-slate-400">Impuestos (0%):</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(summary.tax, currency)}
            </span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold text-accent bg-accent/5 rounded-lg p-4">
            <span>Total:</span>
            <span>{formatCurrency(summary.total, currency)}</span>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-600">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
            Términos y condiciones
          </h4>
          <Field
            readOnly={readOnly}
            value={terms}
            onChange={(value) => onUpdateTerms?.(value)}
            className="text-sm text-slate-600 dark:text-slate-400 bg-transparent border-none p-0 resize-none whitespace-pre-line"
            placeholder="Ingresa los términos y condiciones..."
            multiline
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
