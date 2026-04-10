import React, { useState, useMemo } from 'react';
import { DashboardSummary } from '../components/DashboardSummary';
import { IncomeForm } from '../components/IncomeForm';
import { ExpenseForm } from '../components/ExpenseForm';
import { Download, Upload, Plus, Search, MoreVertical, ChevronDown, CreditCard as Edit2, Trash2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, FileText, ArrowUpDown } from 'lucide-react';
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
  const [activeMonthTab, setActiveMonthTab] = useState<string>('all');
  const [showCancelled] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const transactionsPerPage = 15;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const convertToYYYYMM = (accountingMonth: string) => {
    if (!accountingMonth) return null;
    const parts = accountingMonth.split(' ');
    if (parts.length < 2) return null;
    const [monthName, year] = parts;
    const monthIndex = monthNames.indexOf(monthName);
    if (monthIndex === -1) return null;
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  };

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    allIncome.forEach(i => { if (i.accountingMonth) { const k = convertToYYYYMM(i.accountingMonth); if (k) monthSet.add(k); } });
    allExpenses.forEach(e => { if (e.accountingMonth) { const k = convertToYYYYMM(e.accountingMonth); if (k) monthSet.add(k); } });
    return Array.from(monthSet).sort().reverse();
  }, [allIncome, allExpenses]);

  const filteredTransactions = useMemo(() => {
    const incomeTransactions = allIncome.map(income => ({
      ...income,
      type: 'Income' as const,
      statusValue: income.status,
      originalAmount: income.receivedAmount,
      convertedAmount: income.convertedAmount,
      accountingMonth: income.accountingMonth,
    }));

    const expenseTransactions = allExpenses.map(expense => ({
      ...expense,
      type: 'Expense' as const,
      statusValue: expense.paymentStatus,
      originalAmount: expense.amount,
      convertedAmount: expense.convertedAmount,
      clientName: null,
      accountingMonth: expense.accountingMonth,
    }));

    return [...incomeTransactions, ...expenseTransactions].filter(transaction => {
      if (selectedMonth !== 'all') {
        if (!transaction.accountingMonth) return false;
        if (convertToYYYYMM(transaction.accountingMonth) !== selectedMonth) return false;
      }
      if (activeMonthTab !== 'all') {
        if (!transaction.accountingMonth) return false;
        if (convertToYYYYMM(transaction.accountingMonth) !== activeMonthTab) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!transaction.description?.toLowerCase().includes(q) && !transaction.category?.toLowerCase().includes(q) && !transaction.clientName?.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
      if (statusFilter !== 'all' && transaction.statusValue !== statusFilter) return false;
      if (categoryFilter !== 'all' && transaction.category !== categoryFilter) return false;
      if (dateFrom && transaction.date < dateFrom) return false;
      if (dateTo && transaction.date > dateTo) return false;
      if (!showCancelled && transaction.statusValue === 'Cancelled') return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [allIncome, allExpenses, selectedMonth, activeMonthTab, searchQuery, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo, showCancelled]);

  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + transactionsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [selectedMonth, activeMonthTab, searchQuery, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo]);

  const allCategories = useMemo(() => {
    const cats = new Set([...allIncome.map(t => t.category), ...allExpenses.map(t => t.category)].filter(Boolean));
    return Array.from(cats).sort();
  }, [allIncome, allExpenses]);

  const allStatuses = useMemo(() => {
    const sts = new Set([...allIncome.map(t => t.status), ...allExpenses.map(t => t.paymentStatus)].filter(Boolean));
    return Array.from(sts).sort();
  }, [allIncome, allExpenses]);

  const monthlyOverview = useMemo(() => {
    const overview: Record<string, { income: number; expenses: number; net: number; count: number }> = {};
    const fi = selectedMonth === 'all' ? allIncome : allIncome.filter(i => convertToYYYYMM(i.accountingMonth) === selectedMonth);
    const fe = selectedMonth === 'all' ? allExpenses : allExpenses.filter(e => convertToYYYYMM(e.accountingMonth) === selectedMonth);
    fi.forEach(income => {
      if (income.status === 'Received' || income.status === 'Partial') {
        const k = convertToYYYYMM(income.accountingMonth);
        if (!k) return;
        if (!overview[k]) overview[k] = { income: 0, expenses: 0, net: 0, count: 0 };
        overview[k].income += income.convertedAmount || 0;
        overview[k].count += 1;
      }
    });
    fe.forEach(expense => {
      if (expense.paymentStatus === 'Done') {
        const k = convertToYYYYMM(expense.accountingMonth);
        if (!k) return;
        if (!overview[k]) overview[k] = { income: 0, expenses: 0, net: 0, count: 0 };
        overview[k].expenses += expense.convertedAmount || 0;
        overview[k].count += 1;
      }
    });
    Object.keys(overview).forEach(m => { overview[m].net = overview[m].income - overview[m].expenses; });
    return overview;
  }, [allIncome, allExpenses, selectedMonth]);

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const transactionTotals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'Income' && (t.statusValue === 'Received' || t.statusValue === 'Partial')).reduce((s, t) => s + (t.convertedAmount || 0), 0);
    const expenses = filteredTransactions.filter(t => t.type === 'Expense' && t.statusValue === 'Done').reduce((s, t) => s + (t.convertedAmount || 0), 0);
    return { income, expenses, net: income - expenses, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTransactions.map(t => ({
      'Accounting Month': t.accountingMonth || 'Not Assigned',
      'Transaction Date': t.date,
      Type: t.type,
      Description: t.description,
      Category: t.category,
      'Original Amount': t.originalAmount,
      Currency: t.currency,
      'Converted Amount (PKR)': t.convertedAmount,
      Status: t.statusValue,
      Account: t.account,
      Subcategory: t.subcategory || '',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadgeClass = (statusValue: string) => {
    if (statusValue === 'Received' || statusValue === 'Done') return 'bg-green-50 text-green-700 border border-green-200';
    if (statusValue === 'Partial') return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    if (statusValue === 'Pending' || statusValue === 'Upcoming') return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-gray-50 text-gray-600 border border-gray-200';
  };

  const getStatusLabel = (t: any) => {
    if (t.statusValue === 'Received' || t.statusValue === 'Done') return 'Paid';
    return t.statusValue;
  };

  return (
    <div className="space-y-6">
      <DashboardSummary summary={summary} selectedMonth={selectedMonth} />

      {editingIncome && (
        <IncomeForm onSubmit={async (d) => { await onUpdateIncome(editingIncome.id, d); setEditingIncome(null); }} onCancel={() => setEditingIncome(null)} exchangeRates={exchangeRates} accounts={accounts.map(a => ({ name: a.name, currency: a.currency }))} editData={editingIncome} />
      )}
      {editingExpense && (
        <ExpenseForm onSubmit={async (d) => { await onUpdateExpense(editingExpense.id, d); setEditingExpense(null); }} onCancel={() => setEditingExpense(null)} exchangeRates={exchangeRates} accounts={accounts.map(a => ({ name: a.name, currency: a.currency }))} editData={editingExpense} />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Income', value: formatCurrency(transactionTotals.income), icon: <TrendingUp className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
          { label: 'Total Expenses', value: formatCurrency(transactionTotals.expenses), icon: <TrendingDown className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' },
          { label: 'Net Balance', value: formatCurrency(transactionTotals.net), icon: <DollarSign className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Transactions', value: String(transactionTotals.count), icon: <FileText className="w-5 h-5 text-gray-400" />, bg: 'bg-gray-100' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`p-2.5 ${card.bg} rounded-xl flex-shrink-0`}>{card.icon}</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500">Showing {filteredTransactions.length} of {allIncome.length + allExpenses.length} transactions</p>

      {/* Transactions Card */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Transactions</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                List View
              </button>
              <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button onClick={onAddIncome} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Import
              </button>
              <button onClick={onAddIncome} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Transaction
              </button>
            </div>
          </div>
          {/* Month Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setActiveMonthTab('all')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeMonthTab === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All Months</button>
            {availableMonths.slice(0, 6).map(m => (
              <button key={m} onClick={() => setActiveMonthTab(m)} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeMonthTab === m ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {formatMonthLabel(m)}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
              <option value="all">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
              <option value="all">All Status</option>
              {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
              <option value="all">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex items-center gap-1">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400">–</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Table */}
        {filteredTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              {Object.entries(
                paginatedTransactions.reduce((groups: Record<string, typeof paginatedTransactions>, t) => {
                  const key = t.accountingMonth || 'Unassigned';
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(t);
                  return groups;
                }, {})
              ).map(([monthLabel, transactions]) => {
                const gi = transactions.filter(t => t.type === 'Income' && (t.statusValue === 'Received' || t.statusValue === 'Partial')).reduce((s, t) => s + (t.convertedAmount || 0), 0);
                const ge = transactions.filter(t => t.type === 'Expense' && t.statusValue === 'Done').reduce((s, t) => s + (t.convertedAmount || 0), 0);
                const gn = gi - ge;
                return (
                  <table key={monthLabel} className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-100">
                        <td colSpan={9} className="px-6 py-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
                            <div className="flex items-center gap-4 text-sm flex-wrap">
                              <span className="text-green-600 font-medium">Income: {formatCurrency(gi)}</span>
                              <span className="text-red-500 font-medium">Expenses: {formatCurrency(ge)}</span>
                              <span className={`font-semibold ${gn >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Net: {formatCurrency(gn)}</span>
                              <span className="text-gray-400">({transactions.length} transaction{transactions.length !== 1 ? 's' : ''})</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded border-gray-300" /></th>
                        <th className="px-4 py-3 text-left"><button className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date <ArrowUpDown className="w-3 h-3" /></button></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-left"><button className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount <ArrowUpDown className="w-3 h-3" /></button></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subcategory</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map(transaction => {
                        const menuKey = `${transaction.type}-${transaction.id}`;
                        return (
                          <tr key={menuKey} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3.5"><input type="checkbox" className="rounded border-gray-300" /></td>
                            <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                              {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                              {transaction.clientName && <div className="text-xs text-gray-400 mt-0.5">{transaction.clientName}</div>}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="text-sm font-bold text-gray-900">{formatCurrency(transaction.convertedAmount)}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(transaction.statusValue)}`}>
                                {getStatusLabel(transaction)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${transaction.type === 'Income' ? 'text-blue-600 border-blue-300 bg-blue-50' : 'text-red-600 border-red-300 bg-red-50'}`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-gray-700">{transaction.category || '—'}</td>
                            <td className="px-4 py-3.5 text-sm text-gray-500">{transaction.subcategory || '—'}</td>
                            <td className="px-4 py-3.5">
                              <div className="relative">
                                <button onClick={() => setOpenActionMenu(openActionMenu === menuKey ? null : menuKey)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {openActionMenu === menuKey && (
                                  <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-32">
                                    <button onClick={() => { if (transaction.type === 'Income') setEditingIncome(transaction); else setEditingExpense(transaction); setOpenActionMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                      <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button onClick={async () => { setOpenActionMenu(null); if (window.confirm(`Delete this ${transaction.type.toLowerCase()}?`)) { try { if (transaction.type === 'Income') await onDeleteIncome(transaction.id); else await onDeleteExpense(transaction.id); } catch { alert(`Failed to delete`); } } }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">Showing {startIndex + 1}–{Math.min(startIndex + transactionsPerPage, filteredTransactions.length)} of {filteredTransactions.length}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === page ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{page}</button>;
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No transactions found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Monthly Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Monthly Overview</h2>
        {Object.keys(monthlyOverview).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(monthlyOverview).sort(([a], [b]) => b.localeCompare(a)).map(([month, stats]) => (
              <div key={month} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <h3 className="font-bold text-gray-900 mb-3">{formatMonthLabel(month)}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium">Income:</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(stats.income)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-400 font-medium">Expenses:</span>
                    <span className="text-sm font-semibold text-red-500">{formatCurrency(stats.expenses)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-900">Net:</span>
                    <span className={`text-sm font-bold ${stats.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(stats.net)}</span>
                  </div>
                  <p className="text-xs text-gray-400 text-center pt-1">{stats.count} transaction{stats.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No data available</p>
        )}
      </div>

      {openActionMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenu(null)} />}
    </div>
  );
};
