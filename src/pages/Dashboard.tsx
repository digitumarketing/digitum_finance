import React, { useState, useMemo } from 'react';
import { DashboardSummary } from '../components/DashboardSummary';
import { IncomeForm } from '../components/IncomeForm';
import { ExpenseForm } from '../components/ExpenseForm';
import { Download, Upload, Plus, Search, Calendar, Filter, MoreVertical, ChevronDown, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import * as XLSX from 'xlsx';

interface DashboardProps {
  summary: any;
  selectedMonth: string;
  allIncome: any[];
  allExpenses: any[];
  exchangeRates: any;
  accounts: any[];
  isSuperAdmin: boolean;
  onDeleteIncome: (id: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onUpdateIncome: (id: string, data: any) => Promise<void>;
  onUpdateExpense: (id: string, data: any) => Promise<void>;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  selectedMonth,
  allIncome,
  allExpenses,
  exchangeRates,
  accounts,
  isSuperAdmin,
  onDeleteIncome,
  onDeleteExpense,
  onUpdateIncome,
  onUpdateExpense,
  onAddIncome,
  onAddExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showCancelled, setShowCancelled] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 15;

  // Combine and filter all transactions
  const filteredTransactions = useMemo(() => {
    // Create combined transactions list with type indicator
    const incomeTransactions = allIncome.map(income => ({
      ...income,
      type: 'Income' as const,
      statusValue: income.status,
      originalAmount: income.receivedAmount,
      convertedAmount: income.convertedAmount,
    }));

    const expenseTransactions = allExpenses.map(expense => ({
      ...expense,
      type: 'Expense' as const,
      statusValue: expense.paymentStatus,
      originalAmount: expense.amount,
      convertedAmount: expense.convertedAmount,
      clientName: null, // Expenses don't have clients
    }));

    const combined = [...incomeTransactions, ...expenseTransactions];

    // Apply filters
    return combined.filter(transaction => {
      // Month filter - Filter by selected month first
      if (selectedMonth !== 'all') {
        const transactionMonth = transaction.date.substring(0, 7); // Get YYYY-MM
        if (transactionMonth !== selectedMonth) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          transaction.description?.toLowerCase().includes(query) ||
          transaction.category?.toLowerCase().includes(query) ||
          transaction.clientName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && transaction.statusValue !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && transaction.category !== categoryFilter) return false;

      // Date range filter
      if (dateFrom && transaction.date < dateFrom) return false;
      if (dateTo && transaction.date > dateTo) return false;

      // Show cancelled filter
      if (!showCancelled && transaction.statusValue === 'Cancelled') return false;

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Sort by date, newest first
  }, [allIncome, allExpenses, selectedMonth, searchQuery, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo, showCancelled]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, searchQuery, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo, showCancelled]);

  // Get unique categories from both income and expenses
  const allCategories = useMemo(() => {
    const categories = new Set([
      ...allIncome.map(t => t.category).filter(Boolean),
      ...allExpenses.map(t => t.category).filter(Boolean)
    ]);
    return Array.from(categories).sort();
  }, [allIncome, allExpenses]);

  // Get unique statuses from both income and expenses
  const allStatuses = useMemo(() => {
    const statuses = new Set([
      ...allIncome.map(t => t.status).filter(Boolean),
      ...allExpenses.map(t => t.paymentStatus).filter(Boolean)
    ]);
    return Array.from(statuses).sort();
  }, [allIncome, allExpenses]);

  // Calculate monthly overview
  const monthlyOverview = useMemo(() => {
    const overview: Record<string, { income: number; expenses: number; net: number; count: number }> = {};

    // Filter income by selected month
    const filteredIncome = selectedMonth === 'all'
      ? allIncome
      : allIncome.filter(income => income.date.substring(0, 7) === selectedMonth);

    // Filter expenses by selected month
    const filteredExpenses = selectedMonth === 'all'
      ? allExpenses
      : allExpenses.filter(expense => expense.date.substring(0, 7) === selectedMonth);

    // Group income by month
    filteredIncome.forEach(income => {
      if (income.status === 'Received' || income.status === 'Partial') {
        const monthKey = income.date.substring(0, 7); // YYYY-MM
        if (!overview[monthKey]) {
          overview[monthKey] = { income: 0, expenses: 0, net: 0, count: 0 };
        }
        overview[monthKey].income += income.convertedAmount || 0;
        overview[monthKey].count += 1;
      }
    });

    // Group expenses by month
    filteredExpenses.forEach(expense => {
      if (expense.paymentStatus === 'Done') {
        const monthKey = expense.date.substring(0, 7); // YYYY-MM
        if (!overview[monthKey]) {
          overview[monthKey] = { income: 0, expenses: 0, net: 0, count: 0 };
        }
        overview[monthKey].expenses += expense.convertedAmount || 0;
        overview[monthKey].count += 1;
      }
    });

    // Calculate net for each month
    Object.keys(overview).forEach(month => {
      overview[month].net = overview[month].income - overview[month].expenses;
    });

    return overview;
  }, [allIncome, allExpenses, selectedMonth]);

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate transaction totals
  const transactionTotals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'Income' && (t.statusValue === 'Received' || t.statusValue === 'Partial'))
      .reduce((sum, t) => sum + (t.convertedAmount || 0), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'Expense' && t.statusValue === 'Done')
      .reduce((sum, t) => sum + (t.convertedAmount || 0), 0);

    const net = income - expenses;

    return { income, expenses, net, count: filteredTransactions.length };
  }, [filteredTransactions]);

  // Export to Excel
  const handleExport = () => {
    const allData = filteredTransactions.map(t => ({
      Date: t.date,
      Type: t.type,
      Description: t.description,
      Category: t.category,
      'Client Name': t.type === 'Income' ? (t.clientName || '') : '-',
      'Original Amount': t.originalAmount,
      Currency: t.currency,
      'Converted Amount (PKR)': t.convertedAmount,
      Status: t.statusValue,
      Account: t.account,
      Subcategory: t.subcategory || '',
      Notes: t.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleEditIncome = (income: any) => {
    setEditingIncome(income);
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
  };

  const handleUpdateIncome = async (data: any) => {
    if (editingIncome) {
      await onUpdateIncome(editingIncome.id, data);
      setEditingIncome(null);
    }
  };

  const handleUpdateExpense = async (data: any) => {
    if (editingExpense) {
      await onUpdateExpense(editingExpense.id, data);
      setEditingExpense(null);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardSummary summary={summary} selectedMonth={selectedMonth} />

      {/* Edit Income Form */}
      {editingIncome && (
        <IncomeForm
          onSubmit={handleUpdateIncome}
          onCancel={() => setEditingIncome(null)}
          exchangeRates={exchangeRates}
          accounts={accounts.map(acc => ({ name: acc.name, currency: acc.currency }))}
          editData={editingIncome}
        />
      )}

      {/* Edit Expense Form */}
      {editingExpense && (
        <ExpenseForm
          onSubmit={handleUpdateExpense}
          onCancel={() => setEditingExpense(null)}
          exchangeRates={exchangeRates}
          accounts={accounts.map(acc => ({ name: acc.name, currency: acc.currency }))}
          editData={editingExpense}
        />
      )}

      {/* Transactions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-green-600 font-medium">Income: {formatCurrency(transactionTotals.income)}</span>
              <span className="text-red-600 font-medium">Expenses: {formatCurrency(transactionTotals.expenses)}</span>
              <span className={`font-bold ${transactionTotals.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                Net: {formatCurrency(transactionTotals.net)}
              </span>
              <span className="text-gray-500">({transactionTotals.count} transactions)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onAddIncome}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
          {/* Search */}
          <div className="relative md:col-span-3">
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
            onChange={(e) => setTypeFilter(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            {allStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {allCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="md:col-span-1.5 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="dd/mm/yyyy"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="md:col-span-1.5 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="dd/mm/yyyy"
          />
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto bg-gray-50 rounded-lg p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Description</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Account</th>
                    <th className="pb-3 pr-4">Original Amount</th>
                    <th className="pb-3 pr-4">PKR Equivalent</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedTransactions.map((transaction) => (
                  <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-white transition-colors">
                    <td className="py-4 pr-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                      {transaction.clientName && (
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {transaction.clientName}
                        </div>
                      )}
                      {transaction.notes && (
                        <div className="text-xs text-gray-500 mt-0.5">{transaction.notes}</div>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        transaction.type === 'Income'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-sm text-gray-900">{transaction.category}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {transaction.account}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-gray-900">
                      {transaction.currency} {transaction.originalAmount?.toLocaleString()}
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.convertedAmount)}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        transaction.statusValue === 'Received' || transaction.statusValue === 'Done'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : transaction.statusValue === 'Partial'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : transaction.statusValue === 'Pending'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {(transaction.statusValue === 'Received' || transaction.statusValue === 'Done') && (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {transaction.statusValue}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => transaction.type === 'Income' ? handleEditIncome(transaction) : handleEditExpense(transaction)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmMessage = `Are you sure you want to delete this ${transaction.type.toLowerCase()}?`;
                            if (window.confirm(confirmMessage)) {
                              try {
                                if (transaction.type === 'Income') {
                                  await onDeleteIncome(transaction.id);
                                } else {
                                  await onDeleteExpense(transaction.id);
                                }
                              } catch (error) {
                                console.error(`Error deleting ${transaction.type.toLowerCase()}:`, error);
                                alert(`Failed to delete ${transaction.type.toLowerCase()}`);
                              }
                            }
                          }}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No transactions found</p>
          </div>
        )}
      </div>

      {/* Monthly Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Monthly Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(monthlyOverview)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([month, stats]) => (
              <div key={month} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">{formatMonthName(month)}</h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Income:</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(stats.income)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expenses:</span>
                    <span className="text-sm font-semibold text-red-600">{formatCurrency(stats.expenses)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-900">Net:</span>
                    <span className={`text-sm font-bold ${stats.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.net)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3 pt-2 border-t border-gray-200">
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
