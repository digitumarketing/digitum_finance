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
  const [incomeSortBy, setIncomeSortBy] = useState<string>('date');

  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<string>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expenseSortBy, setExpenseSortBy] = useState<string>('date');

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

      // Show cancelled filter
      if (!showCancelled && income.status === 'Cancelled') return false;

      return true;
    });
  }, [allIncome, incomeSearchQuery, incomeStatusFilter, incomeCategoryFilter, showCancelled]);

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

      // Show cancelled filter
      if (!showCancelled && expense.paymentStatus === 'Cancelled') return false;

      return true;
    });
  }, [allExpenses, expenseSearchQuery, expenseStatusFilter, expenseCategoryFilter, showCancelled]);

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
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-600 font-medium">{filteredIncome.length} transactions</span>
            {isSuperAdmin && (
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={incomeStatusFilter}
              onChange={(e) => setIncomeStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              {incomeStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showCancelled
                ? 'bg-gray-200 text-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-150'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Show Cancelled
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={incomeSortBy}
              onChange={(e) => setIncomeSortBy(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
            </select>
          </div>
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-600 font-medium">{filteredExpenses.length} transactions</span>
            {isSuperAdmin && (
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={expenseStatusFilter}
              onChange={(e) => setExpenseStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              {expenseStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showCancelled
                ? 'bg-gray-200 text-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-150'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Show Cancelled
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={expenseSortBy}
              onChange={(e) => setExpenseSortBy(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
            </select>
          </div>
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

    </div>
  );
};
