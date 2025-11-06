import React, { useState, useEffect } from 'react';
import { ExchangeRates } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils/helpers';
import { 
  DollarSign, 
  Save, 
  RotateCcw, 
  RefreshCw, 
  History, 
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Globe,
  Plus,
  Trash2,
  X,
  Edit
} from 'lucide-react';

interface ExchangeRateHistory {
  id: string;
  rates: ExchangeRates;
  updatedAt: string;
  updatedBy: string;
  note?: string;
}

interface DynamicExchangeRatesSettingsProps {
  exchangeRates: ExchangeRates;
  onUpdateRates: (rates: ExchangeRates) => void;
}

export const DynamicExchangeRatesSettings: React.FC<DynamicExchangeRatesSettingsProps> = ({
  exchangeRates,
  onUpdateRates
}) => {
  const [editRates, setEditRates] = useState<ExchangeRates>(exchangeRates);
  const [hasChanges, setHasChanges] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [rateHistory, setRateHistory] = useState<ExchangeRateHistory[]>([]);
  const [newCurrency, setNewCurrency] = useState({ code: '', rate: 0 });
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('exchangeRateHistory');
    if (savedHistory) {
      setRateHistory(JSON.parse(savedHistory));
    }
    
    const savedLastUpdated = localStorage.getItem('exchangeRatesLastUpdated');
    if (savedLastUpdated) {
      setLastUpdated(savedLastUpdated);
    }
  }, []);

  // Check for changes
  useEffect(() => {
    const changed = Object.keys(exchangeRates).some(
      currency => exchangeRates[currency] !== editRates[currency]
    ) || Object.keys(editRates).some(
      currency => !exchangeRates.hasOwnProperty(currency)
    );
    setHasChanges(changed);
  }, [editRates, exchangeRates]);

  const handleRateChange = (currency: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditRates(prev => ({ ...prev, [currency]: numValue }));
  };

  const handleAddCurrency = () => {
    if (newCurrency.code && newCurrency.rate > 0 && !editRates.hasOwnProperty(newCurrency.code.toUpperCase())) {
      const currencyCode = newCurrency.code.toUpperCase();
      setEditRates(prev => ({ ...prev, [currencyCode]: newCurrency.rate }));
      setNewCurrency({ code: '', rate: 0 });
      setShowAddForm(false);
    }
  };

  const handleRemoveCurrency = (currency: string) => {
    if (currency === 'PKR') return; // Cannot remove PKR
    
    const newRates = { ...editRates };
    delete newRates[currency];
    setEditRates(newRates);
  };

  const handleSave = async () => {
    setIsUpdating(true);

    try {
      // Add to history
      const historyEntry: ExchangeRateHistory = {
        id: generateId(),
        rates: { ...editRates },
        updatedAt: new Date().toISOString(),
        updatedBy: 'Manual Update',
        note: 'Rates updated manually by user'
      };

      const newHistory = [historyEntry, ...rateHistory].slice(0, 50); // Keep last 50 entries
      setRateHistory(newHistory);
      localStorage.setItem('exchangeRateHistory', JSON.stringify(newHistory));

      // Update rates - this saves to database
      await onUpdateRates(editRates);

      // Update last updated timestamp
      const now = new Date().toISOString();
      setLastUpdated(now);
      localStorage.setItem('exchangeRatesLastUpdated', now);

      // Show success message
      alert('Exchange rates updated successfully in database!');
    } catch (error) {
      console.error('Error saving exchange rates:', error);
      alert('Error saving exchange rates. Please try again.');
    } finally {
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

  const handleReset = () => {
    setEditRates(exchangeRates);
  };

  const handleResetToDefaults = () => {
    const defaultRates: ExchangeRates = {
      USD: 278.50,
      AED: 75.85,
      GBP: 354.20,
      PKR: 1,
    };
    setEditRates(defaultRates);
  };

  const currencies = Object.keys(editRates).filter(currency => currency !== 'PKR');

  const calculateImpact = (currency: string) => {
    const oldRate = exchangeRates[currency] || 0;
    const newRate = editRates[currency];
    if (oldRate === 0) return 0;
    const change = ((newRate - oldRate) / oldRate) * 100;
    return change;
  };

  const getCurrencyFlag = (currency: string) => {
    const flags: Record<string, string> = {
      USD: '🇺🇸',
      AED: '🇦🇪',
      GBP: '🇬🇧',
      EUR: '🇪🇺',
      CAD: '🇨🇦',
      AUD: '🇦🇺',
      JPY: '🇯🇵',
      CHF: '🇨🇭',
      CNY: '🇨🇳',
      INR: '🇮🇳',
      SAR: '🇸🇦',
      PKR: '🇵🇰'
    };
    return flags[currency] || '💱';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dynamic Exchange Rates</h2>
              <p className="text-gray-600 mt-1">Add and manage currency conversion rates for global financial tracking</p>
            </div>
          </div>
          <div className="text-right">
            {lastUpdated && (
              <div className="text-sm text-gray-500">
                Last updated: {formatDate(lastUpdated)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Rates Overview */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Active Exchange Rates</h3>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Currency</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* PKR (Base Currency) */}
          <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🇵🇰</span>
                <div>
                  <div className="font-semibold text-gray-900">PKR</div>
                  <div className="text-xs text-gray-500">Pakistani Rupee (Base)</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">1.00</div>
                <div className="text-xs text-gray-500">Base Currency</div>
              </div>
            </div>
          </div>

          {/* Other Currencies */}
          {currencies.map(currency => (
            <div key={currency} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getCurrencyFlag(currency)}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{currency}</div>
                    <div className="text-xs text-gray-500">to PKR</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {editRates[currency].toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">PKR per {currency}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Currency Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Currency</h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCurrency({ code: '', rate: 0 });
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency Code
              </label>
              <input
                type="text"
                value={newCurrency.code}
                onChange={(e) => setNewCurrency(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., EUR, CAD"
                maxLength={3}
              />
              <p className="text-xs text-gray-500 mt-1">3-letter currency code (ISO 4217)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exchange Rate to PKR
              </label>
              <input
                type="number"
                value={newCurrency.rate || ''}
                onChange={(e) => setNewCurrency(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 295.50"
                step="0.01"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">How many PKR for 1 {newCurrency.code || 'CURRENCY'}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCurrency({ code: '', rate: 0 });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCurrency}
              disabled={!newCurrency.code || newCurrency.rate <= 0 || editRates.hasOwnProperty(newCurrency.code.toUpperCase())}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Currency</span>
            </button>
          </div>
        </div>
      )}

      {/* Rate Editor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Exchange Rates</h3>
                <p className="text-sm text-gray-600">Update conversion rates to PKR</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="text-sm">History</span>
              </button>
              
              <button
                onClick={handleResetToDefaults}
                className="flex items-center space-x-2 px-3 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Reset to Defaults</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {currencies.map(currency => {
              const impact = calculateImpact(currency);
              const hasSignificantChange = Math.abs(impact) > 5;
              
              return (
                <div key={currency} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Currency Info */}
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getCurrencyFlag(currency)}</span>
                      <div>
                        <div className="font-semibold text-gray-900 text-lg">{currency}</div>
                        <div className="text-xs text-gray-400">1 {currency} = ? PKR</div>
                      </div>
                    </div>

                    {/* Current vs New Rate */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Current:</span>
                        <span className="font-medium text-gray-700">
                          {formatCurrency(exchangeRates[currency] || 0)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-500">New:</label>
                        <input
                          type="number"
                          value={editRates[currency]}
                          onChange={(e) => handleRateChange(currency, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-right font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      
                      {hasChanges && Math.abs(impact) > 0.1 && (
                        <div className={`text-xs flex items-center space-x-1 ${
                          impact > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{impact > 0 ? '↗' : '↘'}</span>
                          <span>{Math.abs(impact).toFixed(2)}% change</span>
                        </div>
                      )}
                    </div>

                    {/* Impact Preview */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Example conversion:</div>
                      <div className="text-sm">
                        <div>100 {currency} = {formatCurrency(editRates[currency] * 100)}</div>
                      </div>
                      
                      {hasSignificantChange && (
                        <div className="mt-2 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600">Significant change</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleRemoveCurrency(currency)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove currency"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning for significant changes */}
          {hasChanges && currencies.some(c => Math.abs(calculateImpact(c)) > 10) && (
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-800">Large Rate Changes Detected</div>
                  <div className="text-sm text-orange-700 mt-1">
                    Some rates have changed by more than 10%. This will significantly impact existing calculations.
                    Please verify these rates are correct before saving.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Changes</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges || isUpdating}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rate History */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <History className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Rate Change History</h3>
                <p className="text-sm text-gray-600">Track previous exchange rate updates</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {rateHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No rate change history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rateHistory.slice(0, 10).map((entry, index) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">{entry.updatedBy}</span>
                        {index === 0 && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(entry.updatedAt)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {Object.entries(entry.rates)
                        .filter(([key]) => key !== 'PKR')
                        .map(([currency, rate]) => (
                          <div key={currency}>
                            <span className="text-gray-500">{currency}:</span>
                            <span className="ml-2 font-medium">{rate}</span>
                          </div>
                        ))
                      }
                    </div>
                    
                    {entry.note && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                        {entry.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">How Exchange Rates Work</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Exchange rates are used to automatically convert foreign currency amounts to PKR</p>
              <p>• When adding income or expenses, you'll see the PKR equivalent calculated in real-time</p>
              <p>• All financial summaries and reports use PKR as the base currency</p>
              <p><strong>IMPORTANT:</strong> Rate changes are saved to the database and only affect NEW transactions - existing records keep their original conversion rates</p>
              <p>• Each transaction stores the exchange rate that was used at the time of creation</p>
              <p>• Keep rates updated regularly for accurate financial tracking of new transactions</p>
              <p>• You can add new currencies that will be available throughout the application</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};