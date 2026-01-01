/**
 * Analytics Charts Components
 * Phase 4: World-Class Reporting & Analytics
 *
 * Reusable chart components for analytics dashboards.
 * Uses native CSS for simplicity - can be upgraded to Recharts for production.
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
import type { TrendData } from '../../services/ReportingService';

// =====================================================
// METRIC CARD
// =====================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    neutral: 'bg-neutral-50 text-neutral-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-neutral-500">{title}</span>
        {icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
      <div className="flex items-center justify-between mt-1">
        {subtitle && <span className="text-xs text-neutral-400">{subtitle}</span>}
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? 'text-success-600' : 'text-danger-600'}`}>
            {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// =====================================================
// PROGRESS BAR CHART
// =====================================================

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  max,
  color = 'primary',
  showPercentage = true,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-neutral-600">{label}</span>
        <span className="text-sm font-medium text-neutral-900">
          {showPercentage ? `${percentage.toFixed(0)}%` : value}
        </span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorClasses[color]}`}
        />
      </div>
    </div>
  );
};

// =====================================================
// BAR CHART (Simple)
// =====================================================

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 200,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
      {title && <h3 className="text-sm font-medium text-neutral-700 mb-4">{title}</h3>}
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * height * 0.8;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="text-xs text-neutral-500 mb-1">{item.value}</div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="w-full rounded-t-lg"
                style={{
                  backgroundColor: item.color || '#6366f1',
                }}
              />
              <div className="text-xs text-neutral-600 mt-2 text-center truncate w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =====================================================
// DONUT CHART (Simple)
// =====================================================

interface DonutChartProps {
  value: number;
  max: number;
  title: string;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  value,
  max,
  title,
  subtitle,
  color = 'primary',
  size = 120,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-primary-500',
    success: 'stroke-success-500',
    warning: 'stroke-warning-500',
    danger: 'stroke-danger-500',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={colorClasses[color]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-neutral-900">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium text-neutral-700">{title}</div>
        {subtitle && <div className="text-xs text-neutral-500">{subtitle}</div>}
      </div>
    </div>
  );
};

// =====================================================
// TREND LIST
// =====================================================

interface TrendListProps {
  trends: TrendData[];
  title?: string;
}

export const TrendList: React.FC<TrendListProps> = ({ trends, title }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
      {title && <h3 className="text-sm font-medium text-neutral-700 mb-3">{title}</h3>}
      <div className="space-y-3">
        {trends.map((trend, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-neutral-600">{trend.metric}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-900">{trend.current}</span>
              <div
                className={`flex items-center gap-1 text-xs ${
                  trend.isPositive ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {trend.change > 0 ? (
                  <TrendingUp size={14} />
                ) : trend.change < 0 ? (
                  <TrendingDown size={14} />
                ) : (
                  <Minus size={14} />
                )}
                <span>{Math.abs(trend.changePercent).toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// SLA COMPLIANCE GAUGE
// =====================================================

interface SLAGaugeProps {
  complianceRate: number;
  title?: string;
}

export const SLAGauge: React.FC<SLAGaugeProps> = ({
  complianceRate,
  title = 'SLA Compliance',
}) => {
  const getColor = (rate: number) => {
    if (rate >= 95) return 'success';
    if (rate >= 80) return 'warning';
    return 'danger';
  };

  const color = getColor(complianceRate);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
      <h3 className="text-sm font-medium text-neutral-700 mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <DonutChart
          value={complianceRate}
          max={100}
          title={`${complianceRate.toFixed(1)}%`}
          subtitle="Target: 95%"
          color={color}
          size={140}
        />
      </div>
      <div className="mt-4 flex justify-center gap-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success-500" />
          <span>≥95% Excellent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-warning-500" />
          <span>≥80% Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-danger-500" />
          <span>&lt;80% Needs Work</span>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// ACTIVITY TIMELINE
// =====================================================

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'match' | 'issue' | 'tenancy' | 'message';
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  title?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  items,
  title = 'Recent Activity',
}) => {
  const typeColors = {
    match: 'bg-success-500',
    issue: 'bg-warning-500',
    tenancy: 'bg-primary-500',
    message: 'bg-neutral-400',
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
      <h3 className="text-sm font-medium text-neutral-700 mb-4">{title}</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-3"
          >
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${typeColors[item.type]}`} />
              {index < items.length - 1 && (
                <div className="absolute top-3 left-1.5 w-px h-full bg-neutral-200" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="text-sm font-medium text-neutral-900">{item.title}</div>
              <div className="text-xs text-neutral-500">{item.description}</div>
              <div className="text-xs text-neutral-400 mt-1">
                {formatTimeAgo(item.timestamp)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// EXPORT BUTTON
// =====================================================

interface ExportButtonProps {
  onExport: (format: 'pdf' | 'xlsx' | 'csv') => void;
  loading?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  loading = false,
}) => {
  return (
    <div className="relative inline-block">
      <button
        onClick={() => onExport('pdf')}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <Download size={16} />
        <span>{loading ? 'Exporting...' : 'Export Report'}</span>
      </button>
    </div>
  );
};

// =====================================================
// HELPERS
// =====================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
