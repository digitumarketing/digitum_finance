import React, { useState, useMemo } from 'react';
import { Income, Expense } from '../types';
import { formatCurrency, exportToCSV, getMonthName, formatDate } from '../utils/helpers';
import { Download, FileText, TrendingUp, TrendingDown, PieChart, Filter, Calendar, DollarSign, Building2, Tag, User, BarChart3 } from 'lucide-react';

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
  const [dateFilter, setDateFilter] = useState<string>('current-month');
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
    
    const companyShare = totalIncome * 0.5;
    const roshaanShare = totalIncome * 0.25;
    const shahbazShare = totalIncome * 0.25;
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
  }, [filteredIncome, filteredExpenses]);

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
      'Company Share (50%)': item.splitAmountPKR * 0.5,
      'Roshaan Share (25%)': item.splitAmountPKR * 0.25,
      'Shahbaz Share (25%)': item.splitAmountPKR * 0.25,
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
        case 'all-time': return 'All Time';
        default: return 'Custom Range';
      }
    };

    const data = [{
      'Report Period': getDateRangeLabel(),
      'Total Income (PKR)': analytics.totalIncome,
      'Total Expenses (PKR)': analytics.totalExpenses,
      'Net Profit/Loss (PKR)': analytics.netProfit,
      'Company Share (50%)': analytics.companyShare,
      'Company Balance After Expenses': analytics.remainingCompanyBalance,
      'Roshaan Share (25%)': analytics.roshaanShare,
      'Shahbaz Share (25%)': analytics.shahbazShare,
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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <PieChart className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Income by Category</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.incomeByCategory).map(([category, amount]) => {
              const percentage = analytics.totalIncome > 0 ? (amount / analytics.totalIncome) * 100 : 0;
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <PieChart className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Expenses by Category</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.expensesByCategory).map(([category, amount]) => {
              const percentage = analytics.totalExpenses > 0 ? (amount / analytics.totalExpenses) * 100 : 0;
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Currency Breakdown */}
      {Object.keys(analytics.currencyBreakdown).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Currency Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analytics.currencyBreakdown).map(([currency, data]) => (
              <div key={currency} className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-purple-900">{currency}</span>
                  <span className="text-sm text-purple-600">{data.count} transactions</span>
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
    </div>
  );
};