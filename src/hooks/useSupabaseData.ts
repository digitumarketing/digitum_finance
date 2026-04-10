import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';
import {
  Income,
  Expense,
  Account,
  ExchangeRates,
  Notification,
  NotificationSettings,
} from '../types';
import { getCurrentMonth, calculateConvertedAmount, convertAccountingMonthToYYYYMM } from '../utils/helpers';

export const useSupabaseData = (officeId: string | null) => {
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
  const [profitDistribution, setProfitDistribution] = useState({
    companyPercentage: 50,
    roshaanPercentage: 25,
    shahbazPercentage: 25
  });

  const hasLoadedDataRef = useRef<string | null>(null);

  useEffect(() => {
    const loadProfitDistribution = async () => {
      if (!user || !selectedMonth) {
        setProfitDistribution({ companyPercentage: 50, roshaanPercentage: 25, shahbazPercentage: 25 });
        return;
      }
      const [year, month] = selectedMonth.split('-').map(Number);
      try {
        const { data, error } = await supabase
          .from('profit_distribution_settings')
          .select('company_percentage, roshaan_percentage, shahbaz_percentage')
          .eq('user_id', user.id)
          .eq('year', year)
          .eq('month', month)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return;
        if (data) {
          setProfitDistribution({
            companyPercentage: Number(data.company_percentage),
            roshaanPercentage: Number(data.roshaan_percentage),
            shahbazPercentage: Number(data.shahbaz_percentage)
          });
        } else {
          setProfitDistribution({ companyPercentage: 50, roshaanPercentage: 25, shahbazPercentage: 25 });
        }
      } catch {
        setProfitDistribution({ companyPercentage: 50, roshaanPercentage: 25, shahbazPercentage: 25 });
      }
    };
    loadProfitDistribution();
  }, [user, selectedMonth]);

  useEffect(() => {
    if (user && profile && profile.is_active && officeId) {
      const loadKey = `${user.id}-${officeId}`;
      if (hasLoadedDataRef.current !== loadKey) {
        hasLoadedDataRef.current = loadKey;
        loadAllData();
      }
    } else if (!user || !profile || !profile.is_active) {
      hasLoadedDataRef.current = null;
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
  }, [user, profile, officeId]);

  useEffect(() => {
    if (!user || !profile?.is_active) return;
    const channel = supabase
      .channel(`notifications-${user.id}-${officeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const notif = payload.new as any;
        if (notif.office_id && notif.office_id !== officeId) return;
        const scheduledFor = notif.scheduled_for ? new Date(notif.scheduled_for) : null;
        if (!scheduledFor || scheduledFor <= new Date()) {
          setNotifications(prev => {
            if (prev.some(n => n.id === notif.id)) return prev;
            return [{
              id: notif.id, type: notif.type, title: notif.title,
              message: notif.message, priority: notif.priority, isRead: notif.is_read,
              createdAt: notif.created_at, scheduledFor: notif.scheduled_for,
              relatedId: notif.related_id, channels: notif.channels || [], metadata: notif.metadata || {},
            }, ...prev];
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, profile, officeId]);

  const loadAllData = useCallback(async () => {
    if (!user?.id || !profile?.is_active || !officeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      await Promise.allSettled([loadAccounts(), loadExchangeRates()]);
      await Promise.allSettled([loadIncome(), loadExpenses()]);
      await Promise.allSettled([loadNotifications(), loadNotificationSettings()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, officeId]);

  const loadAccounts = useCallback(async () => {
    if (!user || !profile?.is_active || !officeId) return;
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false });
      if (error) { console.error('Error loading accounts:', error); return; }
      setAccounts(data.map(account => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
        balance: parseFloat(account.balance || 0),
        convertedBalance: parseFloat(account.converted_balance || 0),
        lastUpdated: account.updated_at,
        notes: account.notes || '',
      })));
    } catch (error) { console.error('Error in loadAccounts:', error); }
  }, [user, profile, officeId]);

  const loadExchangeRates = useCallback(async () => {
    if (!user || !profile?.is_active || !officeId) return;
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('office_id', officeId)
        .order('currency', { ascending: true });
      if (error) { console.error('Error loading exchange rates:', error); return; }
      const rates: ExchangeRates = { PKR: 1 };
      data.forEach(rate => { rates[rate.currency] = parseFloat(rate.rate); });
      setExchangeRates(rates);
    } catch (error) { console.error('Error in loadExchangeRates:', error); }
  }, [user, profile, officeId]);

  const loadIncome = useCallback(async () => {
    if (!user || !profile?.is_active || !officeId) return;
    try {
      const isSuperAdmin = profile.role === 'super_admin';
      let query = supabase.from('income').select('*').eq('office_id', officeId).order('date', { ascending: false });
      if (!isSuperAdmin) { query = query.eq('user_id', user.id); }
      const { data, error } = await query;
      if (error) { console.error('Error loading income:', error); return; }
      const userIds = [...new Set(data.map(item => item.user_id))];
      const { data: profiles } = await supabase.from('user_profiles').select('id, name, email').in('id', userIds);
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setIncome(data.map(item => ({
        id: item.id, date: item.date,
        originalAmount: parseFloat(item.original_amount),
        currency: item.currency,
        receivedAmount: parseFloat(item.received_amount || 0),
        convertedAmount: parseFloat(item.converted_amount || 0),
        originalConvertedAmount: parseFloat(item.original_converted_amount || 0),
        category: item.category, description: item.description, clientName: item.client_name,
        notes: item.notes || '', status: item.status, account: item.account_name,
        dueDate: item.due_date, accountingMonth: item.accounting_month,
        manualConversionRate: item.manual_conversion_rate ? parseFloat(item.manual_conversion_rate) : undefined,
        manualPKRAmount: item.manual_pkr_amount ? parseFloat(item.manual_pkr_amount) : undefined,
        splitAmountPKR: parseFloat(item.split_amount_pkr || 0),
        splitRateUsed: parseFloat(item.split_rate_used || 1),
        userId: item.user_id,
        userName: profilesMap.get(item.user_id)?.name,
        userEmail: profilesMap.get(item.user_id)?.email,
        createdAt: item.created_at, updatedAt: item.updated_at,
      })));
    } catch (error) { console.error('Error in loadIncome:', error); }
  }, [user, profile, officeId]);

  const loadExpenses = useCallback(async () => {
    if (!user || !profile?.is_active || !officeId) return;
    try {
      const isSuperAdmin = profile.role === 'super_admin';
      let query = supabase.from('expenses').select('*').eq('office_id', officeId).order('date', { ascending: false });
      if (!isSuperAdmin) { query = query.eq('user_id', user.id); }
      const { data, error } = await query;
      if (error) { console.error('Error loading expenses:', error); return; }
      const userIds = [...new Set(data.map(item => item.user_id))];
      const { data: profiles } = await supabase.from('user_profiles').select('id, name, email').in('id', userIds);
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setExpenses(data.map(item => ({
        id: item.id, date: item.date,
        amount: parseFloat(item.amount),
        currency: item.currency,
        convertedAmount: parseFloat(item.converted_amount || 0),
        category: item.category, description: item.description,
        paymentStatus: item.payment_status, notes: item.notes || '',
        account: item.account_name, dueDate: item.due_date,
        accountingMonth: item.accounting_month,
        manualConversionRate: item.manual_conversion_rate ? parseFloat(item.manual_conversion_rate) : undefined,
        manualPKRAmount: item.manual_pkr_amount ? parseFloat(item.manual_pkr_amount) : undefined,
        userId: item.user_id,
        userName: profilesMap.get(item.user_id)?.name,
        userEmail: profilesMap.get(item.user_id)?.email,
        createdAt: item.created_at, updatedAt: item.updated_at,
      })));
    } catch (error) { console.error('Error in loadExpenses:', error); }
  }, [user, profile, officeId]);

  const loadNotifications = useCallback(async () => {
    if (!user || !profile?.is_active || !officeId) return;
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('office_id', officeId)
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('created_at', { ascending: false });
      if (error) { console.error('Error loading notifications:', error); return; }
      setNotifications(data.map(notif => ({
        id: notif.id, type: notif.type, title: notif.title, message: notif.message,
        priority: notif.priority, isRead: notif.is_read, createdAt: notif.created_at,
        scheduledFor: notif.scheduled_for, relatedId: notif.related_id,
        channels: notif.channels || [], metadata: notif.metadata || {},
      })));
    } catch (error) { console.error('Error in loadNotifications:', error); }
  }, [user, profile, officeId]);

  useEffect(() => {
    if (!user || !profile?.is_active) return;
    const interval = setInterval(() => { loadNotifications(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, profile, loadNotifications]);

  const loadNotificationSettings = useCallback(async () => {
    if (!user || !profile?.is_active) return;
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return;
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
      }
    } catch (error) { console.error('Error in loadNotificationSettings:', error); }
  }, [user, profile]);

  const addIncome = useCallback(async (incomeData: any) => {
    if (!user || !officeId) return;
    try {
      const account = accounts.find(acc => acc.name === incomeData.account);
      const accountCurrency = account?.currency || 'PKR';
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
          ? (incomeData.manualPKRAmount
              ? (incomeData.manualPKRAmount * (incomeData.receivedAmount / incomeData.originalAmount))
              : (incomeData.receivedAmount * effectiveRate))
          : incomeData.receivedAmount;
        convertedAmount = receivedPKRAmount;
        splitAmountPKR = receivedPKRAmount;
      }
      const { data, error } = await supabase.from('income').insert({
        user_id: user.id,
        office_id: officeId,
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
        accounting_month: incomeData.accountingMonth || null,
        manual_conversion_rate: incomeData.manualConversionRate || null,
        manual_pkr_amount: incomeData.manualPKRAmount || null,
        split_amount_pkr: splitAmountPKR,
        split_rate_used: effectiveRate,
      }).select().single();
      if (error) throw error;
      if (incomeData.status === 'Upcoming' && incomeData.dueDate) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          office_id: officeId,
          type: 'income_due',
          title: `Payment Due: ${incomeData.clientName}`,
          message: `Expected payment of ${incomeData.originalAmount} ${accountCurrency} from ${incomeData.clientName} is due on ${new Date(incomeData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
          priority: 'high',
          is_read: false,
          scheduled_for: incomeData.dueDate,
          related_id: data.id,
          channels: ['in_app'],
          metadata: { amount: incomeData.originalAmount, currency: accountCurrency, clientName: incomeData.clientName, dueDate: incomeData.dueDate },
        });
      }
      await loadIncome();
      await updateAccountBalances();
      return data;
    } catch (error) { console.error('Error in addIncome:', error); throw error; }
  }, [user, officeId, accounts, exchangeRates]);

  const updateIncome = useCallback(async (id: string, updates: any) => {
    if (!user) return;
    try {
      const account = accounts.find(acc => acc.name === updates.account);
      const accountCurrency = account?.currency || updates.currency || 'PKR';
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
          ? (updates.manualPKRAmount
              ? (updates.manualPKRAmount * (updates.receivedAmount / (updates.originalAmount || 1)))
              : (updates.receivedAmount * effectiveRate))
          : updates.receivedAmount;
        convertedAmount = receivedPKRAmount;
        splitAmountPKR = receivedPKRAmount;
      } else if (updates.status === 'Upcoming' || updates.status === 'Cancelled') {
        convertedAmount = 0;
        splitAmountPKR = 0;
      }
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
        split_amount_pkr: splitAmountPKR,
        split_rate_used: effectiveRate,
      };
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.accountingMonth !== undefined) dbUpdates.accounting_month = updates.accountingMonth;
      if (updates.manualConversionRate !== undefined) dbUpdates.manual_conversion_rate = updates.manualConversionRate;
      if (updates.manualPKRAmount !== undefined) dbUpdates.manual_pkr_amount = updates.manualPKRAmount;
      Object.keys(dbUpdates).forEach(key => { if (dbUpdates[key] === undefined) delete dbUpdates[key]; });
      const { data, error } = await supabase.from('income').update(dbUpdates).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      await loadIncome();
      await updateAccountBalances();
      return data;
    } catch (error) { console.error('Error in updateIncome:', error); throw error; }
  }, [user, accounts, exchangeRates]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('income').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadIncome();
      await updateAccountBalances();
    } catch (error) { console.error('Error in deleteIncome:', error); throw error; }
  }, [user]);

  const deleteAllIncome = useCallback(async () => {
    if (!user || !officeId) return;
    try {
      const { error } = await supabase.from('income').delete().eq('user_id', user.id).eq('office_id', officeId);
      if (error) throw error;
      await loadIncome();
      await loadExpenses();
      await loadAccounts();
    } catch (error) { console.error('Error in deleteAllIncome:', error); throw error; }
  }, [user, officeId, loadIncome, loadExpenses, loadAccounts]);

  const addExpense = useCallback(async (expenseData: any) => {
    if (!user || !officeId) return;
    try {
      const account = accounts.find(acc => acc.name === expenseData.account);
      const accountCurrency = account?.currency || 'PKR';
      let convertedAmount = expenseData.amount;
      if (accountCurrency !== 'PKR') {
        const effectiveRate = expenseData.manualConversionRate || exchangeRates[accountCurrency] || 1;
        convertedAmount = expenseData.manualPKRAmount || (expenseData.amount * effectiveRate);
      }
      const { data, error } = await supabase.from('expenses').insert({
        user_id: user.id,
        office_id: officeId,
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
        accounting_month: expenseData.accountingMonth || null,
        manual_conversion_rate: expenseData.manualConversionRate || null,
        manual_pkr_amount: expenseData.manualPKRAmount || null,
      }).select().single();
      if (error) throw error;
      if (expenseData.paymentStatus === 'Pending' && expenseData.dueDate) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          office_id: officeId,
          type: 'expense_due',
          title: `Expense Due: ${expenseData.description}`,
          message: `Payment of ${expenseData.amount} ${accountCurrency} for "${expenseData.description}" is due on ${new Date(expenseData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
          priority: 'medium',
          is_read: false,
          scheduled_for: expenseData.dueDate,
          related_id: data.id,
          channels: ['in_app'],
          metadata: { amount: expenseData.amount, currency: accountCurrency, dueDate: expenseData.dueDate },
        });
      }
      await loadExpenses();
      await updateAccountBalances();
      return data;
    } catch (error) { console.error('Error in addExpense:', error); throw error; }
  }, [user, officeId, accounts, exchangeRates]);

  const updateExpense = useCallback(async (id: string, updates: any) => {
    if (!user) return;
    try {
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
      const dbUpdates: any = {
        date: updates.date, amount: updates.amount, currency: accountCurrency,
        converted_amount: convertedAmount, category: updates.category, description: updates.description,
        payment_status: updates.paymentStatus, notes: updates.notes || '', account_name: updates.account,
        due_date: updates.dueDate || null, accounting_month: updates.accountingMonth || null,
        manual_conversion_rate: updates.manualConversionRate || null,
        manual_pkr_amount: updates.manualPKRAmount || null,
      };
      Object.keys(dbUpdates).forEach(key => { if (dbUpdates[key] === undefined) delete dbUpdates[key]; });
      const { data, error } = await supabase.from('expenses').update(dbUpdates).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      await loadExpenses();
      await updateAccountBalances();
      return data;
    } catch (error) { console.error('Error in updateExpense:', error); throw error; }
  }, [user, accounts, exchangeRates]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadExpenses();
      await updateAccountBalances();
    } catch (error) { console.error('Error in deleteExpense:', error); throw error; }
  }, [user]);

  const deleteAllExpenses = useCallback(async () => {
    if (!user || !officeId) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('user_id', user.id).eq('office_id', officeId);
      if (error) throw error;
      await loadIncome();
      await loadExpenses();
      await loadAccounts();
    } catch (error) { console.error('Error in deleteAllExpenses:', error); throw error; }
  }, [user, officeId, loadIncome, loadExpenses, loadAccounts]);

  const updateAccountBalance = useCallback(async (id: string, newBalance: number) => {
    if (!user) return;
    try {
      const account = accounts.find(acc => acc.id === id);
      if (!account) return;
      const convertedBalance = calculateConvertedAmount(newBalance, account.currency, exchangeRates);
      const { error } = await supabase.from('accounts').update({ balance: newBalance, converted_balance: convertedBalance }).eq('id', id);
      if (error) throw error;
      setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, balance: newBalance, convertedBalance, lastUpdated: new Date().toISOString() } : acc));
    } catch (error) { console.error('Error in updateAccountBalance:', error); throw error; }
  }, [user, accounts, exchangeRates]);

  const updateAccountBalances = useCallback(async () => {
    if (!user || accounts.length === 0 || (income.length === 0 && expenses.length === 0)) return;
    try {
      const accountBalances: Record<string, { balance: number; convertedBalance: number }> = {};
      accounts.forEach(account => { accountBalances[account.name] = { balance: 0, convertedBalance: 0 }; });
      income.forEach(incomeItem => {
        if (incomeItem.status === 'Received' || incomeItem.status === 'Partial') {
          if (!accountBalances[incomeItem.account]) accountBalances[incomeItem.account] = { balance: 0, convertedBalance: 0 };
          accountBalances[incomeItem.account].balance += incomeItem.receivedAmount;
          accountBalances[incomeItem.account].convertedBalance += incomeItem.convertedAmount;
        }
      });
      expenses.forEach(expense => {
        if (expense.paymentStatus === 'Done') {
          if (!accountBalances[expense.account]) accountBalances[expense.account] = { balance: 0, convertedBalance: 0 };
          accountBalances[expense.account].balance -= expense.amount;
          accountBalances[expense.account].convertedBalance -= expense.convertedAmount;
        }
      });
      for (const [accountName, balances] of Object.entries(accountBalances)) {
        const account = accounts.find(acc => acc.name === accountName);
        if (account) {
          await supabase.from('accounts').update({ balance: balances.balance, converted_balance: balances.convertedBalance }).eq('id', account.id).eq('user_id', user.id);
        }
      }
      setAccounts(prev => prev.map(account => ({
        ...account,
        balance: accountBalances[account.name]?.balance || 0,
        convertedBalance: accountBalances[account.name]?.convertedBalance || 0,
        lastUpdated: new Date().toISOString(),
      })));
    } catch (error) { console.error('Error in updateAccountBalances:', error); }
  }, [user, accounts, income, expenses, exchangeRates]);

  const addAccount = useCallback(async (accountData: Omit<Account, 'id'>) => {
    if (!user || !officeId) return;
    try {
      const { data, error } = await supabase.from('accounts').insert({
        user_id: user.id,
        office_id: officeId,
        name: accountData.name,
        currency: accountData.currency,
        balance: 0,
        converted_balance: 0,
        notes: accountData.notes || '',
      }).select().single();
      if (error) throw error;
      await loadAccounts();
      return data;
    } catch (error) { console.error('Error in addAccount:', error); throw error; }
  }, [user, officeId, exchangeRates]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadAccounts();
    } catch (error) { console.error('Error in deleteAccount:', error); throw error; }
  }, [user]);

  const updateExchangeRates = useCallback(async (newRates: ExchangeRates) => {
    if (!user || !officeId) return;
    try {
      const { data: existingRates, error: fetchError } = await supabase
        .from('exchange_rates').select('currency').eq('office_id', officeId);
      if (fetchError) throw fetchError;
      const existingCurrencies = existingRates?.map(r => r.currency) || [];
      const newCurrencies = Object.keys(newRates).filter(c => c !== 'PKR');
      const currenciesToDelete = existingCurrencies.filter(currency => !newCurrencies.includes(currency));
      if (currenciesToDelete.length > 0) {
        const { error: deleteError } = await supabase.from('exchange_rates').delete().eq('office_id', officeId).in('currency', currenciesToDelete);
        if (deleteError) throw deleteError;
      }
      const upsertData = Object.entries(newRates).filter(([currency]) => currency !== 'PKR').map(([currency, rate]) => ({
        user_id: user.id,
        office_id: officeId,
        currency,
        rate,
        updated_by: user.id,
      }));
      if (upsertData.length > 0) {
        const { error: upsertError } = await supabase.from('exchange_rates').upsert(upsertData, { onConflict: 'office_id,currency' });
        if (upsertError) throw upsertError;
      }
      await loadExchangeRates();
      await updateAccountBalances();
    } catch (error) { console.error('Error in updateExchangeRates:', error); throw error; }
  }, [user, officeId, loadExchangeRates, updateAccountBalances]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif));
    } catch (error) { console.error('Error in markNotificationAsRead:', error); throw error; }
  }, [user]);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user || !officeId) return;
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('office_id', officeId).eq('is_read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (error) { console.error('Error in markAllNotificationsAsRead:', error); throw error; }
  }, [user, officeId]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) { console.error('Error in deleteNotification:', error); throw error; }
  }, [user]);

  const clearAllNotifications = useCallback(async () => {
    if (!user || !officeId) return;
    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id).eq('office_id', officeId);
      if (error) throw error;
      setNotifications([]);
    } catch (error) { console.error('Error in clearAllNotifications:', error); throw error; }
  }, [user, officeId]);

  const updateNotificationSettingsAsync = useCallback(async (settings: NotificationSettings) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notification_settings').upsert({
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
      if (error) throw error;
      setNotificationSettings(settings);
    } catch (error) { console.error('Error in updateNotificationSettings:', error); throw error; }
  }, [user]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!user || !officeId) return;
    try {
      const { data, error } = await supabase.from('notifications').insert({
        user_id: user.id,
        office_id: officeId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        is_read: notification.isRead,
        scheduled_for: notification.scheduledFor || null,
        related_id: notification.relatedId || null,
        channels: notification.channels,
        metadata: notification.metadata || {},
      }).select().single();
      if (error) throw error;
      await loadNotifications();
      return data;
    } catch (error) { console.error('Error in addNotification:', error); throw error; }
  }, [user, officeId]);

  const bulkImportIncome = useCallback(async (incomeDataArray: any[]) => {
    if (!user) return;
    try {
      await Promise.all(incomeDataArray.map(incomeData => addIncome(incomeData)));
      await loadIncome();
      await updateAccountBalances();
    } catch (error) { console.error('Error in bulkImportIncome:', error); throw error; }
  }, [user, addIncome, loadIncome, updateAccountBalances]);

  const bulkImportExpenses = useCallback(async (expenseDataArray: any[]) => {
    if (!user) return;
    try {
      await Promise.all(expenseDataArray.map(expenseData => addExpense(expenseData)));
      await loadExpenses();
      await updateAccountBalances();
    } catch (error) { console.error('Error in bulkImportExpenses:', error); throw error; }
  }, [user, addExpense, loadExpenses, updateAccountBalances]);

  const recalculateAllBalances = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('recalculate_all_account_balances');
      if (error) throw error;
      console.log(`Successfully recalculated ${data} account balances`);
      await loadAccounts();
    } catch (error) { console.error('Error in recalculateAllBalances:', error); throw error; }
  }, [user, loadAccounts]);

  const monthlyIncome = selectedMonth === 'all'
    ? income
    : income.filter(item => {
        if (!item.accountingMonth) return false;
        return convertAccountingMonthToYYYYMM(item.accountingMonth) === selectedMonth;
      });
  const monthlyExpenses = selectedMonth === 'all'
    ? expenses
    : expenses.filter(item => {
        if (!item.accountingMonth) return false;
        return convertAccountingMonthToYYYYMM(item.accountingMonth) === selectedMonth;
      });

  const dashboardSummary = {
    currentMonth: {
      month: selectedMonth,
      totalIncome: monthlyIncome.filter(item => item.status === 'Received' || item.status === 'Partial').reduce((sum, item) => sum + item.splitAmountPKR, 0),
      expectedIncome: monthlyIncome.filter(item => item.status === 'Upcoming').reduce((sum, item) => sum + item.originalConvertedAmount, 0),
      cancelledIncome: monthlyIncome.filter(item => item.status === 'Cancelled').reduce((sum, item) => sum + item.originalConvertedAmount, 0),
      totalExpenses: monthlyExpenses.reduce((sum, item) => sum + item.convertedAmount, 0),
      netBalance: 0,
      companyShare: 0,
      roshaanShare: 0,
      shahbazShare: 0,
      remainingCompanyBalance: 0,
      pendingPayments: monthlyExpenses.filter(expense => expense.paymentStatus === 'Pending').reduce((sum, expense) => sum + expense.convertedAmount, 0),
      totalReserves: 0,
      reserveGainLoss: 0,
    },
    totalBalance: 0,
    accounts,
    recentTransactions: [...monthlyIncome, ...monthlyExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    pendingExpenses: monthlyExpenses.filter(expense => expense.paymentStatus === 'Pending'),
    upcomingIncome: monthlyIncome.filter(item => item.status === 'Upcoming'),
    partialPayments: monthlyIncome.filter(item => item.status === 'Partial'),
    currencyReserves: [],
    notifications,
    unreadNotifications: notifications.filter(n => !n.isRead).length,
  };

  const totalIncome = dashboardSummary.currentMonth.totalIncome;
  const totalExpenses = dashboardSummary.currentMonth.totalExpenses;
  dashboardSummary.currentMonth.companyShare = totalIncome * (profitDistribution.companyPercentage / 100);
  dashboardSummary.currentMonth.roshaanShare = totalIncome * (profitDistribution.roshaanPercentage / 100);
  dashboardSummary.currentMonth.shahbazShare = totalIncome * (profitDistribution.shahbazPercentage / 100);
  dashboardSummary.currentMonth.remainingCompanyBalance = dashboardSummary.currentMonth.companyShare - totalExpenses;
  dashboardSummary.currentMonth.netBalance = totalIncome - totalExpenses;
  dashboardSummary.totalBalance = dashboardSummary.currentMonth.remainingCompanyBalance;

  return {
    income: monthlyIncome,
    expenses: monthlyExpenses,
    accounts,
    exchangeRates,
    selectedMonth,
    dashboardSummary,
    notifications,
    notificationSettings,
    isLoading,
    allIncome: income,
    allExpenses: expenses,
    addIncome,
    addExpense,
    updateIncome,
    updateExpense,
    deleteIncome,
    deleteExpense,
    deleteAllIncome,
    deleteAllExpenses,
    updateAccountBalance,
    addAccount,
    deleteAccount,
    setExchangeRates: updateExchangeRates,
    setSelectedMonth,
    bulkImportIncome,
    bulkImportExpenses,
    unreadNotifications: notifications.filter(n => !n.isRead).length,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    updateNotificationSettings: updateNotificationSettingsAsync,
    addNotification,
    refreshData: loadAllData,
    recalculateAllBalances,
  };
};
