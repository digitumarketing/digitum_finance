import React from 'react';
import { DashboardSummary } from '../components/DashboardSummary';
import { DataTable } from '../components/DataTable';
import { Trash2 } from 'lucide-react';

interface DashboardProps {
  summary: any;
  selectedMonth: Date;
  income: any[];
  expenses: any[];
  exchangeRates: any;
  isSuperAdmin: boolean;
  onDeleteIncome: (id: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onEditIncome: (income: any) => void;
  onEditExpense: (expense: any) => void;
  onDeleteAllIncome: () => Promise<void>;
  onDeleteAllExpenses: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  selectedMonth,
  income,
  expenses,
  exchangeRates,
  isSuperAdmin,
  onDeleteIncome,
  onDeleteExpense,
  onEditIncome,
  onEditExpense,
  onDeleteAllIncome,
  onDeleteAllExpenses,
}) => {
  return (
    <div className="space-y-6">
      <DashboardSummary summary={summary} selectedMonth={selectedMonth} />

      {/* Recent Income */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Income</h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-green-600 font-medium">
              {income.length} transactions
            </span>
            {income.length > 0 && (
              <button
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete all ${income.length} income transactions? This action cannot be undone.`)) {
                    await onDeleteAllIncome();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All</span>
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          <DataTable
            data={income.slice(0, 10)}
            type="income"
            onDelete={onDeleteIncome}
            onEdit={onEditIncome}
            exchangeRates={exchangeRates}
            showUserAttribution={isSuperAdmin}
          />
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-red-600 font-medium">
              {expenses.length} transactions
            </span>
            {expenses.length > 0 && (
              <button
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete all ${expenses.length} expense transactions? This action cannot be undone.`)) {
                    await onDeleteAllExpenses();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All</span>
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          <DataTable
            data={expenses.slice(0, 10)}
            type="expense"
            onDelete={onDeleteExpense}
            onEdit={onEditExpense}
            exchangeRates={exchangeRates}
            showUserAttribution={isSuperAdmin}
          />
        </div>
      </div>
    </div>
  );
};
