import { TrendingUp, FileText, Share } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    <Card className="top-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="bg-accent/10 text-accent rounded-lg p-2">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span>Cost Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 dark:text-slate-400">Total Hours</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {summary.totalHours} hrs
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 dark:text-slate-400">Total Days</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {summary.totalDays} days
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 dark:text-slate-400">Hourly Rate</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(summary.hourlyRate, currency)}/hr
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-3 bg-accent/5 rounded-lg px-4">
            <span className="text-lg font-semibold text-slate-900 dark:text-white">
              Total Cost
            </span>
            <span className="text-2xl font-bold text-accent">
              {formatCurrency(summary.total, currency)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => {}}
            className="w-full flex items-center justify-center space-x-2 font-medium"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Receipt</span>
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onExportPDF}
              variant="destructive"
              className="flex items-center justify-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm">PDF</span>
            </Button>
            <Button
              onClick={onShare}
              className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600"
            >
              <Share className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
