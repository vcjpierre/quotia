import { Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type Task } from "@shared/schema";

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
  terms: string;
  onUpdateFreelancerInfo: (info: Partial<ReceiptPreviewProps["freelancerInfo"]>) => void;
  onUpdateClientInfo: (info: Partial<ReceiptPreviewProps["clientInfo"]>) => void;
  onUpdateTerms: (terms: string) => void;
}

export function ReceiptPreview({
  freelancerInfo,
  clientInfo,
  tasks,
  summary,
  terms,
  onUpdateFreelancerInfo,
  onUpdateClientInfo,
  onUpdateTerms,
}: ReceiptPreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const quoteNumber = `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
        <CardTitle>Receipt Preview</CardTitle>
      </CardHeader>
      
      <CardContent id="receipt-content" className="p-6 bg-white dark:bg-slate-800">
        {/* Receipt Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="bg-primary text-white rounded-lg p-3">
              <Code2 className="h-8 w-8" />
            </div>
            <div className="text-left">
              <Input
                value={freelancerInfo.name}
                onChange={(e) => onUpdateFreelancerInfo({ name: e.target.value })}
                className="text-2xl font-bold border-none p-0 h-auto bg-transparent"
                placeholder="Your Name"
              />
              <Input
                value={freelancerInfo.title}
                onChange={(e) => onUpdateFreelancerInfo({ title: e.target.value })}
                className="text-slate-600 dark:text-slate-400 border-none p-0 h-auto bg-transparent"
                placeholder="Your Title"
              />
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <Input
              value={freelancerInfo.email}
              onChange={(e) => onUpdateFreelancerInfo({ email: e.target.value })}
              className="text-center border-none p-0 h-auto bg-transparent"
              placeholder="your.email@example.com"
            />
            <Input
              value={freelancerInfo.phone}
              onChange={(e) => onUpdateFreelancerInfo({ phone: e.target.value })}
              className="text-center border-none p-0 h-auto bg-transparent"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Bill To:</h4>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <Input
              value={clientInfo.name}
              onChange={(e) => onUpdateClientInfo({ name: e.target.value })}
              className="font-medium text-slate-900 dark:text-white border-none p-0 h-auto bg-transparent"
              placeholder="Client Name"
            />
            <Textarea
              value={clientInfo.address}
              onChange={(e) => onUpdateClientInfo({ address: e.target.value })}
              className="border-none p-0 bg-transparent resize-none"
              placeholder="Client Address"
              rows={2}
            />
          </div>
        </div>

        {/* Quote Details */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-white">Quote Details</h4>
            <div className="text-right text-sm text-slate-500">
              <p>Quote #: <span>{quoteNumber}</span></p>
              <p>Date: <span>{currentDate}</span></p>
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
                    Description
                  </th>
                  <th className="text-right py-3 font-semibold text-slate-900 dark:text-white">
                    Hours
                  </th>
                  <th className="text-right py-3 font-semibold text-slate-900 dark:text-white">
                    Rate
                  </th>
                  <th className="text-right py-3 font-semibold text-slate-900 dark:text-white">
                    Amount
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
                      {formatCurrency(task.cost / task.hours)}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(task.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>No tasks added yet.</p>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(summary.subtotal)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600 dark:text-slate-400">Tax (0%):</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(summary.tax)}
            </span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold text-accent bg-accent/5 rounded-lg p-4">
            <span>Total:</span>
            <span>{formatCurrency(summary.total)}</span>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-600">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
            Terms & Conditions
          </h4>
          <Textarea
            value={terms}
            onChange={(e) => onUpdateTerms(e.target.value)}
            className="text-sm text-slate-600 dark:text-slate-400 bg-transparent border-none p-0 resize-none"
            placeholder="Enter terms and conditions..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
