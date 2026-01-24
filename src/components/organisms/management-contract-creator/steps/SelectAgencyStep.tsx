/**
 * SelectAgencyStep - Choose an agency for the management contract
 */

import { useState, useEffect } from 'react';
import { Building2, Search, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import type { AgencyProfile } from '../../../../types';

interface SelectAgencyStepProps {
  landlordId: string;
  selectedAgencyId?: string;
  onSelect: (agencyId: string) => void;
}

export function SelectAgencyStep({
  landlordId,
  selectedAgencyId,
  onSelect,
}: SelectAgencyStepProps) {
  const [linkedAgencies, setLinkedAgencies] = useState<AgencyProfile[]>([]);
  const [searchResults, setSearchResults] = useState<AgencyProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load linked agencies on mount
  useEffect(() => {
    loadLinkedAgencies();
  }, [landlordId]);

  async function loadLinkedAgencies() {
    try {
      setLoading(true);
      // Get agencies linked to this landlord
      const { data: links, error: linksError } = await supabase
        .from('agency_property_links')
        .select('agency_id')
        .eq('landlord_id', landlordId)
        .eq('is_active', true);

      if (linksError) throw linksError;

      if (links && links.length > 0) {
        const agencyIds = [...new Set(links.map(l => l.agency_id))];
        const { data: agencies, error: agenciesError } = await supabase
          .from('agency_profiles')
          .select('*')
          .in('id', agencyIds);

        if (agenciesError) throw agenciesError;
        setLinkedAgencies(agencies || []);
      }
    } catch (err) {
      console.error('Failed to load linked agencies:', err);
      setError('Failed to load your linked agencies');
    } finally {
      setLoading(false);
    }
  }

  async function searchAgencies(query: string) {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const { data, error: searchError } = await supabase
        .from('agency_profiles')
        .select('*')
        .or(`company_name.ilike.%${query}%,trading_name.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      if (searchError) throw searchError;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Failed to search agencies:', err);
    } finally {
      setIsSearching(false);
    }
  }

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchAgencies(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building2 className="mx-auto h-12 w-12 text-primary-500 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Select an Agency</h2>
        <p className="mt-2 text-neutral-600">
          Choose a management agency to create a contract with
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search agencies by name..."
          className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-colors"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger-50 text-danger-700 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Linked agencies section */}
      {searchQuery.length < 2 && linkedAgencies.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">
            Your Linked Agencies
          </h3>
          <div className="space-y-2">
            {linkedAgencies.map(agency => (
              <AgencyCard
                key={agency.id}
                agency={agency}
                isSelected={selectedAgencyId === agency.id}
                onSelect={() => onSelect(agency.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {searchQuery.length >= 2 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">
            Search Results
          </h3>
          {searchResults.length === 0 ? (
            <p className="text-center text-neutral-500 py-8">
              No agencies found matching "{searchQuery}"
            </p>
          ) : (
            <div className="space-y-2">
              {searchResults.map(agency => (
                <AgencyCard
                  key={agency.id}
                  agency={agency}
                  isSelected={selectedAgencyId === agency.id}
                  onSelect={() => onSelect(agency.id)}
                  isLinked={linkedAgencies.some(a => a.id === agency.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {searchQuery.length < 2 && linkedAgencies.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <p className="text-neutral-600">
            You don't have any linked agencies yet.
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Search for an agency to create a new contract.
          </p>
        </div>
      )}
    </div>
  );
}

interface AgencyCardProps {
  agency: AgencyProfile;
  isSelected: boolean;
  onSelect: () => void;
  isLinked?: boolean;
}

function AgencyCard({ agency, isSelected, onSelect, isLinked }: AgencyCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-neutral-200 bg-white hover:border-primary-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-neutral-900">
              {agency.tradingName || agency.companyName}
            </h4>
            {isLinked && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                Linked
              </span>
            )}
          </div>
          {agency.tradingName && agency.companyName !== agency.tradingName && (
            <p className="text-sm text-neutral-500">{agency.companyName}</p>
          )}
          <p className="text-sm text-neutral-600 mt-1">
            {agency.serviceAreas?.join(', ') || 'Service areas not specified'}
          </p>
          {agency.primaryContactName && (
            <p className="text-xs text-neutral-500 mt-2">
              Contact: {agency.primaryContactName}
            </p>
          )}
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-primary-500' : 'bg-neutral-200'
        }`}>
          {isSelected && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>
    </button>
  );
}
