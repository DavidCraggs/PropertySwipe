import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Save,
  PoundSterling,
  Home,
  Shield,
  Wrench,
  Users,
  Building,
  Zap,
  MoreHorizontal,
} from 'lucide-react';
import type { PropertyCost, PropertyCostCategory, CostFrequency, Property } from '../../types';
import { savePropertyCost, getPropertyCosts, deletePropertyCost } from '../../lib/storage';
import { useToastStore } from './toastUtils';

interface PropertyCostManagerProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onCostsUpdated?: () => void;
}

const COST_CATEGORIES: { value: PropertyCostCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'mortgage', label: 'Mortgage', icon: <Home className="h-4 w-4" /> },
  { value: 'insurance', label: 'Insurance', icon: <Shield className="h-4 w-4" /> },
  { value: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" /> },
  { value: 'management_fee', label: 'Management Fee', icon: <Users className="h-4 w-4" /> },
  { value: 'service_charge', label: 'Service Charge', icon: <Building className="h-4 w-4" /> },
  { value: 'ground_rent', label: 'Ground Rent', icon: <Building className="h-4 w-4" /> },
  { value: 'utilities', label: 'Utilities', icon: <Zap className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <MoreHorizontal className="h-4 w-4" /> },
];

const FREQUENCIES: { value: CostFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_time', label: 'One-time' },
];

/**
 * Modal for managing property costs (CRUD operations)
 */
export function PropertyCostManager({
  property,
  isOpen,
  onClose,
  onCostsUpdated,
}: PropertyCostManagerProps) {
  const { addToast } = useToastStore();
  const [costs, setCosts] = useState<PropertyCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCost, setEditingCost] = useState<PropertyCost | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    category: PropertyCostCategory;
    description: string;
    amount: string;
    frequency: CostFrequency;
    isRecurring: boolean;
  }>({
    category: 'mortgage',
    description: '',
    amount: '',
    frequency: 'monthly',
    isRecurring: true,
  });

  // Load costs on mount
  useEffect(() => {
    if (isOpen) {
      loadCosts();
    }
  }, [isOpen, property.id]);

  const loadCosts = async () => {
    setLoading(true);
    try {
      const loadedCosts = await getPropertyCosts(property.id);
      setCosts(loadedCosts);
    } catch (error) {
      console.error('[PropertyCostManager] Failed to load costs:', error);
      addToast({
        type: 'danger',
        title: 'Error',
        message: 'Failed to load property costs',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'mortgage',
      description: '',
      amount: '',
      frequency: 'monthly',
      isRecurring: true,
    });
    setEditingCost(null);
    setShowAddForm(false);
  };

  const handleEditCost = (cost: PropertyCost) => {
    setEditingCost(cost);
    setFormData({
      category: cost.category,
      description: cost.description,
      amount: cost.amount.toString(),
      frequency: cost.frequency,
      isRecurring: cost.isRecurring,
    });
    setShowAddForm(true);
  };

  const handleSaveCost = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      addToast({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount',
      });
      return;
    }

    setSaving(true);
    try {
      const costData: Omit<PropertyCost, 'id'> = {
        propertyId: property.id,
        category: formData.category,
        description: formData.description || COST_CATEGORIES.find(c => c.value === formData.category)?.label || '',
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        isRecurring: formData.isRecurring,
        createdAt: editingCost?.createdAt || new Date(),
      };

      if (editingCost) {
        await savePropertyCost({ ...costData, id: editingCost.id });
        addToast({
          type: 'success',
          title: 'Cost Updated',
          message: 'Property cost has been updated',
        });
      } else {
        await savePropertyCost(costData);
        addToast({
          type: 'success',
          title: 'Cost Added',
          message: 'Property cost has been added',
        });
      }

      await loadCosts();
      resetForm();
      onCostsUpdated?.();
    } catch (error) {
      console.error('[PropertyCostManager] Failed to save cost:', error);
      addToast({
        type: 'danger',
        title: 'Error',
        message: 'Failed to save property cost',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCost = async (costId: string) => {
    try {
      await deletePropertyCost(costId);
      addToast({
        type: 'success',
        title: 'Cost Deleted',
        message: 'Property cost has been removed',
      });
      await loadCosts();
      onCostsUpdated?.();
    } catch (error) {
      console.error('[PropertyCostManager] Failed to delete cost:', error);
      addToast({
        type: 'danger',
        title: 'Error',
        message: 'Failed to delete property cost',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateMonthlyTotal = () => {
    return costs.reduce((sum, cost) => {
      switch (cost.frequency) {
        case 'monthly':
          return sum + cost.amount;
        case 'quarterly':
          return sum + cost.amount / 3;
        case 'annually':
          return sum + cost.amount / 12;
        case 'one_time':
          return sum; // One-time costs don't count toward monthly
        default:
          return sum;
      }
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Manage Costs</h2>
            <p className="text-sm text-neutral-500 truncate max-w-[280px]">
              {property.address.street}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-neutral-500">Loading costs...</p>
            </div>
          ) : showAddForm ? (
            // Add/Edit Form
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-900">
                {editingCost ? 'Edit Cost' : 'Add New Cost'}
              </h3>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as PropertyCostCategory })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {COST_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Monthly mortgage payment"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Amount (£)
                </label>
                <div className="relative">
                  <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value as CostFrequency })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recurring Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">This is a recurring cost</span>
              </label>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCost}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : editingCost ? 'Update' : 'Add Cost'}
                </button>
              </div>
            </div>
          ) : (
            // Cost List
            <div>
              {/* Monthly Total */}
              <div className="bg-primary-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-primary-700 font-medium">Monthly Total</span>
                  <span className="text-2xl font-bold text-primary-900">
                    {formatCurrency(calculateMonthlyTotal())}
                  </span>
                </div>
              </div>

              {/* Cost Items */}
              {costs.length === 0 ? (
                <div className="text-center py-8">
                  <PoundSterling className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 mb-4">No costs added yet</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Cost
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {costs.map((cost) => {
                    const categoryInfo = COST_CATEGORIES.find((c) => c.value === cost.category);
                    return (
                      <div
                        key={cost.id}
                        className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                      >
                        <div className="p-2 bg-white rounded-lg text-primary-600">
                          {categoryInfo?.icon || <MoreHorizontal className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neutral-900 truncate">
                            {cost.description || categoryInfo?.label}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {FREQUENCIES.find((f) => f.value === cost.frequency)?.label}
                            {cost.isRecurring && ' • Recurring'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-neutral-900">
                            {formatCurrency(cost.amount)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditCost(cost)}
                            className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
                            aria-label="Edit cost"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCost(cost.id)}
                            className="p-1.5 rounded-lg hover:bg-danger-100 text-neutral-500 hover:text-danger-600 transition-colors"
                            aria-label="Delete cost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Button */}
              {costs.length > 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Cost
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
