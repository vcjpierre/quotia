import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCalculator } from "@/hooks/use-calculator";
import { Navigation } from "@/components/navigation";
import { RateConfiguration } from "@/components/rate-configuration";
import { TaskManagement } from "@/components/task-management";
import { CostSummary } from "@/components/cost-summary";
import { ReceiptPreview } from "@/components/receipt-preview";
import { exportToPDF, generateShareableURL } from "@/lib/pdf-export";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertQuoteSchema } from "@shared/schema";

export default function CalculatorPage() {
  const { toast } = useToast();
  const calculator = useCalculator();
  const queryClient = useQueryClient();

  const saveQuoteMutation = useMutation({
    mutationFn: async () => {
      const quoteData = {
        title: `Quote - ${new Date().toLocaleDateString()}`,
        clientName: calculator.state.clientInfo.name || "Client",
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
      const response = await apiRequest("POST", "/api/quotes", validatedData);
      return response.json();
    },
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Quote saved successfully!",
        description: `Quote #${quote.id} has been saved.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExportPDF = async () => {
    try {
      await exportToPDF("receipt-content", `freelance-quote-${Date.now()}`);
      toast({
        title: "PDF exported successfully!",
        description: "Your quote has been saved as a PDF file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    const url = generateShareableURL();
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied!",
        description: "Shareable link has been copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Share link",
        description: url,
      });
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navigation />
      
      {/* Save Quote Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveQuoteMutation.mutate()}
            disabled={saveQuoteMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">
              {saveQuoteMutation.isPending ? "Saving..." : "Save Quote"}
            </span>
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
