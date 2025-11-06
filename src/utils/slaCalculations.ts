/**
 * Phase 7: SLA (Service Level Agreement) Calculation Utilities
 * Functions for calculating SLA deadlines, checking overdue status,
 * measuring response times, and determining compliance rates
 */

import type { IssuePriority, AgencyProfile } from '../types';

/**
 * Calculate the SLA deadline for an issue based on priority and agency configuration
 * @param raisedAt - When the issue was raised
 * @param priority - Issue priority level
 * @param slaConfig - Agency's SLA configuration
 * @returns Date object representing the SLA deadline
 */
export function calculateSLADeadline(
  raisedAt: Date,
  priority: IssuePriority,
  slaConfig: AgencyProfile['slaConfiguration']
): Date {
  const deadline = new Date(raisedAt);

  switch (priority) {
    case 'emergency':
      // Add emergency response hours (e.g., 4 hours)
      deadline.setHours(deadline.getHours() + slaConfig.emergencyResponseHours);
      break;

    case 'urgent':
      // Add urgent response hours (e.g., 24 hours)
      deadline.setHours(deadline.getHours() + slaConfig.urgentResponseHours);
      break;

    case 'routine':
      // Add routine response hours (e.g., 72 hours)
      deadline.setHours(deadline.getHours() + slaConfig.routineResponseHours);
      break;

    case 'low':
      // For low priority, use maintenance response time converted to hours
      deadline.setDate(deadline.getDate() + slaConfig.maintenanceResponseDays);
      break;
  }

  return deadline;
}

/**
 * Check if an issue is overdue based on its SLA deadline and current status
 * @param slaDeadline - The SLA deadline date
 * @param acknowledgedAt - When the issue was acknowledged (undefined if not acknowledged)
 * @param resolvedAt - When the issue was resolved (undefined if not resolved)
 * @returns true if the issue is overdue, false otherwise
 */
export function checkIsOverdue(
  slaDeadline: Date,
  acknowledgedAt?: Date,
  resolvedAt?: Date
): boolean {
  // If already resolved, it's not overdue
  if (resolvedAt) {
    return false;
  }

  // If not yet acknowledged and past deadline, it's overdue
  if (!acknowledgedAt) {
    return new Date() > slaDeadline;
  }

  // If acknowledged but not resolved, check if acknowledged within SLA
  // This is a business decision: we consider "acknowledged within SLA" as meeting SLA
  return new Date(acknowledgedAt) > slaDeadline;
}

/**
 * Calculate the actual response time in hours
 * @param raisedAt - When the issue was raised
 * @param acknowledgedAt - When the issue was acknowledged
 * @returns Response time in hours, or null if not yet acknowledged
 */
export function calculateResponseTime(raisedAt: Date, acknowledgedAt?: Date): number | null {
  if (!acknowledgedAt) {
    return null;
  }

  const diffMs = new Date(acknowledgedAt).getTime() - new Date(raisedAt).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.round(diffHours * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate the resolution time in days
 * @param raisedAt - When the issue was raised
 * @param resolvedAt - When the issue was resolved
 * @returns Resolution time in days, or null if not yet resolved
 */
export function calculateResolutionTime(raisedAt: Date, resolvedAt?: Date): number | null {
  if (!resolvedAt) {
    return null;
  }

  const diffMs = new Date(resolvedAt).getTime() - new Date(raisedAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return Math.round(diffDays * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate SLA compliance rate as a percentage
 * @param totalIssuesRaised - Total number of issues raised
 * @param issuesWithinSLA - Number of issues that were acknowledged/resolved within SLA
 * @returns Compliance rate as a percentage (0-100)
 */
export function calculateSLAComplianceRate(
  totalIssuesRaised: number,
  issuesWithinSLA: number
): number {
  if (totalIssuesRaised === 0) {
    return 100; // No issues = 100% compliance
  }

  const rate = (issuesWithinSLA / totalIssuesRaised) * 100;
  return Math.round(rate * 10) / 10; // Round to 1 decimal place
}

/**
 * Get human-readable SLA display text based on compliance rate
 * Implements the user's requirement:
 * - 80%+ compliance: "usually responds within X hours"
 * - 60-80% compliance: "tries to respond within X+24 hours"
 * - <60% compliance: warning message
 *
 * @param complianceRate - SLA compliance rate (0-100)
 * @param slaHours - Target SLA time in hours
 * @param priority - Priority level for context
 * @returns Object with display text and color indicator
 */
export function getSLADisplayText(
  complianceRate: number,
  slaHours: number
): {
  text: string;
  color: 'success' | 'warning' | 'danger';
  displayHours: number;
} {
  if (complianceRate >= 80) {
    // Excellent compliance
    return {
      text: `usually responds within ${slaHours} hour${slaHours !== 1 ? 's' : ''}`,
      color: 'success',
      displayHours: slaHours,
    };
  } else if (complianceRate >= 60) {
    // Good but not excellent - add 24 hours buffer
    const adjustedHours = slaHours + 24;
    return {
      text: `tries to respond within ${adjustedHours} hour${adjustedHours !== 1 ? 's' : ''}`,
      color: 'warning',
      displayHours: adjustedHours,
    };
  } else {
    // Poor compliance - show warning
    const adjustedHours = slaHours + 48;
    return {
      text: `target response time ${adjustedHours} hour${adjustedHours !== 1 ? 's' : ''} (performance below target)`,
      color: 'danger',
      displayHours: adjustedHours,
    };
  }
}

/**
 * Get the appropriate SLA time for a given priority
 * @param priority - Issue priority
 * @param slaConfig - Agency's SLA configuration
 * @returns SLA time in hours
 */
export function getSLATimeForPriority(
  priority: IssuePriority,
  slaConfig: AgencyProfile['slaConfiguration']
): number {
  switch (priority) {
    case 'emergency':
      return slaConfig.emergencyResponseHours;
    case 'urgent':
      return slaConfig.urgentResponseHours;
    case 'routine':
      return slaConfig.routineResponseHours;
    case 'low':
      return slaConfig.maintenanceResponseDays * 24; // Convert days to hours
  }
}

/**
 * Calculate average response time from a list of response times
 * @param responseTimes - Array of response times in hours (may include nulls)
 * @returns Average response time in hours, or 0 if no data
 */
export function calculateAverageResponseTime(responseTimes: (number | null)[]): number {
  const validTimes = responseTimes.filter((time): time is number => time !== null);

  if (validTimes.length === 0) {
    return 0;
  }

  const sum = validTimes.reduce((acc, time) => acc + time, 0);
  const average = sum / validTimes.length;

  return Math.round(average * 10) / 10; // Round to 1 decimal place
}

/**
 * Determine if an issue is approaching its SLA deadline (within 25% of time remaining)
 * @param slaDeadline - The SLA deadline
 * @param raisedAt - When the issue was raised
 * @returns true if approaching deadline, false otherwise
 */
export function isApproachingSLADeadline(slaDeadline: Date, raisedAt: Date): boolean {
  const now = new Date();
  const totalSLATime = slaDeadline.getTime() - new Date(raisedAt).getTime();
  const timeRemaining = slaDeadline.getTime() - now.getTime();

  // If already past deadline, not "approaching" - it's overdue
  if (timeRemaining <= 0) {
    return false;
  }

  // Approaching if within 25% of time remaining
  const threshold = totalSLATime * 0.25;
  return timeRemaining <= threshold;
}

/**
 * Get color indicator based on SLA compliance rate
 * Per plan: 80%+ green, 60-80% yellow, <60% red
 * @param complianceRate - Compliance rate (0-100)
 * @returns Color indicator string
 */
export function getSLAComplianceColor(complianceRate: number): 'success' | 'warning' | 'danger' {
  if (complianceRate >= 80) return 'success';
  if (complianceRate >= 60) return 'warning';
  return 'danger';
}

/**
 * Format time remaining until deadline in human-readable format
 * @param slaDeadline - The SLA deadline
 * @returns Formatted string like "2h 30m" or "OVERDUE by 1h 15m"
 */
export function formatTimeRemaining(slaDeadline: Date): string {
  const now = new Date();
  const diffMs = slaDeadline.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);

  const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return isOverdue ? `OVERDUE by ${timeStr}` : timeStr;
}

/**
 * Priority-based color mappings (per plan color coding system)
 */
export const PRIORITY_COLORS = {
  emergency: {
    bg: 'bg-danger-100',
    text: 'text-danger-700',
    border: 'border-danger-500',
    hex: '#EF4444',
  },
  urgent: {
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    border: 'border-warning-500',
    hex: '#F59E0B',
  },
  routine: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    border: 'border-success-500',
    hex: '#10B981',
  },
  low: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-500',
    hex: '#6B7280',
  },
} as const;

/**
 * SLA compliance color mappings
 */
export const SLA_COMPLIANCE_COLORS = {
  success: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    border: 'border-success-500',
    hex: '#10B981',
  },
  warning: {
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    border: 'border-warning-500',
    hex: '#F59E0B',
  },
  danger: {
    bg: 'bg-danger-100',
    text: 'text-danger-700',
    border: 'border-danger-500',
    hex: '#EF4444',
  },
} as const;
