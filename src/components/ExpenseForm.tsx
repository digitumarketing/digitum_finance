import React, { useState, useEffect } from 'react';
import { Plus, X, Info, Calculator, Building2, DollarSign, Edit, Clock } from 'lucide-react';
import { Currency, ExpenseCategory, PaymentStatus, AccountName, getAccountCurrencyMap } from '../types';
import { formatCurrency } from '../utils/helpers';

interface ExpenseFormData {
  date: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  description: string;
  paymentStatus: PaymentStatus;
  notes: string;
  account: AccountName;
  dueDate?: string; // New field for due date
  manualConversionRate?: number;
  manualPKRAmount?: number;
}

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  exchangeRates?: Record<string, number>;
  accounts?: { name: string; currency: string }[];
  editData?: any; // For editing existing entries
}

const expenseCategories: ExpenseCategory[] = [
  'Salary',
  'Office',
  'Food',
  'Tools',
  'Donation',
  'Bank',
  'Marketing',
  'Travel',
  'Utilities',
  'Other'
];

const paymentStatuses: PaymentStatus[] = ['Pending', 'Done'];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, onCancel, exchangeRates, accounts: propAccounts, editData }) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: editData?.date || new Date().toISOString().split('T')[0],
    amount: editData?.amount || 0,
    currency: editData?.currency || 'PKR',
    category: editData?.category || 'Office',
    description: editData?.description || '',
    paymentStatus: editData?.paymentStatus || 'Pending',
    notes: editData?.notes || '',
    account: editData?.account || 'Bank Alfalah',
    dueDate: editData?.dueDate || '',
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

  // Auto-update currency when account changes (only for new entries)
  useEffect(() => {
    if (!editData) {
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
    }
  }, [formData.account, editData, accounts]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    // Validate due date for pending payments
    if (formData.paymentStatus === 'Pending' && !formData.dueDate) {
      newErrors.dueDate = 'Due date is required for pending payments';
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
      console.log('Submitting expense data:', formData);
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof ExpenseFormData, value: any) => {
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
    return exchangeRates?.[formData.currency] || 1;
  };

  const calculatePKRAmount = () => {
    if (useManualPKR && formData.manualPKRAmount) {
      return formData.manualPKRAmount;
    }
    return formData.amount * getEffectiveConversionRate();
  };

  const pkriEquivalent = calculatePKRAmount();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              {editData ? <Edit className="w-5 h-5 text-red-600" /> : <Plus className="w-5 h-5 text-red-600" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editData ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <p className="text-sm text-gray-600">Record expense with account-specific currency handling</p>
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
          {/* Date and Payment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                  errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => handleChange('paymentStatus', e.target.value as PaymentStatus)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                {paymentStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date (for pending payments) */}
          {formData.paymentStatus === 'Pending' && (
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                <span>Payment Due Date</span>
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                  errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
              <p className="text-xs text-red-600 mt-1">
                This date will be used for payment reminders and notifications
              </p>
            </div>
          )}

          {/* Account Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4" />
              <span>Payment Account</span>
            </label>
            <select
              value={formData.account}
              onChange={(e) => handleChange('account', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            >
              {accounts.map(account => (
                <option key={account.name} value={account.name}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
            {!editData && (
              <p className="text-xs text-gray-500 mt-1">
                Currency will be automatically set based on selected account
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Amount ({formData.currency})</span>
            </label>
            <input
              type="number"
              value={formData.amount || ''}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Currency Conversion (for foreign currencies) */}
          {formData.currency !== 'PKR' && exchangeRates && (
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
                    <div className="bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm font-medium text-red-600">
                      {formatCurrency(pkriEquivalent)}
                    </div>
                  )}
                  {errors.manualPKRAmount && <p className="text-red-500 text-xs mt-1">{errors.manualPKRAmount}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Category and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value as ExpenseCategory)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                {expenseCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Brief description of the expense"
                required
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-colors"
              rows={3}
              placeholder="Additional notes or comments"
            />
          </div>

          {/* Preview Section */}
          {formData.amount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-4 h-4 text-red-600" />
                <h4 className="text-sm font-medium text-red-900">Expense Preview</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-700">Amount:</span>
                    <span className="font-semibold text-red-900">
                      {formatCurrency(formData.amount, formData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-700">Account:</span>
                    <span className="font-semibold text-red-900">{formData.account}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-700">Category:</span>
                    <span className="font-semibold text-red-900">{formData.category}</span>
                  </div>
                  {formData.paymentStatus === 'Pending' && formData.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-700">Due Date:</span>
                      <span className="font-semibold text-red-900">
                        {new Date(formData.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-700">PKR Equivalent:</span>
                    <span className="font-semibold text-red-900">
                      {formatCurrency(pkriEquivalent)}
                    </span>
                  </div>
                  {formData.currency !== 'PKR' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-700">Rate Used:</span>
                      <span className="font-semibold text-red-900">
                        {getEffectiveConversionRate()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-700">Status:</span>
                    <span className={`font-semibold ${
                      formData.paymentStatus === 'Done' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {formData.paymentStatus}
                    </span>
                  </div>
                </div>
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
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2 font-medium"
          >
            {editData ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editData ? 'Update Expense' : 'Add Expense'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};