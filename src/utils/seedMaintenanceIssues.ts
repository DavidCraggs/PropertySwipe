/**
 * Step 7: Seed Maintenance Issues
 * Creates maintenance issues for management agency dashboard
 */

import type { Issue, IssueMessage } from '../types';
import { saveIssue } from '../lib/storage';
import { daysAgo, calculateSLADeadline } from './seedHelpers';
import { GENERATED_IDS } from './seedUserProfiles';
import { PROPERTY_IDS } from './seedProperties';



/**
 * Create Issue 1: Urgent plumbing issue
 */
export async function createIssue1(): Promise<Issue> {
    const raisedAt = daysAgo(3);
    const slaDeadline = calculateSLADeadline(raisedAt, 'urgent');

    const issue: Omit<Issue, 'id'> & { seed_tag: string } = {
        seed_tag: 'seed-issue-001',
        propertyId: PROPERTY_IDS.property2Id,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        agencyId: GENERATED_IDS.managementAgencyId,
        category: 'repair',
        priority: 'urgent',
        subject: "Kitchen tap leaking",
        description: "The kitchen tap has started leaking continuously. Water is dripping even when fully closed. This needs urgent attention as it's wasting water.",
        images: [],
        raisedAt,
        acknowledgedAt: daysAgo(2),
        slaDeadline,
        isOverdue: false,
        status: 'acknowledged',
        statusHistory: [
            {
                status: 'open',
                timestamp: raisedAt,
                updatedBy: GENERATED_IDS.renterId,
            },
            {
                status: 'acknowledged',
                timestamp: daysAgo(2),
                updatedBy: GENERATED_IDS.managementAgencyId,
                notes: 'Plumber scheduled for tomorrow',
            },
        ],
        messages: [
            {
                id: 'seed-issue-msg-001',
                senderId: GENERATED_IDS.renterId,
                senderType: 'renter',
                senderName: 'Test Renter',
                content: "The tap has been dripping for 2 days now, it's getting worse.",
                timestamp: raisedAt,
                isInternal: false,
            },
            {
                id: 'seed-issue-msg-002',
                senderId: GENERATED_IDS.managementAgencyId,
                senderType: 'management_agency',
                senderName: 'PropertyCare Solutions',
                content: "Thanks for reporting. We've contacted our plumber and they'll be there tomorrow morning.",
                timestamp: daysAgo(2),
                isInternal: false,
            },
        ] as IssueMessage[],
        createdAt: raisedAt,
        updatedAt: daysAgo(2),
    };

    return await saveIssue(issue);
}

/**
 * Create Issue 2: Routine heating maintenance
 */
export async function createIssue2(): Promise<Issue> {
    const raisedAt = daysAgo(10);
    const slaDeadline = calculateSLADeadline(raisedAt, 'routine');

    const issue: Omit<Issue, 'id'> & { seed_tag: string } = {
        seed_tag: 'seed-issue-002',
        propertyId: PROPERTY_IDS.property4Id,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        agencyId: GENERATED_IDS.managementAgencyId,
        assignedToAgentId: GENERATED_IDS.managementAgencyId,
        category: 'maintenance',
        priority: 'routine',
        subject: "Annual boiler service due",
        description: "Boiler service is due this month as per gas safety requirements. This is the annual service check.",
        images: [],
        raisedAt,
        acknowledgedAt: daysAgo(9),
        slaDeadline,
        isOverdue: false,
        status: 'in_progress',
        statusHistory: [
            {
                status: 'open',
                timestamp: raisedAt,
                updatedBy: GENERATED_IDS.managementAgencyId,
            },
            {
                status: 'acknowledged',
                timestamp: daysAgo(9),
                updatedBy: GENERATED_IDS.managementAgencyId,
            },
            {
                status: 'in_progress',
                timestamp: daysAgo(7),
                updatedBy: GENERATED_IDS.managementAgencyId,
                notes: 'Gas Safe engineer booked',
            },
        ],
        messages: [],
        internalNotes: ['Engineer scheduled for next week', 'Annual service - standard procedure'],
        createdAt: raisedAt,
        updatedAt: daysAgo(7),
    };

    return await saveIssue(issue);
}

/**
 * Create Issue 3: Low priority electrical
 */
export async function createIssue3(): Promise<Issue> {
    const raisedAt = daysAgo(1);
    const slaDeadline = calculateSLADeadline(raisedAt, 'low');

    const issue: Omit<Issue, 'id'> & { seed_tag: string } = {
        seed_tag: 'seed-issue-003',
        propertyId: PROPERTY_IDS.property2Id,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        agencyId: GENERATED_IDS.managementAgencyId,
        category: 'repair',
        priority: 'low',
        subject: "Hallway light bulb replacement",
        description: "The hallway light bulb needs replacing. Not urgent but would be good to fix when possible.",
        images: [],
        raisedAt,
        slaDeadline,
        isOverdue: false,
        status: 'open',
        statusHistory: [
            {
                status: 'open',
                timestamp: raisedAt,
                updatedBy: GENERATED_IDS.renterId,
            },
        ],
        messages: [],
        createdAt: raisedAt,
        updatedAt: raisedAt,
    };

    return await saveIssue(issue);
}

/**
 * Seed all test maintenance issues
 * @returns Number of issues created
 */
export async function seedMaintenanceIssues(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating test maintenance issues...');

    const issues = await Promise.all([
        createIssue1(),
        createIssue2(),
        createIssue3(),
    ]);

    if (verbose) {
        console.log(`[Seed] ✓ Created ${issues.length} maintenance issues:`);
        issues.forEach(i => console.log(`  - ${i.id}: ${i.subject} (${i.status})`));
    }

    return issues.length;
}
