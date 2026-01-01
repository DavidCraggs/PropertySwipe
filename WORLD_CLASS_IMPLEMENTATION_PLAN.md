# World-Class Property Matching Platform Implementation Plan

## Executive Summary

This document outlines a comprehensive, multi-stage implementation plan to transform PropertySwipe into a **world-leading UK property matching platform** for renters, landlords, estate agents, and management agencies. Each phase is designed to be implementable by Claude Haiku with clear, atomic tasks.

**Target:** UK national rollout, fully Renters' Rights Act 2025 compliant, GDPR compliant with Right to Be Forgotten, and enterprise-grade reporting capabilities.

---

## Current State Assessment

### Strengths (Already Implemented)
| Feature | Status | Notes |
|---------|--------|-------|
| Core Swipe Matching | 60% | One-way matching works, needs two-sided |
| RRA 2025 Compliance | 75% | Rent bidding ban, periodic tenancies, PRS tracking |
| Multi-Role System | 80% | Renter, Landlord, Agency, Admin roles |
| Messaging System | 85% | Dual conversations (landlord + agency) |
| Issue/Ticket System | 80% | SLA tracking, status workflow |
| Email Service | 70% | Multi-provider, templates built |
| Rating System | 85% | Bidirectional, category scores |

### Critical Gaps (Must Build)
| Gap | Priority | Impact |
|-----|----------|--------|
| GDPR Right to Erasure | CRITICAL | Legal compliance, data protection |
| ID Verification | CRITICAL | Right to Rent, fraud prevention |
| Two-Sided Matching | HIGH | Core product feature |
| Reporting & Analytics | HIGH | Estate agent value proposition |
| Payment System | HIGH | Monetization |
| Real-Time Features | MEDIUM | WebSocket chat, notifications |
| Data Export | MEDIUM | GDPR compliance, user value |

---

## Phase 1: GDPR Compliance & Data Protection (CRITICAL)

**Priority:** CRITICAL - Legal requirement before launch
**Estimated Haiku Tasks:** 15

### 1.1 Right to Be Forgotten Infrastructure

#### Task 1.1.1: Create Data Deletion Service
```typescript
// File: src/services/DataDeletionService.ts
// Purpose: Handle complete user data erasure across all tables

interface DeletionRequest {
  userId: string;
  userType: UserType;
  requestedAt: Date;
  reason?: string;
  verificationToken: string;
}

interface DeletionResult {
  success: boolean;
  tablesAffected: string[];
  recordsDeleted: number;
  backupsScheduledForDeletion: string[];
  estimatedCompletionDate: Date;
}
```

**Haiku Instructions:**
1. Create `src/services/DataDeletionService.ts`
2. Implement `requestDeletion()` - initiates deletion with email verification
3. Implement `executeDeletion()` - performs cascade deletion across all tables
4. Implement `verifyDeletionComplete()` - confirms all data removed
5. Add 30-day grace period before permanent deletion

#### Task 1.1.2: Create Anonymization Utilities
```typescript
// File: src/utils/dataAnonymization.ts
// Purpose: Anonymize data that cannot be deleted (e.g., aggregate analytics)

export function anonymizeUserInRatings(userId: string): void;
export function anonymizeUserInConversations(userId: string): void;
export function replaceWithPlaceholder(field: string): string;
```

**Haiku Instructions:**
1. Create anonymization functions for each data type
2. Replace identifying data with "[Deleted User]" or similar
3. Preserve aggregate data structure for analytics
4. Document which fields are anonymized vs deleted

#### Task 1.1.3: Database Cascade Deletion Rules
```sql
-- File: supabase/migrations/20251229_gdpr_cascade_deletion.sql

-- Add ON DELETE CASCADE to all user-linked tables
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_renter_id_fkey;
ALTER TABLE matches ADD CONSTRAINT matches_renter_id_fkey
  FOREIGN KEY (renter_id) REFERENCES renter_profiles(id) ON DELETE CASCADE;

-- Create deletion audit log
CREATE TABLE deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  tables_affected TEXT[],
  records_deleted INTEGER,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT
);
```

**Haiku Instructions:**
1. Create migration file with cascade rules
2. Add deletion audit log table
3. Create indexes for efficient deletion
4. Test cascade deletion doesn't break referential integrity

### 1.2 Data Export (GDPR Subject Access Request)

#### Task 1.2.1: Create Data Export Service
```typescript
// File: src/services/DataExportService.ts

interface ExportRequest {
  userId: string;
  userType: UserType;
  format: 'json' | 'csv' | 'pdf';
  includeConversations: boolean;
  includeRatings: boolean;
  includeActivityLog: boolean;
}

interface ExportResult {
  downloadUrl: string;
  expiresAt: Date;
  fileSizeBytes: number;
  dataCategories: string[];
}
```

**Haiku Instructions:**
1. Create export service that gathers all user data
2. Support JSON, CSV, and PDF formats
3. Generate secure download links (expire after 24 hours)
4. Include all data categories: profile, matches, messages, ratings, issues
5. Log all export requests for audit

#### Task 1.2.2: User Data Export UI
**Haiku Instructions:**
1. Add "Download My Data" button to ProfilePage
2. Create export options modal (format, categories)
3. Show progress indicator during export generation
4. Email user when export is ready
5. Display data retention information

### 1.3 Consent Management

#### Task 1.3.1: Create Consent Tracking System
```typescript
// File: src/lib/consentManagement.ts

interface ConsentRecord {
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt: Date;
  withdrawnAt?: Date;
  ipAddress: string;
  version: string; // Terms version consented to
}

type ConsentType =
  | 'essential_cookies'
  | 'analytics_cookies'
  | 'marketing_emails'
  | 'sms_notifications'
  | 'data_processing'
  | 'third_party_sharing';
```

**Haiku Instructions:**
1. Create consent tracking table in Supabase
2. Record consent with timestamp and IP
3. Allow granular consent withdrawal
4. Block features requiring withdrawn consent
5. Create consent preferences UI in settings

---

## Phase 2: ID Verification Without Long-Term Storage (CRITICAL)

**Priority:** CRITICAL - Right to Rent requirement
**Estimated Haiku Tasks:** 12

### 2.1 Third-Party Verification Integration

#### Task 2.1.1: Create Verification Service Interface
```typescript
// File: src/services/IdentityVerificationService.ts
// Purpose: Abstract interface for ID verification providers

interface VerificationProvider {
  name: 'onfido' | 'yoti' | 'jumio';
  verifyIdentity(userId: string): Promise<VerificationSession>;
  getVerificationStatus(sessionId: string): Promise<VerificationResult>;
  revokeAccess(sessionId: string): Promise<void>;
}

interface VerificationSession {
  sessionId: string;
  redirectUrl: string;
  expiresAt: Date;
}

interface VerificationResult {
  verified: boolean;
  verificationDate: Date;
  expiryDate: Date; // When re-verification is needed
  // NO raw document data stored
  documentType?: 'passport' | 'driving_license' | 'biometric_rp';
  checksPerformed: string[];
}
```

**Haiku Instructions:**
1. Create abstract verification service interface
2. Implement Onfido adapter (recommended for UK)
3. Store ONLY verification status and dates, NOT documents
4. Set verification expiry (1 year for Right to Rent)
5. Implement re-verification workflow

#### Task 2.1.2: Right to Rent Verification Flow
```typescript
// File: src/components/organisms/RightToRentVerification.tsx

interface RightToRentProps {
  renterId: string;
  onVerified: (result: VerificationResult) => void;
  onSkipped: () => void; // For UK/Irish citizens with passport
}
```

**Haiku Instructions:**
1. Create verification initiation UI
2. Redirect to third-party verification (Onfido/Yoti)
3. Handle callback with verification result
4. Store only pass/fail status + expiry date
5. Show verification badge on renter profile
6. Trigger re-verification 30 days before expiry

#### Task 2.1.3: Landlord PRS Registration Verification
```typescript
// Integration with HM Land Registry PRS Database API (when available)
// For now: Manual verification with document upload to temporary storage

interface PRSVerificationResult {
  isRegistered: boolean;
  registrationNumber: string;
  expiryDate: Date;
  verifiedAt: Date;
  // Document deleted after verification
}
```

**Haiku Instructions:**
1. Create PRS registration lookup (API when available)
2. For now: Accept registration number + supporting document
3. Auto-delete uploaded documents after verification
4. Store only registration number and verification status
5. Set expiry reminders for landlords

### 2.2 Document Handling (Zero Long-Term Storage)

#### Task 2.2.1: Temporary Document Storage
```typescript
// File: src/lib/temporaryDocumentStorage.ts

interface TemporaryDocument {
  id: string;
  uploadedAt: Date;
  expiresAt: Date; // Max 72 hours
  purpose: 'identity_verification' | 'income_verification' | 'reference_check';
  accessedBy: string[]; // Audit trail
}

export async function uploadTemporaryDocument(
  file: File,
  purpose: string,
  maxRetentionHours: number = 72
): Promise<TemporaryDocument>;

export async function deleteDocument(documentId: string): Promise<void>;

export async function purgeExpiredDocuments(): Promise<number>;
```

**Haiku Instructions:**
1. Create temporary storage with automatic expiry
2. Set maximum 72-hour retention for verification documents
3. Create scheduled cleanup job (runs hourly)
4. Log all document access for audit
5. Encrypt documents at rest
6. Documents auto-deleted after verification complete

---

## Phase 3: Two-Sided Matching System (HIGH)

**Priority:** HIGH - Core product differentiator
**Estimated Haiku Tasks:** 18

### 3.1 Landlord Renter Discovery

#### Task 3.1.1: Create Landlord Swipe Interface
```typescript
// File: src/pages/LandlordSwipePage.tsx
// Purpose: Allow landlords to view and like/pass on interested renters

interface RenterCard {
  renterId: string;
  situation: RenterSituation;
  employmentStatus: EmploymentStatus;
  monthlyIncome: number;
  hasPets: boolean;
  hasGuarantor: boolean;
  rating?: UserRatingsSummary;
  // Protected characteristics hidden (no benefit status, children)
}
```

**Haiku Instructions:**
1. Create new page `/landlord/discover`
2. Show renters who have liked landlord's properties
3. Display non-discriminatory profile information only
4. Add like/pass swipe gestures
5. Match created when landlord likes back (mutual match)
6. Update existing one-way matches to pending status

#### Task 3.1.2: Implement Mutual Match Logic
```typescript
// File: src/hooks/useAppStore.ts - Update checkForMatch

// CURRENT (one-way):
// checkForMatch: () => Math.random() < 0.3

// NEW (two-sided):
checkForMatch: async (propertyId: string, renterId: string) => {
  // Create "interest" record
  await createInterest({
    renterId,
    propertyId,
    landlordId: property.landlordId,
    interestedAt: new Date(),
    status: 'pending_landlord_review'
  });

  // Notify landlord of new interested renter
  await notifyLandlord(property.landlordId, renterId);

  // Return false - no match until landlord reciprocates
  return false;
};

// NEW: Landlord reciprocation
confirmMatch: async (interestId: string) => {
  const interest = await getInterest(interestId);

  // Create actual match
  const match = await createMatch({
    renterId: interest.renterId,
    landlordId: interest.landlordId,
    propertyId: interest.propertyId,
    timestamp: new Date(),
    applicationStatus: 'pending',
    tenancyStatus: 'prospective'
  });

  // Notify both parties
  await notifyRenter(interest.renterId, match);
  await notifyLandlord(interest.landlordId, match);

  return match;
};
```

**Haiku Instructions:**
1. Refactor `checkForMatch` to create interest records
2. Add `confirmMatch` for landlord acceptance
3. Add `declineInterest` for landlord rejection
4. Update MatchesPage to show pending vs confirmed matches
5. Send notifications for match events
6. Add "Pending Review" status badge

#### Task 3.1.3: Create Interest Table
```sql
-- File: supabase/migrations/20251229_two_sided_matching.sql

CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  renter_id TEXT NOT NULL REFERENCES renter_profiles(id),
  landlord_id TEXT NOT NULL REFERENCES landlord_profiles(id),
  property_id TEXT NOT NULL REFERENCES properties(id),
  interested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'landlord_liked', 'landlord_passed', 'expired')),
  landlord_reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  created_match_id UUID REFERENCES matches(id),
  UNIQUE(renter_id, property_id)
);

CREATE INDEX idx_interests_landlord_pending
  ON interests(landlord_id, status)
  WHERE status = 'pending';
```

**Haiku Instructions:**
1. Create interests table with proper indexes
2. Add expiry for stale interests (30 days)
3. Create cleanup job for expired interests
4. Add foreign key to matches when match created
5. Create RLS policies for access control

### 3.2 Smart Match Scoring

#### Task 3.2.1: Create Match Compatibility Score
```typescript
// File: src/utils/matchScoring.ts

interface CompatibilityScore {
  overall: number; // 0-100
  breakdown: {
    affordability: number; // Income vs rent
    location: number; // Distance/area match
    timing: number; // Move-in date alignment
    propertyFit: number; // Bedrooms, type, features
    petCompatibility: number;
    tenantHistory: number; // Previous ratings
  };
  flags: CompatibilityFlag[];
}

type CompatibilityFlag =
  | 'income_marginal' // 2.5-3x rent
  | 'move_date_mismatch'
  | 'pet_requires_approval'
  | 'first_time_renter'
  | 'excellent_references';

export function calculateCompatibility(
  renter: RenterProfile,
  property: Property,
  landlord: LandlordProfile
): CompatibilityScore;
```

**Haiku Instructions:**
1. Create scoring algorithm with weighted factors
2. Affordability: Income should be 2.5x+ rent (30 points)
3. Location: Preference match (20 points)
4. Timing: Move-in date alignment (15 points)
5. Property fit: Bedrooms, type (20 points)
6. Tenant history: Rating score (15 points)
7. Add flags for edge cases requiring attention

#### Task 3.2.2: Display Compatibility in UI
**Haiku Instructions:**
1. Show compatibility score on renter cards (landlord view)
2. Show compatibility score on property cards (renter view)
3. Add score breakdown tooltip
4. Highlight positive/negative flags
5. Sort by compatibility score option

---

## Phase 4: World-Class Reporting & Analytics (HIGH)

**Priority:** HIGH - Estate agent value proposition
**Estimated Haiku Tasks:** 25

### 4.1 Reporting Infrastructure

#### Task 4.1.1: Create Analytics Data Warehouse
```sql
-- File: supabase/migrations/20251229_analytics_warehouse.sql

-- Materialized views for fast reporting
CREATE MATERIALIZED VIEW mv_property_performance AS
SELECT
  p.id AS property_id,
  p.landlord_id,
  p.managing_agency_id,
  p.rent_pcm,
  p.address->>'city' AS city,
  COUNT(DISTINCT i.renter_id) AS total_interests,
  COUNT(DISTINCT m.id) AS total_matches,
  COUNT(DISTINCT CASE WHEN m.application_status = 'tenancy_signed' THEN m.id END) AS successful_tenancies,
  AVG(EXTRACT(EPOCH FROM (m.tenancy_start_date - m.created_at)) / 86400) AS avg_days_to_let,
  COUNT(DISTINCT iss.id) AS total_issues_raised,
  AVG(r.rating) AS average_rating
FROM properties p
LEFT JOIN interests i ON p.id = i.property_id
LEFT JOIN matches m ON p.id = m.property_id
LEFT JOIN issues iss ON p.id = iss.property_id
LEFT JOIN ratings r ON p.id = r.property_id
GROUP BY p.id, p.landlord_id, p.managing_agency_id, p.rent_pcm, p.address->>'city';

-- Refresh every hour
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_property_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agency_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_landlord_portfolio;
END;
$$ LANGUAGE plpgsql;
```

**Haiku Instructions:**
1. Create materialized views for common queries
2. Add concurrent refresh for zero-downtime updates
3. Schedule hourly refresh via Supabase cron
4. Create indexes on materialized views
5. Add view for agency performance, landlord portfolio

#### Task 4.1.2: Create Report Generation Service
```typescript
// File: src/services/ReportingService.ts

interface ReportConfig {
  type: ReportType;
  dateRange: { from: Date; to: Date };
  filters: {
    propertyIds?: string[];
    landlordIds?: string[];
    agencyId?: string;
    cities?: string[];
  };
  format: 'pdf' | 'xlsx' | 'csv' | 'json';
  schedule?: 'daily' | 'weekly' | 'monthly';
  recipients?: string[]; // Email addresses
}

type ReportType =
  | 'portfolio_overview'
  | 'property_performance'
  | 'tenant_activity'
  | 'issue_resolution'
  | 'sla_compliance'
  | 'financial_summary'
  | 'market_comparison'
  | 'compliance_audit';

export async function generateReport(config: ReportConfig): Promise<ReportResult>;
export async function scheduleReport(config: ReportConfig): Promise<ScheduledReport>;
export async function getReportHistory(userId: string): Promise<ReportResult[]>;
```

**Haiku Instructions:**
1. Create report generation engine
2. Support multiple output formats (PDF with charts, Excel, CSV)
3. Implement scheduled report delivery
4. Store report history for 90 days
5. Add report templates for common use cases

### 4.2 Dashboard Components

#### Task 4.2.1: Create Agency Analytics Dashboard
```typescript
// File: src/pages/AgencyAnalyticsDashboard.tsx

interface DashboardMetrics {
  // Portfolio Overview
  totalProperties: number;
  totalLandlords: number;
  activeTenancies: number;
  vacancyRate: number;

  // Performance
  averageDaysToLet: number;
  matchConversionRate: number;
  renewalRate: number;

  // SLA
  slaComplianceRate: number;
  averageResponseTime: number;
  overdueIssues: number;

  // Financial
  totalRentManaged: number;
  commissionEarned: number;
  arrearsValue: number;

  // Comparison
  vsLastMonth: { [key: string]: number }; // % change
  vsBenchmark: { [key: string]: number }; // vs industry average
}
```

**Haiku Instructions:**
1. Create beautiful dashboard with cards and charts
2. Use Recharts/Chart.js for visualizations
3. Add period selector (week/month/quarter/year)
4. Include trend indicators (up/down arrows)
5. Add export to PDF button
6. Show benchmark comparisons

#### Task 4.2.2: Create Interactive Charts
```typescript
// File: src/components/organisms/AnalyticsCharts.tsx

// Chart components:
// 1. PropertyPerformanceChart - Days to let, views, matches over time
// 2. SLAComplianceChart - Resolution times by category
// 3. PortfolioHeatMap - Geographic performance
// 4. TenantRetentionFunnel - Match → Viewing → Application → Tenancy
// 5. RevenueChart - Rent collected, commission earned
// 6. ComparisonRadar - Portfolio vs market benchmark
```

**Haiku Instructions:**
1. Create reusable chart components with Recharts
2. Add interactive tooltips with detailed data
3. Implement drill-down functionality (click chart → details)
4. Support dark mode theming
5. Add animation on data load
6. Export charts as PNG/SVG

### 4.3 Report Templates

#### Task 4.3.1: Portfolio Performance Report
```typescript
// Template: Monthly portfolio performance for landlords/agencies

interface PortfolioReport {
  summary: {
    totalProperties: number;
    occupancyRate: number;
    averageRent: number;
    totalRevenue: number;
  };

  propertyBreakdown: {
    propertyId: string;
    address: string;
    status: 'let' | 'vacant' | 'marketing';
    currentRent: number;
    daysVacant?: number;
    lastTenancyEnd?: Date;
    issuesOpen: number;
  }[];

  trends: {
    metric: string;
    current: number;
    previous: number;
    change: number;
  }[];

  recommendations: string[];
}
```

**Haiku Instructions:**
1. Create PDF template with branded header
2. Include summary statistics cards
3. Add property-by-property breakdown table
4. Include trend charts
5. Auto-generate recommendations based on data
6. Add appendix with detailed data

#### Task 4.3.2: SLA Compliance Report
```typescript
// Template: Issue resolution performance for agencies

interface SLAReport {
  period: { from: Date; to: Date };

  overall: {
    totalIssues: number;
    resolved: number;
    slaCompliance: number; // Percentage
    averageResolutionTime: number; // Hours
  };

  byPriority: {
    priority: IssuePriority;
    count: number;
    avgResolutionTime: number;
    slaTarget: number;
    achieved: number;
  }[];

  byCategory: {
    category: IssueCategory;
    count: number;
    avgResolutionTime: number;
  }[];

  breaches: {
    issueId: string;
    propertyAddress: string;
    priority: IssuePriority;
    targetHours: number;
    actualHours: number;
    reason?: string;
  }[];

  topPerformers: { agentId: string; name: string; resolved: number; avgTime: number }[];
  areasForImprovement: string[];
}
```

**Haiku Instructions:**
1. Create SLA report template
2. Include traffic light indicators (green/amber/red)
3. Show breaches with root cause
4. Highlight top performers
5. Generate improvement recommendations
6. Include trend vs previous periods

### 4.4 Data Export Excellence

#### Task 4.4.1: Bulk Data Export
```typescript
// File: src/services/BulkExportService.ts

interface BulkExportConfig {
  datasets: DatasetType[];
  format: 'xlsx' | 'csv' | 'json';
  dateRange?: { from: Date; to: Date };
  filters?: Record<string, string>;
}

type DatasetType =
  | 'properties'
  | 'tenancies'
  | 'financial'
  | 'issues'
  | 'ratings'
  | 'communications';

export async function exportDatasets(config: BulkExportConfig): Promise<string>; // Download URL
```

**Haiku Instructions:**
1. Create bulk export with multiple datasets in one file
2. Excel format: Each dataset as separate sheet
3. Include data dictionary sheet
4. Add filters for date range, properties, etc.
5. Compress large exports (zip)
6. Generate secure download links

---

## Phase 5: Payment & Subscription System (HIGH)

**Priority:** HIGH - Monetization
**Estimated Haiku Tasks:** 20

### 5.1 Stripe Integration

#### Task 5.1.1: Create Payment Service
```typescript
// File: src/services/PaymentService.ts

interface SubscriptionTier {
  id: 'basic' | 'professional' | 'enterprise';
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    properties: number;
    users: number;
    reports: number;
  };
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 29,
    annualPrice: 290,
    features: ['Up to 5 properties', 'Basic reporting', 'Email support'],
    limits: { properties: 5, users: 1, reports: 5 }
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 99,
    annualPrice: 990,
    features: ['Up to 50 properties', 'Advanced analytics', 'Priority support', 'API access'],
    limits: { properties: 50, users: 5, reports: 50 }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 299,
    annualPrice: 2990,
    features: ['Unlimited properties', 'Custom reporting', 'Dedicated support', 'White-label'],
    limits: { properties: Infinity, users: Infinity, reports: Infinity }
  }
];
```

**Haiku Instructions:**
1. Integrate Stripe SDK
2. Create subscription management UI
3. Implement checkout flow
4. Handle subscription lifecycle (create, update, cancel)
5. Add billing history page
6. Implement usage metering

#### Task 5.1.2: Commission Tracking
```typescript
// File: src/services/CommissionService.ts

interface Commission {
  id: string;
  agencyId: string;
  landlordId: string;
  propertyId: string;
  matchId: string;
  type: 'letting_fee' | 'management_fee' | 'renewal_fee';
  amount: number;
  percentage: number;
  basedOn: number; // Rent amount
  period?: { from: Date; to: Date };
  status: 'pending' | 'invoiced' | 'paid';
  invoiceId?: string;
}

export async function calculateMonthlyCommission(agencyId: string, month: Date): Promise<Commission[]>;
export async function generateInvoice(commissions: Commission[]): Promise<Invoice>;
```

**Haiku Instructions:**
1. Create commission calculation engine
2. Support multiple fee types (letting, management, renewal)
3. Auto-generate monthly invoices
4. Track payment status
5. Create invoice PDF templates
6. Add commission dashboard for agencies

---

## Phase 6: Real-Time Features (MEDIUM)

**Priority:** MEDIUM - Enhanced UX
**Estimated Haiku Tasks:** 15

### 6.1 WebSocket Integration

#### Task 6.1.1: Real-Time Chat
```typescript
// File: src/hooks/useRealtimeChat.ts

export function useRealtimeChat(conversationId: string) {
  // Subscribe to Supabase Realtime
  useEffect(() => {
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, handleNewMessage)
      .subscribe();

    return () => subscription.unsubscribe();
  }, [conversationId]);
}
```

**Haiku Instructions:**
1. Enable Supabase Realtime for messages table
2. Create useRealtimeChat hook
3. Add typing indicators
4. Implement read receipts
5. Add message delivery status
6. Handle reconnection gracefully

#### Task 6.1.2: Push Notifications
```typescript
// File: src/services/PushNotificationService.ts

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  action?: {
    type: 'open_match' | 'open_conversation' | 'open_issue';
    id: string;
  };
}

export async function registerForPush(userId: string): Promise<string>; // Returns token
export async function sendPush(userId: string, notification: PushNotification): Promise<void>;
```

**Haiku Instructions:**
1. Integrate Web Push API
2. Create notification permission request flow
3. Store push tokens in database
4. Implement notification preferences
5. Add notification center UI
6. Support Capacitor push for mobile

---

## Phase 7: Mobile Excellence (MEDIUM)

**Priority:** MEDIUM - Mobile-first market
**Estimated Haiku Tasks:** 12

### 7.1 Capacitor Polish

#### Task 7.1.1: Native Feature Integration
**Haiku Instructions:**
1. Add camera integration for property photos
2. Implement biometric authentication
3. Add location services for nearby properties
4. Integrate native share functionality
5. Add haptic feedback on swipes
6. Implement deep linking

#### Task 7.1.2: Offline Support
```typescript
// File: src/lib/offlineStorage.ts

export async function cacheForOffline(userId: string): Promise<void>;
export async function syncWhenOnline(): Promise<void>;
export function isOffline(): boolean;
```

**Haiku Instructions:**
1. Cache user profile and recent matches
2. Queue messages for sending when online
3. Show offline indicator
4. Sync on reconnection
5. Handle conflict resolution

---

## Phase 8: Advanced Compliance Features (LOW)

**Priority:** LOW - Future-proofing
**Estimated Haiku Tasks:** 10

### 8.1 Audit Trail System

#### Task 8.1.1: Comprehensive Audit Logging
```typescript
// File: src/lib/auditLog.ts

interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userType: UserType;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}

type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'verify'
  | 'approve'
  | 'reject';
```

**Haiku Instructions:**
1. Create audit log table
2. Add triggers for all sensitive operations
3. Log user actions across all tables
4. Create audit log viewer for admins
5. Add retention policy (7 years for financial)
6. Implement tamper-proof logging

### 8.2 Automated Compliance Checks

#### Task 8.2.1: Compliance Monitoring
```typescript
// File: src/services/ComplianceMonitorService.ts

interface ComplianceCheck {
  type: 'prs_registration' | 'ombudsman_membership' | 'right_to_rent' | 'gas_safety' | 'epc';
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  expiryDate?: Date;
  daysUntilExpiry?: number;
}

export async function runComplianceChecks(landlordId: string): Promise<ComplianceCheck[]>;
export async function sendExpiryWarnings(): Promise<void>; // Scheduled job
```

**Haiku Instructions:**
1. Create compliance check engine
2. Send automated expiry warnings (30, 14, 7 days)
3. Block property marketing if non-compliant
4. Create compliance dashboard
5. Generate compliance reports
6. Integrate with government APIs when available

---

## Implementation Timeline

### Month 1-2: Foundation (Phases 1-2)
- GDPR compliance infrastructure
- Right to erasure implementation
- ID verification integration
- Data export functionality

### Month 3-4: Core Features (Phases 3-4)
- Two-sided matching system
- Reporting infrastructure
- Analytics dashboard
- Report templates

### Month 5-6: Monetization (Phase 5)
- Stripe integration
- Subscription management
- Commission tracking
- Billing system

### Month 7-8: Enhancement (Phases 6-7)
- Real-time chat
- Push notifications
- Mobile polish
- Offline support

### Month 9-10: Polish (Phase 8)
- Audit trail system
- Compliance monitoring
- Performance optimization
- Security hardening

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| GDPR Compliance | 100% | Deletion requests processed within 30 days |
| ID Verification | 95% | Renters verified before matching |
| Match Conversion | 40% | Interests → Confirmed Matches |
| Agency Retention | 90% | Monthly churn < 10% |
| NPS Score | 50+ | Quarterly survey |
| Report Generation | < 30s | Time to generate PDF report |
| Uptime | 99.9% | Monthly availability |
| Mobile Rating | 4.5+ | App Store rating |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| GDPR Non-compliance | CRITICAL | Phase 1 prioritized, legal review |
| ID Provider Outage | HIGH | Multi-provider fallback |
| Payment Failures | HIGH | Retry logic, manual fallback |
| Scale Issues | MEDIUM | Load testing, database optimization |
| Mobile Rejection | MEDIUM | App Store guidelines compliance |

---

## Appendix: File Structure for New Features

```
src/
├── services/
│   ├── DataDeletionService.ts    # Phase 1
│   ├── DataExportService.ts      # Phase 1
│   ├── IdentityVerificationService.ts  # Phase 2
│   ├── ReportingService.ts       # Phase 4
│   ├── PaymentService.ts         # Phase 5
│   ├── CommissionService.ts      # Phase 5
│   ├── PushNotificationService.ts  # Phase 6
│   └── ComplianceMonitorService.ts  # Phase 8
├── components/
│   └── organisms/
│       ├── RightToRentVerification.tsx  # Phase 2
│       ├── LandlordRenterCards.tsx      # Phase 3
│       ├── AnalyticsCharts.tsx          # Phase 4
│       ├── SubscriptionManager.tsx      # Phase 5
│       └── NotificationCenter.tsx       # Phase 6
├── pages/
│   ├── LandlordDiscoverPage.tsx   # Phase 3
│   ├── AnalyticsDashboard.tsx     # Phase 4
│   ├── BillingPage.tsx            # Phase 5
│   └── AuditLogPage.tsx           # Phase 8
├── lib/
│   ├── consentManagement.ts       # Phase 1
│   ├── temporaryDocumentStorage.ts  # Phase 2
│   ├── offlineStorage.ts          # Phase 7
│   └── auditLog.ts                # Phase 8
└── utils/
    ├── dataAnonymization.ts       # Phase 1
    └── matchScoring.ts            # Phase 3
```

---

**Document Version:** 1.0
**Created:** December 2024
**Last Updated:** December 2024
**Author:** PropertySwipe Technical Team
