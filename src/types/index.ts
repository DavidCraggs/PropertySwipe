/**
 * Core type definitions for GetOn - UK Rental Property Platform
 * Compliant with Renters' Rights Act 2025
 */

// =====================================================
// BASIC TYPES
// =====================================================

export type PropertyType = 'Detached' | 'Semi-detached' | 'Terraced' | 'End-Terraced' | 'Bungalow' | 'Flat';
export type EPCRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type UserType = 'landlord' | 'renter' | 'estate_agent' | 'management_agency' | 'admin';
export type LocalArea = 'Southport' | 'Liverpool' | 'Manchester' | 'Preston' | 'Blackpool' | 'Chester' | 'Warrington' | 'Wigan' | 'St Helens' | 'Formby';

// Admin system types
export type AdminPermission = 'role_switching' | 'view_all_users' | 'modify_users' | 'system_settings';

// NEW: Renter lifecycle status
export type RenterStatus = 'prospective' | 'current' | 'former';

// NEW: Agency type distinction
export type AgencyType = 'estate_agent' | 'management_agency';

// =====================================================
// RENTAL-SPECIFIC TYPES
// =====================================================

export type RenterSituation = 'Single' | 'Couple' | 'Family' | 'Professional Sharers';

export type RenterType =
  | 'Student'
  | 'Young Professional'
  | 'Family'
  | 'Couple'
  | 'Professional Sharers'
  | 'Retired';

export type EmploymentStatus =
  | 'Employed Full-Time'
  | 'Employed Part-Time'
  | 'Self-Employed'
  | 'Student'
  | 'Retired'
  | 'Unemployed'
  | 'Contract Worker';

export type FurnishingType = 'Furnished' | 'Part Furnished' | 'Unfurnished';

export type TenancyType = 'Periodic'; // RRA 2025: Only periodic tenancies allowed (no fixed terms)

export type PetsPreference = 'No Pets' | 'Cat Friendly' | 'Dog Friendly' | 'Pets Considered';

// =====================================================
// RENTERS' RIGHTS ACT 2025 TYPES
// =====================================================

export type PRSRegistrationStatus = 'not_registered' | 'pending' | 'active' | 'expired' | 'suspended';

export type OmbudsmanScheme =
  | 'not_registered'
  | 'property_redress_scheme'
  | 'property_ombudsman'
  | 'tpo';

export type EvictionGround =
  | 'ground_8' // 8+ weeks rent arrears (mandatory)
  | 'ground_7a' // Persistent rent arrears (mandatory)
  | 'ground_1' // Landlord moving in (discretionary)
  | 'ground_1a' // Selling to buyer needing vacant possession (discretionary)
  | 'ground_6' // Substantial redevelopment (discretionary)
  | 'ground_14' // Anti-social behavior (discretionary)
  | 'ground_14a' // Serious criminal activity (discretionary)
  | 'ground_14za' // Domestic abuse (discretionary)
  | 'ground_17'; // False statement to obtain tenancy (discretionary)

export type HazardType =
  | 'damp_mould'
  | 'gas_safety'
  | 'fire_safety'
  | 'electrical'
  | 'structural'
  | 'pest_infestation'
  | 'other';

export type HazardSeverity = 'immediate' | 'serious' | 'moderate';

export type DisputeCategory =
  | 'repairs'
  | 'deposit'
  | 'rent_increase'
  | 'harassment'
  | 'illegal_eviction'
  | 'discrimination'
  | 'other';

export type DisputeStatus =
  | 'open'
  | 'investigating'
  | 'mediation'
  | 'resolved'
  | 'escalated_to_ombudsman';

// NEW: Issue/Ticket System Types
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

// NEW: Email notification types
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

export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'failed';

// NEW: Tenancy lifecycle status
export type TenancyStatus = 'prospective' | 'active' | 'notice_given' | 'ended';

// =====================================================
// RATING SYSTEM TYPES
// =====================================================

export type RatingCategory =
  | 'communication'
  | 'cleanliness'
  | 'reliability'
  | 'property_condition' // landlord ratings only
  | 'respect_for_property'; // renter ratings only

export interface Rating {
  id: string;
  matchId: string;
  fromUserId: string;
  fromUserType: UserType;
  toUserId: string;
  toUserType: UserType;
  propertyId: string;
  overallScore: number; // 1-5
  categoryScores: {
    communication: number;
    cleanliness: number;
    reliability: number;
    property_condition?: number;
    respect_for_property?: number;
  };
  review: string; // Min 50, max 1000 characters
  wouldRecommend: boolean;
  tenancyStartDate: Date;
  tenancyEndDate: Date;
  isVerified: boolean;
  createdAt: Date;
  reportedAt?: Date;
  isHidden: boolean;
}

export interface UserRatingsSummary {
  userId: string;
  userType: UserType;
  averageOverallScore: number;
  totalRatings: number;
  averageCategoryScores: {
    communication: number;
    cleanliness: number;
    reliability: number;
    property_condition?: number;
    respect_for_property?: number;
  };
  wouldRecommendPercentage: number;
  verifiedTenancies: number;
}

// =====================================================
// PROPERTY INTERFACE (RENTAL)
// =====================================================

export interface Property {
  id: string;
  address: {
    street: string;
    city: string;
    postcode: string;
    council: string;
  };

  // Rental pricing (NOT purchase price)
  rentPcm: number; // Monthly rent in GBP
  deposit: number; // Typically 5 weeks rent (max by law)
  maxRentInAdvance: 1; // RRA 2025: Max 1 month rent in advance (literal type enforces this)

  // Property details
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  images: string[];
  description: string;
  epcRating: EPCRating;
  yearBuilt: number;
  features: string[];

  // Rental-specific
  furnishing: FurnishingType;
  availableFrom: string; // ISO date string
  tenancyType: TenancyType; // Always 'Periodic' per RRA 2025
  maxOccupants: number;

  // Pets policy (RRA 2025: cannot blanket refuse)
  petsPolicy: {
    willConsiderPets: true; // Required by law
    preferredPetTypes: ('cat' | 'dog' | 'small_caged' | 'fish')[];
    requiresPetInsurance: boolean;
    petDeposit?: number;
    additionalPetRent?: number;
    maxPetsAllowed: number;
    propertyUnsuitableFor?: ('large_dogs' | 'multiple_dogs')[];
  };

  // Bills
  bills: {
    councilTaxBand: string;
    gasElectricIncluded: boolean;
    waterIncluded: boolean;
    internetIncluded: boolean;
  };

  // Compliance (RRA 2025)
  meetsDecentHomesStandard: boolean;
  awaabsLawCompliant: boolean;
  lastSafetyInspectionDate?: Date;

  // PRS Database (RRA 2025)
  prsPropertyRegistrationNumber?: string;
  prsPropertyRegistrationStatus: PRSRegistrationStatus;

  // Landlord
  landlordId: string;

  // Agency relationships (optional)
  managingAgencyId?: string;
  marketingAgentId?: string;

  // Availability
  isAvailable: boolean;
  canBeMarketed: boolean; // Calculated: requires PRS registration + compliance
  listingDate: string;

  // Preferences (non-enforceable)
  preferredMinimumStay?: number; // Landlord preference in months (not legally binding)
  acceptsShortTermTenants: boolean;
}

// =====================================================
// RENTER PROFILE
// =====================================================

export interface RenterProfile {
  id: string;
  email: string;
  passwordHash: string;  // Hashed password for secure authentication
  situation: RenterSituation;
  names: string;
  ages: string;
  localArea: LocalArea;
  renterType: RenterType;
  employmentStatus: EmploymentStatus;
  monthlyIncome: number; // For affordability checks (not discrimination)

  // Additional rental info
  hasPets: boolean;
  petDetails?: {
    type: 'cat' | 'dog' | 'small_caged' | 'fish' | 'other';
    breed?: string;
    count: number;
    hasInsurance: boolean;
    description: string;
  }[];
  smokingStatus: 'Non-Smoker' | 'Smoker' | 'Vaper';
  hasGuarantor: boolean;
  preferredMoveInDate?: Date;
  currentRentalSituation: 'Living with Parents' | 'Currently Renting' | 'Homeowner' | 'Student Accommodation';

  // Rental history
  hasRentalHistory: boolean;
  previousLandlordReference: boolean;

  // Protected characteristics (tracked but CANNOT be used for discrimination per RRA 2025)
  receivesHousingBenefit: boolean;
  receivesUniversalCredit: boolean;
  numberOfChildren?: number;

  createdAt: Date;
  onboardingComplete: boolean;

  // NEW: Current tenancy tracking
  status: RenterStatus; // 'prospective' | 'current' | 'former'
  currentTenancyId?: string; // Reference to active Match
  currentPropertyId?: string;
  currentLandlordId?: string;
  currentAgencyId?: string; // Managing agency for current tenancy
  moveInDate?: Date;

  // Rating summary
  ratingsSummary?: UserRatingsSummary;
}

// =====================================================
// LANDLORD PROFILE
// =====================================================

export interface LandlordProfile {
  id: string;
  email: string;
  passwordHash: string;  // Hashed password for secure authentication
  names: string;
  propertyType: PropertyType;

  // Preferences (not filters - cannot discriminate)
  furnishingPreference: FurnishingType;
  preferredTenantTypes: RenterType[]; // Preferences only

  // Pets policy
  defaultPetsPolicy: {
    willConsiderPets: true;
    requiresPetInsurance: boolean;
    preferredPetTypes: ('cat' | 'dog' | 'small_caged' | 'fish')[];
    maxPetsAllowed: number;
  };

  // RRA 2025: PRS Database Registration (MANDATORY)
  prsRegistrationNumber?: string;
  prsRegistrationStatus: PRSRegistrationStatus;
  prsRegistrationDate?: Date;
  prsRegistrationExpiryDate?: Date;

  // RRA 2025: Ombudsman Membership (MANDATORY)
  ombudsmanScheme: OmbudsmanScheme;
  ombudsmanMembershipNumber?: string;

  // Compliance check
  isFullyCompliant: boolean; // Both PRS + ombudsman registered

  // Deposit scheme
  depositScheme: string; // DPS, MyDeposits, TDS
  isRegisteredLandlord: boolean;

  estateAgentLink: string;
  propertyId?: string;
  createdAt: Date;
  onboardingComplete: boolean;

  // NEW: Agency relationships
  managementAgencyId?: string; // Link to managing agency
  estateAgentId?: string; // Link to marketing agent
  agentCommissionRate?: number; // e.g., 10.00 = 10%

  // NEW: Contact preferences
  preferredContactMethod?: 'in_app' | 'email' | 'both';
  notificationEmail?: string;

  // Rating summary
  ratingsSummary?: UserRatingsSummary;
}

// =====================================================
// AGENCY PROFILE (Estate Agents & Management Agencies)
// =====================================================

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
  passwordHash: string;  // Hashed password for secure authentication
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

  // SLA Configuration
  slaConfiguration: {
    emergencyResponseHours: number; // e.g., 4 hours for gas leaks
    urgentResponseHours: number; // e.g., 24 hours for broken appliances
    routineResponseHours: number; // e.g., 72 hours for general maintenance
    maintenanceResponseDays: number; // e.g., 14 days for repairs requiring contractors
  };

  // Performance Tracking
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
  brandColor?: string; // Hex color code

  createdAt: Date;
  isActive: boolean;
  onboardingComplete: boolean; // Onboarding completion status
}

// =====================================================
// ADMIN PROFILE (Role Switching & Testing)
// =====================================================

export interface AdminProfile {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin';
  permissions: AdminPermission[];
  createdAt: string;
  lastLogin?: string;
}

export interface AdminSession {
  adminId: string;
  adminProfile: AdminProfile;
  impersonatedRole: UserType | null;
  impersonatedProfile: LandlordProfile | RenterProfile | AgencyProfile | null;
  sessionStarted: string;
}

// =====================================================
// USER PREFERENCES (FILTERING)
// =====================================================

export interface UserPreferences {
  locations: string[];
  rentRange: {
    min: number; // Monthly rent min (e.g., 500)
    max: number; // Monthly rent max (e.g., 2000)
  };
  bedrooms: {
    min: number;
    max: number;
  };
  propertyTypes: PropertyType[];
  furnishing: FurnishingType[];
  petsRequired: boolean;
  mustHaveGarden: boolean;
  mustHaveParking: boolean;
  minMoveInDate?: Date;
  maxCommuteTo?: string; // Location for commute calculations
}

// =====================================================
// MATCH INTERFACE (RENTAL)
// =====================================================

export interface Match {
  id: string;
  propertyId: string;
  property: Property;
  landlordId: string;
  landlordName: string;
  renterId: string;
  renterName: string;
  renterProfile?: RenterProfile;
  timestamp: string;
  messages: Message[];
  lastMessageAt?: string;
  unreadCount: number;

  // Viewing
  viewingPreference?: ViewingPreference;
  hasViewingScheduled: boolean;
  confirmedViewingDate?: Date;

  // Application status (rental-specific)
  applicationStatus:
  | 'pending'
  | 'viewing_requested'
  | 'viewing_completed'
  | 'application_submitted'
  | 'referencing'
  | 'offer_made'
  | 'offer_accepted'
  | 'tenancy_signed'
  | 'declined'
  | 'withdrawn';
  applicationSubmittedAt?: Date;

  // Tenancy (RRA 2025: periodic only, no end date)
  tenancyStartDate?: Date;
  tenancyNoticedDate?: Date; // When tenant/landlord gave 2 months notice
  expectedMoveOutDate?: Date; // Calculated: noticedDate + 56 days
  tenancyCompletedAt?: Date;
  tenancyEndReason?: 'tenant_notice' | EvictionGround;

  // Ratings
  canRate: boolean; // True if tenancy completed or declined after viewing
  hasRenterRated: boolean;
  hasLandlordRated: boolean;
  renterRatingId?: string;
  landlordRatingId?: string;

  // Eviction tracking
  evictionNotice?: EvictionNotice;
  isUnderEvictionProceedings: boolean;

  // Rent tracking (for Ground 8 evictions)
  rentArrears: {
    totalOwed: number;
    monthsMissed: number;
    consecutiveMonthsMissed: number;
    lastPaymentDate?: Date;
  };

  // NEW: Tenancy lifecycle management
  tenancyStatus: TenancyStatus; // 'prospective' | 'active' | 'notice_given' | 'ended'

  // NEW: Agency involvement
  managingAgencyId?: string; // Management agency handling issues
  marketingAgentId?: string; // Estate agent who marketed property

  // NEW: Active tenancy financial data
  monthlyRentAmount?: number; // Confirmed rent (may differ from property.rentPcm due to negotiation)
  depositAmount?: number;
  depositSchemeReference?: string;

  // RRA 2025: Compliance Tracking
  rightToRentVerifiedAt?: Date; // Mandatory check
  petRequestStatus?: 'none' | 'requested' | 'approved' | 'refused';
  petRefusalReason?: string; // Required if refused

  // NEW: Issue tracking for current tenancies
  activeIssueIds: string[]; // Links to Issue[]
  totalIssuesRaised: number;
  totalIssuesResolved: number;
}

// =====================================================
// MESSAGE INTERFACE
// =====================================================

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  senderType: UserType;
  content: string;
  timestamp: string;
  isRead: boolean;
}

// =====================================================
// VIEWING PREFERENCE
// =====================================================

export interface ViewingTimeSlot {
  dayType: 'Weekday' | 'Weekend' | 'Any Day';
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Flexible';
  specificDays?: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
}

export interface ViewingPreference {
  id: string;
  matchId: string;
  renterId: string;
  landlordId: string;
  propertyId: string;
  preferredTimes?: ViewingTimeSlot[];
  specificDateTime?: Date;
  flexibility: 'Flexible' | 'Specific' | 'ASAP';
  additionalNotes?: string;
  landlordResponse?: string;
  requiresVirtualViewing?: boolean;
  status: 'pending' | 'confirmed' | 'declined' | 'rescheduled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// =====================================================
// RRA 2025: EVICTION NOTICE
// =====================================================

export interface EvictionNotice {
  id: string;
  matchId: string;
  landlordId: string;
  renterId: string;
  propertyId: string;
  ground: EvictionGround;
  noticeServedDate: Date;
  earliestPossessionDate: Date; // Calculated based on ground (28 or 56 days)
  reason: string; // Detailed explanation (min 100 chars)
  evidence: string[]; // Supporting documents
  status: 'served' | 'challenged' | 'court_hearing_scheduled' | 'possession_granted' | 'possession_denied';
  courtHearingDate?: Date;
  outcomeDate?: Date;
  createdAt: Date;
}

// =====================================================
// RRA 2025: HAZARD REPORT (Awaab's Law)
// =====================================================

export interface HazardReport {
  id: string;
  matchId: string;
  propertyId: string;
  reportedBy: 'renter' | 'inspection';
  hazardType: HazardType;
  severity: HazardSeverity;
  description: string;
  photos: string[];
  reportedAt: Date;
  landlordNotifiedAt?: Date;
  deadline: Date; // 14 days for most, immediate for serious
  fixedAt?: Date;
  isOverdue: boolean;
  localAuthorityNotifiedAt?: Date;
  penaltyIssued?: {
    amount: number;
    reason: string;
  };
}

// =====================================================
// RRA 2025: DISPUTE RESOLUTION
// =====================================================

export interface Dispute {
  id: string;
  matchId: string;
  landlordId: string;
  renterId: string;
  propertyId: string;
  raisedBy: 'renter' | 'landlord';
  category: DisputeCategory;
  description: string;
  evidence: string[];
  desiredOutcome: string;
  status: DisputeStatus;
  resolution?: string;
  compensationAwarded?: number;
  createdAt: Date;
  resolvedAt?: Date;
}

// =====================================================
// RRA 2025: ISSUE/TICKET SYSTEM (Agency Management)
// =====================================================

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

  // SLA Tracking
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

// =====================================================
// EMAIL NOTIFICATIONS
// =====================================================

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
  status: EmailStatus;
  failureReason?: string;

  createdAt: Date;
}

// =====================================================
// AUTHENTICATION STATE
// =====================================================

export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType | null;
  currentUser: LandlordProfile | RenterProfile | AgencyProfile | AdminProfile | null;
  onboardingStep: number;

  // Admin mode fields
  isAdminMode?: boolean;
  adminProfile?: AdminProfile;
  impersonatedRole?: UserType;
}

// =====================================================
// OTHER TYPES
// =====================================================

export type SwipeAction = 'like' | 'dislike';

export interface SwipeEvent {
  propertyId: string;
  action: SwipeAction;
  timestamp: string;
}

export interface UserStats {
  propertiesViewed: number;
  propertiesLiked: number;
  propertiesPassed: number;
  matchesCount: number;
  messagesCount: number;
}

export type NotificationType = 'match' | 'message' | 'info' | 'success' | 'error' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface FilterOptions extends Partial<UserPreferences> {
  sortBy?: 'rent-asc' | 'rent-desc' | 'newest' | 'bedrooms';
}

export interface Location {
  name: string;
  region: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// =====================================================
// AGENCY LINKING SYSTEM (Landlord <-> Agency Relationships)
// =====================================================

/**
 * Type of agency relationship being invited or linked
 * - estate_agent: Marketing and tenant acquisition
 * - management_agency: Ongoing property and tenancy management
 */
export type InvitationType = 'estate_agent' | 'management_agency';

/**
 * Link type for active agency relationships (same as InvitationType)
 */
export type LinkType = 'estate_agent' | 'management_agency';

/**
 * Status of an agency link invitation
 * - pending: Invitation sent, awaiting response
 * - accepted: Invitation accepted, link created
 * - declined: Invitation declined by recipient
 * - expired: Invitation expired after 30 days
 * - cancelled: Invitation cancelled by initiator
 */
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

/**
 * Who initiated the agency link invitation
 * - landlord: Landlord invited agency to manage property
 * - agency: Agency invited landlord to link their property
 */
export type InvitationInitiator = 'landlord' | 'agency';

/**
 * Agency Link Invitation
 * Represents a bidirectional invitation between landlords and agencies
 * to establish property management or marketing relationships.
 */
export interface AgencyLinkInvitation {
  id: string;
  landlordId: string;
  agencyId: string;
  propertyId?: string; // Optional: null means "all properties" invitation

  invitationType: InvitationType;
  initiatedBy: InvitationInitiator;
  status: InvitationStatus;

  // Proposal terms
  proposedCommissionRate?: number; // Percentage (e.g., 10 = 10%)
  proposedContractLengthMonths?: number; // e.g., 12 months
  message?: string; // Optional message from initiator

  // Timestamps
  createdAt: Date;
  expiresAt: Date; // Auto-expires after 30 days
  respondedAt?: Date; // When invitation was accepted/declined
  responseMessage?: string; // Optional response message
}

/**
 * Agency Property Link
 * Represents an active relationship between a landlord, agency, and property.
 * Tracks commission, contract dates, and performance metrics.
 */
export interface AgencyPropertyLink {
  id: string;
  landlordId: string;
  agencyId: string;
  propertyId: string;

  linkType: LinkType;
  commissionRate: number; // Agreed percentage (e.g., 10 = 10%)

  // Contract dates
  contractStartDate: Date;
  contractEndDate?: Date; // Optional end date

  // Status tracking
  isActive: boolean; // Soft delete: false means link terminated
  terminationReason?: string; // Why link was terminated
  terminatedAt?: Date; // When link was terminated

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Performance metrics
  totalRentCollected: number; // Total rent collected through this link
  totalCommissionEarned: number; // Total commission earned by agency
}

// =====================================================
// LEGACY TYPES (For Migration - Will be removed)
// =====================================================

/**
 * @deprecated Use RenterProfile instead. Removed in v2.0
 */
export type BuyerProfile = RenterProfile;

/**
 * @deprecated Use LandlordProfile instead. Removed in v2.0
 */
export type VendorProfile = LandlordProfile;

/**
 * @deprecated Use RenterSituation instead. Removed in v2.0
 */
export type BuyerSituation = RenterSituation;

/**
 * @deprecated Use RenterType instead. Removed in v2.0
 */
export type BuyerType = RenterType;

/**
 * @deprecated Use EmploymentStatus instead. Removed in v2.0
 */
export type PurchaseType = EmploymentStatus;

/**
 * @deprecated No longer used (cannot discriminate). Removed in v2.0
 */
export type LookingFor = 'Family' | 'Investor';

/**
 * @deprecated Not relevant for rental properties. Removed in v2.0
 */
export type Tenure = 'Freehold' | 'Leasehold' | 'Shared Ownership';

/**
 * Legacy User interface - being phased out
 * @deprecated Use RenterProfile or LandlordProfile directly
 */
export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  preferences: UserPreferences;
  likedProperties: string[];
  passedProperties: string[];
  matches: string[];
  avatar?: string;
  createdAt: string;
  hasCompletedOnboarding: boolean;
}
