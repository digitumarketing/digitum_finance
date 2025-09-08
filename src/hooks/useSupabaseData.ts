import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';
import { 
  Income, 
  Expense, 
  Account, 
  ExchangeRates, 
  Notification,
  NotificationSettings,
  Currency,
  AccountName
} from '../types';
import { getCurrentMonth, calculateConvertedAmount } from '../utils/helpers';

export const useSupabaseData = () => {
  const { user, profile } = useSupabaseAuth();
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ PKR: 1 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: false,
    whatsappEnabled: false,
    inAppEnabled: true,
    reminderDays: 3,
    dailyDigest: false,
    weeklyReport: false,
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [isLoading, setIsLoading] = useState(true);

  // Load all data when user changes
  useEffect(() => {
    if (user && profile && profile.is_active) {
      console.log('Loading data for user:', user.id);
      loadAllData();
    } else {
      console.log('Resetting data - no active user');
      // Reset data when user logs out
      setIncome([]);
      setExpenses([]);
      setAccounts([]);
      setExchangeRates({ PKR: 1 });
      setNotifications([]);
      setNotificationSettings({
        emailEnabled: false,
        whatsappEnabled: false,
        inAppEnabled: true,
        reminderDays: 3,
        dailyDigest: false,
        weeklyReport: false,
      });
      setIsLoading(false);
    }
  }, [user, profile]);

  // Load all data from Supabase
  const loadAllData = useCallback(async () => {
    if (!user?.id || !profile?.is_active) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log('Starting data load for user:', user.id);
    
    try {
      // Load data in batches to prevent timeout
      console.log('Loading essential data...');
      await Promise.allSettled([
        loadAccounts(),
        loadExchangeRates(),
      ]);
      
      console.log('Loading transaction data...');
      await Promise.allSettled([
        loadIncome(),
        loadExpenses(),
      ]);
      
      console.log('Loading notifications...');
      await Promise.allSettled([
        loadNotifications(),
        loadNotificationSettings(),
      ]);
      
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      console.log('Data loading completed');
    }
  }, [user, profile]);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    if (!user || !profile?.is_active) return;

    try {
      console.log('Loading accounts...');
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
        return;
      }

      const accountsData = data.map(account => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
        balance: 0,
        convertedBalance: 0,
        lastUpdated: account.updated_at,
        notes: account.notes || '',
      }));

      setAccounts(accountsData);
      console.log('Accounts loaded:', accountsData.length);
    } catch (error) {
      console.error('Error in loadAccounts:', error);
    }
  }, [user, profile]);

  // Load exchange rates
  const loadExchangeRates = useCallback(async () => {
    if (!user || !profile?.is_active) return;

    try {
      console.log('Loading exchange rates...');
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading exchange rates:', error);
        return;
      }

      const rates: ExchangeRates = { PKR: 1 };
      data.forEach(rate => {
        rates[rate.currency] = parseFloat(rate.rate);
      });

      setExchangeRates(rates);
      console.log('Exchange rates loaded:', Object.keys(rates).length);
    } catch (error) {
      console.error('Error in loadExchangeRates:', error);
    }
  }, [user, profile]);

  // Load income
  const loadIncome = useCallback(async () => {
    if (!user || !profile?.is_active) return;

    try {
      console.log('Loading income...');
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading income:', error);
        return;
      }

      const incomeData = data.map(item => ({
        id: item.id,
        date: item.date,
        originalAmount: parseFloat(item.original_amount),
        currency: item.currency,
        receivedAmount: parseFloat(item.received_amount || 0),
        convertedAmount: parseFloat(item.converted_amount || 0),
        originalConvertedAmount: parseFloat(item.original_converted_amount || 0),
        category: item.category,
        description: item.description,
        clientName: item.client_name,
        notes: item.notes || '',
        status: item.status,
        account: item.account_name,
        dueDate: item.due_date,
        manualConversionRate: item.manual_conversion_rate ? parseFloat(item.manual_conversion_rate) : undefined,
        manualPKRAmount: item.manual_pkr_amount ? parseFloat(item.manual_pkr_amount) : undefined,
        splitAmountPKR: parseFloat(item.split_amount_pkr || 0),
        splitRateUsed: parseFloat(item.split_rate_used || 1),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      setIncome(incomeData);
      console.log('Income loaded:', incomeData.length);
    } catch (error) {
      console.error('Error in loadIncome:', error);
    }
  }, [user, profile]);

  // Load expenses
  const loadExpenses = useCallback(async () => {
    if (!user || !profile?.is_active) return;

    try {
      console.log('Loading expenses...');
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading expenses:', error);
        return;
      }

      const expensesData = data.map(item => ({
        id: item.id,
        date: item.date,
        amount: parseFloat(item.amount),
        currency: item.currency,
        convertedAmount: parseFloat(item.converted_amount || 0),
        category: item.category,
        description: item.description,
        paymentStatus: item.payment_status,
        notes: item.notes || '',
        account: item.account_name,
        dueDate: item.due_date,
        manualConversionRate: item.manual_conversion_rate ? parseFloat(item.manual_conversion_rate) : undefined,
        manualPKRAmount: item.manual_pkr_amount ? parseFloat(item.manual_pkr_amount) : undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      setExpenses(expensesData);
      console.log('Expenses loaded:', expensesData.length);
    } catch (error) {
      console.error('Error in loadExpenses:', error);
    }
  }, [user, profile]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user || !profile?.is_active) return;

    try {
      console.log('Loading notifications...');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      const notificationsData = data.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        priority: notif.priority,
        isRead: notif.is_read,
        createdAt: notif.created_at,
        scheduledFor: notif.scheduled_for,
        relatedId: notif.related_id,
        channels: notif.channels || [],
        metadata: notif.metadata || {},
      }));

      setNotifications(notificationsData);
      console.log('Notifications loaded:', notificationsData.length);
    } catch (error) {
      console.error('Error in loadNotifications:', error);
    }
  }, [user, profile]);

  // Load notification settings
  const loadNotificationSettings = useCallback(async () => {
    if (!user || !profile?.is_active) return;

    try {
      console.log('Loading notification settings...');
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading notification settings:', error);
        return;
      }

      if (data) {
        setNotificationSettings({
          emailEnabled: data.email_enabled,
          whatsappEnabled: data.whatsapp_enabled,
          inAppEnabled: data.in_app_enabled,
          emailAddress: data.email_address,
          whatsappNumber: data.whatsapp_number,
          reminderDays: data.reminder_days,
          dailyDigest: data.daily_digest,
          weeklyReport: data.weekly_report,
        });
        console.log('Notification settings loaded');
      }
    } catch (error) {
      console.error('Error in loadNotificationSettings:', error);
    }
  }, [user, profile]);

  // Add income
  const addIncome = useCallback(async (incomeData: any) => {
    if (!user) return;

    try {
      // Get account currency from accounts
      const account = accounts.find(acc => acc.name === incomeData.account);
      const accountCurrency = account?.currency || 'PKR';
      
      // Calculate PKR equivalent
      let effectiveRate = 1;
      let originalPKRAmount = incomeData.originalAmount;
      
      if (accountCurrency !== 'PKR') {
        effectiveRate = incomeData.manualConversionRate || exchangeRates[accountCurrency] || 1;
        originalPKRAmount = incomeData.manualPKRAmount || (incomeData.originalAmount * effectiveRate);
      }
      
      const originalConvertedAmount = originalPKRAmount;
      
      let convertedAmount = 0;
      let splitAmountPKR = 0;

      if (incomeData.status === 'Received' || incomeData.status === 'Partial') {
        const receivedPKRAmount = accountCurrency !== 'PKR' 
          ? (incomeData.manualPKRAmount ? 
              (incomeData.manualPKRAmount * (incomeData.receivedAmount / incomeData.originalAmount)) :
              (incomeData.receivedAmount * effectiveRate))
          : incomeData.receivedAmount;
        
        convertedAmount = receivedPKRAmount;
        splitAmountPKR = receivedPKRAmount;
      }

      const { data, error } = await supabase
        .from('income')
        .insert({
          user_id: user.id,
          date: incomeData.date,
          original_amount: incomeData.originalAmount,
          currency: accountCurrency,
          received_amount: incomeData.receivedAmount || 0,
          converted_amount: convertedAmount,
          original_converted_amount: originalConvertedAmount,
          category: incomeData.category,
          description: incomeData.description,
          client_name: incomeData.clientName,
          notes: incomeData.notes || '',
          status: incomeData.status,
          account_name: incomeData.account,
          due_date: incomeData.dueDate || null,
          manual_conversion_rate: incomeData.manualConversionRate || null,
          manual_pkr_amount: incomeData.manualPKRAmount || null,
          split_amount_pkr: splitAmountPKR,
          split_rate_used: effectiveRate,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding income:', error);
        throw error;
      }

      console.log('Income added successfully:', data);
      
      // Reload data
      await loadIncome();
      await updateAccountBalances();
      
      return data;
    } catch (error) {
      console.error('Error in addIncome:', error);
      throw error;
    }
  }, [user, accounts, exchangeRates]);

  // Update income
  const updateIncome = useCallback(async (id: string, updates: any) => {
    if (!user) return;

    try {
      // Get account currency
      const account = accounts.find(acc => acc.name === updates.account);
      const accountCurrency = account?.currency || updates.currency || 'PKR';
      
      // Recalculate values if amounts or rates change
      let effectiveRate = 1;
      let originalConvertedAmount = updates.originalConvertedAmount;
      
      if (updates.originalAmount !== undefined) {
        if (accountCurrency !== 'PKR') {
          effectiveRate = updates.manualConversionRate || exchangeRates[accountCurrency] || 1;
          originalConvertedAmount = updates.manualPKRAmount || (updates.originalAmount * effectiveRate);
        } else {
          originalConvertedAmount = updates.originalAmount;
        }
      }

      let convertedAmount = updates.convertedAmount || 0;
      let splitAmountPKR = updates.splitAmountPKR || 0;

      if (updates.receivedAmount !== undefined && (updates.status === 'Received' || updates.status === 'Partial')) {
        const receivedPKRAmount = accountCurrency !== 'PKR' 
          ? (updates.manualPKRAmount ? 
              (updates.manualPKRAmount * (updates.receivedAmount / (updates.originalAmount || 1))) :
              (updates.receivedAmount * effectiveRate))
          : updates.receivedAmount;
        
        convertedAmount = receivedPKRAmount;
        splitAmountPKR = receivedPKRAmount;
      } else if (updates.status === 'Upcoming' || updates.status === 'Cancelled') {
        convertedAmount = 0;
        splitAmountPKR = 0;
      }

      // Map frontend field names to database column names
      const dbUpdates: any = {
        date: updates.date,
        original_amount: updates.originalAmount,
        currency: accountCurrency,
        received_amount: updates.receivedAmount || 0,
        converted_amount: convertedAmount,
        original_converted_amount: originalConvertedAmount,
        category: updates.category,
        description: updates.description,
        client_name: updates.clientName,
        notes: updates.notes || '',
        status: updates.status,
        account_name: updates.account,
        due_date: updates.dueDate || null,
        manual_conversion_rate: updates.manualConversionRate || null,
        manual_pkr_amount: updates.manualPKRAmount || null,
        split_amount_pkr: splitAmountPKR,
        split_rate_used: effectiveRate,
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      });

      const { data, error } = await supabase
        .from('income')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating income:', error);
        throw error;
      }

      console.log('Income updated successfully:', data);

      // Reload data
      await loadIncome();
      await updateAccountBalances();
      
      return data;
    } catch (error) {
      console.error('Error in updateIncome:', error);
      throw error;
    }
  }, [user, accounts, exchangeRates]);

  // Delete income
  const deleteIncome = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting income:', error);
        throw error;
      }

      console.log('Income deleted successfully:', id);

      // Reload data
      await loadIncome();
      await updateAccountBalances();
    } catch (error) {
      console.error('Error in deleteIncome:', error);
      throw error;
    }
  }, [user]);

  // Add expense
  const addExpense = useCallback(async (expenseData: any) => {
    if (!user) return;

    try {
      // Get account currency from accounts
      const account = accounts.find(acc => acc.name === expenseData.account);
      const accountCurrency = account?.currency || 'PKR';
      
      let convertedAmount = expenseData.amount;
      
      if (accountCurrency !== 'PKR') {
        const effectiveRate = expenseData.manualConversionRate || exchangeRates[accountCurrency] || 1;
        convertedAmount = expenseData.manualPKRAmount || (expenseData.amount * effectiveRate);
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          date: expenseData.date,
          amount: expenseData.amount,
          currency: accountCurrency,
          converted_amount: convertedAmount,
          category: expenseData.category,
          description: expenseData.description,
          payment_status: expenseData.paymentStatus,
          notes: expenseData.notes || '',
          account_name: expenseData.account,
          due_date: expenseData.dueDate || null,
          manual_conversion_rate: expenseData.manualConversionRate || null,
          manual_pkr_amount: expenseData.manualPKRAmount || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding expense:', error);
        throw error;
      }

      console.log('Expense added successfully:', data);

      // Reload data
      await loadExpenses();
      await updateAccountBalances();
      
      return data;
    } catch (error) {
      console.error('Error in addExpense:', error);
      throw error;
    }
  }, [user, accounts, exchangeRates]);

  // Update expense
  const updateExpense = useCallback(async (id: string, updates: any) => {
    if (!user) return;

    try {
      // Get account currency
      const account = accounts.find(acc => acc.name === updates.account);
      const accountCurrency = account?.currency || updates.currency || 'PKR';
      
      let convertedAmount = updates.convertedAmount || updates.amount;
      
      if (updates.amount !== undefined) {
        if (accountCurrency !== 'PKR') {
          const effectiveRate = updates.manualConversionRate || exchangeRates[accountCurrency] || 1;
          convertedAmount = updates.manualPKRAmount || (updates.amount * effectiveRate);
        } else {
          convertedAmount = updates.amount;
        }
      }

      // Map frontend field names to database column names
      const dbUpdates: any = {
        date: updates.date,
        amount: updates.amount,
        currency: accountCurrency,
        converted_amount: convertedAmount,
        category: updates.category,
        description: updates.description,
        payment_status: updates.paymentStatus,
        notes: updates.notes || '',
        account_name: updates.account,
        due_date: updates.dueDate || null,
        manual_conversion_rate: updates.manualConversionRate || null,
        manual_pkr_amount: updates.manualPKRAmount || null,
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      });

      const { data, error } = await supabase
        .from('expenses')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating expense:', error);
        throw error;
      }

      console.log('Expense updated successfully:', data);

      // Reload data
      await loadExpenses();
      await updateAccountBalances();
      
      return data;
    } catch (error) {
      console.error('Error in updateExpense:', error);
      throw error;
    }
  }, [user, accounts, exchangeRates]);

  // Delete expense
  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting expense:', error);
        throw error;
      }

      console.log('Expense deleted successfully:', id);

      // Reload data
      await loadExpenses();
      await updateAccountBalances();
    } catch (error) {
      console.error('Error in deleteExpense:', error);
      throw error;
    }
  }, [user]);

  // Update account balance
  const updateAccountBalance = useCallback(async (id: string, newBalance: number) => {
    if (!user) return;

    try {
      const account = accounts.find(acc => acc.id === id);
      if (!account) return;

      const convertedBalance = calculateConvertedAmount(newBalance, account.currency, exchangeRates);

      const { error } = await supabase
        .from('accounts')
        .update({
          balance: newBalance,
          converted_balance: convertedBalance,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating account balance:', error);
        throw error;
      }

      console.log('Account balance updated successfully:', id);

      // Update local state to show the new balance immediately
      setAccounts(prev => prev.map(acc => 
        acc.id === id 
          ? { ...acc, balance: newBalance, convertedBalance, lastUpdated: new Date().toISOString() }
          : acc
      ));
    } catch (error) {
      console.error('Error in updateAccountBalance:', error);
      throw error;
    }
  }, [user, accounts, exchangeRates]);

  // Update account balances based on transactions
  const updateAccountBalances = useCallback(async () => {
    if (!user || accounts.length === 0) return;

    try {
      console.log('Updating account balances based on company distribution...');
      


      // Reload accounts
      await loadAccounts();
      console.log('Account balances refreshed');
    } catch (error) {
      console.error('Error in updateAccountBalances:', error);
    }
  }, [user]);

  // Add account
  const addAccount = useCallback(async (accountData: Omit<Account, 'id'>) => {
    if (!user) return;

    try {
      const convertedBalance = 0; // Always start with 0 balance

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: accountData.name,
          currency: accountData.currency,
          balance: 0,
          converted_balance: convertedBalance,
          notes: accountData.notes || '',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding account:', error);
        throw error;
      }

      console.log('Account added successfully:', data);

      // Reload accounts
      await loadAccounts();
      
      return data;
    } catch (error) {
      console.error('Error in addAccount:', error);
      throw error;
    }
  }, [user, exchangeRates]);

  // Delete account
  const deleteAccount = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting account:', error);
        throw error;
      }

      console.log('Account deleted successfully:', id);

      // Reload accounts
      await loadAccounts();
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      throw error;
    }
  }, [user]);

  // Update exchange rates
  const updateExchangeRates = useCallback(async (newRates: ExchangeRates) => {
    if (!user) return;

    try {
      // Update or insert exchange rates
      for (const [currency, rate] of Object.entries(newRates)) {
        if (currency !== 'PKR') {
          const { error } = await supabase
            .from('exchange_rates')
            .upsert({
              user_id: user.id,
              currency,
              rate,
              updated_by: user.id,
            });

          if (error) {
            console.error(`Error updating rate for ${currency}:`, error);
          }
        }
      }

      console.log('Exchange rates updated successfully');

      // Update local state
      setExchangeRates(newRates);
      await updateAccountBalances();
    } catch (error) {
      console.error('Error in updateExchangeRates:', error);
      throw error;
    }
  }, [user, updateAccountBalances]);

  // Notification functions
  const markNotificationAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      throw error;
    }
  }, [user]);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error in markAllNotificationsAsRead:', error);
      throw error;
    }
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }

      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      throw error;
    }
  }, [user]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing all notifications:', error);
        throw error;
      }

      // Update local state
      setNotifications([]);
    } catch (error) {
      console.error('Error in clearAllNotifications:', error);
      throw error;
    }
  }, [user]);

  const updateNotificationSettingsAsync = useCallback(async (settings: NotificationSettings) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          email_enabled: settings.emailEnabled,
          whatsapp_enabled: settings.whatsappEnabled,
          in_app_enabled: settings.inAppEnabled,
          email_address: settings.emailAddress || null,
          whatsapp_number: settings.whatsappNumber || null,
          reminder_days: settings.reminderDays,
          daily_digest: settings.dailyDigest,
          weekly_report: settings.weeklyReport,
        });

      if (error) {
        console.error('Error updating notification settings:', error);
        throw error;
      }

      console.log('Notification settings updated successfully');

      // Update local state
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error in updateNotificationSettings:', error);
      throw error;
    }
  }, [user]);

  // Add notification
  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          is_read: notification.isRead,
          scheduled_for: notification.scheduledFor || null,
          related_id: notification.relatedId || null,
          channels: notification.channels,
          metadata: notification.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding notification:', error);
        throw error;
      }

      console.log('Notification added successfully:', data);

      // Reload notifications
      await loadNotifications();
      
      return data;
    } catch (error) {
      console.error('Error in addNotification:', error);
      throw error;
    }
  }, [user]);

  // Filter data by selected month
  const monthlyIncome = income.filter(item => item.date.startsWith(selectedMonth));
  const monthlyExpenses = expenses.filter(item => item.date.startsWith(selectedMonth));

  // Calculate dashboard summary
  const dashboardSummary = {
    currentMonth: {
      month: selectedMonth,
      totalIncome: monthlyIncome
        .filter(item => item.status === 'Received' || item.status === 'Partial')
        .reduce((sum, item) => sum + item.splitAmountPKR, 0),
      expectedIncome: monthlyIncome
        .filter(item => item.status === 'Upcoming')
        .reduce((sum, item) => sum + item.originalConvertedAmount, 0),
      cancelledIncome: monthlyIncome
        .filter(item => item.status === 'Cancelled')
        .reduce((sum, item) => sum + item.originalConvertedAmount, 0),
      totalExpenses: monthlyExpenses.reduce((sum, item) => sum + item.convertedAmount, 0),
      netBalance: 0, // Will be calculated
      companyShare: 0, // Will be calculated
      roshaanShare: 0, // Will be calculated
      shahbazShare: 0, // Will be calculated
      remainingCompanyBalance: 0, // Will be calculated
      pendingPayments: monthlyExpenses
        .filter(expense => expense.paymentStatus === 'Pending')
        .reduce((sum, expense) => sum + expense.convertedAmount, 0),
      totalReserves: 0,
      reserveGainLoss: 0,
    },
    totalBalance: 0, // Will be set to remainingCompanyBalance
    accounts,
    recentTransactions: [...monthlyIncome, ...monthlyExpenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    pendingExpenses: monthlyExpenses.filter(expense => expense.paymentStatus === 'Pending'),
    upcomingIncome: monthlyIncome.filter(item => item.status === 'Upcoming'),
    partialPayments: monthlyIncome.filter(item => item.status === 'Partial'),
    currencyReserves: [],
    notifications,
    unreadNotifications: notifications.filter(n => !n.isRead).length,
  };

  // Calculate derived values
  const totalIncome = dashboardSummary.currentMonth.totalIncome;
  const totalExpenses = dashboardSummary.currentMonth.totalExpenses;
  dashboardSummary.currentMonth.companyShare = totalIncome * 0.5;
  dashboardSummary.currentMonth.roshaanShare = totalIncome * 0.25;
  dashboardSummary.currentMonth.shahbazShare = totalIncome * 0.25;
  dashboardSummary.currentMonth.remainingCompanyBalance = dashboardSummary.currentMonth.companyShare - totalExpenses;
  dashboardSummary.currentMonth.netBalance = totalIncome - totalExpenses;
  
  // Set Total Account Balance to match Remaining Company Balance
  dashboardSummary.totalBalance = dashboardSummary.currentMonth.remainingCompanyBalance;

  return {
    // Data
    income: monthlyIncome,
    expenses: monthlyExpenses,
    accounts,
    exchangeRates,
    selectedMonth,
    dashboardSummary,
    notifications,
    notificationSettings,
    isLoading,
    
    // All data (not filtered by month)
    allIncome: income,
    allExpenses: expenses,
    
    // Actions
    addIncome,
    addExpense,
    updateIncome,
    updateExpense,
    deleteIncome,
    deleteExpense,
    updateAccountBalance,
    addAccount,
    deleteAccount,
    setExchangeRates: updateExchangeRates,
    setSelectedMonth,
    
    // Notification actions
    unreadNotifications: notifications.filter(n => !n.isRead).length,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    updateNotificationSettings: updateNotificationSettingsAsync,
    addNotification,
    
    // Utility
    refreshData: loadAllData,
  };
};