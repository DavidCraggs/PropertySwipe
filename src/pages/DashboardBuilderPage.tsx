/**
 * DashboardBuilderPage - Main page for creating and editing custom dashboards
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  ChevronLeft,
  Layout,
  PanelLeftOpen,
  PanelLeftClose,
  Settings,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { WidgetRenderer, WidgetPalette, WidgetConfigModal } from '../components/organisms/dashboard-builder';
import {
  createDashboard,
  getDashboards,
  getDashboard,
  deleteDashboard,
  addWidget,
  updateWidget,
  removeWidget,
  createDashboardFromTemplate,
  DASHBOARD_TEMPLATES,
} from '../services/DashboardBuilderService';
import type {
  CustomDashboard,
  DashboardWidget,
  WidgetType,
  WidgetConfig,
  DashboardTemplateId,
} from '../types';

interface DashboardBuilderPageProps {
  onBack?: () => void;
}

export function DashboardBuilderPage({ onBack }: DashboardBuilderPageProps) {
  const { currentUser, supabaseUserId } = useAuthStore();
  // Use Supabase Auth user ID (matches auth.users FK) when available,
  // fall back to profile ID for local/password auth mode
  const userId = supabaseUserId || currentUser?.id;

  // Dashboard state
  const [dashboards, setDashboards] = useState<CustomDashboard[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<CustomDashboard | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // UI state
  const [showPalette, setShowPalette] = useState(true);
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingWidgetTitle, setEditingWidgetTitle] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Widget config modal state
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [newWidgetType, setNewWidgetType] = useState<WidgetType | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New dashboard form
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDescription, setNewDashboardDescription] = useState('');

  // Load dashboards
  useEffect(() => {
    if (userId) {
      loadDashboards();
    }
  }, [userId]);

  async function loadDashboards() {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getDashboards(userId);
      setDashboards(data);

      // Select first dashboard if none selected
      if (!activeDashboard && data.length > 0) {
        setActiveDashboard(data[0]);
      }
    } catch (error) {
      console.error('[DashboardBuilder] Failed to load dashboards:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDashboard() {
    if (!userId || !newDashboardName.trim()) return;
    setSaving(true);
    try {
      const dashboard = await createDashboard(userId, newDashboardName, newDashboardDescription);
      setDashboards(prev => [dashboard, ...prev]);
      setActiveDashboard(dashboard);
      setShowCreateModal(false);
      setNewDashboardName('');
      setNewDashboardDescription('');
      setIsEditing(true);
    } catch (error) {
      console.error('[DashboardBuilder] Failed to create dashboard:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFromTemplate(templateId: DashboardTemplateId) {
    if (!userId) return;
    setSaving(true);
    try {
      const dashboard = await createDashboardFromTemplate(userId, templateId);
      setDashboards(prev => [dashboard, ...prev]);
      setActiveDashboard(dashboard);
      setShowTemplateModal(false);
    } catch (error) {
      console.error('[DashboardBuilder] Failed to create from template:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDashboard(dashboardId: string) {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    try {
      await deleteDashboard(dashboardId);
      setDashboards(prev => prev.filter(d => d.id !== dashboardId));
      if (activeDashboard?.id === dashboardId) {
        setActiveDashboard(dashboards.find(d => d.id !== dashboardId) || null);
      }
    } catch (error) {
      console.error('[DashboardBuilder] Failed to delete dashboard:', error);
    }
  }

  async function handleAddWidget(widgetType: WidgetType) {
    setNewWidgetType(widgetType);
  }

  async function handleSaveWidget(config: { title: string; config: WidgetConfig }) {
    if (!activeDashboard) return;

    setSaving(true);
    try {
      if (editingWidget) {
        // Update existing widget
        const updated = await updateWidget(editingWidget.id, {
          title: config.title,
          config: config.config,
        });
        setActiveDashboard(prev =>
          prev
            ? {
                ...prev,
                layout: prev.layout.map(w => (w.id === updated.id ? updated : w)),
              }
            : null
        );
      } else if (newWidgetType) {
        // Add new widget
        const position = calculateNewWidgetPosition(activeDashboard.layout, newWidgetType);
        const widget = await addWidget(
          activeDashboard.id,
          newWidgetType,
          config.title,
          config.config,
          position
        );
        setActiveDashboard(prev =>
          prev
            ? {
                ...prev,
                layout: [...prev.layout, widget],
              }
            : null
        );
      }
    } catch (error) {
      console.error('[DashboardBuilder] Failed to save widget:', error);
    } finally {
      setSaving(false);
      setEditingWidget(null);
      setNewWidgetType(null);
    }
  }

  async function handleRemoveWidget(widgetId: string) {
    if (!activeDashboard) return;
    try {
      await removeWidget(widgetId);
      setActiveDashboard(prev =>
        prev
          ? {
              ...prev,
              layout: prev.layout.filter(w => w.id !== widgetId),
            }
          : null
      );
    } catch (error) {
      console.error('[DashboardBuilder] Failed to remove widget:', error);
    }
  }

  const handleSelectDashboard = useCallback(async (dashboard: CustomDashboard) => {
    // Refresh from DB to get latest widgets
    try {
      const fresh = await getDashboard(dashboard.id);
      if (fresh) {
        setActiveDashboard(fresh);
      }
    } catch (error) {
      console.error('[DashboardBuilder] Failed to refresh dashboard:', error);
      setActiveDashboard(dashboard);
    }
    setShowDashboardDropdown(false);
  }, []);

  // Handle inline widget title update
  async function handleUpdateWidgetTitle(widgetId: string, newTitle: string) {
    if (!activeDashboard) return;
    const widget = activeDashboard.layout.find(w => w.id === widgetId);
    if (!widget || widget.title === newTitle) {
      setEditingWidgetTitle(null);
      return;
    }

    try {
      const updated = await updateWidget(widgetId, { title: newTitle });
      setActiveDashboard(prev =>
        prev
          ? {
              ...prev,
              layout: prev.layout.map(w => (w.id === updated.id ? updated : w)),
            }
          : null
      );
    } catch (error) {
      console.error('[DashboardBuilder] Failed to update widget title:', error);
    }
    setEditingWidgetTitle(null);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDashboardDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500">Please log in to access dashboards.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Dashboard Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDashboardDropdown(!showDashboardDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <Layout className="h-5 w-5 text-primary-500" />
              <div className="text-left">
                <div className="text-lg font-bold text-neutral-900">
                  {activeDashboard?.name || 'Select Dashboard'}
                </div>
                <div className="text-xs text-neutral-500">
                  {activeDashboard ? `${activeDashboard.layout.length} widgets` : 'Choose or create'}
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${showDashboardDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDashboardDropdown && (
              <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 min-w-[280px] max-h-[400px] overflow-auto">
                {/* Create Options */}
                <div className="px-3 py-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowCreateModal(true);
                        setShowDashboardDropdown(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      New
                    </button>
                    <button
                      onClick={() => {
                        setShowTemplateModal(true);
                        setShowDashboardDropdown(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors text-sm"
                    >
                      <Layout className="h-4 w-4" />
                      Template
                    </button>
                  </div>
                </div>

                {/* Dashboard List */}
                {loading ? (
                  <div className="px-3 py-4 text-center text-neutral-500 text-sm">Loading...</div>
                ) : dashboards.length === 0 ? (
                  <div className="px-3 py-4 text-center text-neutral-500 text-sm">
                    No dashboards yet. Create one above!
                  </div>
                ) : (
                  <div className="py-1">
                    {dashboards.map(dashboard => (
                      <button
                        key={dashboard.id}
                        onClick={() => handleSelectDashboard(dashboard)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors group ${
                          activeDashboard?.id === dashboard.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{dashboard.name}</div>
                          <div className="text-xs text-neutral-500">{dashboard.layout.length} widgets</div>
                        </div>
                        {activeDashboard?.id === dashboard.id && (
                          <Check className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteDashboard(dashboard.id);
                          }}
                          className="p-1 text-neutral-400 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeDashboard && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isEditing
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-1.5" />
                {isEditing ? 'Done' : 'Edit'}
              </button>
              {isEditing && (
                <button
                  onClick={() => setShowPalette(!showPalette)}
                  className="p-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
                  title={showPalette ? 'Hide palette' : 'Show palette'}
                >
                  {showPalette ? (
                    <PanelLeftClose className="h-5 w-5" />
                  ) : (
                    <PanelLeftOpen className="h-5 w-5" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Widget Palette (when editing) */}
        {isEditing && (
          <WidgetPalette isOpen={showPalette} onAddWidget={handleAddWidget} />
        )}

        {/* Main Content - Dashboard Grid */}
        <main className="flex-1 overflow-auto p-6">
          {activeDashboard ? (
            activeDashboard.layout.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layout className="h-8 w-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    This dashboard is empty
                  </h3>
                  <p className="text-neutral-500 mb-4">
                    Click "Edit" and add widgets from the palette
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium"
                  >
                    Start Editing
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-4 auto-rows-[100px]">
                {activeDashboard.layout.map(widget => (
                  <div
                    key={widget.id}
                    className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3"
                    style={{
                      gridColumn: `span ${Math.min(widget.position.width, 12)}`,
                      gridRow: `span ${widget.position.height}`,
                    }}
                  >
                    <WidgetRenderer
                      widget={widget}
                      userId={userId}
                      isEditing={isEditing}
                      onEdit={() => setEditingWidget(widget)}
                      onRemove={() => handleRemoveWidget(widget.id)}
                      isEditingTitle={editingWidgetTitle === widget.id}
                      onStartEditTitle={() => setEditingWidgetTitle(widget.id)}
                      onSaveTitle={(newTitle) => handleUpdateWidgetTitle(widget.id, newTitle)}
                      onCancelEditTitle={() => setEditingWidgetTitle(null)}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layout className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  Select or create a dashboard
                </h3>
                <p className="text-neutral-500 mb-4">
                  Choose from the sidebar or create a new one
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200"
                  >
                    Create Blank
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Dashboard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900">Create Dashboard</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newDashboardName}
                  onChange={e => setNewDashboardName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="My Dashboard"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newDashboardDescription}
                  onChange={e => setNewDashboardDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="What is this dashboard for?"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDashboard}
                disabled={!newDashboardName.trim() || saving}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900">Choose a Template</h2>
              <p className="text-sm text-neutral-500">Start with a pre-configured dashboard</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.keys(DASHBOARD_TEMPLATES) as DashboardTemplateId[]).map(templateId => {
                  const template = DASHBOARD_TEMPLATES[templateId];
                  return (
                    <button
                      key={templateId}
                      onClick={() => handleCreateFromTemplate(templateId)}
                      disabled={saving}
                      className="p-4 border border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                    >
                      <div className="font-medium text-neutral-900 mb-1">{template.name}</div>
                      <div className="text-sm text-neutral-500 mb-2">{template.description}</div>
                      <div className="text-xs text-neutral-400">
                        {template.widgets.length} widgets included
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Config Modal */}
      <WidgetConfigModal
        widget={editingWidget}
        widgetType={newWidgetType || undefined}
        isOpen={!!editingWidget || !!newWidgetType}
        onClose={() => {
          setEditingWidget(null);
          setNewWidgetType(null);
        }}
        onSave={handleSaveWidget}
      />
    </div>
  );
}

/**
 * Calculate position for a new widget
 */
function calculateNewWidgetPosition(
  existingWidgets: DashboardWidget[],
  widgetType: WidgetType
): { x: number; y: number; width: number; height: number } {
  // Default sizes by widget type
  const defaultSizes: Record<WidgetType, { width: number; height: number }> = {
    stat_card: { width: 3, height: 2 },
    line_chart: { width: 6, height: 4 },
    bar_chart: { width: 6, height: 4 },
    pie_chart: { width: 4, height: 4 },
    table: { width: 6, height: 4 },
    property_list: { width: 6, height: 4 },
    issue_tracker: { width: 6, height: 4 },
    recent_activity: { width: 4, height: 6 },
  };

  const size = defaultSizes[widgetType] || { width: 4, height: 3 };

  // Find the next available row
  const maxY = existingWidgets.reduce((max, w) => {
    const bottom = w.position.y + w.position.height;
    return Math.max(max, bottom);
  }, 0);

  return {
    x: 0,
    y: maxY,
    ...size,
  };
}
