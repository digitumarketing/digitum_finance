import React, { useState, useEffect } from 'react';
import { Account, Currency, AccountName, getAccountCurrencyMap, updateAccountCurrencyMap, removeFromAccountCurrencyMap } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils/helpers';
import { Building2, Edit, Trash2, Plus, Save, X, AlertCircle, CheckCircle, Info, DollarSign } from 'lucide-react';

interface DynamicAccountManagementProps {
  accounts: Account[];
  exchangeRates: Record<string, number>;
  onUpdateAccount: (id: string, updates: Partial<Account>) => void;
  onAddAccount?: (account: Omit<Account, 'id'>) => void;
  onDeleteAccount?: (id: string) => void;
}

export const DynamicAccountManagement: React.FC<DynamicAccountManagementProps> = ({
  accounts,
  exchangeRates,
  onUpdateAccount,
  onAddAccount,
  onDeleteAccount
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Account>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState<Omit<Account, 'id'>>({
    name: '',
    currency: 'PKR',
    balance: 0,
    convertedBalance: 0,
    lastUpdated: new Date().toISOString(),
    notes: ''
  });
  const [accountNameError, setAccountNameError] = useState('');

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setEditData({
      name: account.name,
      balance: account.balance,
      notes: account.notes
    });
  };

  const handleSave = (id: string) => {
    onUpdateAccount(id, {
      ...editData,
      lastUpdated: new Date().toISOString()
    });
    setEditingId(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const validateNewAccount = () => {
    if (!newAccount.name.trim()) {
      setAccountNameError('Account name is required');
      return false;
    }
    
    if (accounts.some(acc => acc.name.toLowerCase() === newAccount.name.toLowerCase())) {
      setAccountNameError('An account with this name already exists');
      return false;
    }
    
    setAccountNameError('');
    return true;
  };

  const handleAddAccount = () => {
    if (onAddAccount && validateNewAccount()) {
      // Update the account currency map
      updateAccountCurrencyMap(newAccount.name, newAccount.currency);
      
      // Add the account
      onAddAccount({
        ...newAccount,
        lastUpdated: new Date().toISOString()
      });
      
      // Reset form
      setNewAccount({
        name: '',
        currency: 'PKR',
        balance: 0,
        convertedBalance: 0,
        lastUpdated: new Date().toISOString(),
        notes: ''
      });
      setShowAddForm(false);
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (onDeleteAccount) {
      const account = accounts.find(acc => acc.id === id);
      if (account) {
        // Remove from account currency map
        removeFromAccountCurrencyMap(account.name);
        
        // Delete the account
        onDeleteAccount(id);
      }
      setShowDeleteConfirm(null);
    }
  };

  const availableCurrencies = Object.keys(exchangeRates).sort();

  const getAccountStatus = (account: Account) => {
    if (account.balance === 0) return { status: 'empty', color: 'text-gray-500', bgColor: 'bg-gray-50' };
    if (account.balance < 100) return { status: 'low', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { status: 'active', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const DeleteConfirmModal = ({ accountId }: { accountId: string }) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-50 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{account.name}</strong>? 
              This will remove the account from your system but will not affect historical transaction records.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAccount(accountId)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dynamic Account Management</h2>
              <p className="text-gray-600 mt-1">Create and manage payment accounts with custom names and currencies</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Account</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={newAccount.name}
                onChange={(e) => {
                  setNewAccount(prev => ({ ...prev, name: e.target.value }));
                  setAccountNameError('');
                }}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  accountNameError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., JazzCash, Skrill, Revolut"
              />
              {accountNameError && (
                <p className="text-red-500 text-xs mt-1">{accountNameError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Choose a unique, descriptive name for this account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={newAccount.currency}
                onChange={(e) => setNewAccount(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableCurrencies.map(currency => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the currency for this account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Balance
              </label>
              <input
                type="number"
                value={newAccount.balance || ''}
                onChange={(e) => setNewAccount(prev => ({
                  ...prev,
                  balance: parseFloat(e.target.value) || 0
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={newAccount.notes}
                onChange={(e) => setNewAccount(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Additional notes about this account"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAccount}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Current Accounts</h3>
          <p className="text-sm text-gray-500">{accounts.length} accounts configured</p>
        </div>

        <div className="divide-y divide-gray-100">
          {accounts.map((account) => (
            <div key={account.id} className="p-6">
              {editingId === account.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Account name"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Account name cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Balance ({account.currency})
                      </label>
                      <input
                        type="number"
                        value={editData.balance || 0}
                        onChange={(e) => setEditData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={editData.notes || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                        placeholder="Additional notes"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(account.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{account.name}</h4>
                      <p className="text-sm text-gray-500">{account.currency}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Balance: {formatCurrency(account.balance, account.currency)}
                        {account.currency !== 'PKR' && (
                          <span className="text-green-600 ml-2">
                            (≈ {formatCurrency(account.convertedBalance)})
                          </span>
                        )}
                      </p>
                      {account.notes && (
                        <p className="text-xs text-gray-500 mt-1">{account.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right text-xs text-gray-500">
                      <p>Last updated:</p>
                      <p>{formatDate(account.lastUpdated)}</p>
                    </div>
                    
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit account"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {onDeleteAccount && (
                      <button
                        onClick={() => setShowDeleteConfirm(account.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No accounts configured yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Account" to create your first account</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Configuration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Account Management Guidelines</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Create accounts with custom names and select any available currency</p>
              <p>• Account names must be unique across your system</p>
              <p>• Currency assignments cannot be changed after account creation</p>
              <p>• Account balances are automatically updated based on transactions</p>
              <p>• Use notes to add additional context or account details</p>
              <p>• Deleting an account will not affect historical transaction records</p>
              <p>• New accounts will be available in income and expense forms immediately</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && <DeleteConfirmModal accountId={showDeleteConfirm} />}
    </div>
  );
};