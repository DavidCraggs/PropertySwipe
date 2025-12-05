/**
 * Test Data Seeding System for GetOn Rental Platform
 * 
 * This module provides comprehensive test data seeding functionality for Supabase.
 * All seed data uses 'seed-' prefix for easy identification and cleanup.
 * 
 * @module seedTestData
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Result of a seeding operation
 */
export interface SeedingStepResult {
    name: string;
    success: boolean;
    recordsCreated: number;
    duration: number;
    error?: string;
}

/**
 * Complete seeding result
 */
export interface SeedingResult {
    success: boolean;
    steps: SeedingStepResult[];
    totalRecords: number;
    totalDuration: number;
    errors?: string[];
}

export interface SeedingOptions {
    clearExisting?: boolean;
    verbose?: boolean;
}
export async function checkSupabaseConnection(): Promise<void> {
    if (!isSupabaseConfigured()) {
        throw new Error(
            'Supabase is not configured. Seed data requires Supabase connection. ' +
            'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
        );
    }

    // Test the connection with a simple query
    try {
        const { error } = await supabase.from('properties').select('count').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
            throw error;
        }
    } catch (error) {
        console.error('[Seed] Supabase connection test failed:', error);
        throw new Error('Failed to connect to Supabase. Please check your connection.');
    }

    console.log('[Seed] ✓ Supabase connection verified');
}

/**
 * Clear all existing seed data from Supabase
 * Deletes records with seed_tag set
 */
export async function clearSeedData(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Clearing existing seed data...');

    let totalDeleted = 0;
    const tables = [
        'agency_link_invitations',
        'ratings',
        'issues',
        'conversations',
        'matches',
        'agency_property_links',
        'properties',
        'renter_profiles',
        'landlord_profiles',
        'agency_profiles',
    ];

    for (const table of tables) {
        try {
            // Delete records where seed_tag is not null
            const { data, error } = await supabase
                .from(table)
                .delete()
                .not('seed_tag', 'is', null)
                .select();

            if (error) {
                if (verbose) {
                    console.error(`[Seed] Error deleting from ${table}:`, error);
                }
                continue;
            }

            const deletedCount = data?.length || 0;
            totalDeleted += deletedCount;

            if (verbose && deletedCount > 0) {
                console.log(`[Seed] Deleted ${deletedCount} records from ${table}`);
            }
        } catch (error) {
            if (verbose) {
                console.error(`[Seed] Failed to clear ${table}:`, error);
            }
        }
    }

    if (verbose) console.log(`[Seed] ✓ Cleared ${totalDeleted} seed records`);
    return totalDeleted;
}

/**
 * Verify that seed data was created successfully
 */
export async function verifySeedData(verbose: boolean = false): Promise<{
    isValid: boolean;
    counts: Record<string, number>;
    errors: string[];
}> {
    if (verbose) console.log('[Seed] Verifying seed data...');

    const counts: Record<string, number> = {};
    const errors: string[] = [];

    const tables = [
        'renter_profiles',
        'landlord_profiles',
        'agency_profiles',
        'properties',
        'matches',
        'conversations',
        'issues',
        'ratings',
    ];

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .not('seed_tag', 'is', null);

            if (error) {
                errors.push(`Failed to count ${table}: ${error.message}`);
                counts[table] = 0;
            } else {
                counts[table] = count || 0;
            }
        } catch (error) {
            errors.push(`Exception counting ${table}: ${String(error)}`);
            counts[table] = 0;
        }
    }

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const isValid = totalRecords > 0 && errors.length === 0;

    if (verbose) {
        console.log('[Seed] Verification results:');
        for (const [table, count] of Object.entries(counts)) {
            console.log(`  - ${table}: ${count} records`);
        }
        if (errors.length > 0) {
            console.error('[Seed] Verification errors:', errors);
        }
    }

    return { isValid, counts, errors };
}

/**
 * Execute a seeding step with timing and error handling
 */
export async function executeStep(
    name: string,
    fn: () => Promise<number>,
    verbose: boolean = false
): Promise<SeedingStepResult> {
    if (verbose) console.log(`[Seed] Starting step: ${name}...`);

    const startTime = Date.now();

    try {
        const recordsCreated = await fn();
        const duration = Date.now() - startTime;

        if (verbose) {
            console.log(`[Seed] ✓ ${name} completed in ${duration}ms (${recordsCreated} records)`);
        }

        return {
            name,
            success: true,
            recordsCreated,
            duration,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error(`[Seed] ✗ ${name} failed:`, errorMessage);

        return {
            name,
            success: false,
            recordsCreated: 0,
            duration,
            error: errorMessage,
        };
    }
}

/**
 * Rollback seed data if seeding fails
 * This is called when a critical error occurs during seeding
 */
export async function rollbackSeedData(verbose: boolean = false): Promise<void> {
    if (verbose) console.log('[Seed] Rolling back seed data due to error...');

    try {
        await clearSeedData(verbose);
        if (verbose) console.log('[Seed] ✓ Rollback completed');
    } catch (error) {
        console.error('[Seed] ✗ Rollback failed:', error);
    }
}

/**
 * Main seeding orchestration function
 * Executes all seeding steps in order with error handling
 */
export async function seedAllTestData(
    options: SeedingOptions = {}
): Promise<SeedingResult> {
    const { clearExisting = true, verbose = true } = options;

    if (verbose) {
        console.log('[Seed] =================================');
        console.log('[Seed] Starting Test Data Seeding');
        console.log('[Seed] =================================');
    }

    const startTime = Date.now();
    const steps: SeedingStepResult[] = [];
    const errors: string[] = [];

    try {
        // Step 0: Check Supabase connection
        await checkSupabaseConnection();

        // Step 1: Clear existing seed data if requested
        if (clearExisting) {
            const result = await executeStep(
                'Clear Existing Seed Data',
                async () => {
                    const deleted = await clearSeedData(verbose);
                    return deleted;
                },
                verbose
            );
            steps.push(result);
        }

        // Step 2: Seed user profiles
        const userResult = await executeStep(
            'Seed User Profiles',
            async () => {
                const { seedUserProfiles } = await import('./seedUserProfiles');
                return await seedUserProfiles(verbose);
            },
            verbose
        );
        steps.push(userResult);
        if (!userResult.success) throw new Error('Failed to seed user profiles');

        // Step 3: Seed properties
        const propertyResult = await executeStep(
            'Seed Properties',
            async () => {
                const { seedProperties } = await import('./seedProperties');
                return await seedProperties(verbose);
            },
            verbose
        );
        steps.push(propertyResult);
        if (!propertyResult.success) throw new Error('Failed to seed properties');

        // Step 4: Seed matches
        const matchResult = await executeStep(
            'Seed Matches',
            async () => {
                const { seedMatches } = await import('./seedMatches');
                return await seedMatches(verbose);
            },
            verbose
        );
        steps.push(matchResult);
        if (!matchResult.success) throw new Error('Failed to seed matches');

        // Step 5: Seed conversations
        const conversationResult = await executeStep(
            'Seed Conversations',
            async () => {
                const { seedConversations } = await import('./seedConversations');
                return await seedConversations(verbose);
            },
            verbose
        );
        steps.push(conversationResult);
        // Note: Don't fail if conversations seed fails, continue with other steps

        // Step 6: Seed messages  
        const messageResult = await executeStep(
            'Seed Messages',
            async () => {
                const { seedMessages } = await import('./seedMessages');
                return await seedMessages(verbose);
            },
            verbose
        );
        steps.push(messageResult);
        if (!messageResult.success) throw new Error('Failed to seed messages');

        // Step 6: Seed viewing requests
        const viewingResult = await executeStep(
            'Seed Viewing Requests',
            async () => {
                const { seedViewingRequests } = await import('./seedViewingRequests');
                return await seedViewingRequests(verbose);
            },
            verbose
        );
        steps.push(viewingResult);
        if (!viewingResult.success) throw new Error('Failed to seed viewings');

        // Step 7: Seed maintenance issues
        const issueResult = await executeStep(
            'Seed Maintenance Issues',
            async () => {
                const { seedMaintenanceIssues } = await import('./seedMaintenanceIssues');
                return await seedMaintenanceIssues(verbose);
            },
            verbose
        );
        steps.push(issueResult);
        if (!issueResult.success) throw new Error('Failed to seed issues');

        // Step 8: Seed ratings
        const ratingResult = await executeStep(
            'Seed Ratings',
            async () => {
                const { seedRatings } = await import('./seedRatings');
                return await seedRatings(verbose);
            },
            verbose
        );
        steps.push(ratingResult);
        if (!ratingResult.success) throw new Error('Failed to seed ratings');

        // Step 9: Seed agency relationships
        const agencyRelationshipResult = await executeStep(
            'Seed Agency Relationships',
            async () => {
                const { seedAgencyRelationships } = await import('./seedAgencyRelationships');
                return await seedAgencyRelationships(verbose);
            },
            verbose
        );
        steps.push(agencyRelationshipResult);
        if (!agencyRelationshipResult.success) throw new Error('Failed to seed agency relationships');

        // Step 10: Seed agency invitations
        const agencyInvitationResult = await executeStep(
            'Seed Agency Invitations',
            async () => {
                const { seedAgencyInvitations } = await import('./seedAgencyInvitations');
                return await seedAgencyInvitations(verbose);
            },
            verbose
        );
        steps.push(agencyInvitationResult);
        if (!agencyInvitationResult.success) throw new Error('Failed to seed agency invitations');

        // Final verification
        const verificationResult = await executeStep(
            'Verify Seed Data',
            async () => {
                const { isValid, counts } = await verifySeedData(verbose);
                if (!isValid) {
                    throw new Error('Seed data verification failed');
                }
                return Object.values(counts).reduce((sum, count) => sum + count, 0);
            },
            verbose
        );
        steps.push(verificationResult);

        // Calculate totals
        const totalRecords = steps.reduce((sum, step) => sum + step.recordsCreated, 0);
        const totalDuration = Date.now() - startTime;
        const success = steps.every((step) => step.success);

        // Collect errors
        for (const step of steps) {
            if (step.error) {
                errors.push(`${step.name}: ${step.error}`);
            }
        }

        if (verbose) {
            console.log('[Seed] =================================');
            console.log(`[Seed] Seeding ${success ? 'COMPLETED' : 'FAILED'}`);
            console.log(`[Seed] Total Records: ${totalRecords}`);
            console.log(`[Seed] Total Duration: ${totalDuration}ms`);
            console.log('[Seed] =================================');
        }

        return {
            success,
            steps,
            totalRecords,
            totalDuration,
            errors,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(errorMessage);

        if (verbose) {
            console.error('[Seed] Critical error during seeding:', errorMessage);
        }

        // Attempt rollback on critical error
        if (clearExisting) {
            await rollbackSeedData(verbose);
        }

        return {
            success: false,
            steps,
            totalRecords: 0,
            totalDuration: Date.now() - startTime,
            errors,
        };
    }
}
