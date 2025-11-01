/**
 * Storage abstraction layer
 * Automatically uses Supabase when configured, falls back to localStorage
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { VendorProfile, BuyerProfile, Property, Match } from '../types';

// =====================================================
// VENDOR PROFILES
// =====================================================

export const saveVendorProfile = async (profile: VendorProfile): Promise<VendorProfile> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('vendor_profiles')
      .upsert({
        id: profile.id,
        names: profile.names,
        property_type: profile.propertyType,
        looking_for: profile.lookingFor,
        preferred_purchase_type: profile.preferredPurchaseType,
        estate_agent_link: profile.estateAgentLink,
        property_id: profile.propertyId,
        is_complete: profile.isComplete,
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  } else {
    // Fallback to localStorage
    localStorage.setItem(`vendor-profile-${profile.id}`, JSON.stringify(profile));
    return profile;
  }
};

export const getVendorProfile = async (id: string): Promise<VendorProfile | null> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      names: data.names,
      propertyType: data.property_type,
      lookingFor: data.looking_for,
      preferredPurchaseType: data.preferred_purchase_type,
      estateAgentLink: data.estate_agent_link,
      propertyId: data.property_id,
      createdAt: new Date(data.created_at),
      isComplete: data.is_complete,
    };
  } else {
    const stored = localStorage.getItem(`vendor-profile-${id}`);
    return stored ? JSON.parse(stored) : null;
  }
};

// =====================================================
// BUYER PROFILES
// =====================================================

export const saveBuyerProfile = async (profile: BuyerProfile): Promise<BuyerProfile> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('buyer_profiles')
      .upsert({
        id: profile.id,
        situation: profile.situation,
        names: profile.names,
        ages: profile.ages,
        local_area: profile.localArea,
        buyer_type: profile.buyerType,
        purchase_type: profile.purchaseType,
        is_complete: profile.isComplete,
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  } else {
    localStorage.setItem(`buyer-profile-${profile.id}`, JSON.stringify(profile));
    return profile;
  }
};

export const getBuyerProfile = async (id: string): Promise<BuyerProfile | null> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('buyer_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      situation: data.situation,
      names: data.names,
      ages: data.ages,
      localArea: data.local_area,
      buyerType: data.buyer_type,
      purchaseType: data.purchase_type,
      createdAt: new Date(data.created_at),
      isComplete: data.is_complete,
    };
  } else {
    const stored = localStorage.getItem(`buyer-profile-${id}`);
    return stored ? JSON.parse(stored) : null;
  }
};

// =====================================================
// PROPERTIES
// =====================================================

export const saveProperty = async (property: Property): Promise<Property> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('properties')
      .upsert({
        id: property.id,
        vendor_id: property.vendorId,
        street: property.address.street,
        city: property.address.city,
        postcode: property.address.postcode,
        council: property.address.council,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        property_type: property.propertyType,
        square_footage: property.squareFootage,
        year_built: property.yearBuilt,
        description: property.description,
        epc_rating: property.epcRating,
        tenure: property.tenure,
        images: property.images,
        features: property.features,
        listing_date: property.listingDate,
      })
      .select()
      .single();

    if (error) throw error;
    return property;
  } else {
    // Fallback to localStorage
    const allProperties = await getAllProperties();
    const index = allProperties.findIndex(p => p.id === property.id);
    if (index >= 0) {
      allProperties[index] = property;
    } else {
      allProperties.push(property);
    }
    localStorage.setItem('properties', JSON.stringify(allProperties));
    return property;
  }
};

export const getAllProperties = async (): Promise<Property[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      vendorId: d.vendor_id || '',
      address: {
        street: d.street,
        city: d.city,
        postcode: d.postcode,
        council: d.council,
      },
      price: d.price,
      bedrooms: d.bedrooms,
      bathrooms: d.bathrooms,
      propertyType: d.property_type,
      squareFootage: d.square_footage,
      yearBuilt: d.year_built,
      description: d.description,
      epcRating: d.epc_rating,
      tenure: d.tenure,
      images: d.images,
      features: d.features,
      listingDate: d.listing_date,
    }));
  } else {
    const stored = localStorage.getItem('properties');
    return stored ? JSON.parse(stored) : [];
  }
};

export const deleteProperty = async (id: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } else {
    const allProperties = await getAllProperties();
    const filtered = allProperties.filter(p => p.id !== id);
    localStorage.setItem('properties', JSON.stringify(filtered));
  }
};

// =====================================================
// MATCHES
// =====================================================

export const saveMatch = async (match: Match): Promise<Match> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('matches')
      .upsert({
        id: match.id,
        property_id: match.propertyId,
        vendor_id: match.vendorId,
        buyer_id: match.buyerId,
        buyer_name: match.buyerName,
        buyer_profile: match.buyerProfile,
        messages: match.messages,
        last_message_at: match.lastMessageAt,
        unread_count: match.unreadCount,
        has_viewing_scheduled: match.hasViewingScheduled,
        confirmed_viewing_date: match.confirmedViewingDate,
        viewing_preference: match.viewingPreference,
      })
      .select()
      .single();

    if (error) throw error;
    return match;
  } else {
    const allMatches = await getAllMatches();
    const index = allMatches.findIndex(m => m.id === match.id);
    if (index >= 0) {
      allMatches[index] = match;
    } else {
      allMatches.push(match);
    }
    localStorage.setItem('matches', JSON.stringify(allMatches));
    return match;
  }
};

export const getAllMatches = async (): Promise<Match[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        property:properties(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      propertyId: d.property_id,
      property: d.property ? {
        id: d.property.id,
        vendorId: d.property.vendor_id || '',
        address: {
          street: d.property.street,
          city: d.property.city,
          postcode: d.property.postcode,
          council: d.property.council,
        },
        price: d.property.price,
        bedrooms: d.property.bedrooms,
        bathrooms: d.property.bathrooms,
        propertyType: d.property.property_type,
        squareFootage: d.property.square_footage,
        yearBuilt: d.property.year_built,
        description: d.property.description,
        epcRating: d.property.epc_rating,
        tenure: d.property.tenure,
        images: d.property.images,
        features: d.property.features,
        listingDate: d.property.listing_date,
      } : {} as any,
      vendorId: d.vendor_id,
      vendorName: `Vendor ${d.vendor_id?.substring(0, 8)}`,
      buyerId: d.buyer_id,
      buyerName: d.buyer_name,
      buyerProfile: d.buyer_profile,
      timestamp: d.created_at,
      messages: d.messages || [],
      lastMessageAt: d.last_message_at,
      unreadCount: d.unread_count,
      hasViewingScheduled: d.has_viewing_scheduled,
      confirmedViewingDate: d.confirmed_viewing_date ? new Date(d.confirmed_viewing_date) : undefined,
      viewingPreference: d.viewing_preference,
    }));
  } else {
    const stored = localStorage.getItem('matches');
    return stored ? JSON.parse(stored) : [];
  }
};
