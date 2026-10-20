import { TrendingUp, FileText, Share } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, type Currency } from "@/lib/currency";

interface CostSummaryProps {
  summary: {
    totalHours: number;
    totalDays: number;
    subtotal: number;
    tax: number;
    total: number;
    hourlyRate: number;
  };
  currency: Currency;
  onExportPDF: () => void;
  onShare: () => void;
}

export function CostSummary({ summary, currency, onExportPDF, onShare }: CostSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Resumen de costos</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Horas totales</dt>
            <dd className="font-medium tabular text-foreground">{summary.totalHours} h</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Días totales</dt>
            <dd className="font-medium tabular text-foreground">{summary.totalDays} días</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Tarifa por hora</dt>
            <dd className="font-medium tabular text-foreground">
              {formatCurrency(summary.hourlyRate, currency)}/h
            </dd>
          </div>
        </dl>

        <div className="rounded-xl bg-foreground px-4 py-4 text-background">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
              Costo total
            </span>
            <span className="text-2xl font-bold tabular">
              {formatCurrency(summary.total, currency)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onExportPDF}>
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>PDF</span>
          </Button>
          <Button onClick={onShare}>
            <Share className="h-4 w-4" aria-hidden="true" />
            <span>Compartir</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
