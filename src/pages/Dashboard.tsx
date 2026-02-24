import React, { useState, useMemo } from 'react';
import { DashboardSummary } from '../components/DashboardSummary';
import { IncomeForm } from '../components/IncomeForm';
import { ExpenseForm } from '../components/ExpenseForm';
import { Download, Upload, Plus, Search, Calendar, Filter, MoreVertical, ChevronDown, Edit2, Trash2 } from 'lucide-react';
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
  const [incomeSearchQuery, setIncomeSearchQuery] = useState('');
  const [incomeStatusFilter, setIncomeStatusFilter] = useState<string>('all');
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState<string>('all');
  const [incomeDateFrom, setIncomeDateFrom] = useState('');
  const [incomeDateTo, setIncomeDateTo] = useState('');

  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<string>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expenseDateFrom, setExpenseDateFrom] = useState('');
  const [expenseDateTo, setExpenseDateTo] = useState('');

  const [showCancelled, setShowCancelled] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);


  // Filter income transactions
  const filteredIncome = useMemo(() => {
    return allIncome.filter(income => {
      // Search filter
      if (incomeSearchQuery) {
        const query = incomeSearchQuery.toLowerCase();
        const matchesSearch =
          income.description?.toLowerCase().includes(query) ||
          income.category?.toLowerCase().includes(query) ||
          income.clientName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (incomeStatusFilter !== 'all' && income.status !== incomeStatusFilter) return false;

      // Category filter
      if (incomeCategoryFilter !== 'all' && income.category !== incomeCategoryFilter) return false;

      // Date range filter
      if (incomeDateFrom && income.date < incomeDateFrom) return false;
      if (incomeDateTo && income.date > incomeDateTo) return false;

      // Show cancelled filter
      if (!showCancelled && income.status === 'Cancelled') return false;

      return true;
    });
  }, [allIncome, incomeSearchQuery, incomeStatusFilter, incomeCategoryFilter, incomeDateFrom, incomeDateTo, showCancelled]);

  // Filter expense transactions
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(expense => {
      // Search filter
      if (expenseSearchQuery) {
        const query = expenseSearchQuery.toLowerCase();
        const matchesSearch =
          expense.description?.toLowerCase().includes(query) ||
          expense.category?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (expenseStatusFilter !== 'all' && expense.paymentStatus !== expenseStatusFilter) return false;

      // Category filter
      if (expenseCategoryFilter !== 'all' && expense.category !== expenseCategoryFilter) return false;

      // Date range filter
      if (expenseDateFrom && expense.date < expenseDateFrom) return false;
      if (expenseDateTo && expense.date > expenseDateTo) return false;

      // Show cancelled filter
      if (!showCancelled && expense.paymentStatus === 'Cancelled') return false;

      return true;
    });
  }, [allExpenses, expenseSearchQuery, expenseStatusFilter, expenseCategoryFilter, expenseDateFrom, expenseDateTo, showCancelled]);

  // Get unique income categories
  const incomeCategories = useMemo(() => {
    const categories = new Set(allIncome.map(t => t.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [allIncome]);

  // Get unique income statuses
  const incomeStatuses = useMemo(() => {
    const statuses = new Set(allIncome.map(t => t.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [allIncome]);

  // Get unique expense categories
  const expenseCategories = useMemo(() => {
    const categories = new Set(allExpenses.map(t => t.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [allExpenses]);

  // Get unique expense statuses
  const expenseStatuses = useMemo(() => {
    const statuses = new Set(allExpenses.map(t => t.paymentStatus).filter(Boolean));
    return Array.from(statuses).sort();
  }, [allExpenses]);

  // Calculate monthly overview
  const monthlyOverview = useMemo(() => {
    const overview: Record<string, { income: number; expenses: number; net: number; count: number }> = {};

    // Group income by month
    allIncome.forEach(income => {
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
    allExpenses.forEach(expense => {
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
  }, [allIncome, allExpenses]);

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Export to Excel
  const handleExport = () => {
    const incomeData = filteredIncome.map(t => ({
      Date: t.date,
      Type: 'Income',
      Description: t.description,
      Category: t.category,
      'Client Name': t.clientName || '',
      Amount: t.receivedAmount,
      Currency: t.currency,
      'Converted Amount (PKR)': t.convertedAmount,
      Status: t.status,
      Account: t.account,
      Notes: t.notes || '',
    }));

    const expenseData = filteredExpenses.map(t => ({
      Date: t.date,
      Type: 'Expense',
      Description: t.description,
      Category: t.category,
      Amount: t.amount,
      Currency: t.currency,
      'Converted Amount (PKR)': t.convertedAmount,
      Status: t.paymentStatus,
      Account: t.account,
      Notes: t.notes || '',
    }));

    const allData = [...incomeData, ...expenseData].sort((a, b) => b.Date.localeCompare(a.Date));

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

      {/* Income Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Income</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Upload className="w-4 h-4" />
              Import
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
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, category..."
              value={incomeSearchQuery}
              onChange={(e) => setIncomeSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={incomeStatusFilter}
            onChange={(e) => setIncomeStatusFilter(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            {incomeStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={incomeCategoryFilter}
            onChange={(e) => setIncomeCategoryFilter(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {incomeCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={incomeDateFrom}
            onChange={(e) => setIncomeDateFrom(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="dd/mm/yyyy"
          />

          {/* Date To */}
          <input
            type="date"
            value={incomeDateTo}
            onChange={(e) => setIncomeDateTo(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="dd/mm/yyyy"
          />
        </div>

        {/* Income Table */}
        {filteredIncome.length > 0 ? (
          <div className="overflow-x-auto bg-gray-50 rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4">Client</th>
                  <th className="pb-3 pr-4">Account</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Original Amount</th>
                  <th className="pb-3 pr-4">PKR Equivalent</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredIncome.map((income) => (
                  <tr key={income.id} className="hover:bg-white transition-colors">
                    <td className="py-4 pr-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(income.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-sm font-medium text-gray-900">{income.description}</div>
                      {income.notes && (
                        <div className="text-xs text-gray-500 mt-0.5">{income.notes}</div>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-sm text-gray-900">
                      {income.clientName ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {income.clientName}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {income.account}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-sm text-gray-900">{income.category}</td>
                    <td className="py-4 pr-4 text-sm font-semibold text-gray-900">
                      {income.currency}{income.receivedAmount?.toLocaleString()}
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(income.convertedAmount)}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        income.status === 'Received'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : income.status === 'Partial'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : income.status === 'Pending'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {income.status === 'Received' && (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {income.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditIncome(income)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this income?')) {
                                try {
                                  await onDeleteIncome(income.id);
                                } catch (error) {
                                  console.error('Error deleting income:', error);
                                  alert('Failed to delete income');
                                }
                              }
                            }}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No income transactions found</p>
          </div>
        )}
      </div>

      {/* Expenses Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Expenses</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={onAddExpense}
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
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, category..."
              value={expenseSearchQuery}
              onChange={(e) => setExpenseSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={expenseStatusFilter}
            onChange={(e) => setExpenseStatusFilter(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            {expenseStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={expenseCategoryFilter}
            onChange={(e) => setExpenseCategoryFilter(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {expenseCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={expenseDateFrom}
            onChange={(e) => setExpenseDateFrom(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="dd/mm/yyyy"
          />

          {/* Date To */}
          <input
            type="date"
            value={expenseDateTo}
            onChange={(e) => setExpenseDateTo(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="dd/mm/yyyy"
          />
        </div>

        {/* Expenses Table */}
        {filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto bg-gray-50 rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4">Account</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Original Amount</th>
                  <th className="pb-3 pr-4">PKR Equivalent</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white transition-colors">
                    <td className="py-4 pr-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-xs text-gray-500 mt-0.5">{expense.notes}</div>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {expense.account}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-sm text-gray-900">{expense.category}</td>
                    <td className="py-4 pr-4 text-sm font-semibold text-gray-900">
                      {expense.currency}{expense.amount?.toLocaleString()}
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(expense.convertedAmount)}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        expense.paymentStatus === 'Done'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : expense.paymentStatus === 'Pending'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {expense.paymentStatus === 'Done' && (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {expense.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this expense?')) {
                                try {
                                  await onDeleteExpense(expense.id);
                                } catch (error) {
                                  console.error('Error deleting expense:', error);
                                  alert('Failed to delete expense');
                                }
                              }
                            }}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No expense transactions found</p>
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
