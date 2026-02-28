import React, { useState, useEffect } from 'react';
import { Plus, X, DollarSign, User, Calendar, FileText, Tag, MessageSquare, Info, CheckCircle, Building2, Calculator, Clock } from 'lucide-react';
import { Currency, IncomeCategory, IncomeStatus, AccountName, getAccountCurrencyMap } from '../types';
import { formatCurrency } from '../utils/helpers';

interface IncomeFormData {
  date: string;
  originalAmount: number;
  currency: Currency;
  receivedAmount: number;
  category: IncomeCategory;
  description: string;
  clientName: string;
  notes: string;
  status: IncomeStatus;
  account: AccountName;
  dueDate?: string;
  accountingMonth?: string;
  manualConversionRate?: number;
  manualPKRAmount?: number;
}

interface IncomeFormProps {
  onSubmit: (data: IncomeFormData) => void;
  onCancel: () => void;
  exchangeRates: Record<string, number>;
  accounts?: { name: string; currency: string }[];
  editData?: any;
}

const incomeCategories: IncomeCategory[] = [
  'Google Ads',
  'SEO',
  'Website',
  'Backlinks',
  'Automation',
  'Landing Page',
  'Social Media Ads',
  'Social Media Management',
  'Graphics & Design',
  'Others'
];

const statusOptions: IncomeStatus[] = ['Received', 'Upcoming', 'Partial', 'Cancelled'];

export const IncomeForm: React.FC<IncomeFormProps> = ({ onSubmit, onCancel, exchangeRates, accounts: propAccounts, editData }) => {
  const [formData, setFormData] = useState<IncomeFormData>({
    date: editData?.date || new Date().toISOString().split('T')[0],
    originalAmount: editData?.originalAmount || 0,
    currency: editData?.currency || 'PKR',
    receivedAmount: editData?.receivedAmount || 0,
    category: editData?.category || 'Website',
    description: editData?.description || '',
    clientName: editData?.clientName || '',
    notes: editData?.notes || '',
    status: editData?.status || 'Upcoming',
    account: editData?.account || 'Bank Alfalah',
    dueDate: editData?.dueDate || '',
    accountingMonth: editData?.accountingMonth || new Date().toISOString().slice(0, 7),
    manualConversionRate: editData?.manualConversionRate || undefined,
    manualPKRAmount: editData?.manualPKRAmount || undefined,
  });

  const [useManualRate, setUseManualRate] = useState(!!editData?.manualConversionRate);
  const [useManualPKR, setUseManualPKR] = useState(!!editData?.manualPKRAmount);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accounts, setAccounts] = useState<{name: string, currency: string}[]>([]);

  // Use accounts from props or set defaults
  useEffect(() => {
    if (propAccounts) {
      setAccounts(propAccounts);
    } else {
      setAccounts([
        { name: 'Bank Alfalah', currency: 'PKR' },
        { name: 'Wise USD', currency: 'USD' },
        { name: 'Wise GBP', currency: 'GBP' },
        { name: 'Payoneer', currency: 'USD' }
      ]);
    }
  }, [propAccounts]);

  // Auto-update currency when account changes
  useEffect(() => {
    const selectedAccount = accounts.find(acc => acc.name === formData.account);
    const accountCurrency = selectedAccount?.currency || 'PKR';
    
    setFormData(prev => ({ ...prev, currency: accountCurrency }));
    
    // Reset manual overrides when account changes
    setUseManualRate(false);
    setUseManualPKR(false);
    setFormData(prev => ({ 
      ...prev, 
      manualConversionRate: undefined,
      manualPKRAmount: undefined 
    }));
  }, [formData.account, accounts]);

  // Auto-set received amount when status changes
  useEffect(() => {
    if (formData.status === 'Received') {
      setFormData(prev => ({ ...prev, receivedAmount: prev.originalAmount }));
    } else if (formData.status === 'Upcoming' || formData.status === 'Cancelled') {
      setFormData(prev => ({ ...prev, receivedAmount: 0 }));
    }
  }, [formData.status, formData.originalAmount]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.originalAmount || formData.originalAmount <= 0) newErrors.originalAmount = 'Original amount must be greater than 0';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required';
    
    // Validate due date for upcoming payments
    if (formData.status === 'Upcoming' && !formData.dueDate) {
      newErrors.dueDate = 'Due date is required for upcoming payments';
    }
    
    if (formData.status === 'Partial') {
      if (formData.receivedAmount <= 0) newErrors.receivedAmount = 'Received amount must be greater than 0 for partial payments';
      if (formData.receivedAmount >= formData.originalAmount) newErrors.receivedAmount = 'Received amount must be less than original amount for partial payments';
    }

    // Validate manual conversion rate for foreign currency
    if (formData.currency !== 'PKR' && useManualRate && (!formData.manualConversionRate || formData.manualConversionRate <= 0)) {
      newErrors.manualConversionRate = 'Conversion rate must be greater than 0';
    }

    // Validate manual PKR amount
    if (useManualPKR && (!formData.manualPKRAmount || formData.manualPKRAmount <= 0)) {
      newErrors.manualPKRAmount = 'PKR amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Submitting income data:', formData);
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof IncomeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Calculate PKR equivalent
  const getEffectiveConversionRate = () => {
    if (formData.currency === 'PKR') return 1;
    if (useManualRate && formData.manualConversionRate) return formData.manualConversionRate;
    return exchangeRates[formData.currency] || 1;
  };

  const calculatePKRAmount = (amount: number) => {
    if (useManualPKR && formData.manualPKRAmount) {
      return formData.manualPKRAmount;
    }
    return amount * getEffectiveConversionRate();
  };

  const originalPKRAmount = calculatePKRAmount(formData.originalAmount);
  const receivedPKRAmount = calculatePKRAmount(formData.receivedAmount);
  const outstandingPKRAmount = originalPKRAmount - receivedPKRAmount;

  // SIMPLE LOGIC: Full PKR amount goes to distribution (no currency split)
  const distributionAmount = (formData.status === 'Received' || formData.status === 'Partial') 
    ? receivedPKRAmount 
    : 0;

  const getStatusColor = (status: IncomeStatus) => {
    switch (status) {
      case 'Received': return 'text-green-600 bg-green-50 border-green-200';
      case 'Partial': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Upcoming': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: IncomeStatus) => {
    switch (status) {
      case 'Received': return <CheckCircle className="w-4 h-4" />;
      case 'Partial': return <DollarSign className="w-4 h-4" />;
      case 'Upcoming': return <Calendar className="w-4 h-4" />;
      case 'Cancelled': return <X className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editData ? 'Edit Income Entry' : 'Add New Income'}
              </h3>
              <p className="text-sm text-gray-600">Record income with simple 50/50 distribution</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Date and Client Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                <span>Client Name</span>
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.clientName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter client or company name"
                required
              />
              {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4" />
              <span>Account</span>
            </label>
            <select
              value={formData.account}
              onChange={(e) => handleChange('account', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              {accounts.map(account => (
                <option key={account.name} value={account.name}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Currency will be automatically set based on selected account
            </p>
          </div>

          {/* Payment Status */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span>Payment Status</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {statusOptions.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleChange('status', status)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-sm ${
                    formData.status === status 
                      ? getStatusColor(status) + ' border-current' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {getStatusIcon(status)}
                  <span className="font-medium">{status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Due Date (for upcoming payments) */}
          {formData.status === 'Upcoming' && (
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                <span>Expected Payment Date</span>
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
              <p className="text-xs text-blue-600 mt-1">
                This date will be used for payment reminders and notifications
              </p>
            </div>
          )}

          {/* Accounting Month (for received/partial payments) */}
          {(formData.status === 'Received' || formData.status === 'Partial') && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <label className="flex items-center space-x-2 text-sm font-medium text-green-900 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Record Income in Month</span>
              </label>
              <input
                type="month"
                value={formData.accountingMonth || ''}
                onChange={(e) => handleChange('accountingMonth', e.target.value)}
                className="w-full border border-green-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
              />
              <p className="text-xs text-green-700 mt-2 flex items-start space-x-1">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  Select which month this income should be recorded in. This is useful when you receive payment for work done in a previous month, or when you want to track income by the period it belongs to rather than when it was received.
                </span>
              </p>
            </div>
          )}

          {/* Original Amount */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Original Amount ({formData.currency})</span>
            </label>
            <input
              type="number"
              value={formData.originalAmount || ''}
              onChange={(e) => handleChange('originalAmount', parseFloat(e.target.value) || 0)}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.originalAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            {errors.originalAmount && <p className="text-red-500 text-xs mt-1">{errors.originalAmount}</p>}
          </div>

          {/* Currency Conversion (for foreign currencies) */}
          {formData.currency !== 'PKR' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Currency Conversion</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-blue-700">Conversion Rate (1 {formData.currency} = ? PKR)</label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={useManualRate}
                        onChange={(e) => setUseManualRate(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-blue-700">Manual rate</span>
                    </label>
                  </div>
                  
                  {useManualRate ? (
                    <input
                      type="number"
                      value={formData.manualConversionRate || ''}
                      onChange={(e) => handleChange('manualConversionRate', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.manualConversionRate ? 'border-red-300 bg-red-50' : 'border-blue-300'
                      }`}
                      placeholder="Enter conversion rate"
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    <div className="bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm text-gray-700">
                      {exchangeRates[formData.currency] || 'Rate not available'} (Current rate)
                    </div>
                  )}
                  {errors.manualConversionRate && <p className="text-red-500 text-xs mt-1">{errors.manualConversionRate}</p>}
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-blue-700">PKR Equivalent</label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={useManualPKR}
                        onChange={(e) => setUseManualPKR(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-blue-700">Manual PKR</span>
                    </label>
                  </div>
                  
                  {useManualPKR ? (
                    <input
                      type="number"
                      value={formData.manualPKRAmount || ''}
                      onChange={(e) => handleChange('manualPKRAmount', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.manualPKRAmount ? 'border-red-300 bg-red-50' : 'border-blue-300'
                      }`}
                      placeholder="Enter PKR amount"
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    <div className="bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm font-medium text-green-600">
                      {formatCurrency(originalPKRAmount)}
                    </div>
                  )}
                  {errors.manualPKRAmount && <p className="text-red-500 text-xs mt-1">{errors.manualPKRAmount}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Received Amount (for partial payments) */}
          {formData.status === 'Partial' && (
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4" />
                <span>Received Amount ({formData.currency})</span>
              </label>
              <input
                type="number"
                value={formData.receivedAmount || ''}
                onChange={(e) => handleChange('receivedAmount', parseFloat(e.target.value) || 0)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                  errors.receivedAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0.00"
                min="0"
                step="0.01"
                max={formData.originalAmount}
              />
              {errors.receivedAmount && <p className="text-red-500 text-xs mt-1">{errors.receivedAmount}</p>}
            </div>
          )}

          {/* Category and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4" />
                <span>Service Category</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value as IncomeCategory)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                {incomeCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                <span>Description</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Brief description of the work or service provided"
                required
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4" />
              <span>Notes (Optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-colors"
              rows={3}
              placeholder="Additional notes, project details, or payment terms"
            />
          </div>

          {/* Preview Section */}
          {formData.originalAmount > 0 && (
            <div className={`rounded-lg p-6 border-2 ${getStatusColor(formData.status)}`}>
              <div className="flex items-center space-x-2 mb-4">
                <Info className="w-5 h-5" />
                <h4 className="text-sm font-medium">Transaction Preview</h4>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Original Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(formData.originalAmount, formData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PKR Equivalent:</span>
                    <span className="font-semibold">
                      {formatCurrency(originalPKRAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Account:</span>
                    <span className="font-semibold">{formData.account}</span>
                  </div>

                  {(formData.status === 'Received' || formData.status === 'Partial') && formData.accountingMonth && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Recording Month:</span>
                      <span className="font-semibold text-green-600">
                        {new Date(formData.accountingMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}

                  {formData.status === 'Upcoming' && formData.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Due Date:</span>
                      <span className="font-semibold text-blue-600">
                        {new Date(formData.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {formData.status === 'Partial' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Received (PKR):</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(receivedPKRAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Outstanding (PKR):</span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(outstandingPKRAmount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* SIMPLE Distribution Preview */}
                {(formData.status === 'Received' || formData.status === 'Partial') && (
                  <div className="bg-white bg-opacity-50 rounded-lg p-4">
                    <div className="text-sm font-medium mb-3">Distribution Breakdown:</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Company Share (50%):</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(distributionAmount * 0.5)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Roshaan (25%):</span>
                        <span className="font-semibold text-purple-600">
                          {formatCurrency(distributionAmount * 0.25)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Shahbaz (25%):</span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(distributionAmount * 0.25)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
                      Simple 50/50 split: Company vs Owner distribution
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>{editData ? 'Update Income' : 'Add Income'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};