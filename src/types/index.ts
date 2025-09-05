// Core data types for the Digitum Finance Management System

export type Currency = string; // Changed to string to allow dynamic currencies

export type ExpenseCategory = 
  | 'Salary'
  | 'Office'
  | 'Food'
  | 'Tools'
  | 'Donation'
  | 'Bank'
  | 'Marketing'
  | 'Travel'
  | 'Utilities'
  | 'Other';

export type IncomeCategory = 
  | 'Google Ads'
  | 'SEO'
  | 'Website'
  | 'Backlinks'
  | 'Automation'
  | 'Landing Page'
  | 'Social Media Ads'
  | 'Social Media Management'
  | 'Graphics & Design'
  | 'Others';

export type PaymentStatus = 'Pending' | 'Done';

export type IncomeStatus = 'Received' | 'Upcoming' | 'Partial' | 'Cancelled';

export type AccountName = string; // Changed to string to allow dynamic account names

export type NotificationType = 'income_due' | 'expense_due' | 'payment_overdue' | 'low_balance' | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'email' | 'whatsapp' | 'in_app';

export interface ExchangeRates {
  [currency: string]: number; // Dynamic currency support
  PKR: 1; // Always 1 as base currency
}

export interface Income {
  id: string;
  date: string;
  originalAmount: number; // Original amount in original currency
  currency: Currency;
  receivedAmount: number; // Amount actually received (for partial payments)
  convertedAmount: number; // PKR equivalent of received amount
  originalConvertedAmount: number; // PKR equivalent of original amount
  category: IncomeCategory;
  description: string;
  clientName: string;
  notes?: string;
  status: IncomeStatus;
  account: AccountName; // Which account the money is held in
  
  // Due date for upcoming payments
  dueDate?: string; // Expected payment date for upcoming income
  
  // Manual conversion tracking
  manualConversionRate?: number; // User-entered conversion rate
  manualPKRAmount?: number; // User-entered PKR amount (override)
  
  // Simple distribution tracking
  splitAmountPKR: number; // Full PKR amount for distribution
  splitRateUsed: number; // Exchange rate used for conversion
  
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  convertedAmount: number; // PKR equivalent
  category: ExpenseCategory;
  description: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  account: AccountName; // Which account was used for payment
  
  // Due date for pending payments
  dueDate?: string; // Expected payment date for pending expenses
  
  // Manual conversion tracking
  manualConversionRate?: number; // User-entered conversion rate
  manualPKRAmount?: number; // User-entered PKR amount (override)
  
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: AccountName;
  currency: Currency;
  balance: number;
  convertedBalance: number; // PKR equivalent
  lastUpdated: string;
  notes?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  scheduledFor?: string; // When the notification should be sent
  relatedId?: string; // ID of related income/expense
  channels: NotificationChannel[];
  metadata?: {
    amount?: number;
    currency?: Currency;
    clientName?: string;
    account?: AccountName;
    dueDate?: string;
    test?: boolean;
    timestamp?: string;
    upcomingIncome?: number;
    pendingExpenses?: number;
    totalUpcoming?: number;
    totalPending?: number;
  };
}

export interface NotificationSettings {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  inAppEnabled: boolean;
  emailAddress?: string;
  whatsappNumber?: string;
  reminderDays: number; // Days before due date to send reminder
  dailyDigest: boolean;
  weeklyReport: boolean;
}

export interface MonthlyData {
  month: string; // YYYY-MM format
  totalIncome: number; // Only received + partial amounts
  expectedIncome: number; // Upcoming payments
  cancelledIncome: number; // Cancelled amount
  totalExpenses: number;
  netBalance: number;
  companyShare: number; // 50% of confirmed income
  roshaanShare: number; // 25% of confirmed income
  shahbazShare: number; // 25% of confirmed income
  remainingCompanyBalance: number; // Company share - expenses
  pendingPayments: number;
  
  // Simplified (no currency reserves)
  totalReserves: number; // Always 0 in simple logic
  reserveGainLoss: number; // Always 0 in simple logic
}

export interface DashboardSummary {
  currentMonth: MonthlyData;
  totalBalance: number;
  accounts: Account[];
  recentTransactions: (Income | Expense)[];
  pendingExpenses: Expense[];
  upcomingIncome: Income[];
  partialPayments: Income[];
  currencyReserves: any[]; // Empty array in simple logic
  notifications: Notification[];
  unreadNotifications: number;
}

// Dynamic account currency mapping - now stored in localStorage
export const getAccountCurrencyMap = (): Record<AccountName, Currency> => {
  const stored = localStorage.getItem('digitum_account_currency_map');
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Default mapping
  const defaultMap = {
    'Bank Alfalah': 'PKR',
    'Wise USD': 'USD',
    'Wise GBP': 'GBP',
    'Payoneer': 'USD'
  };
  
  localStorage.setItem('digitum_account_currency_map', JSON.stringify(defaultMap));
  return defaultMap;
};

export const updateAccountCurrencyMap = (accountName: AccountName, currency: Currency) => {
  const currentMap = getAccountCurrencyMap();
  const updatedMap = { ...currentMap, [accountName]: currency };
  localStorage.setItem('digitum_account_currency_map', JSON.stringify(updatedMap));
};

export const removeFromAccountCurrencyMap = (accountName: AccountName) => {
  const currentMap = getAccountCurrencyMap();
  const updatedMap = { ...currentMap };
  delete updatedMap[accountName];
  localStorage.setItem('digitum_account_currency_map', JSON.stringify(updatedMap));
};

// Legacy export for backward compatibility
export const ACCOUNT_CURRENCY_MAP = getAccountCurrencyMap();