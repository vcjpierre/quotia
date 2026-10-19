import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCalculator } from "@/hooks/use-calculator";
import { useAuth } from "@/lib/use-auth";
import { Navigation } from "@/components/navigation";
import { RateConfiguration } from "@/components/rate-configuration";
import { TaskManagement } from "@/components/task-management";
import { CostSummary } from "@/components/cost-summary";
import { ReceiptPreview } from "@/components/receipt-preview";
import { exportToPDF, generateShareableURL } from "@/lib/pdf-export";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { insertQuoteSchema, type Quote } from "@shared/schema";

export default function CalculatorPage() {
  const { toast } = useToast();
  const calculator = useCalculator();
  const queryClient = useQueryClient();
  const { isAuthenticated, isPending: isAuthPending } = useAuth();
  const [currentPath, navigate] = useLocation();
  const search = useSearch();

  const quoteParam = new URLSearchParams(search).get("quote");
  const parsedQuoteId =
    quoteParam && /^\d+$/.test(quoteParam) ? Number(quoteParam) : null;
  const quoteId =
    parsedQuoteId !== null &&
    Number.isSafeInteger(parsedQuoteId) &&
    parsedQuoteId > 0
      ? parsedQuoteId
      : null;
  const returnPath = search ? `${currentPath}?${search}` : currentPath;

  const {
    data: loadedQuote,
    error: loadError,
    isLoading: isQuoteLoading,
    refetch: refetchQuote,
  } = useQuery<Quote>({
    queryKey: [`/api/quotes/${quoteId}`],
    queryFn: getQueryFn<Quote>({ on401: "throw" }),
    enabled: isAuthenticated && quoteId !== null,
  });

  const [loadedQuoteId, setLoadedQuoteId] = useState<number | null>(null);
  const loadedQuoteIdRef = useRef<number | null>(null);
  const quoteTitleRef = useRef<string | null>(null);
  const loadErrorHandledRef = useRef(false);

  const { loadQuote } = calculator;

  useEffect(() => {
    setLoadedQuoteId(null);
    loadedQuoteIdRef.current = null;
    quoteTitleRef.current = null;
    loadErrorHandledRef.current = false;
  }, [quoteId]);

  useEffect(() => {
    if (loadedQuote && loadedQuote.id !== loadedQuoteIdRef.current) {
      loadQuote(loadedQuote);
      quoteTitleRef.current = loadedQuote.title;
      loadedQuoteIdRef.current = loadedQuote.id;
      setLoadedQuoteId(loadedQuote.id);
    }
  }, [loadedQuote, loadQuote]);

  useEffect(() => {
    if (loadError && !loadErrorHandledRef.current) {
      loadErrorHandledRef.current = true;
      toast({
        title: "No se pudo cargar el presupuesto",
        description: "El presupuesto no existe o no tenés acceso.",
        variant: "destructive",
      });
    }
  }, [loadError, toast]);

  const isEditRequested = quoteId !== null;
  const isEditReady = isEditRequested && loadedQuoteId === quoteId;
  const isEditUnavailable =
    isEditRequested && isAuthenticated && !isQuoteLoading && !isEditReady;

  const saveQuoteMutation = useMutation({
    mutationFn: async () => {
      const quoteData = {
        title:
          quoteTitleRef.current ??
          `Presupuesto - ${new Date().toLocaleDateString()}`,
        clientName: calculator.state.clientInfo.name || "Cliente",
        clientEmail: calculator.state.clientInfo.email,
        clientAddress: calculator.state.clientInfo.address,
        freelancerName: calculator.state.freelancerInfo.name,
        freelancerTitle: calculator.state.freelancerInfo.title,
        freelancerEmail: calculator.state.freelancerInfo.email,
        freelancerPhone: calculator.state.freelancerInfo.phone,
        hourlyRate: Math.round(calculator.state.hourlyRate * 100), // Convert to cents
        hoursPerDay: calculator.state.hoursPerDay,
        currency: calculator.state.currency,
        tasks: calculator.state.tasks,
        subtotal: Math.round(calculator.summary.subtotal * 100), // Convert to cents
        tax: Math.round(calculator.summary.tax * 100), // Convert to cents
        total: Math.round(calculator.summary.total * 100), // Convert to cents
        terms: calculator.state.terms,
      };

      const validatedData = insertQuoteSchema.parse(quoteData);
      const isEditing = isEditReady;
      const response = await apiRequest(
        isEditing ? "PUT" : "POST",
        isEditing ? `/api/quotes/${quoteId}` : "/api/quotes",
        validatedData,
      );
      return response.json();
    },
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotes/${quote.id}`] });
      toast({
        title: isEditReady
          ? "Presupuesto actualizado"
          : "Presupuesto guardado",
        description: isEditReady
          ? "Los cambios se guardaron correctamente."
          : `El presupuesto n.º ${quote.id} se guardó correctamente.`,
      });
    },
    onError: (error) => {
      toast({
        title: "No se pudo guardar el presupuesto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (isAuthPending) {
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Iniciá sesión para guardar el presupuesto",
        description: "Tus presupuestos se guardan en tu cuenta.",
      });
      navigate(`/login?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }

    if (isEditRequested && !isEditReady) {
      toast({
        title: "No se pudo cargar el presupuesto",
        description: "Verificá que exista y que tengas acceso antes de guardar.",
        variant: "destructive",
      });
      return;
    }

    saveQuoteMutation.mutate();
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF("receipt-content", `freelance-quote-${Date.now()}`);
      toast({
        title: "¡PDF exportado con éxito!",
        description: "Tu presupuesto se guardó como archivo PDF.",
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar el PDF. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    const url = generateShareableURL();
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace para compartir se copió al portapapeles.",
      });
    }).catch(() => {
      toast({
        title: "Compartir enlace",
        description: url,
      });
    });
  };

  const isSaveDisabled =
    isAuthPending ||
    saveQuoteMutation.isPending ||
    (isEditRequested && isAuthenticated && (!isEditReady || isQuoteLoading));

  const saveButtonLabel = saveQuoteMutation.isPending
    ? "Guardando..."
    : isEditReady
      ? "Actualizar presupuesto"
      : isEditRequested && isAuthenticated
        ? isQuoteLoading
          ? "Cargando presupuesto..."
          : "Edición no disponible"
        : "Guardar presupuesto";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navigation />

      {isEditUnavailable ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">
              No se pudo cargar el presupuesto para editar.
            </p>
            <p className="mt-1">
              Verificá que exista y que tengas acceso, o volvé a la lista de
              presupuestos.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetchQuote()}
              >
                Reintentar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/quotes")}
              >
                Volver a presupuestos
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Save Quote Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{saveButtonLabel}</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Left Side - Input Forms */}
          <div className="xl:col-span-2 space-y-6">
            <RateConfiguration
              hourlyRate={calculator.state.hourlyRate}
              hoursPerDay={calculator.state.hoursPerDay}
              currency={calculator.state.currency}
              onHourlyRateChange={calculator.updateHourlyRate}
              onHoursPerDayChange={calculator.updateHoursPerDay}
              onCurrencyChange={calculator.updateCurrency}
            />

            <TaskManagement
              tasks={calculator.state.tasks}
              currency={calculator.state.currency}
              onAddTask={calculator.addTask}
              onUpdateTask={calculator.updateTask}
              onRemoveTask={calculator.removeTask}
              onLoadTemplate={calculator.loadTemplate}
            />
          </div>

          {/* Right Side - Summary and Receipt */}
          <div className="space-y-6">
            <CostSummary
              summary={calculator.summary}
              currency={calculator.state.currency}
              onExportPDF={handleExportPDF}
              onShare={handleShare}
            />

            <ReceiptPreview
              freelancerInfo={calculator.state.freelancerInfo}
              clientInfo={calculator.state.clientInfo}
              tasks={calculator.state.tasks}
              summary={calculator.summary}
              currency={calculator.state.currency}
              terms={calculator.state.terms}
              onUpdateFreelancerInfo={calculator.updateFreelancerInfo}
              onUpdateClientInfo={calculator.updateClientInfo}
              onUpdateTerms={calculator.updateTerms}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
