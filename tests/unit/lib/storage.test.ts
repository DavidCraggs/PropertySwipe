import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  saveLandlordProfile,
  getLandlordProfile,
  saveRenterProfile,
  getRenterProfile,
  saveAgencyProfile,
  getAgencyProfile,
  saveProperty,
  getAllProperties,
  deleteProperty,
} from '../../../src/lib/storage';
import { setupStorageMocks, clearAllStorage } from '../../__mocks__/localStorage';
import type { LandlordProfile, RenterProfile, AgencyProfile, Property } from '../../../src/types';

// Mock Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false, // Always use localStorage for tests
}));

describe('Storage Layer', () => {
  beforeEach(() => {
    setupStorageMocks();
  });

  afterEach(() => {
    clearAllStorage();
  });

  describe('Landlord Profile Storage', () => {
    const mockLandlordProfile: LandlordProfile = {
      id: 'landlord-123',
      email: 'landlord@test.com',
      passwordHash: 'hash123',
      names: 'Test Landlord',
      propertyType: 'Flat',
      furnishingPreference: 'Furnished',
      preferredTenantTypes: ['Professionals'],
      defaultPetsPolicy: 'No Pets',
      prsRegistrationNumber: 'PRS-12345',
      prsRegistrationStatus: 'active',
      ombudsmanScheme: 'Property Redress Scheme',
      isRegisteredLandlord: true,
      isFullyCompliant: true,
      depositScheme: 'DPS',
      isComplete: true,
    };

    it('should save a landlord profile to localStorage', async () => {
      const result = await saveLandlordProfile(mockLandlordProfile);

      expect(result).toEqual(mockLandlordProfile);
      const stored = localStorage.getItem('landlord-profile-landlord-123');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(mockLandlordProfile);
    });

    it('should retrieve a landlord profile from localStorage', async () => {
      await saveLandlordProfile(mockLandlordProfile);

      const result = await getLandlordProfile('landlord-123');

      expect(result).toEqual(mockLandlordProfile);
    });

    it('should return null for non-existent landlord profile', async () => {
      const result = await getLandlordProfile('non-existent-id');

      expect(result).toBeNull();
    });

    it('should update an existing landlord profile', async () => {
      await saveLandlordProfile(mockLandlordProfile);

      const updatedProfile = {
        ...mockLandlordProfile,
        names: 'Updated Landlord',
        propertyType: 'House' as const,
      };

      await saveLandlordProfile(updatedProfile);
      const result = await getLandlordProfile('landlord-123');

      expect(result?.names).toBe('Updated Landlord');
      expect(result?.propertyType).toBe('House');
    });

    it('should handle landlord profile with RRA 2025 compliance dates', async () => {
      const profileWithDates: LandlordProfile = {
        ...mockLandlordProfile,
        prsRegistrationDate: new Date('2024-01-01'),
        prsRegistrationExpiryDate: new Date('2027-01-01'),
      };

      await saveLandlordProfile(profileWithDates);
      const result = await getLandlordProfile('landlord-123');

      // localStorage serializes dates to strings - only Supabase converts them back
      expect(result?.prsRegistrationDate).toBeDefined();
      expect(result?.prsRegistrationExpiryDate).toBeDefined();
    });
  });

  describe('Renter Profile Storage', () => {
    const mockRenterProfile: RenterProfile = {
      id: 'renter-123',
      email: 'renter@test.com',
      passwordHash: 'hash456',
      status: 'prospective',
      situation: 'Looking to Rent',
      names: 'Test Renter',
      ages: '28',
      localArea: 'Liverpool',
      renterType: 'Professional',
      employmentStatus: 'Full-time',
      monthlyIncome: 3000,
      hasPets: false,
      smokingStatus: 'Non-smoker',
      hasGuarantor: false,
      hasRentalHistory: true,
      isComplete: true,
    };

    it('should save a renter profile to localStorage', async () => {
      const result = await saveRenterProfile(mockRenterProfile);

      expect(result).toEqual(mockRenterProfile);
      const stored = localStorage.getItem('renter-profile-renter-123');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(mockRenterProfile);
    });

    it('should retrieve a renter profile from localStorage', async () => {
      await saveRenterProfile(mockRenterProfile);

      const result = await getRenterProfile('renter-123');

      expect(result).toEqual(mockRenterProfile);
    });

    it('should return null for non-existent renter profile', async () => {
      const result = await getRenterProfile('non-existent-id');

      expect(result).toBeNull();
    });

    it('should update an existing renter profile', async () => {
      await saveRenterProfile(mockRenterProfile);

      const updatedProfile = {
        ...mockRenterProfile,
        monthlyIncome: 3500,
        hasPets: true,
        petDetails: '1 cat',
      };

      await saveRenterProfile(updatedProfile);
      const result = await getRenterProfile('renter-123');

      expect(result?.monthlyIncome).toBe(3500);
      expect(result?.hasPets).toBe(true);
      expect(result?.petDetails).toBe('1 cat');
    });

    it('should handle renter profile with preferred move-in date', async () => {
      const profileWithDate: RenterProfile = {
        ...mockRenterProfile,
        preferredMoveInDate: new Date('2025-03-01'),
      };

      await saveRenterProfile(profileWithDate);
      const result = await getRenterProfile('renter-123');

      // localStorage serializes dates to strings - only Supabase converts them back
      expect(result?.preferredMoveInDate).toBeDefined();
    });

    it('should handle renter profile with housing benefit flags', async () => {
      const profileWithBenefits: RenterProfile = {
        ...mockRenterProfile,
        receivesHousingBenefit: true,
        receivesUniversalCredit: false,
        numberOfChildren: 2,
      };

      await saveRenterProfile(profileWithBenefits);
      const result = await getRenterProfile('renter-123');

      expect(result?.receivesHousingBenefit).toBe(true);
      expect(result?.receivesUniversalCredit).toBe(false);
      expect(result?.numberOfChildren).toBe(2);
    });
  });

  describe('Agency Profile Storage', () => {
    const mockAgencyProfile: AgencyProfile = {
      id: 'agency-123',
      email: 'agency@test.com',
      passwordHash: 'hash789',
      agencyType: 'management_agency',
      companyName: 'Test Property Management',
      registrationNumber: 'REG123456',
      primaryContactName: 'Agency Manager',
      phone: '01234567890',
      address: {
        street: '123 Business Street',
        city: 'Liverpool',
        postcode: 'L1 1AA',
      },
      serviceAreas: ['Liverpool', 'Southport'],
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
      },
      propertyOmbudsmanMember: true,
      isActive: true,
      isComplete: true,
    };

    it('should save an agency profile to localStorage', async () => {
      const result = await saveAgencyProfile(mockAgencyProfile);

      expect(result).toEqual(mockAgencyProfile);
      const stored = localStorage.getItem('get-on-agency-profiles');
      expect(stored).not.toBeNull();
      const profiles = JSON.parse(stored!);
      expect(profiles).toHaveLength(1);
      expect(profiles[0]).toEqual(mockAgencyProfile);
    });

    it('should retrieve an agency profile from localStorage', async () => {
      await saveAgencyProfile(mockAgencyProfile);

      const result = await getAgencyProfile('agency-123');

      expect(result).toEqual(mockAgencyProfile);
    });

    it('should return null for non-existent agency profile', async () => {
      const result = await getAgencyProfile('non-existent-id');

      expect(result).toBeNull();
    });

    it('should update an existing agency profile', async () => {
      await saveAgencyProfile(mockAgencyProfile);

      const updatedProfile = {
        ...mockAgencyProfile,
        companyName: 'Updated Property Management',
        totalPropertiesManaged: 5,
      };

      await saveAgencyProfile(updatedProfile);
      const result = await getAgencyProfile('agency-123');

      expect(result?.companyName).toBe('Updated Property Management');
      expect(result?.totalPropertiesManaged).toBe(5);
    });

    it('should handle estate agent agency type', async () => {
      const estateAgentProfile: AgencyProfile = {
        ...mockAgencyProfile,
        id: 'estate-agent-123',
        agencyType: 'estate_agent',
        companyName: 'Best Estate Agents',
      };

      await saveAgencyProfile(estateAgentProfile);
      const result = await getAgencyProfile('estate-agent-123');

      expect(result?.agencyType).toBe('estate_agent');
      expect(result?.companyName).toBe('Best Estate Agents');
    });

    it('should handle agency profile with insurance details', async () => {
      const profileWithInsurance: AgencyProfile = {
        ...mockAgencyProfile,
        insuranceDetails: {
          provider: 'Zurich Insurance',
          policyNumber: 'POL-999888',
          expiryDate: new Date('2025-12-31'),
        },
      };

      await saveAgencyProfile(profileWithInsurance);
      const result = await getAgencyProfile('agency-123');

      expect(result?.insuranceDetails?.provider).toBe('Zurich Insurance');
      expect(result?.insuranceDetails?.policyNumber).toBe('POL-999888');
      // localStorage serializes dates to strings - only Supabase converts them back
      expect(result?.insuranceDetails?.expiryDate).toBeDefined();
    });

    it('should store multiple agency profiles independently', async () => {
      const agency1 = { ...mockAgencyProfile, id: 'agency-1' };
      const agency2 = { ...mockAgencyProfile, id: 'agency-2', companyName: 'Second Agency' };

      await saveAgencyProfile(agency1);
      await saveAgencyProfile(agency2);

      const result1 = await getAgencyProfile('agency-1');
      const result2 = await getAgencyProfile('agency-2');

      expect(result1?.id).toBe('agency-1');
      expect(result2?.id).toBe('agency-2');
      expect(result2?.companyName).toBe('Second Agency');
    });
  });

  describe('Property Storage', () => {
    const mockProperty: Property = {
      id: 'property-123',
      landlordId: 'landlord-123',
      address: {
        street: '123 Test Street',
        city: 'Liverpool',
        postcode: 'L1 1AA',
        council: 'Liverpool City Council',
      },
      rentPcm: 1200,
      deposit: 1200,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'Flat',
      description: 'Modern 2-bed flat in city centre',
      epcRating: 'B',
      images: ['image1.jpg'],
      features: ['Parking', 'Garden'],
      furnishing: 'Furnished',
      availableFrom: '2025-03-01',
      tenancyType: 'Periodic',
      maxOccupants: 4,
      petsPolicy: 'No Pets',
      bills: {
        councilTaxBand: 'B',
        gasElectricIncluded: false,
        waterIncluded: false,
        internetIncluded: true,
      },
      meetsDecentHomesStandard: true,
      awaabsLawCompliant: true,
      prsPropertyRegistrationStatus: 'active',
      canBeMarketed: true,
      isAvailable: true,
      listingDate: '2025-01-01',
      preferredMinimumStay: 12,
      acceptsShortTermTenants: false,
    };

    it('should save a property to localStorage', async () => {
      const result = await saveProperty(mockProperty);

      expect(result).toEqual(mockProperty);
      const allProperties = await getAllProperties();
      expect(allProperties).toHaveLength(1);
      expect(allProperties[0]).toEqual(mockProperty);
    });

    it('should retrieve all properties from localStorage', async () => {
      await saveProperty(mockProperty);

      const result = await getAllProperties();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProperty);
    });

    it('should return empty array when no properties exist', async () => {
      const result = await getAllProperties();

      expect(result).toEqual([]);
    });

    it('should update an existing property', async () => {
      await saveProperty(mockProperty);

      const updatedProperty = {
        ...mockProperty,
        rentPcm: 1300,
        description: 'Updated description',
      };

      await saveProperty(updatedProperty);
      const allProperties = await getAllProperties();

      expect(allProperties).toHaveLength(1);
      expect(allProperties[0].rentPcm).toBe(1300);
      expect(allProperties[0].description).toBe('Updated description');
    });

    it('should delete a property from localStorage', async () => {
      await saveProperty(mockProperty);
      let allProperties = await getAllProperties();
      expect(allProperties).toHaveLength(1);

      await deleteProperty('property-123');
      allProperties = await getAllProperties();

      expect(allProperties).toHaveLength(0);
    });

    it('should store multiple properties independently', async () => {
      const property1 = { ...mockProperty, id: 'property-1' };
      const property2 = { ...mockProperty, id: 'property-2', rentPcm: 1500 };

      await saveProperty(property1);
      await saveProperty(property2);

      const allProperties = await getAllProperties();

      expect(allProperties).toHaveLength(2);
      expect(allProperties.find(p => p.id === 'property-1')).toBeDefined();
      expect(allProperties.find(p => p.id === 'property-2')?.rentPcm).toBe(1500);
    });

    it('should handle property with RRA 2025 compliance fields', async () => {
      const compliantProperty: Property = {
        ...mockProperty,
        prsPropertyRegistrationNumber: 'PRS-PROP-12345',
        lastSafetyInspectionDate: new Date('2024-12-01'),
        meetsDecentHomesStandard: true,
        awaabsLawCompliant: true,
      };

      await saveProperty(compliantProperty);
      const allProperties = await getAllProperties();

      expect(allProperties[0].prsPropertyRegistrationNumber).toBe('PRS-PROP-12345');
      // localStorage serializes dates to strings - only Supabase converts them back
      expect(allProperties[0].lastSafetyInspectionDate).toBeDefined();
      expect(allProperties[0].meetsDecentHomesStandard).toBe(true);
      expect(allProperties[0].awaabsLawCompliant).toBe(true);
    });

    it('should handle property with bills configuration', async () => {
      const propertyWithBills: Property = {
        ...mockProperty,
        bills: {
          councilTaxBand: 'C',
          gasElectricIncluded: true,
          waterIncluded: true,
          internetIncluded: true,
        },
      };

      await saveProperty(propertyWithBills);
      const allProperties = await getAllProperties();

      expect(allProperties[0].bills?.councilTaxBand).toBe('C');
      expect(allProperties[0].bills?.gasElectricIncluded).toBe(true);
      expect(allProperties[0].bills?.waterIncluded).toBe(true);
      expect(allProperties[0].bills?.internetIncluded).toBe(true);
    });

    it('should handle property without optional fields', async () => {
      const minimalProperty: Property = {
        id: 'minimal-prop',
        landlordId: 'landlord-456',
        address: {
          street: '456 Basic Street',
          city: 'Manchester',
          postcode: 'M1 1AA',
          council: 'Manchester City Council',
        },
        rentPcm: 1000,
        deposit: 1000,
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'Flat',
        description: 'Basic flat',
        epcRating: 'C',
        images: [],
        features: [],
        furnishing: 'Unfurnished',
        tenancyType: 'Periodic',
        petsPolicy: 'No Pets',
        isAvailable: true,
      };

      await saveProperty(minimalProperty);
      const allProperties = await getAllProperties();

      expect(allProperties[0].id).toBe('minimal-prop');
      expect(allProperties[0].bedrooms).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty localStorage gracefully', async () => {
      const landlordResult = await getLandlordProfile('non-existent');
      const renterResult = await getRenterProfile('non-existent');
      const agencyResult = await getAgencyProfile('non-existent');
      const propertiesResult = await getAllProperties();

      expect(landlordResult).toBeNull();
      expect(renterResult).toBeNull();
      expect(agencyResult).toBeNull();
      expect(propertiesResult).toEqual([]);
    });

    it('should handle malformed JSON in localStorage', async () => {
      localStorage.setItem('landlord-profile-test', 'not-valid-json');

      await expect(() => getLandlordProfile('test')).rejects.toThrow();
    });

    it('should handle profile updates without existing data', async () => {
      const mockLandlord: LandlordProfile = {
        id: 'new-landlord',
        email: 'new@test.com',
        passwordHash: 'hash',
        names: 'New Landlord',
        propertyType: 'House',
        isComplete: false,
      };

      await saveLandlordProfile(mockLandlord);
      const result = await getLandlordProfile('new-landlord');

      expect(result).toEqual(mockLandlord);
    });

    it('should handle deleting non-existent property gracefully', async () => {
      await deleteProperty('non-existent-property');
      const allProperties = await getAllProperties();

      expect(allProperties).toEqual([]);
    });

    it('should preserve data integrity across multiple operations', async () => {
      // Save multiple profiles
      await saveLandlordProfile({
        id: 'landlord-1',
        email: 'landlord1@test.com',
        passwordHash: 'hash1',
        names: 'Landlord 1',
        isComplete: true,
      });

      await saveRenterProfile({
        id: 'renter-1',
        email: 'renter1@test.com',
        passwordHash: 'hash2',
        status: 'prospective',
        names: 'Renter 1',
        isComplete: true,
      });

      await saveAgencyProfile({
        id: 'agency-1',
        email: 'agency1@test.com',
        passwordHash: 'hash3',
        agencyType: 'estate_agent',
        companyName: 'Agency 1',
        registrationNumber: 'REG1',
        primaryContactName: 'Contact 1',
        phone: '123',
        address: { street: '1 St', city: 'City', postcode: 'PC1' },
        serviceAreas: [],
        managedPropertyIds: [],
        landlordClientIds: [],
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
        },
        propertyOmbudsmanMember: true,
        isActive: true,
        isComplete: true,
      });

      // Verify all profiles are independent
      const landlord = await getLandlordProfile('landlord-1');
      const renter = await getRenterProfile('renter-1');
      const agency = await getAgencyProfile('agency-1');

      expect(landlord?.email).toBe('landlord1@test.com');
      expect(renter?.email).toBe('renter1@test.com');
      expect(agency?.email).toBe('agency1@test.com');
    });
  });
});
