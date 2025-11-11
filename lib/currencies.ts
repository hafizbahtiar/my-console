/**
 * Currency list and utilities
 * Provides a comprehensive list of currencies with codes, names, and symbols
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  nameEn: string;
  nameMs: string;
}

/**
 * Comprehensive list of currencies
 * Includes major world currencies with English and Malay names
 */
export const CURRENCIES: Currency[] = [
  // Major currencies
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', nameEn: 'Malaysian Ringgit', nameMs: 'Ringgit Malaysia' },
  { code: 'USD', name: 'US Dollar', symbol: '$', nameEn: 'US Dollar', nameMs: 'Dolar AS' },
  { code: 'EUR', name: 'Euro', symbol: '€', nameEn: 'Euro', nameMs: 'Euro' },
  { code: 'GBP', name: 'British Pound', symbol: '£', nameEn: 'British Pound', nameMs: 'Paun British' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', nameEn: 'Japanese Yen', nameMs: 'Yen Jepun' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', nameEn: 'Chinese Yuan', nameMs: 'Yuan China' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', nameEn: 'Australian Dollar', nameMs: 'Dolar Australia' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', nameEn: 'Canadian Dollar', nameMs: 'Dolar Kanada' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', nameEn: 'Swiss Franc', nameMs: 'Franc Switzerland' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', nameEn: 'Hong Kong Dollar', nameMs: 'Dolar Hong Kong' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', nameEn: 'Singapore Dollar', nameMs: 'Dolar Singapura' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', nameEn: 'Thai Baht', nameMs: 'Baht Thailand' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', nameEn: 'Indonesian Rupiah', nameMs: 'Rupiah Indonesia' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', nameEn: 'Indian Rupee', nameMs: 'Rupee India' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', nameEn: 'South Korean Won', nameMs: 'Won Korea Selatan' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', nameEn: 'New Zealand Dollar', nameMs: 'Dolar New Zealand' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', nameEn: 'Philippine Peso', nameMs: 'Peso Filipina' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', nameEn: 'Brazilian Real', nameMs: 'Real Brazil' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', nameEn: 'Mexican Peso', nameMs: 'Peso Mexico' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', nameEn: 'South African Rand', nameMs: 'Rand Afrika Selatan' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', nameEn: 'UAE Dirham', nameMs: 'Dirham UAE' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', nameEn: 'Saudi Riyal', nameMs: 'Riyal Arab Saudi' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', nameEn: 'Norwegian Krone', nameMs: 'Krone Norway' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', nameEn: 'Swedish Krona', nameMs: 'Krona Sweden' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', nameEn: 'Danish Krone', nameMs: 'Krone Denmark' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', nameEn: 'Polish Zloty', nameMs: 'Zloty Poland' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', nameEn: 'Russian Ruble', nameMs: 'Ruble Rusia' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', nameEn: 'Turkish Lira', nameMs: 'Lira Turki' },
];

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

/**
 * Get currency name in specified language
 */
export function getCurrencyName(code: string, language: 'en' | 'ms' = 'en'): string {
  const currency = getCurrency(code);
  if (!currency) return code;
  return language === 'ms' ? currency.nameMs : currency.nameEn;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code: string): string {
  const currency = getCurrency(code);
  return currency?.symbol || code;
}

/**
 * Get default currency (MYR for Malaysia-based app)
 */
export function getDefaultCurrency(): string {
  return 'MYR';
}

/**
 * Check if currency code is valid
 */
export function isValidCurrency(code: string): boolean {
  return CURRENCIES.some(c => c.code === code);
}

