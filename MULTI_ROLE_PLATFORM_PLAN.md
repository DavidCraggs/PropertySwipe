# Comprehensive Plan: Multi-Role Rental Platform Flows

## 🎯 Executive Summary

This plan transforms PropertySwipe from a simple swipe-matching platform into a **full-lifecycle rental management system** supporting 4 distinct user roles:
1. **Prospective Renters** - Property discovery & matching
2. **Current Renters** - Ongoing tenancy management & support
3. **Landlords** - Property & tenant management
4. **Estate Agents/Management Agencies** - Portfolio oversight & SLA tracking

---

## 📋 Current State Analysis

### Existing Infrastructure (Strengths)
✅ **User Authentication System** - `useAuthStore` with `userType: 'renter' | 'landlord'`
✅ **Match System** - Property-to-renter matching with messages
✅ **Message Infrastructure** - `Match.messages[]` with sendMessage function
✅ **Property CRUD** - Full property management for landlords
✅ **RRA 2025 Compliance** - Dispute resolution, hazard reporting, eviction notices
✅ **Rating System** - Post-tenancy ratings (landlord ↔ renter)

### Gaps to Address
❌ **No Current Renter State** - No distinction between prospective vs active tenants
❌ **No Agency/Agent Role** - Only 2 user types (landlord, renter)
❌ **No Email Integration** - Messages are in-app only
❌ **No SLA System** - No response time tracking
❌ **No Agency Dashboard** - No portfolio management UI
❌ **No Tenancy Lifecycle** - Match ends at "tenancy_signed", no ongoing management

---

## 🏗️ Architecture Overview

### Phase 1: Data Model Extensions (Foundation)
### Phase 2: Authentication & Role Management
### Phase 3: Current Renter Experience
### Phase 4: Landlord Message Center
### Phase 5: Agency/Agent Infrastructure
### Phase 6: Agency Dashboard & Analytics
### Phase 7: SLA System & Tracking
### Phase 8: Email Integration

---

## 📐 PHASE 1: Data Model Extensions

### 1.1 New User Types
```typescript
// src/types/index.ts

// EXTEND existing UserType
export type UserType = 'landlord' | 'renter' | 'estate_agent' | 'management_agency';

// NEW: Renter status to distinguish prospective vs current
export type RenterStatus = 'prospective' | 'current' | 'former';

// NEW: Agency type enum
export type AgencyType = 'estate_agent' | 'management_agency';
```

### 1.2 Enhanced RenterProfile
```typescript
export interface RenterProfile {
  // ... existing fields

  // NEW: Current tenancy status
  status: RenterStatus;
  currentTenancyId?: string; // Reference to active Match
  currentPropertyId?: string;
  currentLandlordId?: string;
  currentAgencyId?: string; // NEW: Link to managing agency
  moveInDate?: Date;

  // Existing fields remain unchanged
  ratingsSummary?: UserRatingsSummary;
}
```

### 1.3 Enhanced LandlordProfile
```typescript
export interface LandlordProfile {
  // ... existing fields

  // NEW: Agency relationship
  managementAgencyId?: string; // Link to agency managing properties
  estateAgentId?: string; // Link to agent marketing properties
  agentCommissionRate?: number; // e.g., 10% monthly rent

  // NEW: Contact preferences
  preferredContactMethod: 'in_app' | 'email' | 'both';
  notificationEmail?: string;

  // Existing fields remain unchanged
  ratingsSummary?: UserRatingsSummary;
}
```

### 1.4 NEW: AgencyProfile Interface
```typescript
export interface AgencyProfile {
  id: string;
  agencyType: AgencyType; // 'estate_agent' | 'management_agency'

  // Basic Info
  companyName: string;
  registrationNumber: string; // Companies House number
  tradingName?: string;

  // Contact
  primaryContactName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postcode: string;
  };

  // Service Areas
  serviceAreas: LocalArea[]; // ['Southport', 'Liverpool', 'Manchester']

  // Portfolio
  managedPropertyIds: string[]; // Properties under management
  landlordClientIds: string[]; // Landlords they represent
  activeTenantsCount: number;
  totalPropertiesManaged: number;

  // SLA Configuration (NEW)
  slaConfiguration: {
    emergencyResponseHours: number; // e.g., 4 hours
    urgentResponseHours: number; // e.g., 24 hours
    routineResponseHours: number; // e.g., 72 hours
    maintenanceResponseDays: number; // e.g., 14 days
  };

  // Performance Tracking (NEW)
  performanceMetrics: {
    averageResponseTimeHours: number;
    slaComplianceRate: number; // 0-100%
    totalIssuesResolved: number;
    totalIssuesRaised: number;
    currentOpenIssues: number;
  };

  // Compliance
  propertyOmbudsmanMember: boolean;
  insuranceDetails?: {
    provider: string;
    policyNumber: string;
    expiryDate: Date;
  };

  // Branding
  logo?: string;
  brandColor?: string;

  createdAt: Date;
  isActive: boolean;
}
```

### 1.5 NEW: Issue/Ticket System
```typescript
export type IssueCategory =
  | 'maintenance'
  | 'repair'
  | 'complaint'
  | 'query'
  | 'hazard'
  | 'dispute';

export type IssuePriority = 'emergency' | 'urgent' | 'routine' | 'low';

export type IssueStatus =
  | 'open'
  | 'acknowledged'
  | 'in_progress'
  | 'awaiting_parts'
  | 'awaiting_access'
  | 'resolved'
  | 'closed';

export interface Issue {
  id: string;

  // Relationships
  propertyId: string;
  renterId: string;
  landlordId: string;
  agencyId?: string; // Who's managing this issue
  assignedToAgentId?: string; // Specific agent handling it

  // Issue Details
  category: IssueCategory;
  priority: IssuePriority;
  subject: string;
  description: string;
  images: string[];

  // Timeline
  raisedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  // SLA Tracking (NEW)
  slaDeadline: Date; // Calculated from priority + agency SLA
  isOverdue: boolean;
  responseTimeHours?: number; // Actual time to first response
  resolutionTimeDays?: number; // Actual time to resolution

  // Status
  status: IssueStatus;
  statusHistory: {
    status: IssueStatus;
    timestamp: Date;
    updatedBy: string;
    notes?: string;
  }[];

  // Communication Thread
  messages: IssueMessage[];
  internalNotes?: string[]; // Agency-only notes

  // Resolution
  resolutionSummary?: string;
  resolutionCost?: number;
  renterSatisfactionRating?: number; // 1-5

  createdAt: Date;
  updatedAt: Date;
}

export interface IssueMessage {
  id: string;
  senderId: string;
  senderType: UserType;
  senderName: string;
  content: string;
  timestamp: Date;
  isInternal: boolean; // Agency-only communication
  attachments?: string[];
}
```

### 1.6 Enhanced Match Interface
```typescript
export interface Match {
  // ... existing fields

  // NEW: Tenancy lifecycle states
  tenancyStatus: 'prospective' | 'active' | 'notice_given' | 'ended';

  // NEW: Agency involvement
  managingAgencyId?: string;
  marketingAgentId?: string;

  // NEW: Active tenancy data
  monthlyRentAmount?: number; // Confirmed rent (may differ from property.rentPcm)
  depositAmount?: number;
  depositSchemeReference?: string;

  // NEW: Issue tracking for current tenancies
  activeIssueIds: string[]; // Links to Issue[]
  totalIssuesRaised: number;
  totalIssuesResolved: number;

  // Existing fields remain unchanged
  rentArrears: { /* ... */ };
}
```

### 1.7 Email Notification Types
```typescript
export type EmailNotificationType =
  | 'new_message_renter'
  | 'new_message_landlord'
  | 'new_message_agency'
  | 'new_issue_raised'
  | 'issue_acknowledged'
  | 'issue_status_update'
  | 'issue_resolved'
  | 'sla_approaching'
  | 'sla_breached';

export interface EmailNotification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  type: EmailNotificationType;
  subject: string;
  bodyHtml: string;
  bodyText: string;

  // Context data
  issueId?: string;
  matchId?: string;
  propertyId?: string;

  // Delivery tracking
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  failureReason?: string;

  createdAt: Date;
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Data Model Extensions
- [ ] Add new UserType values to types
- [ ] Create RenterStatus type
- [ ] Create AgencyType type
- [ ] Extend RenterProfile interface
- [ ] Extend LandlordProfile interface
- [ ] Create AgencyProfile interface
- [ ] Create Issue interface
- [ ] Create IssueMessage interface
- [ ] Extend Match interface
- [ ] Create EmailNotification interface

### Phase 2: Authentication & Role Management
- [ ] Extend AuthStore with new user types
- [ ] Add role detection helper functions
- [ ] Add agency-specific getters
- [ ] Test role switching logic

### Phase 3: Current Renter Experience
- [ ] Create CurrentRenterDashboard page
- [ ] Build CurrentPropertyCard component
- [ ] Build AgencyContactCard with SLA display
- [ ] Build LandlordContactCard component
- [ ] Build RenterIssueReporter component
- [ ] Create IssueSection component
- [ ] Add tenancy activation logic
- [ ] Test prospective → current transition

### Phase 4: Landlord Message Center
- [ ] Update LandlordDashboard with active tenancies
- [ ] Create ActiveTenancyCard component
- [ ] Create LandlordMessageThread component
- [ ] Add message email integration
- [ ] Test landlord-renter messaging

### Phase 5: Agency/Agent Infrastructure
- [ ] Create AgencyOnboarding flow
- [ ] Build SLAConfigurationForm component
- [ ] Build ServiceAreasSelector component
- [ ] Build AgencyPropertyLinker component
- [ ] Create agency profile storage functions
- [ ] Test agency onboarding flow

### Phase 6: Agency Dashboard & Analytics
- [ ] Create AgencyDashboard page
- [ ] Build AgencyStatsCards component
- [ ] Build SLAPerformanceChart (install chart.js)
- [ ] Build AgencyPropertiesTable component
- [ ] Build AgencyTenanciesTable component
- [ ] Build AgencyIssuesDashboard component
- [ ] Create AgencyIssueRow component
- [ ] Test dashboard data loading

### Phase 7: SLA System & Tracking
- [ ] Create slaCalculations utility file
- [ ] Implement calculateSLADeadline function
- [ ] Implement checkIsOverdue function
- [ ] Implement calculateResponseTime function
- [ ] Implement calculateSLAComplianceRate function
- [ ] Implement getSLADisplayText function
- [ ] Create SLAMonitoringService
- [ ] Test SLA calculations

### Phase 8: Email Integration
- [ ] Create EmailService class
- [ ] Set up SendGrid/AWS SES/Resend API
- [ ] Implement sendNewMessageNotification
- [ ] Implement sendNewIssueNotification
- [ ] Create HTML email templates
- [ ] Integrate email with sendMessage
- [ ] Integrate email with createIssue
- [ ] Test email delivery

---

## 🎨 UI/UX Considerations

### Color Coding System
- **Emergency Issues**: Red (#EF4444)
- **Urgent Issues**: Amber (#F59E0B)
- **Routine Issues**: Green (#10B981)
- **SLA Compliant (80%+)**: Success Green
- **SLA Warning (60-80%)**: Warning Yellow
- **SLA Poor (<60%)**: Danger Red

---

**Total Estimated Development Time**: 6-8 weeks with senior development team
