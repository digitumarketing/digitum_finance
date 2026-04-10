import React, { useState } from 'react';
import { CreditCard as Edit, Trash2, CheckCircle, Clock, AlertCircle, Search, Download, ChevronDown, ArrowUpDown, MoreVertical, TrendingUp, TrendingDown, DollarSign, Hash } from 'lucide-react';
import { Income, Expense, IncomeStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import * as XLSX from 'xlsx';

interface DataTableProps {
  data: (Income | Expense)[];
  type: 'income' | 'expense';
  onEdit?: (item: Income | Expense) => void;
  onDelete?: (id: string) => void;
  exchangeRates?: { USD: number; AED: number; GBP: number; PKR: 1 };
  showUserAttribution?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ data, type, onEdit, onDelete, exchangeRates, showUserAttribution = false }) => {
  const [showCancelled, setShowCancelled] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IncomeStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const isIncome = (item: Income | Expense): item is Income => 'clientName' in item;

  const allCategories = [...new Set(data.map(d => d.category).filter(Boolean))].sort();

  const filteredData = data.filter(item => {
    if (type === 'income' && isIncome(item)) {
      if (!showCancelled && item.status === 'Cancelled') return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    }
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const desc = item.description?.toLowerCase() || '';
      const cat = item.category?.toLowerCase() || '';
      const client = (isIncome(item) ? item.clientName : '')?.toLowerCase() || '';
      if (!desc.includes(q) && !cat.includes(q) && !client.includes(q)) return false;
    }
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: any, bVal: any;
    if (sortBy === 'date') { aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); }
    else { aVal = a.convertedAmount; bVal = b.convertedAmount; }
    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const totals = {
    total: filteredData.reduce((s, i) => s + (i.convertedAmount || 0), 0),
    received: type === 'income'
      ? filteredData.filter(i => isIncome(i) && (i.status === 'Received' || i.status === 'Partial')).reduce((s, i) => s + (i.convertedAmount || 0), 0)
      : filteredData.filter(i => !isIncome(i) && i.paymentStatus === 'Done').reduce((s, i) => s + (i.convertedAmount || 0), 0),
    count: filteredData.length,
    pending: type === 'income'
      ? filteredData.filter(i => isIncome(i) && i.status === 'Upcoming').length
      : filteredData.filter(i => !isIncome(i) && i.paymentStatus === 'Pending').length,
  };

  const handleExport = () => {
    const rows = sortedData.map(item => ({
      Date: formatDate(item.date),
      Description: item.description,
      Category: item.category,
      Account: item.account,
      'Original Amount': isIncome(item) ? item.originalAmount : (item as Expense).amount,
      Currency: item.currency,
      'PKR Equivalent': item.convertedAmount,
      Status: isIncome(item) ? item.status : (item as Expense).paymentStatus,
      Notes: item.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === 'income' ? 'Income' : 'Expenses');
    XLSX.writeFile(wb, `${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadgeClass = (item: Income | Expense) => {
    if (isIncome(item)) {
      if (item.status === 'Received') return 'bg-green-50 text-green-700 border border-green-200';
      if (item.status === 'Partial') return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      if (item.status === 'Upcoming') return 'bg-blue-50 text-blue-700 border border-blue-200';
      return 'bg-gray-50 text-gray-600 border border-gray-200';
    } else {
      const exp = item as Expense;
      if (exp.paymentStatus === 'Done') return 'bg-green-50 text-green-700 border border-green-200';
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    }
  };

  const getStatusLabel = (item: Income | Expense) => {
    if (isIncome(item)) return item.status;
    return (item as Expense).paymentStatus;
  };

  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-50 rounded-full"><AlertCircle className="w-6 h-6 text-red-600" /></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Transaction</h3>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-gray-700 mb-6">Are you sure you want to delete this {type} transaction?</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { if (showDeleteConfirm && onDelete) { onDelete(showDeleteConfirm); setShowDeleteConfirm(null); } }} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );

  const accentColor = type === 'income' ? 'text-green-600' : 'text-red-600';
  const accentBg = type === 'income' ? 'bg-green-50' : 'bg-red-50';

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className={`p-2.5 ${accentBg} rounded-xl flex-shrink-0`}>
            {type === 'income' ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{type === 'income' ? 'Total Income' : 'Total Expenses'}</p>
            <p className="text-base font-bold text-gray-900">{formatCurrency(totals.total)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2.5 bg-green-50 rounded-xl flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{type === 'income' ? 'Received' : 'Completed'}</p>
            <p className="text-base font-bold text-gray-900">{formatCurrency(totals.received)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 rounded-xl flex-shrink-0">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending</p>
            <p className="text-base font-bold text-gray-900">{totals.pending}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2.5 bg-gray-100 rounded-xl flex-shrink-0">
            <Hash className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Records</p>
            <p className="text-base font-bold text-gray-900">{totals.count}</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Filters Row */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${type === 'income' ? 'income' : 'expenses'}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {type === 'income' && (
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as IncomeStatus | 'all')}
                className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Received">Received</option>
                <option value="Partial">Partial</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => { const [sb, so] = e.target.value.split('-') as ['date' | 'amount', 'asc' | 'desc']; setSortBy(sb); setSortOrder(so); }}
              className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="date-desc">Date: Newest</option>
              <option value="date-asc">Date: Oldest</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {type === 'income' && (
            <button
              onClick={() => setShowCancelled(!showCancelled)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showCancelled ? 'bg-red-50 text-red-600 border border-red-200' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {showCancelled ? 'Hide Cancelled' : 'Show Cancelled'}
            </button>
          )}

          <button onClick={handleExport} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {sortedData.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No {type} entries found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new entry</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left">
                      <button onClick={() => { setSortBy('date'); setSortOrder(sortBy === 'date' && sortOrder === 'desc' ? 'asc' : 'desc'); }} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Date <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    {type === 'income' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Accounting Month</th>}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    {type === 'income' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left">
                      <button onClick={() => { setSortBy('amount'); setSortOrder(sortBy === 'amount' && sortOrder === 'desc' ? 'asc' : 'desc'); }} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Amount <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PKR</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    {showUserAttribution && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedData.map(item => {
                    const isCancelled = type === 'income' && isIncome(item) && item.status === 'Cancelled';
                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isCancelled ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">{formatDate(item.date)}</td>
                        {type === 'income' && isIncome(item) && (
                          <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{item.accountingMonth || '—'}</td>
                        )}
                        <td className="px-4 py-3.5">
                          <div className={`text-sm font-medium text-gray-900 ${isCancelled ? 'line-through' : ''}`}>{item.description}</div>
                          {item.notes && <div className="text-xs text-gray-400 mt-0.5">{item.notes}</div>}
                        </td>
                        {type === 'income' && isIncome(item) && (
                          <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                            <span className={isCancelled ? 'line-through' : ''}>{item.clientName || '—'}</span>
                          </td>
                        )}
                        <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{item.account}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{item.category}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
                          <span className={isCancelled ? 'line-through' : ''}>
                            {formatCurrency(isIncome(item) ? item.originalAmount : (item as Expense).amount, item.currency)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
                          <span className={isCancelled ? 'line-through' : ''}>{formatCurrency(item.convertedAmount)}</span>
                          {type === 'income' && isIncome(item) && item.status === 'Partial' && (
                            <div className="text-xs text-orange-500 mt-0.5">Outstanding: {formatCurrency(item.originalConvertedAmount - item.convertedAmount)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item)}`}>
                            {getStatusLabel(item)}
                          </span>
                        </td>
                        {showUserAttribution && (
                          <td className="px-4 py-3.5 text-sm">
                            <div className="font-medium text-gray-900">{item.userName || 'Unknown'}</div>
                            <div className="text-xs text-gray-400">{item.userEmail || ''}</div>
                          </td>
                        )}
                        <td className="px-4 py-3.5">
                          <div className="relative">
                            <button onClick={() => setOpenActionMenu(openActionMenu === item.id ? null : item.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openActionMenu === item.id && (
                              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-32">
                                {onEdit && (
                                  <button onClick={() => { onEdit(item); setOpenActionMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <Edit className="w-3.5 h-3.5" /> Edit
                                  </button>
                                )}
                                {onDelete && (
                                  <button onClick={() => { setShowDeleteConfirm(item.id); setOpenActionMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {sortedData.map(item => {
                const isCancelled = type === 'income' && isIncome(item) && item.status === 'Cancelled';
                return (
                  <div key={item.id} className={`p-4 ${isCancelled ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-gray-900 ${isCancelled ? 'line-through' : ''}`}>
                          {type === 'income' && isIncome(item) ? item.clientName : item.description}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                          <span>{formatDate(item.date)}</span>
                          {type === 'income' && isIncome(item) && item.accountingMonth && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{item.accountingMonth}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {onEdit && <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>}
                        {onDelete && <button onClick={() => setShowDeleteConfirm(item.id)} className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={isCancelled ? 'line-through' : ''}>
                        <div className="font-semibold text-gray-900">{formatCurrency(isIncome(item) ? item.originalAmount : (item as Expense).amount, item.currency)}</div>
                        <div className="text-xs text-gray-500">PKR: {formatCurrency(item.convertedAmount)}</div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item)}`}>{getStatusLabel(item)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>
                      <span className="text-xs text-gray-400">{item.account}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && <DeleteConfirmModal />}
      {openActionMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenu(null)} />}
    </>
  );
};
