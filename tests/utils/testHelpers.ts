/**
 * Test Helper Utilities
 * Common utilities for writing clean, readable tests
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { vi } from 'vitest';

/**
 * Custom render function with common providers
 * Extend this as needed when providers are added (e.g., Router, Theme)
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

/**
 * Wait for async operations to complete
 */
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a mock function with type safety
 */
export const createMockFn = <T extends (...args: any[]) => any>() => {
  return vi.fn<T>();
};

/**
 * Assert that a function throws a specific error
 */
export const expectToThrow = async (fn: () => Promise<any> | any, errorMessage?: string) => {
  let error: Error | undefined;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error('Expected function to throw an error, but it did not');
  }

  if (errorMessage && !error.message.includes(errorMessage)) {
    throw new Error(
      `Expected error message to include "${errorMessage}", but got "${error.message}"`
    );
  }

  return error;
};

/**
 * Create a mock Date for consistent time-based testing
 */
export const mockDate = (isoString: string) => {
  const mockDate = new Date(isoString);
  vi.setSystemTime(mockDate);
  return mockDate;
};

/**
 * Restore real Date
 */
export const restoreDate = () => {
  vi.useRealTimers();
};

/**
 * Generate test data factories
 */
export const createTestRenterProfile = (overrides = {}) => ({
  id: 'test-renter-id',
  email: 'renter@test.com',
  passwordHash: 'hashed-password',
  status: 'prospective' as const,
  situation: 'Single' as const,
  names: 'Test Renter',
  ages: '25',
  localArea: 'Southport' as const,
  renterType: 'Young Professional' as const,
  employmentStatus: 'Employed Full-Time' as const,
  monthlyIncome: 2500,
  hasPets: false,
  smokingStatus: 'Non-Smoker' as const,
  hasGuarantor: false,
  currentRentalSituation: 'Currently Renting',
  hasRentalHistory: true,
  previousLandlordReference: false,
  receivesHousingBenefit: false,
  receivesUniversalCredit: false,
  numberOfChildren: 0,
  createdAt: new Date(),
  isComplete: true,
  ...overrides,
});

export const createTestLandlordProfile = (overrides = {}) => ({
  id: 'test-landlord-id',
  email: 'landlord@test.com',
  passwordHash: 'hashed-password',
  names: 'Test Landlord',
  propertyType: 'Detached' as const,
  preferredTenantTypes: [],
  furnishingPreference: 'Unfurnished' as const,
  defaultPetsPolicy: {
    willConsiderPets: true,
    requiresPetInsurance: false,
    preferredPetTypes: [],
    maxPetsAllowed: 0,
  },
  prsRegistrationNumber: 'PRS123456',
  prsRegistrationStatus: 'active' as const,
  ombudsmanScheme: 'The Property Ombudsman' as const,
  isRegisteredLandlord: true,
  isFullyCompliant: true,
  depositScheme: 'DPS' as const,
  createdAt: new Date(),
  isComplete: true,
  ...overrides,
});

export const createTestAgencyProfile = (overrides = {}) => ({
  id: 'test-agency-id',
  email: 'agency@test.com',
  passwordHash: 'hashed-password',
  agencyType: 'management_agency' as const,
  companyName: 'Test Agency Ltd',
  registrationNumber: 'REG123456',
  primaryContactName: 'Test Contact',
  phone: '01234567890',
  address: {
    street: '123 Test Street',
    city: 'Southport',
    postcode: 'PR9 0AA',
  },
  serviceAreas: ['Southport'],
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
    averageResponseTimeHours: 0,
    slaComplianceRate: 100,
    totalIssuesResolved: 0,
    totalIssuesRaised: 0,
    currentOpenIssues: 0,
  },
  propertyOmbudsmanMember: true,
  createdAt: new Date(),
  isActive: true,
  isComplete: true,
  ...overrides,
});

export const createTestProperty = (overrides = {}) => ({
  id: 'test-property-id',
  landlordId: 'test-landlord-id',
  address: {
    street: '123 Test Street',
    city: 'Southport',
    postcode: 'PR9 0AA',
    council: 'Sefton Council',
  },
  rentPcm: 750,
  deposit: 750,
  bedrooms: 2,
  bathrooms: 1,
  propertyType: 'Flat' as const,
  description: 'Test property description',
  epcRating: 'C' as const,
  images: ['https://example.com/image1.jpg'],
  features: ['Garden', 'Parking'],
  furnishing: 'Unfurnished' as const,
  petsPolicy: {
    willConsiderPets: false,
    requiresPetInsurance: false,
    preferredPetTypes: [],
    maxPetsAllowed: 0,
  },
  isAvailable: true,
  canBeMarketed: true,
  createdAt: new Date(),
  ...overrides,
});
