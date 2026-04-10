import React, { useState } from 'react';
import { Building2, Plus, CreditCard as Edit2, Trash2, Star, X, Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { useOfficeContext, Office } from '../contexts/OfficeContext';

interface OfficeManagementProps {
  onClose: () => void;
}

const OFFICE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

interface OfficeFormData {
  name: string;
  description: string;
  color: string;
}

const emptyForm = (): OfficeFormData => ({ name: '', description: '', color: '#10b981' });

export const OfficeManagement: React.FC<OfficeManagementProps> = ({ onClose }) => {
  const { offices, selectedOffice, createOffice, updateOffice, deleteOffice, setDefaultOffice, switchOffice } = useOfficeContext();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [form, setForm] = useState<OfficeFormData>(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCreate = () => {
    setForm(emptyForm());
    setEditingOffice(null);
    setError(null);
    setView('create');
  };

  const startEdit = (office: Office) => {
    setForm({ name: office.name, description: office.description, color: office.color });
    setEditingOffice(office);
    setError(null);
    setView('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Office name is required'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      if (view === 'create') {
        const office = await createOffice({ name: form.name.trim(), description: form.description.trim(), color: form.color });
        switchOffice(office.id);
      } else if (view === 'edit' && editingOffice) {
        await updateOffice(editingOffice.id, { name: form.name.trim(), description: form.description.trim(), color: form.color });
      }
      setView('list');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteOffice(id);
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete office');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try { await setDefaultOffice(id); } catch {}
  };

  const getTitle = () => {
    if (view === 'create') return 'New Office';
    if (view === 'edit') return `Rename "${editingOffice?.name}"`;
    return 'Manage Offices';
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {view !== 'list' && (
              <button
                onClick={() => { setView('list'); setError(null); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">{getTitle()}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <>
            <div className="px-6 pt-5 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Offices</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {offices.map(office => (
                  <div
                    key={office.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedOffice?.id === office.id ? 'border-gray-300 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${office.color}20` }}
                    >
                      <Building2 className="w-4 h-4" style={{ color: office.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{office.name}</p>
                        {office.isDefault && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-xs font-medium">Default</span>
                        )}
                        {selectedOffice?.id === office.id && (
                          <span className="px-1.5 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded text-xs font-medium">Active</span>
                        )}
                      </div>
                      {office.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{office.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => startEdit(office)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Rename
                      </button>
                      {!office.isDefault && (
                        <button
                          onClick={() => handleSetDefault(office.id)}
                          title="Set as default"
                          className="p-1.5 text-gray-300 hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-colors ml-0.5"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {offices.length > 1 && (
                        <button
                          onClick={() => setConfirmDeleteId(office.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pb-6 pt-3">
              <button
                onClick={startCreate}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50/50 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add New Office
              </button>
            </div>
          </>
        )}

        {/* Create / Edit Form */}
        {(view === 'create' || view === 'edit') && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {view === 'edit' && editingOffice && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${editingOffice.color}20` }}>
                  <Building2 className="w-4 h-4" style={{ color: editingOffice.color }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Editing</p>
                  <p className="text-sm font-semibold text-gray-900">{editingOffice.name}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {view === 'edit' ? 'New Name' : 'Office Name'}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Lahore Office, Marketing Team..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this office..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Accent Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {OFFICE_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-xl transition-all ${form.color === color ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color, ringColor: color }}
                  >
                    {form.color === color && <Check className="w-4 h-4 text-white mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${form.color}20` }}>
                <Building2 className="w-5 h-5" style={{ color: form.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{form.name || 'Office Name'}</p>
                {form.description && <p className="text-xs text-gray-400">{form.description}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setView('list'); setError(null); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.name.trim()}
                className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {isSubmitting ? 'Saving...' : view === 'create' ? 'Create Office' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Overlay */}
        {confirmDeleteId && (
          <div className="absolute inset-0 bg-white/96 backdrop-blur-sm flex flex-col items-center justify-center p-8 rounded-2xl">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Office?</h3>
            <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
              All data linked to this office — income, expenses, accounts, and notifications — will be permanently deleted.
            </p>
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
