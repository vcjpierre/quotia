import { DollarSign, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllSupportedCurrencies, getCurrencySymbol, type Currency } from "@/lib/currency";

interface RateConfigurationProps {
  hourlyRate: number;
  hoursPerDay: number;
  currency: Currency;
  onHourlyRateChange: (rate: number) => void;
  onHoursPerDayChange: (hours: number) => void;
  onCurrencyChange: (currency: Currency) => void;
}

export function RateConfiguration({
  hourlyRate,
  hoursPerDay,
  currency,
  onHourlyRateChange,
  onHoursPerDayChange,
  onCurrencyChange,
}: RateConfigurationProps) {
  const currencySymbol = getCurrencySymbol(currency);
  const supportedCurrencies = getAllSupportedCurrencies();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <DollarSign className="h-5 w-5" />
          </div>
          <span>Configuración de tarifas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="currency" className="text-sm font-medium">
              Moneda
            </Label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="mt-2">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{curr.symbol}</span>
                      <span>{curr.code}</span>
                      <span className="text-slate-500 text-sm">- {curr.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="hourlyRate" className="text-sm font-medium">
              Tarifa por hora ({currencySymbol})
            </Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                {currencySymbol}
              </span>
              <Input
                id="hourlyRate"
                type="number"
                min="1"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => onHourlyRateChange(Number(e.target.value))}
                className="pl-8"
                placeholder="75"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="hoursPerDay" className="text-sm font-medium">
              Horas de trabajo por día
            </Label>
            <Input
              id="hoursPerDay"
              type="number"
              min="1"
              max="24"
              value={hoursPerDay}
              onChange={(e) => onHoursPerDayChange(Number(e.target.value))}
              className="mt-2"
              placeholder="8"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
