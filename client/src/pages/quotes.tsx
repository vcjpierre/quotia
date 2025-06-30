import { useState } from "react";
import { FileText, Eye, Trash2, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { type Quote, type Task } from "@shared/schema";
import { formatCurrency, type Currency } from "@/lib/currency";

export default function QuotesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["/api/quotes"],
    queryFn: getQueryFn<Quote[]>({ on401: "returnNull" }),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/quotes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Quote deleted successfully!",
        description: "The quote has been removed from your list.",
      });
      setSelectedQuote(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrencyFromCents = (cents: number, currency: Currency = "USD") => {
    return formatCurrency(cents / 100, currency);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading quotes...</p>
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
            Saved Quotes
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and view your freelance project quotes
          </p>
        </div>

        {quotes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No quotes saved yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Start creating quotes with the calculator to see them here.
              </p>
              <Button onClick={() => window.location.href = "/calculator"}>
                Create First Quote
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
                          {quote.clientName || 'No client specified'}
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
                          <span>{(quote.tasks as Task[]).length} tasks</span>
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
                      <span>Quote Details</span>
                      <Badge variant="outline">#{selectedQuote.id}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Client Info */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Client Information
                      </h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p><strong>Name:</strong> {selectedQuote.clientName || 'Not specified'}</p>
                        <p><strong>Email:</strong> {selectedQuote.clientEmail || 'Not specified'}</p>
                        <p><strong>Address:</strong> {selectedQuote.clientAddress || 'Not specified'}</p>
                      </div>
                    </div>

                    {/* Project Summary */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Project Summary  
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Hourly Rate:</span>
                          <span className="font-medium">{formatCurrencyFromCents(selectedQuote.hourlyRate, selectedQuote.currency as Currency)}/hr</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Hours per Day:</span>
                          <span className="font-medium">{selectedQuote.hoursPerDay} hrs</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Total Tasks:</span>
                          <span className="font-medium">{(selectedQuote.tasks as Task[]).length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tasks Breakdown */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Tasks Breakdown
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
                                  {task.type}
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {task.hours} hrs
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
                          <span className="text-slate-600 dark:text-slate-400">Tax:</span>
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
                        // TODO: Open quote in calculator for editing
                        window.location.href = `/calculator?quote=${selectedQuote.id}`;
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Edit Quote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Select a Quote
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Click on a quote from the list to view its details here.
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