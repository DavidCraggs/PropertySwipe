/**
 * WidgetConfigModal - Configuration form for widget settings
 */

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { DashboardWidget, WidgetConfig, WidgetType, DataSource } from '../../../types';
import { WIDGET_TYPE_INFO } from './WidgetRenderer';

interface WidgetConfigModalProps {
  widget: DashboardWidget | null;
  widgetType?: WidgetType; // For new widgets
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: { title: string; config: WidgetConfig }) => void;
}

const DATA_SOURCES: { value: DataSource; label: string }[] = [
  { value: 'properties', label: 'Properties' },
  { value: 'matches', label: 'Matches' },
  { value: 'issues', label: 'Issues' },
  { value: 'ratings', label: 'Ratings' },
  { value: 'payments', label: 'Payments' },
  { value: 'tenancies', label: 'Tenancies' },
  { value: 'sla_performance', label: 'SLA Performance' },
];

const DATE_RANGES = [
  { value: 'week', label: 'Last Week' },
  { value: 'month', label: 'Last Month' },
  { value: 'quarter', label: 'Last Quarter' },
  { value: 'year', label: 'Last Year' },
];

const METRICS_BY_DATA_SOURCE: Record<DataSource, { value: string; label: string }[]> = {
  properties: [
    { value: 'count', label: 'Count' },
    { value: 'total_properties', label: 'Total Properties' },
    { value: 'total_rent', label: 'Total Rent' },
    { value: 'occupancy_rate', label: 'Occupancy Rate' },
    { value: 'status', label: 'By Status' },
    { value: 'property_type', label: 'By Property Type' },
  ],
  matches: [
    { value: 'count', label: 'Count' },
    { value: 'total_matches', label: 'Total Matches' },
    { value: 'status', label: 'By Status' },
  ],
  issues: [
    { value: 'count', label: 'Count' },
    { value: 'open_issues', label: 'Open Issues' },
    { value: 'priority', label: 'By Priority' },
    { value: 'category', label: 'By Category' },
    { value: 'status', label: 'By Status' },
  ],
  ratings: [
    { value: 'average', label: 'Average Rating' },
    { value: 'count', label: 'Total Ratings' },
  ],
  payments: [
    { value: 'total', label: 'Total Amount' },
    { value: 'count', label: 'Payment Count' },
    { value: 'status', label: 'By Status' },
  ],
  tenancies: [
    { value: 'count', label: 'Count' },
    { value: 'status', label: 'By Status' },
  ],
  sla_performance: [
    { value: 'compliance_rate', label: 'Compliance Rate' },
    { value: 'avg_response_time', label: 'Avg Response Time' },
    { value: 'avg_resolution_time', label: 'Avg Resolution Time' },
  ],
};

export function WidgetConfigModal({
  widget,
  widgetType,
  isOpen,
  onClose,
  onSave,
}: WidgetConfigModalProps) {
  const [title, setTitle] = useState('');
  const [dataSource, setDataSource] = useState<DataSource>('properties');
  const [selectedMetric, setSelectedMetric] = useState<string>('count');
  const [dateRange, setDateRange] = useState<string>('month');
  const [refreshInterval, setRefreshInterval] = useState<number>(0);

  // Determine the widget type (existing or new)
  const currentWidgetType = widget?.widgetType || widgetType;

  // Initialize form with widget data
  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setDataSource(widget.config.dataSource || 'properties');
      setSelectedMetric(widget.config.metrics?.[0] || 'count');
      setDateRange(widget.config.dateRange || 'month');
      setRefreshInterval(widget.config.refreshInterval || 0);
    } else if (widgetType) {
      // New widget - set defaults
      const info = WIDGET_TYPE_INFO[widgetType];
      setTitle(info.name);
      setDataSource('properties');
      setSelectedMetric('count');
      setDateRange('month');
      setRefreshInterval(0);
    }
  }, [widget, widgetType]);

  if (!isOpen || !currentWidgetType) return null;

  const handleSave = () => {
    const config: WidgetConfig = {
      dataSource,
      metrics: [selectedMetric],
      dateRange: dateRange as WidgetConfig['dateRange'],
      refreshInterval: refreshInterval > 0 ? refreshInterval : undefined,
    };

    onSave({ title, config });
    onClose();
  };

  const availableMetrics = METRICS_BY_DATA_SOURCE[dataSource] || [];
  const info = WIDGET_TYPE_INFO[currentWidgetType];

  // Filter data sources based on widget type
  const availableDataSources = getAvailableDataSources(currentWidgetType);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              {widget ? 'Edit Widget' : 'Configure Widget'}
            </h2>
            <p className="text-sm text-neutral-500">{info.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors rounded-lg hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Widget Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter widget title"
            />
          </div>

          {/* Data Source */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Data Source
            </label>
            <select
              value={dataSource}
              onChange={e => {
                const newSource = e.target.value as DataSource;
                setDataSource(newSource);
                // Reset metric when data source changes
                const newMetrics = METRICS_BY_DATA_SOURCE[newSource] || [];
                if (newMetrics.length > 0) {
                  setSelectedMetric(newMetrics[0].value);
                }
              }}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {availableDataSources.map(ds => (
                <option key={ds.value} value={ds.value}>
                  {ds.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metric */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Metric
            </label>
            <select
              value={selectedMetric}
              onChange={e => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {availableMetrics.map(metric => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range (for charts and stats) */}
          {(currentWidgetType === 'stat_card' ||
            currentWidgetType === 'line_chart' ||
            currentWidgetType === 'bar_chart') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {DATE_RANGES.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Interval */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Auto Refresh
            </label>
            <select
              value={refreshInterval}
              onChange={e => setRefreshInterval(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={0}>Manual only</option>
              <option value={30}>Every 30 seconds</option>
              <option value={60}>Every minute</option>
              <option value={300}>Every 5 minutes</option>
              <option value={900}>Every 15 minutes</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            {widget ? 'Save Changes' : 'Add Widget'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get available data sources based on widget type
 */
function getAvailableDataSources(widgetType: WidgetType): { value: DataSource; label: string }[] {
  switch (widgetType) {
    case 'property_list':
      return [{ value: 'properties', label: 'Properties' }];
    case 'issue_tracker':
      return [{ value: 'issues', label: 'Issues' }];
    case 'recent_activity':
      return DATA_SOURCES; // Activity can come from multiple sources
    default:
      return DATA_SOURCES;
  }
}
