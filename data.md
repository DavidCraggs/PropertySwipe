# Custom Reports & Data Dashboards System

Implementation plan for enabling landlords and agencies to create custom reports and configurable data dashboards.

---

## Background

PropertySwipe has an existing [ReportingService.ts](file:///c:/Users/david/PropertySwipe/src/services/ReportingService.ts) with predefined metrics (Portfolio, Performance, SLA, Financial) and the [AgencyAnalyticsDashboard.tsx](file:///c:/Users/david/PropertySwipe/src/pages/AgencyAnalyticsDashboard.tsx) for agencies. This plan extends these to allow user-defined dashboards and reports.

### Existing Data Sources
From `ReportingService.ts`:
- **Portfolio Metrics**: Total/available/let properties, occupancy rate, avg rent
- **Performance Metrics**: Interests, matches, conversion rate, days to let
- **SLA Metrics**: Issues, resolution time, compliance rate
- **Financial Metrics**: Total rent managed, commission, arrears

Additional tables from migrations:
- `properties` - Property details, rent, status
- `matches` - Tenancy matches, applications
- `issues` - Maintenance issues, priorities
- `ratings` - Tenant/landlord ratings
- `agency_property_links` - Agency-property relationships
- `payment_transactions` - Payment history

---

## Proposed Changes

### Database Layer

#### [NEW] [20260124_custom_dashboards.sql](file:///c:/Users/david/PropertySwipe/supabase/migrations/20260124_custom_dashboards.sql)

```sql
-- User-created dashboard configurations
CREATE TABLE custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  layout JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual widget configurations
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES custom_dashboards(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  position JSONB NOT NULL, -- {x, y, width, height}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved report configurations
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  config JSONB NOT NULL,
  schedule TEXT, -- cron expression
  recipients TEXT[], -- email addresses
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Types & Interfaces

#### [MODIFY] [types/index.ts](file:///c:/Users/david/PropertySwipe/src/types/index.ts)

```typescript
export interface CustomDashboard {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  layout: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  widgetType: WidgetType;
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; width: number; height: number };
}

export type WidgetType = 
  | 'stat_card'        // Single KPI
  | 'line_chart'       // Trend over time
  | 'bar_chart'        // Comparisons
  | 'pie_chart'        // Distribution
  | 'table'            // Data grid
  | 'property_list'    // Property summary
  | 'issue_tracker'    // Open issues
  | 'recent_activity'; // Activity feed

export interface WidgetConfig {
  dataSource: DataSource;
  metrics?: string[];
  filters?: Record<string, unknown>;
  dateRange?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  refreshInterval?: number; // seconds
}

export type DataSource = 
  | 'properties' | 'matches' | 'issues' | 'ratings' 
  | 'payments' | 'tenancies' | 'sla_performance';

export interface SavedReport {
  id: string;
  userId: string;
  name: string;
  reportType: ReportType;
  config: ReportConfig;
  schedule?: string;
  recipients?: string[];
  lastRunAt?: Date;
  nextRunAt?: Date;
  isActive: boolean;
}
```

---

### Dashboard Builder Service

#### [NEW] [services/DashboardBuilderService.ts](file:///c:/Users/david/PropertySwipe/src/services/DashboardBuilderService.ts)

Core service for custom dashboards:
- `createDashboard(userId, name)`: Create empty dashboard
- `saveDashboard(dashboard)`: Save dashboard config
- `getDashboards(userId)`: List user's dashboards
- `addWidget(dashboardId, widget)`: Add widget to dashboard
- `updateWidget(widgetId, config)`: Update widget config
- `removeWidget(widgetId)`: Delete widget
- `getWidgetData(widget)`: Fetch data for widget based on config

**Widget Data Aggregation:**
```typescript
async getWidgetData(widget: DashboardWidget): Promise<unknown> {
  switch(widget.config.dataSource) {
    case 'properties':
      return this.aggregatePropertyData(widget.config);
    case 'issues':
      return this.aggregateIssueData(widget.config);
    case 'sla_performance':
      return this.calculateSLAMetrics(widget.config);
    // etc.
  }
}
```

---

### Report Builder Service

#### [MODIFY] [services/ReportingService.ts](file:///c:/Users/david/PropertySwipe/src/services/ReportingService.ts)

Extend existing service with:
- `createCustomReport(userId, config)`: Save report configuration
- `getScheduledReports(userId)`: List scheduled reports
- `runReport(reportId)`: Execute report manually
- `scheduleReport(reportId, cron)`: Set up recurring execution
- `cancelSchedule(reportId)`: Cancel scheduled report

---

### UI Components

#### [NEW] [pages/DashboardBuilderPage.tsx](file:///c:/Users/david/PropertySwipe/src/pages/DashboardBuilderPage.tsx)
Drag-and-drop dashboard builder:
- Grid-based layout editor
- Widget palette (draggable widget types)
- Widget configuration modal
- Preview mode
- Save/Load dashboards

#### [NEW] [components/organisms/WidgetPalette.tsx](file:///c:/Users/david/PropertySwipe/src/components/organisms/WidgetPalette.tsx)
Sidebar showing available widget types with descriptions.

#### [NEW] [components/organisms/WidgetRenderer.tsx](file:///c:/Users/david/PropertySwipe/src/components/organisms/WidgetRenderer.tsx)
Renders widget based on type:
- StatCard, LineChart, BarChart, PieChart, Table, PropertyList, IssueTracker

#### [NEW] [components/organisms/WidgetConfigModal.tsx](file:///c:/Users/david/PropertySwipe/src/components/organisms/WidgetConfigModal.tsx)
Configuration form for widget settings:
- Data source selector
- Metric picker
- Filter builder
- Date range selector

#### [NEW] [pages/ReportBuilderPage.tsx](file:///c:/Users/david/PropertySwipe/src/pages/ReportBuilderPage.tsx)
Report configuration interface:
- Report type selector
- Date range picker
- Filter configuration
- Schedule setup (daily/weekly/monthly)
- Recipient email list
- Export format (PDF/Excel/CSV)

---

### Navigation Updates

#### [MODIFY] [App.tsx](file:///c:/Users/david/PropertySwipe/src/App.tsx)
Add routes:
- `/dashboard/builder` - Dashboard builder
- `/reports/builder` - Report builder
- `/reports/scheduled` - Scheduled reports list

#### [MODIFY] Sidebar components
Add navigation links for landlord and agency users:
- "Custom Dashboards" → Dashboard list/builder
- "Reports" → Report builder

---

## Available Widget Types

| Widget | Data Sources | Metrics |
|--------|--------------|---------|
| **Stat Card** | Any | Single KPI (count, sum, avg) |
| **Line Chart** | Properties, Issues, Matches | Trends over time |
| **Bar Chart** | Properties, SLA | Comparisons |
| **Pie Chart** | Issues (by status/priority), Properties (by type) | Distribution |
| **Data Table** | Any | Paginated records |
| **Property List** | Properties | Summary cards |
| **Issue Tracker** | Issues | Open issues with status |
| **Activity Feed** | All | Recent events timeline |

---

## User Review Required

> [!IMPORTANT]
> **Design Decisions:**
> 1. Should we use a drag-and-drop library (react-grid-layout) or simpler preset layouts?
> 2. What chart library preference? (Recharts, Chart.js, or Nivo)
> 3. Should scheduled reports send emails or just generate downloadable files?

> [!WARNING]
> **Performance Consideration:** Complex dashboards with many widgets may require data caching strategy. Recommend implementing a refresh policy per widget.

---

## Verification Plan

### Manual Verification

1. **Dashboard Creation Flow**
   - Log in as agency → Analytics → Custom Dashboards → Create New
   - Name it "My Portfolio Overview"
   - Add "Stat Card" widget → Configure for "Total Properties"
   - Add "Pie Chart" widget → Configure for "Issues by Priority"
   - Arrange widgets in grid
   - Save dashboard → Verify it appears in dashboard list

2. **Report Builder Test**
   - Go to Reports → Create Report
   - Select "SLA Performance Report"
   - Set date range to "Last Month"
   - Add email recipient
   - Schedule for weekly
   - Verify report config saved in database

3. **Widget Data Test**
   - Create dashboard with "Property List" widget
   - Verify it displays actual properties from database
   - Create "Issue Tracker" widget
   - Verify open issues appear with correct status

### Suggested User Testing
> [!TIP]
> What specific metrics are most important for your landlords and agencies to track? This will help prioritize which widgets to implement first.

---

## Additional Features (Added during review)

### Dashboard Templates
Pre-built dashboard configurations for quick setup:

| Template | Target User | Widgets Included |
|----------|-------------|------------------|
| **Landlord Portfolio** | Landlord | Property list, Total rent stat, Occupancy pie chart, Issue tracker |
| **Agency Overview** | Agency | KPI stats row, Performance line chart, SLA bar chart, Recent activity |
| **Financial Summary** | Both | Rent collected, Commission earned, Arrears tracker, Payment trends |
| **Maintenance Focus** | Agency | Issue tracker, SLA compliance, Response time trends, Priority breakdown |

### Dashboard Sharing & Permissions

```typescript
interface DashboardPermission {
  dashboardId: string;
  userId: string;
  permission: 'view' | 'edit' | 'admin';
  sharedAt: Date;
  sharedBy: string;
}
```

**Database addition to migration:**
```sql
CREATE TABLE dashboard_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES custom_dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(dashboard_id, user_id)
);
```

### Widget Data Export
Each widget should have an export button supporting:
- CSV download of underlying data
- PNG/SVG image export for charts
- Copy to clipboard as markdown table

### Comparison Widgets
Enable period-over-period comparison:
```typescript
interface ComparisonConfig {
  currentPeriod: 'week' | 'month' | 'quarter' | 'year';
  compareTo: 'previous' | 'same_last_year';
  metrics: string[];
}
```

### Goals & Targets
Allow users to set KPI targets:
```typescript
interface MetricGoal {
  id: string;
  userId: string;
  metric: string;
  targetValue: number;
  targetType: 'above' | 'below' | 'exact';
  deadline?: Date;
  createdAt: Date;
}
```

**Database:**
```sql
CREATE TABLE metric_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  target_value DECIMAL(15,2) NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('above', 'below', 'exact')),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Alert Thresholds
Notify users when metrics cross defined thresholds:
```typescript
interface MetricAlert {
  id: string;
  userId: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  notifyVia: ('email' | 'in_app')[];
  isActive: boolean;
}
```

### Mobile Responsive Layout
- Widgets stack vertically on mobile (single column)
- Collapsible widget headers
- Swipe navigation between dashboards
- Touch-friendly widget interactions

### Real-time Updates (Future)
> [!NOTE]
> Real-time widget updates via Supabase Realtime can be added as a v2 feature. Initial implementation will use polling with configurable refresh intervals.

---

## Integration with Existing ReportingService

The existing `ReportingService.ts` already defines:
- `ReportType` enum (portfolio_overview, property_performance, etc.)
- `ReportFormat` (pdf, xlsx, csv, json)
- `ReportSchedule` (daily, weekly, monthly, quarterly)
- Dashboard metrics interfaces

**Reuse these types** rather than duplicating:
- Import `ReportType`, `ReportConfig`, `ReportFormat` from ReportingService
- Extend `DashboardData` interface for custom widget data

---

## Updated Files Summary

**Create:**
- `src/services/DashboardBuilderService.ts`
- `src/pages/DashboardBuilderPage.tsx`
- `src/pages/ReportBuilderPage.tsx`
- `src/components/organisms/WidgetPalette.tsx`
- `src/components/organisms/WidgetRenderer.tsx`
- `src/components/organisms/WidgetConfigModal.tsx`
- `src/components/organisms/DashboardGrid.tsx`
- `supabase/migrations/20260124_custom_dashboards.sql`

**Modify:**
- `src/types/index.ts` - Add dashboard/widget types
- `src/services/ReportingService.ts` - Add custom report methods
- `src/App.tsx` - Add routes
- Navigation components - Add menu links
