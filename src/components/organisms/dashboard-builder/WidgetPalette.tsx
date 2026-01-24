/**
 * WidgetPalette - Sidebar showing available widget types
 */

import {
  TrendingUp,
  LineChart,
  BarChart3,
  PieChart,
  Table,
  Home,
  AlertTriangle,
  Clock,
  GripVertical,
} from 'lucide-react';
import type { WidgetType } from '../../../types';
import { WIDGET_TYPE_INFO } from './WidgetRenderer';

interface WidgetPaletteProps {
  onAddWidget: (widgetType: WidgetType) => void;
  isOpen: boolean;
  onClose?: () => void;
}

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  stat_card: <TrendingUp className="h-5 w-5" />,
  line_chart: <LineChart className="h-5 w-5" />,
  bar_chart: <BarChart3 className="h-5 w-5" />,
  pie_chart: <PieChart className="h-5 w-5" />,
  table: <Table className="h-5 w-5" />,
  property_list: <Home className="h-5 w-5" />,
  issue_tracker: <AlertTriangle className="h-5 w-5" />,
  recent_activity: <Clock className="h-5 w-5" />,
};

const WIDGET_CATEGORIES = [
  {
    name: 'Metrics',
    widgets: ['stat_card'] as WidgetType[],
  },
  {
    name: 'Charts',
    widgets: ['line_chart', 'bar_chart', 'pie_chart'] as WidgetType[],
  },
  {
    name: 'Lists',
    widgets: ['property_list', 'issue_tracker', 'recent_activity'] as WidgetType[],
  },
  {
    name: 'Data',
    widgets: ['table'] as WidgetType[],
  },
];

export function WidgetPalette({ onAddWidget, isOpen }: WidgetPaletteProps) {
  if (!isOpen) return null;

  return (
    <div className="w-64 bg-white border-r border-neutral-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-semibold text-neutral-900">Add Widget</h3>
        <p className="text-sm text-neutral-500 mt-1">Click to add to your dashboard</p>
      </div>

      <div className="p-4 space-y-6">
        {WIDGET_CATEGORIES.map(category => (
          <div key={category.name}>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              {category.name}
            </h4>
            <div className="space-y-2">
              {category.widgets.map(widgetType => {
                const info = WIDGET_TYPE_INFO[widgetType];
                return (
                  <button
                    key={widgetType}
                    onClick={() => onAddWidget(widgetType)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 bg-neutral-100 group-hover:bg-primary-100 rounded-lg flex items-center justify-center text-neutral-600 group-hover:text-primary-600 transition-colors">
                      {WIDGET_ICONS[widgetType]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-900">{info.name}</div>
                      <div className="text-xs text-neutral-500 truncate">{info.description}</div>
                    </div>
                    <GripVertical className="h-4 w-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// DRAGGABLE WIDGET ITEM (for future drag-and-drop)
// =====================================================

interface DraggableWidgetItemProps {
  widgetType: WidgetType;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
}

export function DraggableWidgetItem({ widgetType, onDragStart, onClick }: DraggableWidgetItemProps) {
  const info = WIDGET_TYPE_INFO[widgetType];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-move group"
    >
      <div className="w-10 h-10 bg-neutral-100 group-hover:bg-primary-100 rounded-lg flex items-center justify-center text-neutral-600 group-hover:text-primary-600 transition-colors">
        {WIDGET_ICONS[widgetType]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-900">{info.name}</div>
        <div className="text-xs text-neutral-500 truncate">{info.description}</div>
      </div>
      <GripVertical className="h-4 w-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
