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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando presupuestos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Presupuestos guardados
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Administra y consulta los presupuestos de tus proyectos freelance
          </p>
        </div>

        {quotesError ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No se pudieron cargar los presupuestos
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {isUnauthorized
                  ? "Tu sesión expiró. Iniciá sesión nuevamente."
                  : "Volvé a intentarlo en unos instantes."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
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
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Aún no hay presupuestos guardados
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Crea presupuestos con la calculadora para verlos aquí.
              </p>
              <Button onClick={() => window.location.href = "/calculator"}>
                Crear primer presupuesto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quotes List */}
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card 
                  key={quote.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedQuote?.id === quote.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedQuote(quote)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {quote.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {quote.clientName || 'Sin cliente especificado'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-accent/10 text-accent">
                        {formatCurrencyFromCents(quote.total, quote.currency as Currency)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(quote.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>{(quote.tasks as Task[]).length} tareas</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuoteMutation.mutate(quote.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                        disabled={deleteQuoteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quote Detail */}
            <div className="lg:sticky lg:top-6">
              {selectedQuote ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Detalles del presupuesto</span>
                      <Badge variant="outline">#{selectedQuote.id}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Client Info */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Información del cliente
                      </h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p><strong>Nombre:</strong> {selectedQuote.clientName || 'No especificado'}</p>
                        <p><strong>Correo:</strong> {selectedQuote.clientEmail || 'No especificado'}</p>
                        <p><strong>Dirección:</strong> {selectedQuote.clientAddress || 'No especificado'}</p>
                      </div>
                    </div>

                    {/* Project Summary */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Resumen del proyecto
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Tarifa por hora:</span>
                          <span className="font-medium">{formatCurrencyFromCents(selectedQuote.hourlyRate, selectedQuote.currency as Currency)}/h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Horas por día:</span>
                          <span className="font-medium">{selectedQuote.hoursPerDay} h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Tareas totales:</span>
                          <span className="font-medium">{(selectedQuote.tasks as Task[]).length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tasks Breakdown */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Desglose de tareas
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(selectedQuote.tasks as Task[]).map((task: Task) => (
                          <div key={task.id} className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {task.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {getTaskTypeLabel(task.type)}
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {task.hours} h
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {formatCurrency(task.cost, selectedQuote.currency as Currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cost Summary */}
                    <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                          <span className="font-medium">{formatCurrencyFromCents(selectedQuote.subtotal, selectedQuote.currency as Currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Impuestos:</span>
                          <span className="font-medium">{formatCurrencyFromCents(selectedQuote.tax, selectedQuote.currency as Currency)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-accent border-t border-slate-200 dark:border-slate-600 pt-2">
                          <span>Total:</span>
                          <span>{formatCurrencyFromCents(selectedQuote.total, selectedQuote.currency as Currency)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button className="w-full" onClick={() => {
                        window.location.href = `/calculator?quote=${selectedQuote.id}`;
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Editar presupuesto
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => shareQuoteMutation.mutate(selectedQuote.id)}
                        disabled={shareQuoteMutation.isPending}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        {activeShareToken
                          ? "Copiar enlace de nuevo"
                          : "Compartir con el cliente"}
                      </Button>

                      {activeShareToken ? (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            className="flex-1"
                            onClick={() =>
                              window.open(
                                buildShareUrl(activeShareToken),
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            className="flex-1 text-red-500 hover:text-red-700"
                            onClick={() => revokeShareMutation.mutate(selectedQuote.id)}
                            disabled={revokeShareMutation.isPending}
                          >
                            <Link2Off className="h-4 w-4 mr-2" />
                            Desactivar
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Selecciona un presupuesto
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Haz clic en un presupuesto de la lista para ver sus detalles aquí.
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