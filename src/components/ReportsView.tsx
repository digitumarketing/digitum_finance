import React, { useState, useMemo } from 'react';
import { Income, Expense } from '../types';
import { formatCurrency, exportToCSV, getMonthName, formatDate } from '../utils/helpers';
import { Download, FileText, TrendingUp, TrendingDown, PieChart as PieChartIcon, Filter, Calendar, DollarSign, Building2, Tag, User, BarChart3 } from 'lucide-react';
import { useProfitDistribution } from '../hooks/useProfitDistribution';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ReportsViewProps {
  income: Income[];
  expenses: Expense[];
  allIncome: Income[];
  allExpenses: Expense[];
  selectedMonth: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  income,
  expenses,
  allIncome,
  allExpenses,
  selectedMonth
}) => {
  const profitDistribution = useProfitDistribution(selectedMonth);
  const [dateFilter, setDateFilter] = useState<string>('current-month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get filtered data based on filters
  const getFilteredData = () => {
    let filteredIncome = allIncome;
    let filteredExpenses = allExpenses;

    // Date filter
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (dateFilter) {
      case 'current-month':
        filteredIncome = income;
        filteredExpenses = expenses;
        break;
      
      case 'last-month':
        const lastMonth = new Date(currentYear, currentMonth - 1);
        const lastMonthString = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
        filteredIncome = allIncome.filter(item => item.date.startsWith(lastMonthString));
        filteredExpenses = allExpenses.filter(item => item.date.startsWith(lastMonthString));
        break;
      
      case 'last-3-months':
        const threeMonthsAgo = new Date(currentYear, currentMonth - 3);
        const threeMonthsCutoff = threeMonthsAgo.toISOString().split('T')[0];
        filteredIncome = allIncome.filter(item => item.date >= threeMonthsCutoff);
        filteredExpenses = allExpenses.filter(item => item.date >= threeMonthsCutoff);
        break;
      
      case 'last-6-months':
        const sixMonthsAgo = new Date(currentYear, currentMonth - 6);
        const sixMonthsCutoff = sixMonthsAgo.toISOString().split('T')[0];
        filteredIncome = allIncome.filter(item => item.date >= sixMonthsCutoff);
        filteredExpenses = allExpenses.filter(item => item.date >= sixMonthsCutoff);
        break;
      
      case 'current-year':
        const currentYearString = currentYear.toString();
        filteredIncome = allIncome.filter(item => item.date.startsWith(currentYearString));
        filteredExpenses = allExpenses.filter(item => item.date.startsWith(currentYearString));
        break;
      
      case 'last-year':
        const lastYearString = (currentYear - 1).toString();
        filteredIncome = allIncome.filter(item => item.date.startsWith(lastYearString));
        filteredExpenses = allExpenses.filter(item => item.date.startsWith(lastYearString));
        break;
      
      case 'last-30-days':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysCutoff = thirtyDaysAgo.toISOString().split('T')[0];
        filteredIncome = allIncome.filter(item => item.date >= thirtyDaysCutoff);
        filteredExpenses = allExpenses.filter(item => item.date >= thirtyDaysCutoff);
        break;
      
      case 'last-90-days':
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const ninetyDaysCutoff = ninetyDaysAgo.toISOString().split('T')[0];
        filteredIncome = allIncome.filter(item => item.date >= ninetyDaysCutoff);
        filteredExpenses = allExpenses.filter(item => item.date >= ninetyDaysCutoff);
        break;
      
      case 'this-quarter':
        const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1);
        const quarterStartString = quarterStart.toISOString().split('T')[0];
        filteredIncome = allIncome.filter(item => item.date >= quarterStartString);
        filteredExpenses = allExpenses.filter(item => item.date >= quarterStartString);
        break;
      
      case 'last-quarter':
        const lastQuarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3 - 3, 1);
        const lastQuarterEnd = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 0);
        const lastQuarterStartString = lastQuarterStart.toISOString().split('T')[0];
        const lastQuarterEndString = lastQuarterEnd.toISOString().split('T')[0];
        filteredIncome = allIncome.filter(item => item.date >= lastQuarterStartString && item.date <= lastQuarterEndString);
        filteredExpenses = allExpenses.filter(item => item.date >= lastQuarterStartString && item.date <= lastQuarterEndString);
        break;

      case 'custom':
        if (customStartDate && customEndDate) {
          filteredIncome = allIncome.filter(item => item.date >= customStartDate && item.date <= customEndDate);
          filteredExpenses = allExpenses.filter(item => item.date >= customStartDate && item.date <= customEndDate);
        }
        break;

      case 'all-time':
      default:
        // No filtering for all-time
        break;
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filteredIncome = filteredIncome.filter(item => item.category === categoryFilter);
      filteredExpenses = filteredExpenses.filter(item => item.category === categoryFilter);
    }

    // Account filter
    if (accountFilter !== 'all') {
      filteredIncome = filteredIncome.filter(item => item.account === accountFilter);
      filteredExpenses = filteredExpenses.filter(item => item.account === accountFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'received') {
        filteredIncome = filteredIncome.filter(item => item.status === 'Received' || item.status === 'Partial');
      } else if (statusFilter === 'pending') {
        filteredIncome = filteredIncome.filter(item => item.status === 'Upcoming');
        filteredExpenses = filteredExpenses.filter(item => item.paymentStatus === 'Pending');
      } else if (statusFilter === 'completed') {
        filteredIncome = filteredIncome.filter(item => item.status === 'Received');
        filteredExpenses = filteredExpenses.filter(item => item.paymentStatus === 'Done');
      } else if (statusFilter === 'cancelled') {
        filteredIncome = filteredIncome.filter(item => item.status === 'Cancelled');
      }
    }

    return { filteredIncome, filteredExpenses };
  };

  const { filteredIncome, filteredExpenses } = getFilteredData();

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalIncome = filteredIncome
      .filter(item => item.status === 'Received' || item.status === 'Partial')
      .reduce((sum, item) => sum + item.splitAmountPKR, 0);

    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.convertedAmount, 0);
    const netProfit = totalIncome - totalExpenses;

    const companyShare = totalIncome * (profitDistribution.companyPercentage / 100);
    const roshaanShare = totalIncome * (profitDistribution.roshaanPercentage / 100);
    const shahbazShare = totalIncome * (profitDistribution.shahbazPercentage / 100);
    const remainingCompanyBalance = companyShare - totalExpenses;

    // Category breakdowns
    const incomeByCategory = filteredIncome
      .filter(item => item.status === 'Received' || item.status === 'Partial')
      .reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.splitAmountPKR;
        return acc;
      }, {} as Record<string, number>);

    const expensesByCategory = filteredExpenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.convertedAmount;
      return acc;
    }, {} as Record<string, number>);

    // Account breakdowns
    const incomeByAccount = filteredIncome
      .filter(item => item.status === 'Received' || item.status === 'Partial')
      .reduce((acc, item) => {
        acc[item.account] = (acc[item.account] || 0) + item.splitAmountPKR;
        return acc;
      }, {} as Record<string, number>);

    const expensesByAccount = filteredExpenses.reduce((acc, item) => {
      acc[item.account] = (acc[item.account] || 0) + item.convertedAmount;
      return acc;
    }, {} as Record<string, number>);

    // Currency analysis
    const currencyBreakdown = filteredIncome
      .filter(item => item.status === 'Received' || item.status === 'Partial')
      .reduce((acc, item) => {
        if (!acc[item.currency]) {
          acc[item.currency] = { originalAmount: 0, pkrAmount: 0, count: 0 };
        }
        acc[item.currency].originalAmount += item.receivedAmount;
        acc[item.currency].pkrAmount += item.splitAmountPKR;
        acc[item.currency].count += 1;
        return acc;
      }, {} as Record<string, { originalAmount: number; pkrAmount: number; count: number }>);

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      companyShare,
      roshaanShare,
      shahbazShare,
      remainingCompanyBalance,
      incomeByCategory,
      expensesByCategory,
      incomeByAccount,
      expensesByAccount,
      currencyBreakdown,
    };
  }, [filteredIncome, filteredExpenses, profitDistribution]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const chartData = useMemo(() => {
    const monthlyData: Record<string, { month: string; income: number; expenses: number }> = {};

    filteredIncome.forEach(item => {
      if (item.status === 'Received' || item.status === 'Partial') {
        const month = item.date.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expenses: 0 };
        }
        monthlyData[month].income += item.splitAmountPKR;
      }
    });

    filteredExpenses.forEach(item => {
      const month = item.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, expenses: 0 };
      }
      monthlyData[month].expenses += item.convertedAmount;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredIncome, filteredExpenses]);

  const incomeCategoryChartData = Object.entries(analytics.incomeByCategory).map(([name, value]) => ({
    name,
    value
  }));

  const expenseCategoryChartData = Object.entries(analytics.expensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  const profitDistributionData = [
    { name: `Company (${profitDistribution.companyPercentage}%)`, value: analytics.companyShare },
    { name: `Roshaan (${profitDistribution.roshaanPercentage}%)`, value: analytics.roshaanShare },
    { name: `Shahbaz (${profitDistribution.shahbazPercentage}%)`, value: analytics.shahbazShare }
  ];

  const incomeVsExpenseData = [
    { name: 'Income', value: analytics.totalIncome, color: '#10b981' },
    { name: 'Expenses', value: analytics.totalExpenses, color: '#ef4444' },
    { name: 'Net Profit', value: analytics.netProfit, color: analytics.netProfit >= 0 ? '#3b82f6' : '#f59e0b' }
  ];

  // Export functions
  const handleExportIncome = () => {
    const data = filteredIncome.map(item => ({
      Date: formatDate(item.date),
      Client: item.clientName,
      Description: item.description,
      Account: item.account,
      Category: item.category,
      'Original Amount': item.originalAmount,
      Currency: item.currency,
      'Received Amount': item.receivedAmount,
      'PKR Equivalent': item.convertedAmount,
      'Split Amount PKR': item.splitAmountPKR,
      'Rate Used': item.splitRateUsed,
      [`Company Share (${profitDistribution.companyPercentage}%)`]: item.splitAmountPKR * (profitDistribution.companyPercentage / 100),
      [`Roshaan Share (${profitDistribution.roshaanPercentage}%)`]: item.splitAmountPKR * (profitDistribution.roshaanPercentage / 100),
      [`Shahbaz Share (${profitDistribution.shahbazPercentage}%)`]: item.splitAmountPKR * (profitDistribution.shahbazPercentage / 100),
      Status: item.status,
      Notes: item.notes || '',
      'Created At': formatDate(item.createdAt)
    }));
    exportToCSV(data, `Income-Report-${dateFilter}-${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportExpenses = () => {
    const data = filteredExpenses.map(item => ({
      Date: formatDate(item.date),
      Description: item.description,
      Account: item.account,
      Category: item.category,
      'Original Amount': item.amount,
      Currency: item.currency,
      'PKR Equivalent': item.convertedAmount,
      'Payment Status': item.paymentStatus,
      Notes: item.notes || '',
      'Created At': formatDate(item.createdAt)
    }));
    exportToCSV(data, `Expense-Report-${dateFilter}-${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCurrencyAnalysis = () => {
    const data = Object.entries(analytics.currencyBreakdown).map(([currency, data]) => ({
      Currency: currency,
      'Transaction Count': data.count,
      'Total Original Amount': data.originalAmount,
      'Total PKR Equivalent': data.pkrAmount,
      'Average Rate': data.pkrAmount / data.originalAmount,
      'Percentage of Total Income': ((data.pkrAmount / analytics.totalIncome) * 100).toFixed(2) + '%'
    }));
    exportToCSV(data, `Currency-Analysis-${dateFilter}-${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportProfitLoss = () => {
    const getDateRangeLabel = () => {
      switch (dateFilter) {
        case 'current-month': return getMonthName(selectedMonth);
        case 'last-month': return 'Last Month';
        case 'last-3-months': return 'Last 3 Months';
        case 'last-6-months': return 'Last 6 Months';
        case 'current-year': return 'Current Year';
        case 'last-year': return 'Last Year';
        case 'last-30-days': return 'Last 30 Days';
        case 'last-90-days': return 'Last 90 Days';
        case 'this-quarter': return 'This Quarter';
        case 'last-quarter': return 'Last Quarter';
        case 'custom': return `Custom Range (${formatDate(customStartDate)} - ${formatDate(customEndDate)})`;
        case 'all-time': return 'All Time';
        default: return 'Custom Range';
      }
    };

    const data = [{
      'Report Period': getDateRangeLabel(),
      'Total Income (PKR)': analytics.totalIncome,
      'Total Expenses (PKR)': analytics.totalExpenses,
      'Net Profit/Loss (PKR)': analytics.netProfit,
      [`Company Share (${profitDistribution.companyPercentage}%)`]: analytics.companyShare,
      'Company Balance After Expenses': analytics.remainingCompanyBalance,
      [`Roshaan Share (${profitDistribution.roshaanPercentage}%)`]: analytics.roshaanShare,
      [`Shahbaz Share (${profitDistribution.shahbazPercentage}%)`]: analytics.shahbazShare,
      'Income Transactions': filteredIncome.filter(i => i.status === 'Received' || i.status === 'Partial').length,
      'Expense Transactions': filteredExpenses.length,
      'Profit Margin %': analytics.totalIncome > 0 ? ((analytics.netProfit / analytics.totalIncome) * 100).toFixed(2) + '%' : '0%',
      'Generated On': new Date().toLocaleString()
    }];
    exportToCSV(data, `Profit-Loss-Statement-${dateFilter}-${new Date().toISOString().split('T')[0]}`);
  };

  // Get unique values for filters
  const uniqueCategories = [...new Set([...allIncome.map(i => i.category), ...allExpenses.map(e => e.category)])];
  const uniqueAccounts = [...new Set([...allIncome.map(i => i.account), ...allExpenses.map(e => e.account)])];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            <p className="text-gray-600 mt-1">Comprehensive financial reports with advanced filtering and export options</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current-month">Current Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="last-6-months">Last 6 Months</option>
              <option value="this-quarter">This Quarter</option>
              <option value="last-quarter">Last Quarter</option>
              <option value="current-year">Current Year</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Date Range</option>
              <option value="all-time">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              {uniqueAccounts.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="received">Received Only</option>
              <option value="pending">Pending Only</option>
              <option value="completed">Completed Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateFilter === 'custom' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-semibold text-blue-900">Custom Date Range</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {customStartDate && customEndDate && customStartDate > customEndDate && (
              <p className="mt-2 text-sm text-red-600">End date must be after start date</p>
            )}
          </div>
        )}

        {/* Filter Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Active Filters:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {dateFilter === 'current-month' ? 'Current Month' :
               dateFilter === 'last-month' ? 'Last Month' :
               dateFilter === 'last-30-days' ? 'Last 30 Days' :
               dateFilter === 'last-90-days' ? 'Last 90 Days' :
               dateFilter === 'last-3-months' ? 'Last 3 Months' :
               dateFilter === 'last-6-months' ? 'Last 6 Months' :
               dateFilter === 'this-quarter' ? 'This Quarter' :
               dateFilter === 'last-quarter' ? 'Last Quarter' :
               dateFilter === 'current-year' ? 'Current Year' :
               dateFilter === 'last-year' ? 'Last Year' :
               dateFilter === 'custom' ? `Custom (${formatDate(customStartDate)} - ${formatDate(customEndDate)})` :
               dateFilter === 'all-time' ? 'All Time' : 'Custom'}
            </span>
            {categoryFilter !== 'all' && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Category: {categoryFilter}
              </span>
            )}
            {accountFilter !== 'all' && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Account: {accountFilter}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                Status: {statusFilter}
              </span>
            )}
            <span className="text-gray-500">
              • {filteredIncome.length} income, {filteredExpenses.length} expenses
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(analytics.totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${analytics.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <BarChart3 className={`w-6 h-6 ${analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Profit/Loss</p>
              <p className={`text-2xl font-bold ${analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(analytics.netProfit)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${analytics.remainingCompanyBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <Building2 className={`w-6 h-6 ${analytics.remainingCompanyBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Company Balance</p>
              <p className={`text-2xl font-bold ${analytics.remainingCompanyBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(analytics.remainingCompanyBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={handleExportIncome}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Export Income</h3>
              <p className="text-sm text-gray-500">Detailed income report</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleExportExpenses}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <Download className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Export Expenses</h3>
              <p className="text-sm text-gray-500">Detailed expense report</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleExportCurrencyAnalysis}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Currency Analysis</h3>
              <p className="text-sm text-gray-500">Multi-currency breakdown</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleExportProfitLoss}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">P&L Statement</h3>
              <p className="text-sm text-gray-500">Complete profit & loss</p>
            </div>
          </div>
        </button>
      </div>

      {/* Visual Analytics Charts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses Over Time</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expenses Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeVsExpenseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Bar dataKey="value" name="Amount">
              {incomeVsExpenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Income by Category</h3>
          </div>
          {incomeCategoryChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={incomeCategoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeCategoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {Object.entries(analytics.incomeByCategory).map(([category, amount], index) => {
                  const percentage = analytics.totalIncome > 0 ? (amount / analytics.totalIncome) * 100 : 0;
                  return (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-gray-700">{category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                        <span className="text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No income data available</p>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Expenses by Category</h3>
          </div>
          {expenseCategoryChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expenseCategoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseCategoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {Object.entries(analytics.expensesByCategory).map(([category, amount], index) => {
                  const percentage = analytics.totalExpenses > 0 ? (amount / analytics.totalExpenses) * 100 : 0;
                  return (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-gray-700">{category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                        <span className="text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No expense data available</p>
          )}
        </div>
      </div>

      {/* Profit Distribution Chart */}
      {profitDistributionData.some(d => d.value > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Profit Distribution</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={profitDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Company Share</span>
                  <span className="text-sm text-blue-600">{profitDistribution.companyPercentage}%</span>
                </div>
                <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(analytics.companyShare)}</p>
                <p className="text-sm text-blue-700 mt-1">After expenses: {formatCurrency(analytics.remainingCompanyBalance)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">Roshaan Share</span>
                  <span className="text-sm text-green-600">{profitDistribution.roshaanPercentage}%</span>
                </div>
                <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(analytics.roshaanShare)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-900">Shahbaz Share</span>
                  <span className="text-sm text-orange-600">{profitDistribution.shahbazPercentage}%</span>
                </div>
                <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(analytics.shahbazShare)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Currency Breakdown */}
      {Object.keys(analytics.currencyBreakdown).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Currency Analysis</h3>
          </div>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(analytics.currencyBreakdown).map(([currency, data]) => ({
                currency,
                amount: data.pkrAmount,
                count: data.count
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="currency" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="amount" fill="#8b5cf6" name="PKR Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analytics.currencyBreakdown).map(([currency, data]) => (
              <div key={currency} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-purple-900">{currency}</span>
                  <span className="text-sm text-purple-600">{data.count} txns</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Original:</span>
                    <span className="font-medium">{formatCurrency(data.originalAmount, currency as any)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">PKR Value:</span>
                    <span className="font-medium">{formatCurrency(data.pkrAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Avg Rate:</span>
                    <span className="font-medium">{(data.pkrAmount / data.originalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Filtered Income Data</h3>
            <p className="text-sm text-gray-500">{filteredIncome.length} transactions</p>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredIncome.slice(0, 10).map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">{formatDate(item.date)}</td>
                    <td className="px-4 py-2">{item.clientName}</td>
                    <td className="px-4 py-2">{formatCurrency(item.splitAmountPKR)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'Received' ? 'bg-green-100 text-green-800' :
                        item.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Filtered Expense Data</h3>
            <p className="text-sm text-gray-500">{filteredExpenses.length} transactions</p>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.slice(0, 10).map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">{formatDate(item.date)}</td>
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="px-4 py-2">{formatCurrency(item.convertedAmount)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.paymentStatus === 'Done' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <QuarterlyBreakdown allIncome={allIncome} allExpenses={allExpenses} />
    </div>
  );
};

const QuarterlyBreakdown: React.FC<{ allIncome: Income[], allExpenses: Expense[] }> = ({ allIncome, allExpenses }) => {
  const currentYear = new Date().getFullYear();

  const monthlyData = useMemo(() => {
    const data: Record<number, { income: number; expense: number; net: number }> = {};

    // Initialize all 12 months
    for (let i = 1; i <= 12; i++) {
      data[i] = { income: 0, expense: 0, net: 0 };
    }

    // Calculate income for each month
    allIncome.forEach(income => {
      if (income.status === 'Received' || income.status === 'Partial') {
        const date = new Date(income.date);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth() + 1;
          data[month].income += income.convertedAmount || 0;
        }
      }
    });

    // Calculate expenses for each month
    allExpenses.forEach(expense => {
      if (expense.paymentStatus === 'Done') {
        const date = new Date(expense.date);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth() + 1;
          data[month].expense += expense.convertedAmount || 0;
        }
      }
    });

    // Calculate net for each month
    Object.keys(data).forEach(month => {
      const monthNum = parseInt(month);
      data[monthNum].net = data[monthNum].income - data[monthNum].expense;
    });

    return data;
  }, [allIncome, allExpenses, currentYear]);

  const quarterlyData = useMemo(() => {
    const quarters = [
      { name: 'Q1', months: [1, 2, 3], color: 'from-blue-500 to-blue-600' },
      { name: 'Q2', months: [4, 5, 6], color: 'from-purple-500 to-purple-600' },
      { name: 'Q3', months: [7, 8, 9], color: 'from-indigo-500 to-indigo-600' },
      { name: 'Q4', months: [10, 11, 12], color: 'from-violet-500 to-violet-600' }
    ];

    return quarters.map(quarter => {
      const income = quarter.months.reduce((sum, month) => sum + monthlyData[month].income, 0);
      const expense = quarter.months.reduce((sum, month) => sum + monthlyData[month].expense, 0);
      const net = income - expense;

      return { ...quarter, income, expense, net };
    });
  }, [monthlyData]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Quarterly Breakdown</h3>
      </div>

      <div className="space-y-8">
        {quarterlyData.map((quarter, qIndex) => (
          <div key={quarter.name}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Month Cards */}
              {quarter.months.map(monthNum => (
                <div key={monthNum} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{monthNames[monthNum - 1]}</h4>
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Income</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(monthlyData[monthNum].income)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Expense</span>
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(monthlyData[monthNum].expense)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-700">Net</span>
                      <span className={`text-sm font-bold ${monthlyData[monthNum].net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {monthlyData[monthNum].net >= 0 ? '+' : ''}{formatCurrency(monthlyData[monthNum].net)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Quarter Summary Card */}
              <div className={`bg-gradient-to-br ${quarter.color} rounded-lg p-5 text-white`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">{quarter.name} Summary</h4>
                  <BarChart3 className="w-5 h-5 text-white opacity-80" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white opacity-90">Total Income</span>
                    <span className="text-base font-bold">
                      {formatCurrency(quarter.income)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white opacity-90">Total Expense</span>
                    <span className="text-base font-bold">
                      {formatCurrency(quarter.expense)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white border-opacity-30">
                    <span className="text-sm font-medium text-white">Net Balance</span>
                    <span className="text-base font-bold">
                      {quarter.net >= 0 ? '+' : ''}{formatCurrency(quarter.net)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};