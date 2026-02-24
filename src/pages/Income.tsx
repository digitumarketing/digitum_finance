import React, { useState } from 'react';
import { IncomeForm } from '../components/IncomeForm';
import { DataTable } from '../components/DataTable';
import { Plus, Trash2 } from 'lucide-react';

interface IncomeProps {
  income: any[];
  allIncome: any[];
  exchangeRates: any;
  accounts: any[];
  isSuperAdmin: boolean;
  onAddIncome: (data: any) => Promise<void>;
  onUpdateIncome: (id: string, data: any) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onDeleteAllIncome: () => Promise<void>;
}

export const Income: React.FC<IncomeProps> = ({
  income,
  allIncome,
  exchangeRates,
  accounts,
  isSuperAdmin,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onDeleteAllIncome,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    if (editingIncome) {
      await onUpdateIncome(editingIncome.id, data);
      setEditingIncome(null);
    } else {
      await onAddIncome(data);
    }
    setShowForm(false);
  };

  const handleEdit = (income: any) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Income Management</h2>
          <p className="text-gray-600 mt-1">Track and manage your income sources with payment status</p>
        </div>
        <div className="flex items-center space-x-3">
          {allIncome.length > 0 && (
            <button
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete all ${allIncome.length} income transactions? This action cannot be undone.`)) {
                  await onDeleteAllIncome();
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
              setEditingIncome(null);
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Income Form */}
      {showForm && (
        <IncomeForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingIncome(null);
          }}
          exchangeRates={exchangeRates}
          accounts={accounts.map(acc => ({ name: acc.name, currency: acc.currency }))}
          editData={editingIncome}
        />
      )}

      {/* Income Table */}
      <DataTable
        data={income}
        type="income"
        onDelete={onDeleteIncome}
        onEdit={handleEdit}
        exchangeRates={exchangeRates}
        showUserAttribution={isSuperAdmin}
      />
    </div>
  );
};
