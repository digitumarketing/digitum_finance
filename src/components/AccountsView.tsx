import React, { useState } from 'react';
import { Account } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Wallet, Edit, Plus, DollarSign, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';

interface AccountsViewProps {
  accounts: Account[];
  onUpdateBalance: (id: string, newBalance: number) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onUpdateBalance }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<number>(0);

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setEditBalance(account.balance);
  };

  const handleSave = (id: string) => {
    onUpdateBalance(id, editBalance);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditBalance(0);
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.convertedBalance, 0);

  // Calculate account activity indicators
  const getAccountStatus = (account: Account) => {
    if (account.balance === 0) return { status: 'empty', color: 'text-gray-500', bgColor: 'bg-gray-50' };
    if (account.balance < 100) return { status: 'low', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { status: 'active', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  return (
    <div className="space-y-6">
      {/* Header with Total Balance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Account Balances</h2>
            <p className="text-gray-600 mt-1">Real-time account balances updated from transactions</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Balance (PKR)</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-gray-400 mt-1">Auto-updated from transactions</p>
          </div>
        </div>
      </div>

      {/* Account Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['PKR', 'USD', 'GBP', 'AED'].map(currency => {
          const currencyAccounts = accounts.filter(acc => acc.currency === currency);
          const totalCurrencyBalance = currencyAccounts.reduce((sum, acc) => sum + acc.balance, 0);
          const totalPKREquivalent = currencyAccounts.reduce((sum, acc) => sum + acc.convertedBalance, 0);
          
          return (
            <div key={currency} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900">{currency}</span>
                </div>
                <span className="text-xs text-gray-500">{currencyAccounts.length} account(s)</span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Total Balance</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(totalCurrencyBalance, currency as any)}
                  </p>
                </div>
                
                {currency !== 'PKR' && (
                  <div>
                    <p className="text-xs text-gray-500">PKR Equivalent</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(totalPKREquivalent)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const accountStatus = getAccountStatus(account);
          
          return (
            <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Account Header */}
              <div className={`p-4 ${accountStatus.bgColor} border-b border-gray-100`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-500">{account.currency}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      accountStatus.status === 'active' ? 'bg-green-500' :
                      accountStatus.status === 'low' ? 'bg-orange-500' : 'bg-gray-400'
                    }`}></div>
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                      title="Edit balance"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Content */}
              <div className="p-4">
                {editingId === account.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Balance ({account.currency})
                      </label>
                      <input
                        type="number"
                        value={editBalance}
                        onChange={(e) => setEditBalance(parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="0.01"
                        min="0"
                        placeholder=""
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(account.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current Balance */}
                    <div>
                      <p className="text-sm text-gray-500">Current Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                      
                      {account.currency !== 'PKR' && (
                        <p className="text-sm text-green-600 mt-1">
                          ≈ {formatCurrency(account.convertedBalance)}
                        </p>
                      )}
                    </div>

                    {/* Account Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Status:</span>
                        <span className={`text-xs font-medium ${accountStatus.color}`}>
                          {accountStatus.status === 'active' ? 'Active' :
                           accountStatus.status === 'low' ? 'Low Balance' : 'Empty'}
                        </span>
                      </div>
                      
                      {account.balance > 0 && (
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">Available</span>
                        </div>
                      )}
                    </div>

                    {/* Account Info */}
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Last updated:</span>
                        <span>{formatDate(account.lastUpdated)}</span>
                      </div>
                      
                      {account.notes && (
                        <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                          {account.notes}
                        </p>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Management Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Account Balance Management</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Account balances are automatically updated based on income and expense transactions</p>
              <p>• Manual balance updates override automatic calculations</p>
              <p>• All foreign currency balances are converted to PKR using current exchange rates</p>
              <p>• Empty accounts (₨0 balance) indicate no recent activity or all funds have been used</p>
              <p>• Use the edit function to manually adjust balances when needed</p>
              <p>• To add or manage accounts, go to Settings → Account Management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};