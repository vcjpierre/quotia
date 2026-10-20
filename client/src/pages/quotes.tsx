import { useState } from "react";
import { FileText, Eye, Trash2, Calendar, Share2, ExternalLink, Link2Off } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, clearAuthToken, getQueryFn } from "@/lib/queryClient";
import { authClient } from "@/lib/auth-client";
import { type Quote, type Task } from "@shared/schema";
import { formatCurrency, type Currency } from "@/lib/currency";
import { buildShareUrl, copyShareUrl } from "@/lib/share";

export default function QuotesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const {
    data: quotesData,
    isLoading,
    error: quotesError,
    refetch: refetchQuotes,
  } = useQuery({
    queryKey: ["/api/quotes"],
    queryFn: getQueryFn<Quote[]>({ on401: "throw" }),
  });

  const quotes = quotesData ?? [];
  const isUnauthorized =
    quotesError instanceof Error && quotesError.message.startsWith("401");

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/quotes/${id}`);
      return response.json();
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: [`/api/quotes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "¡Presupuesto eliminado con éxito!",
        description: "El presupuesto se eliminó de tu lista.",
      });
      setSelectedQuote(null);
    },
    onError: (error) => {
      toast({
        title: "No se pudo eliminar el presupuesto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: shareData } = useQuery<{ token: string | null }>({
    queryKey: [`/api/quotes/${selectedQuote?.id}/share`],
    queryFn: getQueryFn<{ token: string | null }>({ on401: "throw" }),
    enabled: selectedQuote !== null,
  });

  const activeShareToken = shareData?.token ?? null;

  const shareQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/quotes/${id}/share`);
      return (await response.json()) as { token: string };
    },
    onSuccess: async ({ token }, id) => {
      queryClient.invalidateQueries({ queryKey: [`/api/quotes/${id}/share`] });
      const copied = await copyShareUrl(token);

      toast(
        copied
          ? {
              title: "Enlace copiado",
              description:
                "Compartilo con tu cliente: no necesita cuenta y podés desactivarlo cuando quieras.",
            }
          : { title: "Enlace para compartir", description: buildShareUrl(token) },
      );
    },
    onError: (error) => {
      toast({
        title: "No se pudo generar el enlace",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeShareMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/quotes/${id}/share`);
      return response.json();
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [`/api/quotes/${id}/share`] });
      toast({
        title: "Enlace desactivado",
        description: "Quien tenga el enlace anterior ya no puede ver el presupuesto.",
      });
    },
    onError: (error) => {
      toast({
        title: "No se pudo desactivar el enlace",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrencyFromCents = (cents: number, currency: Currency = "USD") => {
    return formatCurrency(cents / 100, currency);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaskTypeLabel = (type: Task["type"]) =>
    ({
      project: "Proyecto completo",
      feature: "Funcionalidad extra",
      microtask: "Microtarea",
    })[type];

  const handleReauthenticate = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Local cleanup still runs so the user can sign in again.
    }

    clearAuthToken();
    queryClient.clear();
    navigate("/login?redirect=/quotes");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">Cargando presupuestos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tu trabajo, ordenado
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Presupuestos guardados
          </h1>
          <p className="mt-1 text-muted-foreground">
            Administrá y consultá los presupuestos de tus proyectos.
          </p>
        </div>

        {quotesError ? (
          <Card>
            <CardContent className="py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-foreground">
                No se pudieron cargar los presupuestos
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isUnauthorized
                  ? "Tu sesión expiró. Iniciá sesión nuevamente."
                  : "Volvé a intentarlo en unos instantes."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => void refetchQuotes()}>
                  Reintentar
                </Button>
                {isUnauthorized ? (
                  <Button onClick={() => void handleReauthenticate()}>
                    Iniciar sesión
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : quotes.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-foreground">
                Aún no hay presupuestos guardados
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Creá tu primer presupuesto con la calculadora y aparecerá acá.
              </p>
              <Button className="mt-5" onClick={() => (window.location.href = "/calculator")}>
                Crear primer presupuesto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quotes List */}
            <div className="space-y-3">
              {quotes.map((quote) => (
                <Card
                  key={quote.id}
                  className={`cursor-pointer transition-shadow duration-200 hover:shadow-elevated ${
                    selectedQuote?.id === quote.id
                      ? "border-primary/60 ring-1 ring-primary/60"
                      : ""
                  }`}
                  onClick={() => setSelectedQuote(quote)}
                >
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground">
                          {quote.title}
                        </h3>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {quote.clientName || "Sin cliente especificado"}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-primary/10 text-primary"
                      >
                        {formatCurrencyFromCents(quote.total, quote.currency as Currency)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{formatDate(quote.createdAt)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{(quote.tasks as Task[]).length} tareas</span>
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Eliminar ${quote.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuoteMutation.mutate(quote.id);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteQuoteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quote Detail */}
            <div className="lg:sticky lg:top-24">
              {selectedQuote ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between gap-3">
                      <span>Detalle del presupuesto</span>
                      <Badge variant="outline" className="shrink-0 tabular">
                        #{selectedQuote.id}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    {/* Client Info */}
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Cliente
                      </h4>
                      <dl className="mt-2 space-y-1.5 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Nombre</dt>
                          <dd className="truncate font-medium text-foreground">
                            {selectedQuote.clientName || "No especificado"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Correo</dt>
                          <dd className="truncate font-medium text-foreground">
                            {selectedQuote.clientEmail || "No especificado"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Dirección</dt>
                          <dd className="truncate font-medium text-foreground">
                            {selectedQuote.clientAddress || "No especificado"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Project Summary */}
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Resumen del proyecto
                      </h4>
                      <dl className="mt-2 space-y-1.5 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Tarifa por hora</dt>
                          <dd className="font-medium tabular text-foreground">
                            {formatCurrencyFromCents(selectedQuote.hourlyRate, selectedQuote.currency as Currency)}/h
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Horas por día</dt>
                          <dd className="font-medium tabular text-foreground">
                            {selectedQuote.hoursPerDay} h
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Tareas totales</dt>
                          <dd className="font-medium tabular text-foreground">
                            {(selectedQuote.tasks as Task[]).length}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Tasks Breakdown */}
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Desglose de tareas
                      </h4>
                      <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
                        {(selectedQuote.tasks as Task[]).map((task: Task) => (
                          <div
                            key={task.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {task.description}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] font-medium">
                                  {getTaskTypeLabel(task.type)}
                                </Badge>
                                <span className="text-xs tabular text-muted-foreground">
                                  {task.hours} h
                                </span>
                              </div>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular text-foreground">
                              {formatCurrency(task.cost, selectedQuote.currency as Currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cost Summary */}
                    <div className="space-y-2 border-t border-border pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium tabular text-foreground">
                          {formatCurrencyFromCents(selectedQuote.subtotal, selectedQuote.currency as Currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Impuestos</span>
                        <span className="font-medium tabular text-foreground">
                          {formatCurrencyFromCents(selectedQuote.tax, selectedQuote.currency as Currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-foreground px-4 py-3 text-background">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
                          Total
                        </span>
                        <span className="text-lg font-bold tabular">
                          {formatCurrencyFromCents(selectedQuote.total, selectedQuote.currency as Currency)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <Button
                        className="w-full gap-2"
                        onClick={() => {
                          window.location.href = `/calculator?quote=${selectedQuote.id}`;
                        }}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Editar presupuesto
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => shareQuoteMutation.mutate(selectedQuote.id)}
                        disabled={shareQuoteMutation.isPending}
                      >
                        <Share2 className="h-4 w-4" aria-hidden="true" />
                        {activeShareToken
                          ? "Copiar enlace de nuevo"
                          : "Compartir con el cliente"}
                      </Button>

                      {activeShareToken ? (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            className="flex-1 gap-2"
                            onClick={() =>
                              window.open(
                                buildShareUrl(activeShareToken),
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            className="flex-1 gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => revokeShareMutation.mutate(selectedQuote.id)}
                            disabled={revokeShareMutation.isPending}
                          >
                            <Link2Off className="h-4 w-4" aria-hidden="true" />
                            Desactivar
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-14 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Eye className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-base font-semibold text-foreground">
                      Seleccioná un presupuesto
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Hacé clic en un presupuesto de la lista para ver su detalle acá.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}