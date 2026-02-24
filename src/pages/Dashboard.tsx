import React, { useState, useMemo } from 'react';
import { DashboardSummary } from '../components/DashboardSummary';
import { Download, Upload, Plus, Search, Calendar, Filter, MoreVertical, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import * as XLSX from 'xlsx';

interface DashboardProps {
  summary: any;
  selectedMonth: string;
  allIncome: any[];
  allExpenses: any[];
  exchangeRates: any;
  isSuperAdmin: boolean;
  onDeleteIncome: (id: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onEditIncome: (income: any) => void;
  onEditExpense: (expense: any) => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  selectedMonth,
  allIncome,
  allExpenses,
  exchangeRates,
  isSuperAdmin,
  onDeleteIncome,
  onDeleteExpense,
  onEditIncome,
  onEditExpense,
  onAddIncome,
  onAddExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Combine income and expenses into transactions
  const allTransactions = useMemo(() => {
    const incomeTransactions = allIncome.map(item => ({
      ...item,
      type: 'income' as const,
      amount: item.receivedAmount,
      convertedAmount: item.convertedAmount,
      status: item.status,
    }));

    const expenseTransactions = allExpenses.map(item => ({
      ...item,
      type: 'expense' as const,
      status: item.paymentStatus,
    }));

    return [...incomeTransactions, ...expenseTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [allIncome, allExpenses]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          transaction.description?.toLowerCase().includes(query) ||
          transaction.category?.toLowerCase().includes(query) ||
          (transaction.type === 'income' && transaction.clientName?.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && transaction.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && transaction.category !== categoryFilter) return false;

      // Date range filter
      if (dateFrom && transaction.date < dateFrom) return false;
      if (dateTo && transaction.date > dateTo) return false;

      // Month filter
      if (selectedMonthFilter !== 'all' && !transaction.date.startsWith(selectedMonthFilter)) return false;

      return true;
    });
  }, [allTransactions, searchQuery, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo, selectedMonthFilter]);

  // Group transactions by month
  const transactionsByMonth = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    filteredTransactions.forEach(transaction => {
      const monthKey = transaction.date.substring(0, 7); // YYYY-MM
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(transaction);
    });

    return grouped;
  }, [filteredTransactions]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const stats: Record<string, { income: number; expenses: number; net: number; count: number }> = {};

    Object.entries(transactionsByMonth).forEach(([month, transactions]) => {
      const income = transactions
        .filter(t => t.type === 'income' && (t.status === 'Received' || t.status === 'Partial'))
        .reduce((sum, t) => sum + t.convertedAmount, 0);

      const expenses = transactions
        .filter(t => t.type === 'expense' && t.status === 'Done')
        .reduce((sum, t) => sum + t.convertedAmount, 0);

      stats[month] = {
        income,
        expenses,
        net: income - expenses,
        count: transactions.length,
      };
    });

    return stats;
  }, [transactionsByMonth]);

  // Get unique months
  const availableMonths = useMemo(() => {
    const months = new Set(allTransactions.map(t => t.date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [allTransactions]);

  // Get unique categories
  const availableCategories = useMemo(() => {
    const categories = new Set(allTransactions.map(t => t.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [allTransactions]);

  // Get unique statuses
  const availableStatuses = useMemo(() => {
    const statuses = new Set(allTransactions.map(t => t.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [allTransactions]);

  // Paginate current month transactions
  const currentMonthTransactions = selectedMonthFilter !== 'all'
    ? transactionsByMonth[selectedMonthFilter] || []
    : filteredTransactions;

  const totalPages = Math.ceil(currentMonthTransactions.length / itemsPerPage);
  const paginatedTransactions = currentMonthTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to Excel
  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
      Date: t.date,
      Type: t.type === 'income' ? 'Income' : 'Expense',
      Description: t.description,
      Category: t.category,
      ...(t.type === 'income' ? { 'Client Name': t.clientName } : {}),
      Amount: t.amount,
      Currency: t.currency,
      'Converted Amount (PKR)': t.convertedAmount,
      Status: t.status,
      Account: t.account,
      Notes: t.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <DashboardSummary summary={summary} selectedMonth={selectedMonth} />

      {/* Transactions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              {viewMode === 'list' ? 'List View' : 'Table View'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onAddIncome}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Month Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedMonthFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                selectedMonthFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Months
            </button>
            {availableMonths.slice(0, 3).map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonthFilter(month)}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  selectedMonthFilter === month
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatMonthName(month)}
              </button>
            ))}
          </div>

          {/* Search and Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              {availableStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Transactions by Month */}
        {Object.keys(transactionsByMonth).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(transactionsByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice((currentPage - 1) * 1, currentPage * 1)
              .map(([month, transactions]) => {
                const stats = monthlyStats[month];
                return (
                  <div key={month} className="space-y-3">
                    {/* Month Header with Stats */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">{formatMonthName(month)}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600 font-medium">
                          Income: {formatCurrency(stats.income)}
                        </span>
                        <span className="text-red-600 font-medium">
                          Expenses: {formatCurrency(stats.expenses)}
                        </span>
                        <span className={`font-bold ${stats.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          Net: {formatCurrency(stats.net)}
                        </span>
                        <span className="text-gray-500">
                          ({stats.count} transaction{stats.count !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="pb-3 pr-4">
                              <input type="checkbox" className="rounded border-gray-300" />
                            </th>
                            <th className="pb-3 pr-4">Date</th>
                            <th className="pb-3 pr-4">Description</th>
                            <th className="pb-3 pr-4 text-right">Amount</th>
                            <th className="pb-3 pr-4">Status</th>
                            <th className="pb-3 pr-4">Type</th>
                            <th className="pb-3 pr-4">Category</th>
                            <th className="pb-3 pr-4">Account</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="py-3 pr-4">
                                <input type="checkbox" className="rounded border-gray-300" />
                              </td>
                              <td className="py-3 pr-4 text-sm text-gray-900">
                                {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-3 pr-4">
                                <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                                {transaction.type === 'income' && transaction.clientName && (
                                  <div className="text-xs text-gray-500">{transaction.clientName}</div>
                                )}
                              </td>
                              <td className="py-3 pr-4 text-right">
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(transaction.convertedAmount)}
                                </div>
                                {transaction.currency !== 'PKR' && (
                                  <div className="text-xs text-gray-500">
                                    {transaction.amount} {transaction.currency}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.status === 'Received' || transaction.status === 'Done'
                                    ? 'bg-green-100 text-green-800'
                                    : transaction.status === 'Partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : transaction.status === 'Pending' || transaction.status === 'Upcoming'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.type === 'income'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.type === 'income' ? 'Income' : 'Expense'}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-sm text-gray-900">{transaction.category}</td>
                              <td className="py-3 pr-4 text-sm text-gray-600">{transaction.account}</td>
                              <td className="py-3">
                                <button
                                  onClick={() => transaction.type === 'income' ? onEditIncome(transaction) : onEditExpense(transaction)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, currentMonthTransactions.length)} of {currentMonthTransactions.length} transactions
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No transactions found</p>
          </div>
        )}
      </div>

      {/* Monthly Overview Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Monthly Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(monthlyStats)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([month, stats]) => (
              <div key={month} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-3">{formatMonthName(month)}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Income:</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(stats.income)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expenses:</span>
                    <span className="text-sm font-semibold text-red-600">{formatCurrency(stats.expenses)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-900">Net:</span>
                    <span className={`text-sm font-bold ${stats.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.net)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    {stats.count} transaction{stats.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
