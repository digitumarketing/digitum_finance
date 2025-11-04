import React, { useState, useEffect } from 'react';
import { PieChart, Plus, Edit2, Trash2, Check, X, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

interface ProfitDistribution {
  id: string;
  year: number;
  month: number;
  companyPercentage: number;
  roshaanPercentage: number;
  shahbazPercentage: number;
}

export const ProfitDistributionSettings: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [distributions, setDistributions] = useState<ProfitDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    companyPercentage: 50
  });

  useEffect(() => {
    loadDistributions();
  }, [user]);

  const loadDistributions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profit_distribution_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      const mapped = data?.map(d => ({
        id: d.id,
        year: d.year,
        month: d.month,
        companyPercentage: Number(d.company_percentage),
        roshaanPercentage: Number(d.roshaan_percentage),
        shahbazPercentage: Number(d.shahbaz_percentage)
      })) || [];

      setDistributions(mapped);
    } catch (error) {
      console.error('Error loading distributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const ownersPercentage = 100 - formData.companyPercentage;
    const eachOwnerPercentage = ownersPercentage / 2;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('profit_distribution_settings')
          .update({
            company_percentage: formData.companyPercentage,
            roshaan_percentage: eachOwnerPercentage,
            shahbaz_percentage: eachOwnerPercentage,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profit_distribution_settings')
          .insert({
            user_id: user.id,
            year: formData.year,
            month: formData.month,
            company_percentage: formData.companyPercentage,
            roshaan_percentage: eachOwnerPercentage,
            shahbaz_percentage: eachOwnerPercentage
          });

        if (error) throw error;
      }

      loadDistributions();
      setShowAddForm(false);
      setEditingId(null);
      setFormData({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        companyPercentage: 50
      });
    } catch (error: any) {
      console.error('Error saving distribution:', error);
      alert(error.message || 'Failed to save distribution settings');
    }
  };

  const handleEdit = (dist: ProfitDistribution) => {
    setFormData({
      year: dist.year,
      month: dist.month,
      companyPercentage: dist.companyPercentage
    });
    setEditingId(dist.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this distribution setting?')) return;

    try {
      const { error } = await supabase
        .from('profit_distribution_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadDistributions();
    } catch (error) {
      console.error('Error deleting distribution:', error);
      alert('Failed to delete distribution setting');
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const ownersPercentage = 100 - formData.companyPercentage;
  const eachOwnerPercentage = ownersPercentage / 2;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How Profit Distribution Works</p>
            <p>• <strong>Default Split:</strong> Company 50% | Owners 50% (Roshaan 25% + Shahbaz 25%)</p>
            <p>• <strong>Custom Ratios:</strong> Set custom splits for specific months (e.g., Company 60% | Owners 40%)</p>
            <p>• <strong>Owner Split:</strong> The owner portion is ALWAYS split equally (50/50) between Roshaan and Shahbaz</p>
            <p>• <strong>Example:</strong> If Company gets 80%, Owners get 20% total → Roshaan 10% + Shahbaz 10%</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border-2 border-blue-500 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Distribution' : 'Add Custom Distribution'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  min="2020"
                  max="2100"
                  disabled={!!editingId}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  disabled={!!editingId}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{getMonthName(m)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Share: {formData.companyPercentage}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={formData.companyPercentage}
                onChange={(e) => setFormData({ ...formData, companyPercentage: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Distribution Preview</h4>

              <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Company</span>
                <span className="text-lg font-bold text-blue-600">{formData.companyPercentage}%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Roshaan</span>
                <span className="text-lg font-bold text-purple-600">{eachOwnerPercentage.toFixed(1)}%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Shahbaz</span>
                <span className="text-lg font-bold text-orange-600">{eachOwnerPercentage.toFixed(1)}%</span>
              </div>

              <div className="h-4 flex rounded-lg overflow-hidden mt-2">
                <div className="bg-blue-500" style={{ width: `${formData.companyPercentage}%` }}></div>
                <div className="bg-purple-500" style={{ width: `${eachOwnerPercentage}%` }}></div>
                <div className="bg-orange-500" style={{ width: `${eachOwnerPercentage}%` }}></div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Update' : 'Save'}</span>
              </button>

              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    companyPercentage: 50
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Custom Distribution for Specific Month</span>
        </button>
      )}

      {/* Distributions List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Distribution Settings</h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : distributions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No custom distributions set. Using default 50/50 split.
          </div>
        ) : (
          distributions.map(dist => (
            <div key={dist.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <PieChart className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    {getMonthName(dist.month)} {dist.year}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(dist)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dist.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Company</p>
                  <p className="text-xl font-bold text-blue-600">{dist.companyPercentage}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Roshaan</p>
                  <p className="text-xl font-bold text-purple-600">{dist.roshaanPercentage}%</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Shahbaz</p>
                  <p className="text-xl font-bold text-orange-600">{dist.shahbazPercentage}%</p>
                </div>
              </div>

              <div className="h-3 flex rounded-lg overflow-hidden mt-3">
                <div className="bg-blue-500" style={{ width: `${dist.companyPercentage}%` }}></div>
                <div className="bg-purple-500" style={{ width: `${dist.roshaanPercentage}%` }}></div>
                <div className="bg-orange-500" style={{ width: `${dist.shahbazPercentage}%` }}></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
