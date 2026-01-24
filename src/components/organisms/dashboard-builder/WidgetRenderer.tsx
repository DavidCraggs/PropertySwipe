/**
 * WidgetRenderer - Renders widgets based on their type and data
 */

import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Home,
  AlertTriangle,
  Clock,
  RefreshCw,
  Download,
  MoreVertical,
  Pencil,
  Check,
  X,
  Settings,
} from 'lucide-react';
import type {
  DashboardWidget,
  WidgetType,
  StatCardData,
  ChartDataPoint,
  ActivityFeedItem,
  Property,
  Issue,
} from '../../../types';
import { getWidgetData } from '../../../services/DashboardBuilderService';

interface WidgetRendererProps {
  widget: DashboardWidget;
  userId: string;
  onEdit?: () => void;
  onRemove?: () => void;
  isEditing?: boolean;
  isEditingTitle?: boolean;
  onStartEditTitle?: () => void;
  onSaveTitle?: (title: string) => void;
  onCancelEditTitle?: () => void;
}

export function WidgetRenderer({
  widget,
  userId,
  onEdit,
  onRemove,
  isEditing = false,
  isEditingTitle = false,
  onStartEditTitle,
  onSaveTitle,
  onCancelEditTitle,
}: WidgetRendererProps) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [titleValue, setTitleValue] = useState(widget.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Reset title value when widget changes
  useEffect(() => {
    setTitleValue(widget.title);
  }, [widget.title]);

  useEffect(() => {
    loadData();
  }, [widget.id, widget.config]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const widgetData = await getWidgetData(widget, userId);
      setData(widgetData);
    } catch (err) {
      console.error('[WidgetRenderer] Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-6 w-6 text-neutral-400 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-danger-500">
          <AlertTriangle className="h-6 w-6 mb-2" />
          <span className="text-sm">{error}</span>
        </div>
      );
    }

    switch (widget.widgetType) {
      case 'stat_card':
        return <StatCardWidget data={data as StatCardData} />;
      case 'line_chart':
        return <LineChartWidget data={data as ChartDataPoint[]} />;
      case 'bar_chart':
        return <BarChartWidget data={data as ChartDataPoint[]} />;
      case 'pie_chart':
        return <PieChartWidget data={data as ChartDataPoint[]} />;
      case 'property_list':
        return <PropertyListWidget data={data as Property[]} />;
      case 'issue_tracker':
        return <IssueTrackerWidget data={data as Issue[]} />;
      case 'recent_activity':
        return <ActivityFeedWidget data={data as ActivityFeedItem[]} />;
      case 'table':
        return <TableWidget data={data as Record<string, unknown>[]} />;
      default:
        return <div className="text-neutral-500">Unknown widget type</div>;
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveTitle?.(titleValue);
    } else if (e.key === 'Escape') {
      setTitleValue(widget.title);
      onCancelEditTitle?.();
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border h-full flex flex-col overflow-hidden transition-all ${isEditing ? 'border-primary-200 ring-1 ring-primary-100' : 'border-neutral-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        {/* Title - Inline editable */}
        {isEditingTitle ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              ref={titleInputRef}
              type="text"
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={() => onSaveTitle?.(titleValue)}
              className="flex-1 px-2 py-1 text-sm font-semibold text-neutral-900 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <button
              onClick={() => onSaveTitle?.(titleValue)}
              className="p-1 text-success-600 hover:bg-success-50 rounded"
              title="Save"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setTitleValue(widget.title);
                onCancelEditTitle?.();
              }}
              className="p-1 text-neutral-400 hover:bg-neutral-100 rounded"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0 group">
            <h3 className="font-semibold text-neutral-900 text-sm truncate">{widget.title}</h3>
            {isEditing && onStartEditTitle && (
              <button
                onClick={onStartEditTitle}
                className="p-1 text-neutral-400 hover:text-primary-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit title"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={loadData}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {isEditing && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10 min-w-[140px]">
                  <button
                    onClick={() => {
                      onStartEditTitle?.();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      onEdit?.();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <hr className="my-1 border-neutral-100" />
                  <button
                    onClick={() => {
                      onRemove?.();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">{renderContent()}</div>
    </div>
  );
}

// =====================================================
// STAT CARD WIDGET
// =====================================================

function StatCardWidget({ data }: { data: StatCardData }) {
  const { value, previousValue, change, changePercent, trend, prefix, suffix } = data;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-neutral-500';

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-3xl font-bold text-neutral-900">
        {prefix}
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix}
      </div>
      {(change !== undefined || changePercent !== undefined) && (
        <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {changePercent !== undefined ? `${changePercent > 0 ? '+' : ''}${changePercent}%` : change}
          </span>
          {previousValue !== undefined && (
            <span className="text-xs text-neutral-500 ml-1">vs {previousValue}</span>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// LINE CHART WIDGET (Simple SVG)
// =====================================================

function LineChartWidget({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No data available" />;
  }

  const maxValue = Math.max(...data.map(d => d.value)) || 1;
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const width = 100;
  const height = 60;
  const padding = 5;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1 || 1)) * (width - padding * 2),
    y: height - padding - ((d.value - minValue) / range) * (height - padding * 2),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="h-full flex flex-col">
      <svg viewBox={`0 0 ${width} ${height}`} className="flex-1 w-full">
        {/* Grid lines */}
        {[0, 0.5, 1].map(ratio => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + ratio * (height - padding * 2)}
            x2={width - padding}
            y2={padding + ratio * (height - padding * 2)}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        {/* Line */}
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#3b82f6" />
        ))}
      </svg>
      {/* Labels */}
      <div className="flex justify-between text-xs text-neutral-500 mt-2">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

// =====================================================
// BAR CHART WIDGET (Simple SVG)
// =====================================================

function BarChartWidget({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No data available" />;
  }

  const maxValue = Math.max(...data.map(d => d.value)) || 1;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-primary-500 rounded-t"
              style={{ height: `${(d.value / maxValue) * 100}%`, minHeight: '4px' }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        ))}
      </div>
      {/* Labels */}
      <div className="flex gap-1 mt-2">
        {data.slice(0, 6).map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-xs text-neutral-500 truncate block">{d.label}</span>
          </div>
        ))}
        {data.length > 6 && (
          <span className="text-xs text-neutral-400">+{data.length - 6}</span>
        )}
      </div>
    </div>
  );
}

// =====================================================
// PIE CHART WIDGET (Simple SVG)
// =====================================================

function PieChartWidget({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No data available" />;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  let currentAngle = 0;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + angle - 90) * (Math.PI / 180);

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[i % colors.length],
      label: d.label,
      value: d.value,
      percent: Math.round((d.value / total) * 100),
    };
  });

  return (
    <div className="h-full flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 flex-shrink-0">
        {slices.map((slice, i) => (
          <path key={i} d={slice.path} fill={slice.color} stroke="white" strokeWidth="1" />
        ))}
      </svg>
      <div className="flex-1 space-y-1 overflow-auto">
        {slices.slice(0, 5).map((slice, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="truncate flex-1 text-neutral-700">{slice.label}</span>
            <span className="text-neutral-500">{slice.percent}%</span>
          </div>
        ))}
        {slices.length > 5 && (
          <div className="text-xs text-neutral-400">+{slices.length - 5} more</div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// PROPERTY LIST WIDGET
// =====================================================

function PropertyListWidget({ data }: { data: Property[] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No properties found" />;
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map(property => (
        <div
          key={property.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <div className="w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <Home className="h-5 w-5 text-neutral-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-neutral-900 truncate">
              {property.address?.street || 'Property'}
            </div>
            <div className="text-xs text-neutral-500">
              {property.rentPcm ? `£${property.rentPcm}/month` : 'No rent set'}
            </div>
          </div>
          <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
            {property.address?.city || 'Property'}
          </div>
        </div>
      ))}
      {data.length > 5 && (
        <div className="text-xs text-neutral-500 text-center pt-2">
          +{data.length - 5} more properties
        </div>
      )}
    </div>
  );
}

// =====================================================
// ISSUE TRACKER WIDGET
// =====================================================

function IssueTrackerWidget({ data }: { data: Issue[] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No open issues" />;
  }

  const priorityColors: Record<string, string> = {
    emergency: 'bg-danger-100 text-danger-700',
    urgent: 'bg-warning-100 text-warning-700',
    routine: 'bg-primary-100 text-primary-700',
    low: 'bg-neutral-100 text-neutral-700',
  };

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map(issue => (
        <div
          key={issue.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-neutral-900 truncate">{issue.subject}</div>
            <div className="text-xs text-neutral-500">{issue.category}</div>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[issue.priority] || priorityColors.routine}`}>
            {issue.priority}
          </div>
        </div>
      ))}
      {data.length > 5 && (
        <div className="text-xs text-neutral-500 text-center pt-2">
          +{data.length - 5} more issues
        </div>
      )}
    </div>
  );
}

// =====================================================
// ACTIVITY FEED WIDGET
// =====================================================

function ActivityFeedWidget({ data }: { data: ActivityFeedItem[] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No recent activity" />;
  }

  const typeIcons: Record<string, React.ReactNode> = {
    match: <Home className="h-4 w-4 text-success-600" />,
    issue: <AlertTriangle className="h-4 w-4 text-warning-600" />,
    payment: <TrendingUp className="h-4 w-4 text-primary-600" />,
    viewing: <Clock className="h-4 w-4 text-secondary-600" />,
    contract: <Download className="h-4 w-4 text-neutral-600" />,
  };

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map(item => (
        <div key={item.id} className="flex items-start gap-3">
          <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
            {typeIcons[item.type] || <Clock className="h-4 w-4 text-neutral-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-neutral-900">{item.title}</div>
            <div className="text-xs text-neutral-500 truncate">{item.description}</div>
            <div className="text-xs text-neutral-400 mt-0.5">
              {new Date(item.timestamp).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// TABLE WIDGET
// =====================================================

function TableWidget({ data }: { data: Record<string, unknown>[] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No data available" />;
  }

  const columns = Object.keys(data[0]).slice(0, 5);

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            {columns.map(col => (
              <th key={col} className="px-2 py-1 text-left font-medium text-neutral-700 capitalize">
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => (
            <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50">
              {columns.map(col => (
                <td key={col} className="px-2 py-1.5 text-neutral-600 truncate max-w-[150px]">
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <div className="text-xs text-neutral-500 text-center pt-2">
          +{data.length - 10} more rows
        </div>
      )}
    </div>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-2">
        <Minus className="h-6 w-6" />
      </div>
      <span className="text-sm">{message}</span>
    </div>
  );
}

// =====================================================
// WIDGET TYPE INFO
// =====================================================

export const WIDGET_TYPE_INFO: Record<WidgetType, { name: string; description: string; icon: string }> = {
  stat_card: {
    name: 'Stat Card',
    description: 'Display a single KPI value with trend',
    icon: 'TrendingUp',
  },
  line_chart: {
    name: 'Line Chart',
    description: 'Show trends over time',
    icon: 'LineChart',
  },
  bar_chart: {
    name: 'Bar Chart',
    description: 'Compare values across categories',
    icon: 'BarChart',
  },
  pie_chart: {
    name: 'Pie Chart',
    description: 'Show distribution of values',
    icon: 'PieChart',
  },
  table: {
    name: 'Data Table',
    description: 'Display data in a table format',
    icon: 'Table',
  },
  property_list: {
    name: 'Property List',
    description: 'List your properties',
    icon: 'Home',
  },
  issue_tracker: {
    name: 'Issue Tracker',
    description: 'Track open maintenance issues',
    icon: 'AlertTriangle',
  },
  recent_activity: {
    name: 'Activity Feed',
    description: 'Recent activity timeline',
    icon: 'Clock',
  },
};
