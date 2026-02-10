/**
 * DashboardBuilderService
 * Manages custom dashboard CRUD operations and widget data fetching
 * Dual-layer: Supabase when configured + user authenticated via Supabase Auth,
 * otherwise falls back to localStorage.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../hooks/useAuthStore';
import type {
  CustomDashboard,
  DashboardWidget,
  DashboardShare,
  DashboardPermission,
  WidgetConfig,
  WidgetType,
  WidgetPosition,
  StatCardData,
  ChartDataPoint,
  ActivityFeedItem,
  DashboardTemplateId,
  Property,
  Issue,
} from '../types';

// =====================================================
// LOCAL STORAGE HELPERS
// =====================================================

const LS_DASHBOARDS_KEY = 'get-on-dashboards';
const LS_WIDGETS_KEY = 'get-on-dashboard-widgets';

function generateId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Use Supabase only when configured AND user is authenticated via Supabase Auth */
function shouldUseSupabase(): boolean {
  if (!isSupabaseConfigured()) return false;
  const { supabaseUserId } = useAuthStore.getState();
  return !!supabaseUserId;
}

function getLocalDashboards(): CustomDashboard[] {
  try {
    const raw = localStorage.getItem(LS_DASHBOARDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((d: Record<string, unknown>) => ({
      ...d,
      createdAt: new Date(d.createdAt as string),
      updatedAt: new Date(d.updatedAt as string),
      layout: (d.layout as DashboardWidget[]) || [],
    }));
  } catch { return []; }
}

function saveLocalDashboards(dashboards: CustomDashboard[]): void {
  localStorage.setItem(LS_DASHBOARDS_KEY, JSON.stringify(dashboards));
}

function getLocalWidgets(): DashboardWidget[] {
  try {
    const raw = localStorage.getItem(LS_WIDGETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((w: Record<string, unknown>) => ({
      ...w,
      createdAt: new Date(w.createdAt as string),
      updatedAt: new Date(w.updatedAt as string),
    }));
  } catch { return []; }
}

function saveLocalWidgets(widgets: DashboardWidget[]): void {
  localStorage.setItem(LS_WIDGETS_KEY, JSON.stringify(widgets));
}

// =====================================================
// DASHBOARD CRUD OPERATIONS
// =====================================================

/**
 * Create a new custom dashboard
 */
export async function createDashboard(
  userId: string,
  name: string,
  description?: string,
  templateId?: DashboardTemplateId
): Promise<CustomDashboard> {
  if (shouldUseSupabase()) {
    const { data, error } = await supabase
      .from('custom_dashboards')
      .insert({
        user_id: userId,
        name,
        description,
        template_id: templateId,
        is_default: false,
        layout: [],
      })
      .select()
      .single();

    if (error) {
      console.error('[DashboardBuilder] Failed to create dashboard:', error);
      throw error;
    }

    return mapDashboardFromDb(data);
  }

  // localStorage fallback
  const now = new Date();
  const dashboard: CustomDashboard = {
    id: generateId(),
    userId,
    name,
    description,
    isDefault: false,
    templateId,
    layout: [],
    createdAt: now,
    updatedAt: now,
  };
  const dashboards = getLocalDashboards();
  dashboards.unshift(dashboard);
  saveLocalDashboards(dashboards);
  return dashboard;
}

/**
 * Get all dashboards for a user (owned + shared)
 */
export async function getDashboards(userId: string): Promise<CustomDashboard[]> {
  if (shouldUseSupabase()) {
    // Get owned dashboards
    const { data: owned, error: ownedError } = await supabase
      .from('custom_dashboards')
      .select('*, dashboard_widgets(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ownedError) {
      console.error('[DashboardBuilder] Failed to fetch owned dashboards:', ownedError);
      throw ownedError;
    }

    // Get shared dashboards
    const { data: shared, error: sharedError } = await supabase
      .from('dashboard_permissions')
      .select('dashboard_id, custom_dashboards(*, dashboard_widgets(*))')
      .eq('user_id', userId);

    if (sharedError) {
      console.error('[DashboardBuilder] Failed to fetch shared dashboards:', sharedError);
      // Continue with owned dashboards only
    }

    const ownedDashboards = (owned || []).map(mapDashboardFromDb);
    const sharedDashboards = (shared || [])
      .filter(s => s.custom_dashboards)
      .map(s => mapDashboardFromDb(s.custom_dashboards as unknown as Record<string, unknown>));

    return [...ownedDashboards, ...sharedDashboards];
  }

  // localStorage fallback
  const dashboards = getLocalDashboards().filter(d => d.userId === userId);
  const widgets = getLocalWidgets();
  return dashboards.map(d => ({
    ...d,
    layout: widgets.filter(w => w.dashboardId === d.id),
  }));
}

/**
 * Get a single dashboard by ID
 */
export async function getDashboard(dashboardId: string): Promise<CustomDashboard | null> {
  if (shouldUseSupabase()) {
    const { data, error } = await supabase
      .from('custom_dashboards')
      .select('*, dashboard_widgets(*)')
      .eq('id', dashboardId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('[DashboardBuilder] Failed to fetch dashboard:', error);
      throw error;
    }

    return mapDashboardFromDb(data);
  }

  // localStorage fallback
  const dashboard = getLocalDashboards().find(d => d.id === dashboardId);
  if (!dashboard) return null;
  const widgets = getLocalWidgets().filter(w => w.dashboardId === dashboardId);
  return { ...dashboard, layout: widgets };
}

/**
 * Update dashboard metadata
 */
export async function updateDashboard(
  dashboardId: string,
  updates: Partial<Pick<CustomDashboard, 'name' | 'description' | 'isDefault'>>
): Promise<CustomDashboard> {
  if (shouldUseSupabase()) {
    const { data, error } = await supabase
      .from('custom_dashboards')
      .update({
        name: updates.name,
        description: updates.description,
        is_default: updates.isDefault,
      })
      .eq('id', dashboardId)
      .select('*, dashboard_widgets(*)')
      .single();

    if (error) {
      console.error('[DashboardBuilder] Failed to update dashboard:', error);
      throw error;
    }

    return mapDashboardFromDb(data);
  }

  // localStorage fallback
  const dashboards = getLocalDashboards();
  const idx = dashboards.findIndex(d => d.id === dashboardId);
  if (idx === -1) throw new Error('Dashboard not found');
  dashboards[idx] = { ...dashboards[idx], ...updates, updatedAt: new Date() };
  saveLocalDashboards(dashboards);
  const widgets = getLocalWidgets().filter(w => w.dashboardId === dashboardId);
  return { ...dashboards[idx], layout: widgets };
}

/**
 * Delete a dashboard
 */
export async function deleteDashboard(dashboardId: string): Promise<void> {
  if (shouldUseSupabase()) {
    const { error } = await supabase
      .from('custom_dashboards')
      .delete()
      .eq('id', dashboardId);

    if (error) {
      console.error('[DashboardBuilder] Failed to delete dashboard:', error);
      throw error;
    }
    return;
  }

  // localStorage fallback
  saveLocalDashboards(getLocalDashboards().filter(d => d.id !== dashboardId));
  saveLocalWidgets(getLocalWidgets().filter(w => w.dashboardId !== dashboardId));
}

// =====================================================
// WIDGET CRUD OPERATIONS
// =====================================================

/**
 * Add a widget to a dashboard
 */
export async function addWidget(
  dashboardId: string,
  widgetType: WidgetType,
  title: string,
  config: WidgetConfig,
  position: WidgetPosition
): Promise<DashboardWidget> {
  if (shouldUseSupabase()) {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert({
        dashboard_id: dashboardId,
        widget_type: widgetType,
        title,
        config,
        position,
      })
      .select()
      .single();

    if (error) {
      console.error('[DashboardBuilder] Failed to add widget:', error);
      throw error;
    }

    return mapWidgetFromDb(data);
  }

  // localStorage fallback
  const now = new Date();
  const widget: DashboardWidget = {
    id: generateId(),
    dashboardId,
    widgetType,
    title,
    config,
    position,
    createdAt: now,
    updatedAt: now,
  };
  const widgets = getLocalWidgets();
  widgets.push(widget);
  saveLocalWidgets(widgets);
  return widget;
}

/**
 * Update a widget's configuration or position
 */
export async function updateWidget(
  widgetId: string,
  updates: Partial<Pick<DashboardWidget, 'title' | 'config' | 'position'>>
): Promise<DashboardWidget> {
  if (shouldUseSupabase()) {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update({
        title: updates.title,
        config: updates.config,
        position: updates.position,
      })
      .eq('id', widgetId)
      .select()
      .single();

    if (error) {
      console.error('[DashboardBuilder] Failed to update widget:', error);
      throw error;
    }

    return mapWidgetFromDb(data);
  }

  // localStorage fallback
  const widgets = getLocalWidgets();
  const idx = widgets.findIndex(w => w.id === widgetId);
  if (idx === -1) throw new Error('Widget not found');
  widgets[idx] = { ...widgets[idx], ...updates, updatedAt: new Date() };
  saveLocalWidgets(widgets);
  return widgets[idx];
}

/**
 * Remove a widget from a dashboard
 */
export async function removeWidget(widgetId: string): Promise<void> {
  if (shouldUseSupabase()) {
    const { error } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('id', widgetId);

    if (error) {
      console.error('[DashboardBuilder] Failed to remove widget:', error);
      throw error;
    }
    return;
  }

  // localStorage fallback
  saveLocalWidgets(getLocalWidgets().filter(w => w.id !== widgetId));
}

/**
 * Batch update widget positions (for drag-and-drop)
 */
export async function updateWidgetPositions(
  updates: { id: string; position: WidgetPosition }[]
): Promise<void> {
  if (shouldUseSupabase()) {
    // Supabase doesn't support bulk update, so we use Promise.all
    const promises = updates.map(({ id, position }) =>
      supabase
        .from('dashboard_widgets')
        .update({ position })
        .eq('id', id)
    );

    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      console.error('[DashboardBuilder] Some widget positions failed to update:', errors);
      throw errors[0].error;
    }
    return;
  }

  // localStorage fallback
  const widgets = getLocalWidgets();
  for (const { id, position } of updates) {
    const idx = widgets.findIndex(w => w.id === id);
    if (idx !== -1) {
      widgets[idx] = { ...widgets[idx], position, updatedAt: new Date() };
    }
  }
  saveLocalWidgets(widgets);
}

// =====================================================
// DASHBOARD SHARING
// =====================================================

/**
 * Share a dashboard with another user
 */
export async function shareDashboard(
  dashboardId: string,
  userId: string,
  permission: DashboardPermission,
  sharedBy: string
): Promise<DashboardShare> {
  if (!shouldUseSupabase()) {
    throw new Error('Dashboard sharing requires Supabase authentication');
  }

  const { data, error } = await supabase
    .from('dashboard_permissions')
    .insert({
      dashboard_id: dashboardId,
      user_id: userId,
      permission,
      shared_by: sharedBy,
    })
    .select()
    .single();

  if (error) {
    console.error('[DashboardBuilder] Failed to share dashboard:', error);
    throw error;
  }

  return {
    id: data.id,
    dashboardId: data.dashboard_id,
    userId: data.user_id,
    permission: data.permission,
    sharedAt: new Date(data.shared_at),
    sharedBy: data.shared_by,
  };
}

/**
 * Remove dashboard share
 */
export async function unshareDashboard(dashboardId: string, userId: string): Promise<void> {
  if (!shouldUseSupabase()) {
    throw new Error('Dashboard sharing requires Supabase authentication');
  }

  const { error } = await supabase
    .from('dashboard_permissions')
    .delete()
    .eq('dashboard_id', dashboardId)
    .eq('user_id', userId);

  if (error) {
    console.error('[DashboardBuilder] Failed to unshare dashboard:', error);
    throw error;
  }
}

// =====================================================
// WIDGET DATA FETCHING
// =====================================================

/**
 * Fetch data for a widget based on its configuration
 */
export async function getWidgetData(
  widget: DashboardWidget,
  userId: string
): Promise<StatCardData | ChartDataPoint[] | ActivityFeedItem[] | Property[] | Issue[] | Record<string, unknown>[]> {
  const { config, widgetType } = widget;

  switch (widgetType) {
    case 'stat_card':
      return getStatCardData(config, userId);
    case 'line_chart':
    case 'bar_chart':
      return getChartData(config, userId, widgetType);
    case 'pie_chart':
      return getPieChartData(config, userId);
    case 'property_list':
      return getPropertyListData(config, userId);
    case 'issue_tracker':
      return getIssueTrackerData(config, userId);
    case 'recent_activity':
      return getActivityFeedData(config, userId);
    case 'table':
      return getTableData(config, userId);
    default:
      console.warn('[DashboardBuilder] Unknown widget type:', widgetType);
      return [];
  }
}

/**
 * Get stat card data (single KPI)
 */
async function getStatCardData(config: WidgetConfig, userId: string): Promise<StatCardData> {
  const { dataSource, metrics, dateRange } = config;
  const metric = metrics?.[0] || 'count';
  const { startDate, endDate } = getDateRange(dateRange);

  let value = 0;
  let previousValue = 0;

  switch (dataSource) {
    case 'properties': {
      if (metric === 'count' || metric === 'total_properties') {
        const { count } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('landlord_id', userId);
        value = count || 0;
      } else if (metric === 'total_rent') {
        const { data } = await supabase
          .from('properties')
          .select('rent_pcm')
          .eq('landlord_id', userId);
        value = (data || []).reduce((sum, p) => sum + (p.rent_pcm || 0), 0);
      } else if (metric === 'occupancy_rate') {
        const { data } = await supabase
          .from('properties')
          .select('status')
          .eq('landlord_id', userId);
        const total = data?.length || 0;
        const occupied = data?.filter(p => p.status === 'let').length || 0;
        value = total > 0 ? Math.round((occupied / total) * 100) : 0;
      }
      break;
    }
    case 'matches': {
      if (metric === 'count' || metric === 'total_matches') {
        const { count } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('landlord_id', userId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        value = count || 0;
      }
      break;
    }
    case 'issues': {
      if (metric === 'count' || metric === 'open_issues') {
        const { count } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('landlord_id', userId)
          .neq('status', 'closed');
        value = count || 0;
      }
      break;
    }
    default:
      break;
  }

  const change = value - previousValue;
  const changePercent = previousValue > 0 ? Math.round((change / previousValue) * 100) : 0;

  return {
    value,
    previousValue,
    change,
    changePercent,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  };
}

/**
 * Get chart data for line/bar charts
 */
async function getChartData(
  config: WidgetConfig,
  userId: string,
  _chartType: 'line_chart' | 'bar_chart'
): Promise<ChartDataPoint[]> {
  const { dataSource, metrics, dateRange } = config;
  const metric = metrics?.[0] || 'count';
  const { startDate, endDate } = getDateRange(dateRange);

  const dataPoints: ChartDataPoint[] = [];

  // Generate date buckets
  const buckets = generateDateBuckets(startDate, endDate, dateRange || 'month');

  switch (dataSource) {
    case 'matches': {
      const { data } = await supabase
        .from('matches')
        .select('created_at')
        .eq('landlord_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      for (const bucket of buckets) {
        const count = (data || []).filter(m => {
          const date = new Date(m.created_at);
          return date >= bucket.start && date < bucket.end;
        }).length;
        dataPoints.push({
          label: bucket.label,
          value: metric === 'count' ? count : count,
          date: bucket.start.toISOString(),
        });
      }
      break;
    }
    case 'issues': {
      const { data } = await supabase
        .from('issues')
        .select('raised_at')
        .eq('landlord_id', userId)
        .gte('raised_at', startDate.toISOString())
        .lte('raised_at', endDate.toISOString());

      for (const bucket of buckets) {
        const count = (data || []).filter(i => {
          const date = new Date(i.raised_at);
          return date >= bucket.start && date < bucket.end;
        }).length;
        dataPoints.push({
          label: bucket.label,
          value: count,
          date: bucket.start.toISOString(),
        });
      }
      break;
    }
    default:
      break;
  }

  return dataPoints;
}

/**
 * Get pie chart data
 */
async function getPieChartData(config: WidgetConfig, userId: string): Promise<ChartDataPoint[]> {
  const { dataSource, metrics } = config;
  const groupBy = metrics?.[0] || 'status';

  switch (dataSource) {
    case 'properties': {
      const { data } = await supabase
        .from('properties')
        .select(groupBy)
        .eq('landlord_id', userId);

      const counts: Record<string, number> = {};
      for (const item of data || []) {
        const key = String(item[groupBy as keyof typeof item] || 'Unknown');
        counts[key] = (counts[key] || 0) + 1;
      }

      return Object.entries(counts).map(([label, value]) => ({ label, value }));
    }
    case 'issues': {
      const { data } = await supabase
        .from('issues')
        .select(groupBy)
        .eq('landlord_id', userId);

      const counts: Record<string, number> = {};
      for (const item of data || []) {
        const key = String(item[groupBy as keyof typeof item] || 'Unknown');
        counts[key] = (counts[key] || 0) + 1;
      }

      return Object.entries(counts).map(([label, value]) => ({ label, value }));
    }
    default:
      return [];
  }
}

/**
 * Get property list data
 */
async function getPropertyListData(config: WidgetConfig, userId: string): Promise<Property[]> {
  const { filters } = config;
  let query = supabase
    .from('properties')
    .select('*')
    .eq('landlord_id', userId)
    .limit(10);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DashboardBuilder] Failed to fetch properties:', error);
    return [];
  }

  return data as Property[];
}

/**
 * Get issue tracker data
 */
async function getIssueTrackerData(config: WidgetConfig, userId: string): Promise<Issue[]> {
  const { filters } = config;
  let query = supabase
    .from('issues')
    .select('*')
    .eq('landlord_id', userId)
    .neq('status', 'closed')
    .order('raised_at', { ascending: false })
    .limit(10);

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DashboardBuilder] Failed to fetch issues:', error);
    return [];
  }

  return data as Issue[];
}

/**
 * Get activity feed data
 */
async function getActivityFeedData(_config: WidgetConfig, userId: string): Promise<ActivityFeedItem[]> {
  const activities: ActivityFeedItem[] = [];

  // Fetch recent matches
  const { data: matches } = await supabase
    .from('matches')
    .select('id, created_at, property_id')
    .eq('landlord_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  for (const match of matches || []) {
    activities.push({
      id: match.id,
      type: 'match',
      title: 'New Match',
      description: 'A new tenant match was created',
      timestamp: new Date(match.created_at),
      relatedId: match.property_id,
    });
  }

  // Fetch recent issues
  const { data: issues } = await supabase
    .from('issues')
    .select('id, raised_at, subject, property_id')
    .eq('landlord_id', userId)
    .order('raised_at', { ascending: false })
    .limit(5);

  for (const issue of issues || []) {
    activities.push({
      id: issue.id,
      type: 'issue',
      title: 'Issue Reported',
      description: issue.subject,
      timestamp: new Date(issue.raised_at),
      relatedId: issue.property_id,
    });
  }

  // Sort by timestamp
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
}

/**
 * Get table data (generic)
 */
async function getTableData(config: WidgetConfig, userId: string): Promise<Record<string, unknown>[]> {
  const { dataSource, filters } = config;

  const { data, error } = await supabase
    .from(dataSource)
    .select('*')
    .eq('landlord_id', userId)
    .limit(filters?.limit as number || 20);

  if (error) {
    console.error('[DashboardBuilder] Failed to fetch table data:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// TEMPLATES
// =====================================================

/**
 * Dashboard template definitions
 */
export const DASHBOARD_TEMPLATES: Record<DashboardTemplateId, {
  name: string;
  description: string;
  widgets: Omit<DashboardWidget, 'id' | 'dashboardId' | 'createdAt' | 'updatedAt'>[];
}> = {
  landlord_portfolio: {
    name: 'Landlord Portfolio',
    description: 'Overview of your property portfolio with key metrics',
    widgets: [
      {
        widgetType: 'stat_card',
        title: 'Total Properties',
        config: { dataSource: 'properties', metrics: ['total_properties'] },
        position: { x: 0, y: 0, width: 3, height: 2 },
      },
      {
        widgetType: 'stat_card',
        title: 'Monthly Rent',
        config: { dataSource: 'properties', metrics: ['total_rent'] },
        position: { x: 3, y: 0, width: 3, height: 2 },
      },
      {
        widgetType: 'stat_card',
        title: 'Occupancy Rate',
        config: { dataSource: 'properties', metrics: ['occupancy_rate'] },
        position: { x: 6, y: 0, width: 3, height: 2 },
      },
      {
        widgetType: 'stat_card',
        title: 'Open Issues',
        config: { dataSource: 'issues', metrics: ['open_issues'] },
        position: { x: 9, y: 0, width: 3, height: 2 },
      },
      {
        widgetType: 'property_list',
        title: 'Your Properties',
        config: { dataSource: 'properties' },
        position: { x: 0, y: 2, width: 6, height: 4 },
      },
      {
        widgetType: 'issue_tracker',
        title: 'Active Issues',
        config: { dataSource: 'issues' },
        position: { x: 6, y: 2, width: 6, height: 4 },
      },
    ],
  },
  agency_overview: {
    name: 'Agency Overview',
    description: 'Key performance metrics for agency management',
    widgets: [
      {
        widgetType: 'stat_card',
        title: 'Properties Managed',
        config: { dataSource: 'properties', metrics: ['total_properties'] },
        position: { x: 0, y: 0, width: 3, height: 2 },
      },
      {
        widgetType: 'stat_card',
        title: 'Active Matches',
        config: { dataSource: 'matches', metrics: ['total_matches'], dateRange: 'month' },
        position: { x: 3, y: 0, width: 3, height: 2 },
      },
      {
        widgetType: 'line_chart',
        title: 'Matches Trend',
        config: { dataSource: 'matches', metrics: ['count'], dateRange: 'quarter' },
        position: { x: 0, y: 2, width: 6, height: 4 },
      },
      {
        widgetType: 'pie_chart',
        title: 'Issues by Priority',
        config: { dataSource: 'issues', metrics: ['priority'] },
        position: { x: 6, y: 2, width: 6, height: 4 },
      },
    ],
  },
  financial_summary: {
    name: 'Financial Summary',
    description: 'Track rent, payments, and financial metrics',
    widgets: [
      {
        widgetType: 'stat_card',
        title: 'Total Rent',
        config: { dataSource: 'properties', metrics: ['total_rent'] },
        position: { x: 0, y: 0, width: 4, height: 2 },
      },
      {
        widgetType: 'bar_chart',
        title: 'Rent by Property',
        config: { dataSource: 'properties', metrics: ['rent_pcm'] },
        position: { x: 0, y: 2, width: 12, height: 4 },
      },
    ],
  },
  maintenance_focus: {
    name: 'Maintenance Focus',
    description: 'Track issues, SLA compliance, and maintenance tasks',
    widgets: [
      {
        widgetType: 'stat_card',
        title: 'Open Issues',
        config: { dataSource: 'issues', metrics: ['open_issues'] },
        position: { x: 0, y: 0, width: 4, height: 2 },
      },
      {
        widgetType: 'issue_tracker',
        title: 'Issue Tracker',
        config: { dataSource: 'issues' },
        position: { x: 0, y: 2, width: 8, height: 6 },
      },
      {
        widgetType: 'pie_chart',
        title: 'Issues by Category',
        config: { dataSource: 'issues', metrics: ['category'] },
        position: { x: 8, y: 2, width: 4, height: 6 },
      },
    ],
  },
};

/**
 * Create a dashboard from a template
 */
export async function createDashboardFromTemplate(
  userId: string,
  templateId: DashboardTemplateId
): Promise<CustomDashboard> {
  const template = DASHBOARD_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  // Create dashboard
  const dashboard = await createDashboard(userId, template.name, template.description, templateId);

  // Add widgets
  for (const widget of template.widgets) {
    await addWidget(
      dashboard.id,
      widget.widgetType,
      widget.title,
      widget.config,
      widget.position
    );
  }

  // Fetch complete dashboard with widgets
  const completeDashboard = await getDashboard(dashboard.id);
  if (!completeDashboard) {
    throw new Error('Failed to fetch created dashboard');
  }

  return completeDashboard;
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Map database row to CustomDashboard type
 */
function mapDashboardFromDb(row: Record<string, unknown>): CustomDashboard {
  const widgets = (row.dashboard_widgets as Record<string, unknown>[] || []).map(mapWidgetFromDb);

  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    isDefault: row.is_default as boolean,
    templateId: row.template_id as DashboardTemplateId | undefined,
    layout: widgets,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Map database row to DashboardWidget type
 */
function mapWidgetFromDb(row: Record<string, unknown>): DashboardWidget {
  return {
    id: row.id as string,
    dashboardId: row.dashboard_id as string,
    widgetType: row.widget_type as WidgetType,
    title: row.title as string,
    config: row.config as WidgetConfig,
    position: row.position as WidgetPosition,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Get date range from preset
 */
function getDateRange(range?: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (range) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1); // Default to month
  }

  return { startDate, endDate };
}

/**
 * Generate date buckets for chart data
 */
function generateDateBuckets(
  startDate: Date,
  endDate: Date,
  range: string
): { start: Date; end: Date; label: string }[] {
  const buckets: { start: Date; end: Date; label: string }[] = [];
  const current = new Date(startDate);

  while (current < endDate) {
    const bucketStart = new Date(current);
    let bucketEnd: Date;
    let label: string;

    switch (range) {
      case 'week':
        bucketEnd = new Date(current);
        bucketEnd.setDate(bucketEnd.getDate() + 1);
        label = current.toLocaleDateString('en-GB', { weekday: 'short' });
        current.setDate(current.getDate() + 1);
        break;
      case 'month':
        bucketEnd = new Date(current);
        bucketEnd.setDate(bucketEnd.getDate() + 1);
        label = current.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        current.setDate(current.getDate() + 1);
        break;
      case 'quarter':
        bucketEnd = new Date(current);
        bucketEnd.setDate(bucketEnd.getDate() + 7);
        label = `W${Math.ceil(current.getDate() / 7)}`;
        current.setDate(current.getDate() + 7);
        break;
      case 'year':
        bucketEnd = new Date(current);
        bucketEnd.setMonth(bucketEnd.getMonth() + 1);
        label = current.toLocaleDateString('en-GB', { month: 'short' });
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        bucketEnd = new Date(current);
        bucketEnd.setDate(bucketEnd.getDate() + 1);
        label = current.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        current.setDate(current.getDate() + 1);
    }

    buckets.push({ start: bucketStart, end: bucketEnd, label });
  }

  return buckets;
}
