import { Download, FileWarning, Loader2 } from "lucide-react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { QuotiaMark } from "@/components/brand";
import { useToast } from "@/hooks/use-toast";
import { ReceiptPreview } from "@/components/receipt-preview";
import { exportToPDF } from "@/lib/pdf-export";
import { type PublicQuote, type Task } from "@shared/schema";
import { type Currency } from "@/lib/currency";

const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function readShareToken(legacyToken: string): { token: string; viaHeader: boolean } {
  if (SHARE_TOKEN_PATTERN.test(legacyToken)) {
    return { token: legacyToken, viaHeader: false };
  }

  const hashToken = window.location.hash.replace(/^#/, "");
  if (SHARE_TOKEN_PATTERN.test(hashToken)) {
    return { token: hashToken, viaHeader: true };
  }

  return { token: "", viaHeader: false };
}

/**
 * Public, read-only view of a quote. Reached with `/s#token` (the fragment never
 * reaches the server) or the legacy `/s/:token`, and rendered outside the auth
 * shell: no navigation, no editing, no owner information.
 */
export default function SharedQuotePage() {
  const params = useParams<{ token?: string }>();
  const { token, viaHeader } = readShareToken(params.token ?? "");
  const { toast } = useToast();

  const {
    data: quote,
    isLoading,
    error,
    refetch,
  } = useQuery<PublicQuote>({
    queryKey: [`/api/shared/${token}`],
    queryFn: async () => {
      const response = viaHeader
        ? await fetch("/api/shared", {
            headers: { "X-Share-Token": token },
            cache: "no-store",
          })
        : await fetch(`/api/shared/${encodeURIComponent(token)}`, { cache: "no-store" });

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
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (notFound || !quote) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-card">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <FileWarning className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
            Este enlace no está disponible
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Puede haber sido desactivado por quien lo compartió o estar incompleto.
            Pedile un enlace nuevo a la persona que te envió el presupuesto.
          </p>
          {notFound ? null : (
            <Button variant="outline" className="mt-5" onClick={() => void refetch()}>
              Reintentar
            </Button>
          )}
        </div>
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
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <QuotiaMark className="h-9 w-9 text-primary" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Presupuesto compartido
              </p>
              <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
                {quote.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold tabular text-muted-foreground sm:inline-flex">
              {reference}
            </span>
            <Button size="sm" onClick={() => void handleDownload()}>
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="ml-2 hidden sm:inline">Descargar PDF</span>
              <span className="sr-only sm:hidden">Descargar PDF</span>
            </Button>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
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

        <footer className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Este enlace es de solo lectura: los datos no se pueden editar desde acá.
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <QuotiaMark className="h-4 w-4 text-primary" />
            Hecho con Quotia
          </span>
        </footer>
      </div>
    </div>
  );
}
