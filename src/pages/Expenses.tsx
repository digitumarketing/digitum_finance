import React, { useState } from 'react';
import { ExpenseForm } from '../components/ExpenseForm';
import { DataTable } from '../components/DataTable';
import { Plus, Trash2 } from 'lucide-react';

interface ExpensesProps {
  expenses: any[];
  allExpenses: any[];
  exchangeRates: any;
  accounts: any[];
  isSuperAdmin: boolean;
  onAddExpense: (data: any) => Promise<void>;
  onUpdateExpense: (id: string, data: any) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onDeleteAllExpenses: () => Promise<void>;
}

export const Expenses: React.FC<ExpensesProps> = ({
  expenses,
  allExpenses,
  exchangeRates,
  accounts,
  isSuperAdmin,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onDeleteAllExpenses,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    if (editingExpense) {
      await onUpdateExpense(editingExpense.id, data);
      setEditingExpense(null);
    } else {
      await onAddExpense(data);
    }
    setShowForm(false);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expense Management</h2>
          <p className="text-gray-600 mt-1">Track and manage your business expenses</p>
        </div>
        <div className="flex items-center space-x-3">
          {allExpenses.length > 0 && (
            <button
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete all ${allExpenses.length} expense transactions? This action cannot be undone.`)) {
                  await onDeleteAllExpenses();
                }
              }}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All</span>
            </button>
          )}
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowForm(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Expense Form */}
      {showForm && (
        <ExpenseForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          exchangeRates={exchangeRates}
          accounts={accounts.map(acc => ({ name: acc.name, currency: acc.currency }))}
          editData={editingExpense}
        />
      )}

      {/* Expenses Table */}
      <DataTable
        data={expenses}
        type="expense"
        onDelete={onDeleteExpense}
        onEdit={handleEdit}
        exchangeRates={exchangeRates}
        showUserAttribution={isSuperAdmin}
      />
    </div>
  );
};
