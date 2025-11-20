/**
 * Validation Script for Test Data Seeding
 * Provides comprehensive validation and reporting of seeded test data
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Validation result for a single table
 */
export interface TableValidation {
    tableName: string;
    recordCount: number;
    hasRecords: boolean;
    sampleIds?: string[];
}

/**
 * Complete validation report
 */
export interface ValidationReport {
    isValid: boolean;
    timestamp: string;
    tables: TableValidation[];
    totalRecords: number;
    errors: string[];
    warnings: string[];
}

/**
 * Validate all seeded test data
 * @returns Comprehensive validation report
 */
export async function validateSeeding(verbose: boolean = true): Promise<ValidationReport> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
    }

    if (verbose) {
        console.log('[Validation] =================================');
        console.log('[Validation] Starting Seed Data Validation');
        console.log('[Validation] =================================');
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const tables: TableValidation[] = [];
    let totalRecords = 0;

    // Define expected tables and minimum record counts
    const expectedTables = [
        { name: 'renter_profiles', minRecords: 1 },
        { name: 'landlord_profiles', minRecords: 1 },
        { name: 'agency_profiles', minRecords: 2 }, // Estate agent + Management agency
        { name: 'properties', minRecords: 5 },
        { name: 'matches', minRecords: 4 },
        { name: 'issues', minRecords: 1 },
        { name: 'ratings', minRecords: 2 },
        { name: 'agency_property_links', minRecords: 10 }, // 5 properties × 2 agencies
        { name: 'agency_link_invitations', minRecords: 4 },
    ];

    // Validate each table
    for (const { name, minRecords } of expectedTables) {
        try {
            const { data, error, count } = await supabase
                .from(name)
                .select('id', { count: 'exact' })
                .not('seed_tag', 'is', null)
                .limit(5);

            if (error) {
                errors.push(`Failed to query ${name}: ${error.message}`);
                tables.push({
                    tableName: name,
                    recordCount: 0,
                    hasRecords: false,
                });
                continue;
            }

            const recordCount = count || 0;
            totalRecords += recordCount;

            const validation: TableValidation = {
                tableName: name,
                recordCount,
                hasRecords: recordCount > 0,
                sampleIds: data?.map(r => r.id) || [],
            };

            tables.push(validation);

            // Check if minimum records met
            if (recordCount < minRecords) {
                warnings.push(
                    `${name}: Expected at least ${minRecords} records, found ${recordCount}`
                );
            }

            if (verbose) {
                const status = recordCount >= minRecords ? '✓' : '⚠';
                console.log(`[Validation] ${status} ${name}: ${recordCount} records`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push(`Exception validating ${name}: ${errorMessage}`);
            tables.push({
                tableName: name,
                recordCount: 0,
                hasRecords: false,
            });
        }
    }

    // Additional validation checks
    if (verbose) console.log('[Validation] Running relationship checks...');

    // Check that properties have agency IDs
    try {
        const { data: propertiesWithoutAgencies } = await supabase
            .from('properties')
            .select('id')
            .not('seed_tag', 'is', null)
            .or('managing_agency_id.is.null,marketing_agent_id.is.null');

        if (propertiesWithoutAgencies && propertiesWithoutAgencies.length > 0) {
            warnings.push(
                `${propertiesWithoutAgencies.length} properties missing agency IDs`
            );
        } else if (verbose) {
            console.log('[Validation] ✓ All properties have agency IDs');
        }
    } catch (error) {
        errors.push('Failed to validate property agency relationships');
    }

    // Check that matches have agency IDs
    try {
        const { data: matchesWithoutAgencies } = await supabase
            .from('matches')
            .select('id')
            .not('seed_tag', 'is', null)
            .or('managing_agency_id.is.null,marketing_agent_id.is.null');

        if (matchesWithoutAgencies && matchesWithoutAgencies.length > 0) {
            warnings.push(
                `${matchesWithoutAgencies.length} matches missing agency IDs`
            );
        } else if (verbose) {
            console.log('[Validation] ✓ All matches have agency IDs');
        }
    } catch (error) {
        errors.push('Failed to validate match agency relationships');
    }

    // Determine overall validity
    const isValid = errors.length === 0 && totalRecords > 0;

    if (verbose) {
        console.log('[Validation] =================================');
        console.log(`[Validation] Validation ${isValid ? 'PASSED' : 'FAILED'}`);
        console.log(`[Validation] Total Records: ${totalRecords}`);
        console.log(`[Validation] Errors: ${errors.length}`);
        console.log(`[Validation] Warnings: ${warnings.length}`);
        console.log('[Validation] =================================');

        if (errors.length > 0) {
            console.error('[Validation] Errors:');
            errors.forEach(err => console.error(`  - ${err}`));
        }

        if (warnings.length > 0) {
            console.warn('[Validation] Warnings:');
            warnings.forEach(warn => console.warn(`  - ${warn}`));
        }
    }

    return {
        isValid,
        timestamp: new Date().toISOString(),
        tables,
        totalRecords,
        errors,
        warnings,
    };
}

/**
 * Clear all test data (convenience function)
 * @returns Number of records deleted
 */
export async function clearAllTestData(verbose: boolean = true): Promise<number> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
    }

    if (verbose) {
        console.log('[Cleanup] Clearing all test data...');
    }

    let totalDeleted = 0;
    const tables = [
        'agency_link_invitations',
        'ratings',
        'issues',
        'matches',
        'agency_property_links',
        'properties',
        'renter_profiles',
        'landlord_profiles',
        'agency_profiles',
    ];

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .delete()
                .not('seed_tag', 'is', null)
                .select();

            if (error) {
                if (verbose) {
                    console.error(`[Cleanup] Error deleting from ${table}:`, error.message);
                }
                continue;
            }

            const deletedCount = data?.length || 0;
            totalDeleted += deletedCount;

            if (verbose && deletedCount > 0) {
                console.log(`[Cleanup] ✓ Deleted ${deletedCount} records from ${table}`);
            }
        } catch (error) {
            if (verbose) {
                console.error(`[Cleanup] Failed to clear ${table}:`, error);
            }
        }
    }

    if (verbose) {
        console.log(`[Cleanup] ✓ Cleared ${totalDeleted} total records`);
    }

    return totalDeleted;
}

/**
 * Get summary statistics for seeded data
 */
export async function getSeedingStats(): Promise<Record<string, number>> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
    }

    const stats: Record<string, number> = {};
    const tables = [
        'renter_profiles',
        'landlord_profiles',
        'agency_profiles',
        'properties',
        'matches',
        'issues',
        'ratings',
        'agency_property_links',
        'agency_link_invitations',
    ];

    for (const table of tables) {
        try {
            const { count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .not('seed_tag', 'is', null);

            stats[table] = count || 0;
        } catch (error) {
            stats[table] = 0;
        }
    }

    return stats;
}
