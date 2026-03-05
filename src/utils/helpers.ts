import { Currency, ExchangeRates } from '../types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const formatCurrency = (amount: number, currency: Currency = 'PKR'): string => {
  const symbols: Record<string, string> = { 
    PKR: '₨', 
    USD: '$', 
    AED: 'د.إ', 
    GBP: '£',
    EUR: '€',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'Fr',
    CNY: '¥',
    INR: '₹',
    SAR: '﷼'
  };
  
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const calculateConvertedAmount = (amount: number, currency: Currency, rates: ExchangeRates): number => {
  if (currency === 'PKR') return amount;
  return amount * (rates[currency] || 0);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const getMonthName = (monthString: string): string => {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
};

export const generateMonthOptions = (): { value: string; label: string }[] => {
  const options = [];
  const currentDate = new Date();
  
  // Generate last 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    options.push({ value: monthString, label });
  }
  
  return options;
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Get currency symbol
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = { 
    PKR: '₨', 
    USD: '$', 
    AED: 'د.إ', 
    GBP: '£',
    EUR: '€',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'Fr',
    CNY: '¥',
    INR: '₹',
    SAR: '﷼'
  };
  
  return symbols[currency] || currency;
};

// Get currency flag emoji
export const getCurrencyFlag = (currency: string): string => {
  const flags: Record<string, string> = {
    PKR: '🇵🇰',
    USD: '🇺🇸',
    AED: '🇦🇪',
    GBP: '🇬🇧',
    EUR: '🇪🇺',
    CAD: '🇨🇦',
    AUD: '🇦🇺',
    JPY: '🇯🇵',
    CHF: '🇨🇭',
    CNY: '🇨🇳',
    INR: '🇮🇳',
    SAR: '🇸🇦'
  };

  return flags[currency] || '💱';
};

export const convertAccountingMonthToYYYYMM = (accountingMonth: string): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [monthName, yearStr] = accountingMonth.split(' ');
  const monthIndex = monthNames.indexOf(monthName);

  if (monthIndex === -1 || !yearStr) {
    return '';
  }

  const monthNum = String(monthIndex + 1).padStart(2, '0');
  return `${yearStr}-${monthNum}`;
};

export const convertYYYYMMToAccountingMonth = (yyyymm: string): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [year, month] = yyyymm.split('-');
  const monthIndex = parseInt(month) - 1;

  if (monthIndex < 0 || monthIndex > 11 || !year) {
    return '';
  }

  return `${monthNames[monthIndex]} ${year}`;
};