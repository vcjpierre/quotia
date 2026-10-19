import { Download, FileWarning, Loader2 } from "lucide-react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ReceiptPreview } from "@/components/receipt-preview";
import { exportToPDF } from "@/lib/pdf-export";
import { type PublicQuote, type Task } from "@shared/schema";
import { type Currency } from "@/lib/currency";

/**
 * Public, read-only view of a quote. Reached with `/s/:token` and rendered
 * outside the auth shell: no navigation, no editing, no owner information.
 */
export default function SharedQuotePage() {
  const params = useParams<{ token?: string }>();
  const token = params.token ?? "";
  const { toast } = useToast();

  const {
    data: quote,
    isLoading,
    error,
    refetch,
  } = useQuery<PublicQuote>({
    queryKey: [`/api/shared/${token}`],
    queryFn: async () => {
      const response = await fetch(`/api/shared/${token}`);

      if (response.status === 404) {
        throw new Error("not-found");
      }

      if (!response.ok) {
        throw new Error(`request-failed-${response.status}`);
      }

      return response.json();
    },
    retry: false,
    enabled: token.length > 0,
  });

  const notFound =
    token.length === 0 || (error instanceof Error && error.message === "not-found");

  const handleDownload = async () => {
    try {
      await exportToPDF("receipt-content", `presupuesto-${token.slice(0, 8)}`);
      toast({
        title: "PDF descargado",
        description: "El presupuesto se guardó como archivo PDF.",
      });
    } catch {
      toast({
        title: "No se pudo descargar el PDF",
        description: "Volvé a intentarlo en unos instantes.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (notFound || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <FileWarning className="h-14 w-14 mx-auto mb-4 text-slate-400" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Este enlace no está disponible
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Puede haber sido desactivado por quien lo compartió o estar incompleto.
              Pedile un enlace nuevo a la persona que te envió el presupuesto.
            </p>
            {notFound ? null : (
              <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
                Reintentar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const created = new Date(quote.createdAt);
  const year = Number.isNaN(created.getTime()) ? new Date().getFullYear() : created.getFullYear();
  const month = Number.isNaN(created.getTime())
    ? 1
    : created.getMonth() + 1;
  const day = Number.isNaN(created.getTime()) ? 1 : created.getDate();
  const reference = `QT-${year}-${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;

  const currency = quote.currency as Currency;
  const tasks = quote.tasks as Task[];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Presupuesto compartido
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
              {quote.title}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => void handleDownload()}>
            <Download className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Descargar PDF</span>
          </Button>
        </header>

        <ReceiptPreview
          readOnly
          freelancerInfo={{
            name: quote.freelancerName ?? "",
            title: quote.freelancerTitle ?? "",
            email: quote.freelancerEmail ?? "",
            phone: quote.freelancerPhone ?? "",
          }}
          clientInfo={{
            name: quote.clientName ?? "",
            // The client's email is internal and never rendered in the document.
            email: "",
            address: quote.clientAddress ?? "",
          }}
          tasks={tasks}
          summary={{
            subtotal: quote.subtotal / 100,
            tax: quote.tax / 100,
            total: quote.total / 100,
          }}
          currency={currency}
          terms={quote.terms ?? ""}
          reference={reference}
          issuedAt={quote.createdAt}
        />
      </div>
    </div>
  );
}
