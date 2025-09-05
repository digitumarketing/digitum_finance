import React, { useState } from 'react';
import { Edit, Trash2, CheckCircle, Clock, ExternalLink, Eye, EyeOff, Filter, Calendar, DollarSign, AlertCircle, Building2 } from 'lucide-react';
import { Income, Expense, IncomeStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

interface DataTableProps {
  data: (Income | Expense)[];
  type: 'income' | 'expense';
  onEdit?: (item: Income | Expense) => void;
  onDelete?: (id: string) => void;
  exchangeRates?: { USD: number; AED: number; GBP: number; PKR: 1 };
}

export const DataTable: React.FC<DataTableProps> = ({ data, type, onEdit, onDelete, exchangeRates }) => {
  const [showCancelled, setShowCancelled] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IncomeStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">No {type} entries found for this month.</p>
      </div>
    );
  }

  const isIncome = (item: Income | Expense): item is Income => {
    return 'clientName' in item;
  };

  const getStatusBadge = (item: Income | Expense) => {
    if (!isIncome(item)) {
      // Handle expense status
      const isDone = item.paymentStatus === 'Done';
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isDone 
            ? 'bg-green-100 text-green-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          {isDone ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
          {item.paymentStatus}
        </span>
      );
    }

    // Handle income status
    const incomeStatus = item.status as IncomeStatus;
    const statusConfig = {
      'Received': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'Partial': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: DollarSign },
      'Upcoming': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Calendar },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[incomeStatus];
    if (!config) {
      // Fallback for unknown status
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          {incomeStatus}
        </span>
      );
    }

    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {incomeStatus}
      </span>
    );
  };

  const getConversionInfo = (item: Income | Expense) => {
    if (item.currency === 'PKR') return null;
    
    const rate = isIncome(item) 
      ? (item.manualConversionRate || item.splitRateUsed)
      : (item.manualConversionRate || exchangeRates?.[item.currency] || 1);
    
    return (
      <div className="text-xs text-gray-500 mt-1">
        Rate: 1 {item.currency} = {rate} PKR
        {(isIncome(item) ? item.manualConversionRate : item.manualConversionRate) && (
          <span className="text-blue-600 ml-1">(Manual)</span>
        )}
      </div>
    );
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      setShowDeleteConfirm(id);
    }
  };

  const confirmDelete = () => {
    if (showDeleteConfirm && onDelete) {
      console.log('Deleting item with ID:', showDeleteConfirm);
      onDelete(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  // Filter and sort data
  const filteredData = data.filter(item => {
    if (type === 'income' && isIncome(item)) {
      if (!showCancelled && item.status === 'Cancelled') return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    }
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
        break;
      case 'amount':
        aValue = a.convertedAmount;
        bValue = b.convertedAmount;
        break;
      case 'status':
        if (type === 'income' && isIncome(a) && isIncome(b)) {
          aValue = a.status;
          bValue = b.status;
        } else {
          aValue = 0;
          bValue = 0;
        }
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Transaction</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Are you sure you want to delete this {type} transaction? This will permanently remove it from your records.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters and Controls */}
        {type === 'income' && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as IncomeStatus | 'all')}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Received">Received</option>
                    <option value="Partial">Partial</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Show/Hide Cancelled */}
                <button
                  onClick={() => setShowCancelled(!showCancelled)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                    showCancelled 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {showCancelled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{showCancelled ? 'Hide' : 'Show'} Cancelled</span>
                </button>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-100">
          {sortedData.map((item, index) => {
            const isCancelled = type === 'income' && isIncome(item) && item.status === 'Cancelled';
            
            return (
              <div key={item.id} className={`p-4 ${isCancelled ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-gray-900 ${isCancelled ? 'line-through' : ''}`}>
                      {type === 'income' && isIncome(item) ? item.clientName : item.description}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatDate(item.date)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {type === 'income' && isIncome(item) && (
                    <div className="text-sm text-gray-600">
                      {item.description}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{item.account}</span>
                    </div>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                      {item.category}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className={isCancelled ? 'line-through' : ''}>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(isIncome(item) ? item.originalAmount : item.amount, item.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        PKR: {formatCurrency(item.convertedAmount)}
                      </div>
                      {getConversionInfo(item)}
                    </div>
                    <div>
                      {getStatusBadge(item)}
                    </div>
                  </div>
                  
                  {type === 'income' && isIncome(item) && item.status === 'Partial' && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      Outstanding: {formatCurrency(item.originalConvertedAmount - item.convertedAmount)}
                    </div>
                  )}
                  
                  {item.notes && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {item.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                {type === 'income' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PKR Equivalent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedData.map((item, index) => {
                const isCancelled = type === 'income' && isIncome(item) && item.status === 'Cancelled';
                
                return (
                  <tr 
                    key={item.id} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                      isCancelled ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className={isCancelled ? 'line-through' : ''}>
                        <div className="font-medium">{item.description}</div>
                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                        )}
                      </div>
                    </td>
                    {type === 'income' && isIncome(item) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <span className={isCancelled ? 'line-through' : ''}>{item.clientName || '-'}</span>
                          {item.clientName && (
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className={isCancelled ? 'line-through' : ''}>{item.account}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className={isCancelled ? 'line-through' : ''}>
                        {formatCurrency(isIncome(item) ? item.originalAmount : item.amount, item.currency)}
                        {getConversionInfo(item)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className={isCancelled ? 'line-through' : ''}>
                        {formatCurrency(item.convertedAmount)}
                        {type === 'income' && isIncome(item) && item.status === 'Partial' && (
                          <div className="text-xs text-orange-600 mt-1">
                            Outstanding: {formatCurrency(item.originalConvertedAmount - item.convertedAmount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit entry"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && <DeleteConfirmModal />}
    </>
  );
};