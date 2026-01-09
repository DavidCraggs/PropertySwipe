import { LayoutList, LayoutGrid, RectangleVertical } from 'lucide-react';
import type { PropertyViewMode } from '../../types';

interface PropertyViewSwitcherProps {
  currentView: PropertyViewMode;
  onViewChange: (view: PropertyViewMode) => void;
  className?: string;
}

/**
 * Toggle buttons for switching between List, Grid, and Card view modes
 */
export function PropertyViewSwitcher({
  currentView,
  onViewChange,
  className = '',
}: PropertyViewSwitcherProps) {
  const viewOptions: { mode: PropertyViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'list', icon: <LayoutList className="h-4 w-4" />, label: 'List' },
    { mode: 'grid', icon: <LayoutGrid className="h-4 w-4" />, label: 'Grid' },
    { mode: 'card', icon: <RectangleVertical className="h-4 w-4" />, label: 'Card' },
  ];

  return (
    <div className={`inline-flex rounded-lg bg-neutral-100 p-1 ${className}`}>
      {viewOptions.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
            transition-all duration-200
            ${
              currentView === mode
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }
          `}
          aria-label={`Switch to ${label} view`}
          aria-pressed={currentView === mode}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
