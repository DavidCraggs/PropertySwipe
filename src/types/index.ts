/**
 * Core type definitions for GetOn - UK Rental Property Platform
 * Compliant with Renters' Rights Act 2025
 */

// =====================================================
// BASIC TYPES
// =====================================================

/**
 * Standard address structure used across all profile types
 */
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

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
  | 'scheduled'
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

  // Full management delegation
  isFullyManagedByAgency?: boolean;       // Agency has full management control
  landlordCanEditWhenManaged?: boolean;   // Landlord retains edit rights when fully managed
  lastEditedBy?: string;                  // User ID for audit trail
  lastEditedAt?: Date;                    // Timestamp for audit trail

  // Availability
  isAvailable: boolean;
  canBeMarketed: boolean; // Calculated: requires PRS registration + compliance
  listingDate: string;

  // Preferences (non-enforceable)
  preferredMinimumStay?: number; // Landlord preference in months (not legally binding)
  acceptsShortTermTenants: boolean;
}

// =====================================================
// PROPERTY MANAGEMENT TYPES
// =====================================================

/**
 * Cost categories for property expense tracking
 */
export type PropertyCostCategory =
  | 'mortgage'
  | 'insurance'
  | 'maintenance'
  | 'management_fee'
  | 'service_charge'
  | 'ground_rent'
  | 'utilities'
  | 'other';

/**
 * Frequency of recurring costs
 */
export type CostFrequency = 'monthly' | 'quarterly' | 'annually' | 'one_time';

/**
 * Property cost record for financial tracking
 */
export interface PropertyCost {
  id: string;
  propertyId: string;
  category: PropertyCostCategory;
  description: string;
  amount: number; // Amount in GBP
  frequency: CostFrequency;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Occupancy status for a property
 */
export type OccupancyStatus = 'occupied' | 'vacant' | 'ending_soon';

/**
 * Property with enriched details for landlord/agency dashboard
 */
export interface PropertyWithDetails extends Property {
  // Current tenant info (if occupied)
  currentTenant?: {
    name: string;
    renterId: string;
    moveInDate: Date;
    monthlyRent: number;
  };

  // Status and metrics
  occupancyStatus: OccupancyStatus;
  activeIssuesCount: number;
  unreadMessagesCount: number;

  // Financial summary (monthly normalized)
  monthlyCosts: number;
  monthlyIncome: number; // Rent if occupied, 0 if vacant
  monthlyProfit: number; // income - costs

  // Related data
  costs?: PropertyCost[];
  matchId?: string; // Current active tenancy match
}

/**
 * View mode options for properties page
 */
export type PropertyViewMode = 'list' | 'grid' | 'card';

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
  address?: Address; // Current residential address
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

  // ID Verification (Right to Rent)
  rightToRentVerified?: boolean;
  rightToRentVerifiedAt?: Date;
  rightToRentExpiresAt?: Date;
  rightToRentDocumentType?: 'passport' | 'driving_license' | 'biometric_residence_permit' | 'share_code' | 'other';
  verificationStatus?: 'not_started' | 'pending' | 'processing' | 'verified' | 'failed' | 'expired';
}

// =====================================================
// LANDLORD PROFILE
// =====================================================

export interface LandlordProfile {
  id: string;
  email: string;
  passwordHash: string;  // Hashed password for secure authentication
  names: string;
  businessAddress?: Address; // Business/correspondence address
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
  propertyIds?: string[]; // Changed from propertyId to support multiple properties
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
  address: Address; // Office address

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

  // DEPRECATED: Legacy message fields (kept for backward compatibility during transition)
  /** @deprecated Use conversations instead */
  messages: Message[];
  /** @deprecated Use conversations.landlord.lastMessageAt or conversations.agency.lastMessageAt instead */
  lastMessageAt?: string;
  /** @deprecated Use conversations.landlord.unreadCount or conversations.agency.unreadCount instead */
  unreadCount: number;

  // NEW: Dual-conversation system
  conversations?: {
    landlord: ConversationMetadata;
    agency?: ConversationMetadata; // Optional because not all properties have agencies
  };


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
// CONVERSATION INTERFACE (Dual Messaging System)
// =====================================================

export type ConversationType = 'landlord' | 'agency';

export interface Conversation {
  id: string;
  matchId: string;
  conversationType: ConversationType;
  messages: Message[];
  lastMessageAt?: string;
  unreadCountRenter: number;
  unreadCountOther: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMetadata {
  conversationType: ConversationType;
  unreadCount: number;
  lastMessage?: Message;
  lastMessageAt?: string;
  recipientName: string; // Landlord name or agency company name
  recipientId: string; // Landlord ID or agency ID
  averageResponseTimeHours?: number; // For showing "Typically responds within X hours"
}

export interface SendMessageParams {
  matchId: string;
  conversationType: ConversationType;
  content: string;
  senderId: string;
  senderType: UserType;
}

// =====================================================
// AGENCY-LANDLORD CONVERSATION INTERFACE
// =====================================================

/**
 * AgencyLandlordConversation
 * Direct messaging between agencies and landlords they manage.
 * Separate from renter-match conversations.
 */
export interface AgencyLandlordConversation {
  id: string;
  agencyId: string;
  landlordId: string;
  propertyId?: string; // Optional - for property-specific discussions
  messages: AgencyLandlordMessage[];
  lastMessageAt?: string;
  unreadCountAgency: number;
  unreadCountLandlord: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgencyLandlordMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'agency' | 'landlord';
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface SendAgencyLandlordMessageParams {
  agencyId: string;
  landlordId: string;
  content: string;
  senderId: string;
  senderType: 'agency' | 'landlord';
  propertyId?: string; // Optional context
}

// =====================================================
// PROPERTY-GROUPED CONVERSATION INTERFACES
// =====================================================

/**
 * PropertyConversationGroup
 * Represents a conversation thread for a specific property (or general discussion)
 */
export interface PropertyConversationGroup {
  propertyId: string | null; // null = general discussion
  propertyAddress?: string;
  conversation: AgencyLandlordConversation | null;
  unreadCount: number;
  lastMessageAt?: string;
}

/**
 * LandlordConversationGroup
 * Groups all property conversations for a single landlord (used in agency view)
 */
export interface LandlordConversationGroup {
  landlord: LandlordProfile;
  propertyConversations: PropertyConversationGroup[];
  totalUnreadCount: number;
  properties: Property[]; // All properties linked to this landlord
}

/**
 * AgencyConversationGroup
 * Groups all property conversations for a single agency (used in landlord view)
 */
export interface AgencyConversationGroup {
  agency: AgencyProfile;
  propertyConversations: PropertyConversationGroup[];
  totalUnreadCount: number;
  properties: Property[]; // All properties linked to this agency
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

/** Auth provider type for tracking how users signed in */
export type AuthProvider = 'google' | 'apple' | 'email' | 'password';

/** Unified profile row from the `profiles` table (bridges auth.users to role-specific tables) */
export interface SupabaseProfile {
  id: string;
  email: string;
  role: UserType | null;
  display_name: string | null;
  avatar_url: string | null;
  landlord_profile_id: string | null;
  renter_profile_id: string | null;
  agency_profile_id: string | null;
  auth_provider: AuthProvider;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
}

/** Auth screen state for the login page */
export type AuthScreen = 'idle' | 'loading' | 'magic-link-sent' | 'error';

export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType | null;
  currentUser: LandlordProfile | RenterProfile | AgencyProfile | AdminProfile | null;
  onboardingStep: number;

  // Admin mode fields
  isAdminMode?: boolean;
  adminProfile?: AdminProfile;
  impersonatedRole?: UserType;

  // Supabase Auth fields
  supabaseUserId?: string | null;
  supabaseProfile?: SupabaseProfile | null;
  authProvider?: AuthProvider | null;
  isSessionLoading?: boolean;
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
// MANAGEMENT CONTRACT TYPES (Landlord-Agency Contracts)
// =====================================================

/**
 * Service level for agency management contracts
 * - let_only: Tenant finding only (one-time fee)
 * - rent_collection: Tenant finding + rent collection
 * - full_management: Complete property management service
 */
export type ManagementServiceLevel = 'let_only' | 'rent_collection' | 'full_management';

/**
 * Contract renewal options
 */
export type ContractRenewalType = 'auto' | 'manual' | 'none';

/**
 * Management contract status lifecycle
 */
export type ManagementContractStatus =
  | 'draft'
  | 'pending_landlord'
  | 'pending_agency'
  | 'active'
  | 'terminated'
  | 'expired';

/**
 * Service inclusions for management contracts
 * Defines what services are included at each level
 */
export interface ManagementServiceInclusions {
  tenantFinding: boolean;
  referenceChecking: boolean;
  rentCollection: boolean;
  propertyInspections: boolean;
  maintenanceCoordination: boolean;
  tenantCommunication: boolean;
  legalCompliance: boolean; // Gas certs, EPC, deposit protection
  evictionHandling: boolean;
}

/**
 * Payment terms for management contracts
 */
export interface ManagementPaymentTerms {
  paymentFrequency: 'monthly' | 'quarterly';
  paymentMethod: 'bank_transfer' | 'standing_order';
  invoiceDueWithinDays: number;
}

/**
 * SLA commitments for management contracts
 */
export interface ManagementSlaTerms {
  emergencyResponseHours: number;
  routineResponseDays: number;
  rentRemittanceDays: number; // Days after collection to remit to landlord
  inspectionFrequency: 'monthly' | 'quarterly' | 'biannually';
}

/**
 * Management contract terms
 * All negotiable terms between landlord and agency
 */
export interface ManagementContractTerms {
  serviceLevel: ManagementServiceLevel;
  commissionRate: number; // Percentage (e.g., 10 = 10%)
  letOnlyFee?: number; // One-time fee for let-only service
  contractLengthMonths: number;
  noticePeriodDays: number;
  renewalType: ContractRenewalType;
  includedServices: ManagementServiceInclusions;
  paymentTerms: ManagementPaymentTerms;
  slaTerms: ManagementSlaTerms;
}

/**
 * Management Contract
 * Represents a formal agreement between a landlord and agency
 * for property management services
 */
export interface ManagementContract {
  id: string;
  landlordId: string;
  agencyId: string;
  propertyIds: string[]; // Properties covered by this contract
  terms: ManagementContractTerms;
  status: ManagementContractStatus;

  // Signatures
  signedByLandlordAt?: Date;
  signedByAgencyAt?: Date;

  // Contract dates
  effectiveFrom?: Date;
  effectiveUntil?: Date;

  // Termination
  terminatedAt?: Date;
  terminationReason?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // PDF generation
  generatedPdfPath?: string;
  generatedAt?: Date;

  // Joined data
  landlord?: LandlordProfile;
  agency?: AgencyProfile;
  properties?: Property[];
}

/**
 * Management contract wizard form state
 */
export interface ManagementContractWizardState {
  currentStep: number;
  selectedAgencyId?: string;
  selectedPropertyIds: string[];
  serviceLevel: ManagementServiceLevel;
  commissionRate: number;
  letOnlyFee?: number;
  contractLengthMonths: number;
  noticePeriodDays: number;
  renewalType: ContractRenewalType;
  includedServices: ManagementServiceInclusions;
  paymentTerms: ManagementPaymentTerms;
  slaTerms: ManagementSlaTerms;
  isDirty: boolean;
  lastSavedAt?: Date;
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

// =====================================================
// RENTER INVITE SYSTEM
// =====================================================

/**
 * Renter invite code for pre-configured onboarding
 * Allows landlords/agencies to invite renters with property details pre-filled
 */
export interface RenterInvite {
  id: string;
  code: string;
  createdById: string;
  createdByType: 'landlord' | 'management_agency' | 'estate_agent';

  /** Target configuration */
  propertyId: string;
  landlordId: string;
  managingAgencyId?: string;

  /** Tenancy pre-configuration */
  proposedRentPcm: number;
  proposedDepositAmount?: number;
  proposedMoveInDate?: Date;
  specialTerms?: string;

  /** Status tracking */
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedByRenterId?: string;
  createdMatchId?: string;

  /** Audit timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of validating an invite code
 * Returns validation status, invite details, and property preview
 */
export interface InviteValidationResult {
  isValid: boolean;
  invite?: RenterInvite;
  error?: 'not_found' | 'expired' | 'already_used' | 'revoked';
  property?: Property; // Property preview for valid invites
}

// =====================================================
// TWO-SIDED MATCHING SYSTEM (Phase 3)
// =====================================================

/**
 * Interest status for two-sided matching
 * - pending: Renter swiped right, awaiting landlord review
 * - landlord_liked: Landlord approved, creates match
 * - landlord_passed: Landlord declined
 * - expired: Interest expired after 30 days
 * - matched: Successfully converted to a Match
 */
export type InterestStatus = 'pending' | 'landlord_liked' | 'landlord_passed' | 'expired' | 'matched';

/**
 * Interest record - represents a renter's interest in a property
 * Before two-sided confirmation
 */
export interface Interest {
  id: string;
  renterId: string;
  landlordId: string;
  propertyId: string;
  interestedAt: Date;
  status: InterestStatus;
  landlordReviewedAt?: Date;
  expiresAt: Date;
  createdMatchId?: string;

  // Cached compatibility scoring
  compatibilityScore?: number; // 0-100
  compatibilityBreakdown?: CompatibilityBreakdown;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Compatibility score breakdown for match quality assessment
 */
export interface CompatibilityBreakdown {
  affordability: number; // 0-30 points (income vs rent)
  location: number; // 0-20 points (area preference match)
  timing: number; // 0-15 points (move-in date alignment)
  propertyFit: number; // 0-20 points (bedrooms, type, features)
  tenantHistory: number; // 0-15 points (previous ratings)
}

/**
 * Full compatibility score with flags for edge cases
 */
export interface CompatibilityScore {
  overall: number; // 0-100
  breakdown: CompatibilityBreakdown;
  flags: CompatibilityFlag[];
}

/**
 * Flags for edge cases that require attention
 */
export type CompatibilityFlag =
  | 'income_marginal' // Income is 2.5-3x rent (borderline)
  | 'income_strong' // Income is 3x+ rent
  | 'move_date_mismatch' // Move dates don't align
  | 'move_date_flexible' // Renter is flexible on dates
  | 'pet_requires_approval' // Has pets, needs landlord approval
  | 'first_time_renter' // No rental history
  | 'excellent_references' // Strong previous ratings
  | 'has_guarantor' // Has a guarantor
  | 'verified_income' // Income has been verified
  | 'long_term_seeker'; // Looking for long tenancy

/**
 * Renter card data for landlord swipe interface
 * Shows non-discriminatory information only
 */
export interface RenterCard {
  renterId: string;
  interestId: string;
  situation: RenterSituation;
  employmentStatus: EmploymentStatus;
  monthlyIncome: number;
  hasPets: boolean;
  petDetails?: {
    type: string;
    count: number;
    hasInsurance: boolean;
  }[];
  hasGuarantor: boolean;
  hasRentalHistory: boolean;
  preferredMoveInDate?: Date;
  smokingStatus: 'Non-Smoker' | 'Smoker' | 'Vaper';
  rating?: UserRatingsSummary;
  compatibilityScore: CompatibilityScore;
  interestedAt: Date;
  propertyId: string;
  propertyAddress: string;
}

// =====================================================
// TENANCY AGREEMENTS & DOCUMENT SIGNING
// =====================================================

/**
 * Agreement status lifecycle
 */
export type AgreementStatus =
  | 'draft'
  | 'pending_signatures'
  | 'partially_signed'
  | 'fully_signed'
  | 'expired'
  | 'cancelled';

/**
 * How the signature was created
 */
export type SignatureType = 'draw' | 'type' | 'upload';

/**
 * Audit log actions for agreements
 */
export type AgreementAuditAction =
  | 'created'
  | 'viewed'
  | 'downloaded'
  | 'signed'
  | 'reminder_sent'
  | 'expired'
  | 'cancelled';

/**
 * Tenancy Agreement - uploaded document with signature tracking
 */
export interface TenancyAgreement {
  id: string;
  matchId: string;
  propertyId: string;
  landlordId: string;
  agencyId?: string;
  renterId: string;

  // Document storage
  originalDocumentPath: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;

  // Signed version
  signedDocumentPath?: string;
  signedAt?: Date;

  // Metadata
  title: string;
  description?: string;
  tenancyStartDate?: Date;
  tenancyEndDate?: Date;
  rentAmount?: number;
  depositAmount?: number;

  // Status
  status: AgreementStatus;
  expiresAt: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // Joined data
  signatories?: AgreementSignatory[];
  property?: Property;
  match?: Match;
}

/**
 * Signatory - a person required to sign an agreement
 */
export interface AgreementSignatory {
  id: string;
  agreementId: string;
  userId: string;
  userType: 'landlord' | 'agency' | 'renter';
  userEmail: string;
  userName: string;
  signingOrder: number;
  isRequired: boolean;

  // Signature
  hasSigned: boolean;
  signedAt?: Date;
  signatureData?: string;
  signatureType?: SignatureType;
  ipAddress?: string;
  userAgent?: string;

  // Notifications
  invitationSentAt?: Date;
  lastReminderAt?: Date;
  reminderCount: number;

  createdAt: Date;
}

/**
 * Audit log entry for agreement actions
 */
export interface AgreementAuditEntry {
  id: string;
  agreementId: string;
  action: AgreementAuditAction;
  performedBy?: string;
  performedByType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Input for creating a new agreement
 */
export interface CreateAgreementInput {
  matchId: string;
  title: string;
  description?: string;
  tenancyStartDate?: Date;
  tenancyEndDate?: Date;
  rentAmount?: number;
  depositAmount?: number;
  file: File;
}

/**
 * Input for signing an agreement
 */
export interface SignAgreementInput {
  agreementId: string;
  signatureData: string;
  signatureType: SignatureType;
}

// =====================================================
// RRA 2025 AGREEMENT CREATOR TYPES
// =====================================================

/**
 * Clause categories for agreement structure
 */
export type ClauseCategory =
  | 'parties'
  | 'property'
  | 'term'
  | 'rent'
  | 'deposit'
  | 'repairs'
  | 'pets'
  | 'termination'
  | 'property_use'
  | 'utilities'
  | 'insurance'
  | 'compliance'
  | 'signatures'
  | 'special';

/**
 * Variable types for clause placeholders
 */
export type ClauseVariableType = 'text' | 'number' | 'date' | 'boolean' | 'select';

/**
 * Variable definition in a clause template
 */
export interface ClauseVariable {
  name: string;
  type: ClauseVariableType;
  label: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: string[]; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Individual clause within a template section
 */
export interface AgreementClause {
  id: string;
  category: ClauseCategory;
  title: string;
  content: string; // Text with {{variable}} placeholders
  variables?: ClauseVariable[];
  isMandatory: boolean; // Required by RRA 2025
  isProhibited: boolean; // Forbidden by RRA 2025
  rraReference?: string; // e.g., "Section 12(1)"
  isSelected?: boolean; // For customization UI
}

/**
 * Section containing related clauses
 */
export interface AgreementSection {
  id: string;
  title: string;
  order: number;
  clauses: AgreementClause[];
  isRequired: boolean;
}

/**
 * Agreement template (system-provided or custom)
 */
export interface AgreementTemplate {
  id: string;
  name: string;
  description?: string;
  version: string; // e.g., "RRA2025-v1.0"
  sections: AgreementSection[];
  isSystemTemplate: boolean;
  createdBy?: string;
  isActive: boolean;
  rraCompliant: boolean;
  lastComplianceCheck?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Deposit protection schemes in UK
 */
export type DepositScheme = 'DPS' | 'TDS' | 'MyDeposits';

/**
 * Payment methods for rent
 */
export type RentPaymentMethod = 'bank_transfer' | 'standing_order' | 'direct_debit';

/**
 * Ombudsman schemes available
 */
export type OmbudsmanSchemeOption =
  | 'Housing Ombudsman Service'
  | 'Property Ombudsman'
  | 'Property Redress Scheme';

/**
 * Additional occupant details
 */
export interface AdditionalOccupant {
  name: string;
  relationship: string;
  dateOfBirth?: string;
}

/**
 * Form data structure for generating agreements
 */
export interface AgreementFormData {
  // Tenancy details
  tenancyStartDate: string;

  // Parties
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  agentName?: string;
  agentAddress?: string;

  // Rent
  rentAmount: number;
  rentPaymentDay: number; // 1-28
  rentPaymentMethod: RentPaymentMethod;

  // Deposit
  depositAmount: number;
  depositWeeks: number;
  depositScheme: DepositScheme;
  depositSchemeRef?: string;
  depositProtectedDate?: string;

  // Occupants
  additionalOccupants: AdditionalOccupant[];
  maxOccupants: number;

  // Pets
  petsAllowed: boolean;
  petDetails?: string;

  // Utilities
  utilitiesIncluded: boolean;
  includedUtilities?: string;
  councilTaxResponsibility: 'Tenant' | 'Landlord';
  councilTaxBand?: string;

  // Property specifics
  furnishingLevel: 'unfurnished' | 'part furnished' | 'fully furnished';
  inventoryIncluded: boolean;
  parkingIncluded: boolean;
  parkingDetails?: string;
  hasGarden: boolean;
  gardenMaintenance?: 'Tenant' | 'Landlord' | 'shared';

  // Property address (auto-filled)
  propertyAddress: string;

  // Compliance (auto-filled from property/landlord data)
  epcRating: EPCRating;
  epcExpiryDate: string;
  hasGas: boolean;
  gasSafetyDate?: string;
  eicrDate: string;
  prsRegistrationNumber: string;
  ombudsmanScheme: OmbudsmanSchemeOption;
  ombudsmanMembershipNumber: string;

  // Special conditions
  additionalConditions?: string;

  // Agreement date
  agreementDate: string;
}

/**
 * Generated agreement status
 */
export type GeneratedAgreementStatus =
  | 'draft'
  | 'generated'
  | 'sent_for_signing'
  | 'signed'
  | 'cancelled';

/**
 * Generated agreement instance from a template
 */
export interface GeneratedAgreement {
  id: string;
  templateId: string;
  matchId: string;
  landlordId: string;
  agencyId?: string;
  renterId: string;
  propertyId: string;

  agreementData: AgreementFormData;
  generatedPdfPath?: string;
  generatedAt?: Date;

  // Link to tenancy_agreements for signing workflow
  tenancyAgreementId?: string;

  status: GeneratedAgreementStatus;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // Joined data
  template?: AgreementTemplate;
  property?: Property;
  landlord?: LandlordProfile;
  renter?: RenterProfile;
}

/**
 * Compliance error from RRA 2025 validation
 */
export interface ComplianceError {
  field: string;
  message: string;
  rraReference: string;
}

/**
 * Compliance warning (best practice, not mandatory)
 */
export interface ComplianceWarning {
  field: string;
  message: string;
  suggestion: string;
}

/**
 * Result of RRA 2025 compliance check
 */
export interface ComplianceCheckResult {
  isCompliant: boolean;
  errors: ComplianceError[];
  warnings: ComplianceWarning[];
}

/**
 * Wizard step configuration
 */
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  isOptional: boolean;
  isComplete: boolean;
}

/**
 * Agreement creator wizard state
 */
export interface AgreementWizardState {
  currentStep: number;
  steps: WizardStep[];
  template: AgreementTemplate | null;
  formData: Partial<AgreementFormData>;
  complianceResult: ComplianceCheckResult | null;
  isDirty: boolean;
  lastSavedAt?: Date;
}

// =====================================================
// CUSTOM DASHBOARDS & REPORTS (Analytics System)
// =====================================================

/**
 * Widget types available for dashboards
 */
export type WidgetType =
  | 'stat_card'        // Single KPI value
  | 'line_chart'       // Trend over time
  | 'bar_chart'        // Comparisons
  | 'pie_chart'        // Distribution
  | 'table'            // Data grid
  | 'property_list'    // Property summary cards
  | 'issue_tracker'    // Open issues with status
  | 'recent_activity'; // Activity feed timeline

/**
 * Data sources available for widgets
 */
export type DataSource =
  | 'properties'
  | 'matches'
  | 'issues'
  | 'ratings'
  | 'payments'
  | 'tenancies'
  | 'sla_performance';

/**
 * Widget position and size in grid
 */
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Widget configuration options
 */
export interface WidgetConfig {
  dataSource: DataSource;
  metrics?: string[];
  filters?: Record<string, unknown>;
  dateRange?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  customDateRange?: {
    from: string;
    to: string;
  };
  refreshInterval?: number; // seconds, 0 = manual only
  chartOptions?: {
    showLegend?: boolean;
    colorScheme?: string;
    stacked?: boolean;
  };
}

/**
 * Individual dashboard widget
 */
export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetType: WidgetType;
  title: string;
  config: WidgetConfig;
  position: WidgetPosition;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dashboard permission level
 */
export type DashboardPermission = 'view' | 'edit' | 'admin';

/**
 * Dashboard sharing entry
 */
export interface DashboardShare {
  id: string;
  dashboardId: string;
  userId: string;
  permission: DashboardPermission;
  sharedAt: Date;
  sharedBy: string;
}

/**
 * Pre-defined dashboard templates
 */
export type DashboardTemplateId =
  | 'landlord_portfolio'
  | 'agency_overview'
  | 'financial_summary'
  | 'maintenance_focus';

/**
 * Custom dashboard configuration
 */
export interface CustomDashboard {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  templateId?: DashboardTemplateId;
  layout: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Saved report schedule type
 */
export type ReportScheduleType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

/**
 * Report export format
 */
export type ReportExportFormat = 'pdf' | 'xlsx' | 'csv' | 'json';

/**
 * Saved report configuration
 */
export interface SavedReport {
  id: string;
  userId: string;
  name: string;
  reportType: string;
  config: {
    dateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    customDateRange?: { from: string; to: string };
    filters?: Record<string, unknown>;
    format: ReportExportFormat;
  };
  schedule?: ReportScheduleType;
  recipients?: string[];
  lastRunAt?: Date;
  nextRunAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Metric goal for KPI tracking
 */
export interface MetricGoal {
  id: string;
  userId: string;
  metric: string;
  targetValue: number;
  targetType: 'above' | 'below' | 'exact';
  deadline?: Date;
  achievedAt?: Date;
  createdAt: Date;
}

/**
 * Alert condition operators
 */
export type AlertCondition = 'gt' | 'lt' | 'eq' | 'gte' | 'lte';

/**
 * Notification channels
 */
export type NotificationChannel = 'email' | 'in_app';

/**
 * Metric alert configuration
 */
export interface MetricAlert {
  id: string;
  userId: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  notifyVia: NotificationChannel[];
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
}

/**
 * Data point for chart widgets
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  category?: string;
}

/**
 * Stat card data
 */
export interface StatCardData {
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  suffix?: string;
  prefix?: string;
}

/**
 * Activity feed item
 */
export interface ActivityFeedItem {
  id: string;
  type: 'match' | 'issue' | 'payment' | 'viewing' | 'contract';
  title: string;
  description: string;
  timestamp: Date;
  relatedId?: string;
  userId?: string;
}

/**
 * Widget data union type
 */
export type WidgetData =
  | StatCardData
  | ChartDataPoint[]
  | ActivityFeedItem[]
  | Property[]
  | Issue[];
