import type {
  RenterProfile,
  LandlordProfile,
  AgencyProfile,
  RenterStatus,
} from '../types';
import { hashPassword } from './validation';

/**
 * Generates a complete test renter profile for admin role switching
 * All data is realistic and complies with RRA 2025
 */
export const generateTestRenter = async (): Promise<RenterProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  return {
    id: 'test-renter-001',
    email: 'test.renter@geton.com',
    passwordHash,
    names: 'Test Renter',
    ages: '28',
    localArea: 'Liverpool',
    renterType: 'Young Professional',
    employmentStatus: 'Employed Full-Time',
    monthlyIncome: 2500,
    situation: 'Single',
    status: 'prospective' as RenterStatus,
    preferredMoveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    hasPets: false,
    smokingStatus: 'Non-Smoker',
    hasGuarantor: false,
    currentRentalSituation: 'Currently Renting',
    hasRentalHistory: true,
    previousLandlordReference: true,
    receivesHousingBenefit: false,
    receivesUniversalCredit: false,
    onboardingComplete: true,
    createdAt: new Date(),
  };
};

/**
 * Generates a complete test landlord profile
 */
export const generateTestLandlord = async (): Promise<LandlordProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  return {
    id: 'test-landlord-001',
    email: 'test.landlord@geton.com',
    passwordHash,
    names: 'Test Landlord',
    propertyType: 'Flat',
    furnishingPreference: 'Furnished',
    preferredTenantTypes: ['Young Professional', 'Professional Sharers'],
    defaultPetsPolicy: {
      willConsiderPets: true,
      requiresPetInsurance: true,
      preferredPetTypes: ['cat', 'dog'],
      maxPetsAllowed: 2,
    },
    prsRegistrationNumber: 'PRS123456789',
    prsRegistrationStatus: 'active',
    ombudsmanScheme: 'property_ombudsman',
    ombudsmanMembershipNumber: 'OM123456',
    isFullyCompliant: true,
    isRegisteredLandlord: true,
    depositScheme: 'mydeposits',
    estateAgentLink: '',
    onboardingComplete: true,
    createdAt: new Date(),
  };
};

/**
 * Generates test estate agent profile
 */
export const generateTestEstateAgent = async (): Promise<AgencyProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  return {
    id: 'test-estate-agent-001',
    email: 'test.estateagent@geton.com',
    passwordHash,
    agencyType: 'estate_agent',
    companyName: 'Test Estate Agency Ltd',
    registrationNumber: 'EA123456',
    primaryContactName: 'Agent Contact',
    phone: '07700900123',
    address: {
      street: '123 High Street',
      city: 'Liverpool',
      postcode: 'L1 1AA',
    },
    serviceAreas: ['Liverpool', 'Southport', 'Formby'],
    isActive: true,
    managedPropertyIds: [],
    landlordClientIds: [],
    activeTenantsCount: 0,
    totalPropertiesManaged: 0,
    slaConfiguration: {
      emergencyResponseHours: 4,
      urgentResponseHours: 24,
      routineResponseHours: 72,
      maintenanceResponseDays: 14,
    },
    performanceMetrics: {
      averageResponseTimeHours: 12,
      slaComplianceRate: 95,
      totalIssuesResolved: 0,
      totalIssuesRaised: 0,
      currentOpenIssues: 0,
    },
    propertyOmbudsmanMember: true,
    onboardingComplete: true,
    createdAt: new Date(),
  };
};

/**
 * Generates test management agency profile
 */
export const generateTestManagementAgency = async (): Promise<AgencyProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  return {
    id: 'test-management-agency-001',
    email: 'test.managementagency@geton.com',
    passwordHash,
    agencyType: 'management_agency',
    companyName: 'Test Management Services Ltd',
    registrationNumber: 'MA123456',
    primaryContactName: 'Manager Contact',
    phone: '07700900456',
    address: {
      street: '456 Management Road',
      city: 'Manchester',
      postcode: 'M1 1BB',
    },
    serviceAreas: ['Manchester', 'Preston', 'Blackpool'],
    isActive: true,
    managedPropertyIds: [],
    landlordClientIds: [],
    activeTenantsCount: 0,
    totalPropertiesManaged: 0,
    slaConfiguration: {
      emergencyResponseHours: 4,
      urgentResponseHours: 24,
      routineResponseHours: 72,
      maintenanceResponseDays: 14,
    },
    performanceMetrics: {
      averageResponseTimeHours: 10,
      slaComplianceRate: 98,
      totalIssuesResolved: 0,
      totalIssuesRaised: 0,
      currentOpenIssues: 0,
    },
    propertyOmbudsmanMember: true,
    onboardingComplete: true,
    createdAt: new Date(),
  };
};

/**
 * Initialize all test profiles and store them
 */
export const initializeTestProfiles = async (): Promise<void> => {
  const testProfiles = {
    renter: await generateTestRenter(),
    landlord: await generateTestLandlord(),
    estate_agent: await generateTestEstateAgent(),
    management_agency: await generateTestManagementAgency(),
  };

  localStorage.setItem('get-on-admin-test-profiles', JSON.stringify(testProfiles));
  console.log('[Admin] Test profiles initialized');
};

/**
 * Get test profile for a specific role
 */
export const getTestProfile = (
  userType: 'renter' | 'landlord' | 'estate_agent' | 'management_agency'
): RenterProfile | LandlordProfile | AgencyProfile | null => {
  const profilesJson = localStorage.getItem('get-on-admin-test-profiles');
  if (!profilesJson) return null;

  const profiles = JSON.parse(profilesJson);
  return profiles[userType] || null;
};
