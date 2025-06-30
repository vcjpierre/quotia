import { SUPPORTED_CURRENCIES } from "@shared/schema";

export type Currency = typeof SUPPORTED_CURRENCIES[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  MXN: "$",
  BRL: "R$",
  INR: "₹",
  COP: "$",
  BOB: "Bs",
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  JPY: "Japanese Yen",
  MXN: "Mexican Peso",
  BRL: "Brazilian Real",
  INR: "Indian Rupee",
  COP: "Colombian Peso",
  BOB: "Bolivian Boliviano",
};

export function formatCurrency(amount: number, currency: Currency = "USD"): string {
  try {
    return new Intl.NumberFormat(getLocaleForCurrency(currency), {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === "JPY" ? 0 : 2,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const decimals = currency === "JPY" ? 0 : 2;
    return `${symbol}${amount.toFixed(decimals)}`;
  }
}

function getLocaleForCurrency(currency: Currency): string {
  const localeMap: Record<Currency, string> = {
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
    CAD: "en-CA",
    AUD: "en-AU",
    JPY: "ja-JP",
    MXN: "es-MX",
    BRL: "pt-BR",
    INR: "en-IN",
    COP: "es-CO",
    BOB: "es-BO",
  };
  
  return localeMap[currency] || "en-US";
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

export function getAllSupportedCurrencies(): Array<{ code: Currency; name: string; symbol: string }> {
  return SUPPORTED_CURRENCIES.map(code => ({
    code,
    name: CURRENCY_NAMES[code],
    symbol: CURRENCY_SYMBOLS[code],
  }));
}