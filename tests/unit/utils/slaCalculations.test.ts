/**
 * Tests for SLA (Service Level Agreement) Calculations
 *
 * Tests all SLA calculation utilities including deadline calculation,
 * overdue detection, response/resolution time tracking, and compliance metrics.
 *
 * Coverage:
 * - SLA deadline calculation for all priority levels
 * - Overdue status detection
 * - Response time calculation (hours)
 * - Resolution time calculation (days)
 * - SLA compliance rate calculation
 * - SLA display text generation
 * - Time remaining formatting
 * - Approaching deadline detection
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  calculateSLADeadline,
  checkIsOverdue,
  calculateResponseTime,
  calculateResolutionTime,
  calculateSLAComplianceRate,
  getSLADisplayText,
  getSLATimeForPriority,
  calculateAverageResponseTime,
  isApproachingSLADeadline,
  getSLAComplianceColor,
  formatTimeRemaining,
} from '../../../src/utils/slaCalculations';
import type { AgencyProfile } from '../../../src/types';

describe('SLA Calculations', () => {
  const mockSLAConfig: AgencyProfile['slaConfiguration'] = {
    emergencyResponseHours: 4,
    urgentResponseHours: 24,
    routineResponseHours: 72,
    maintenanceResponseDays: 14,
  };

  describe('SLA Deadline Calculation', () => {
    it('should calculate emergency SLA deadline (4 hours)', () => {
      const raisedAt = new Date('2024-06-01T10:00:00');
      const deadline = calculateSLADeadline(raisedAt, 'emergency', mockSLAConfig);

      const diffHours = (deadline.getTime() - raisedAt.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBe(4); // Exactly 4 hours added
    });

    it('should calculate urgent SLA deadline (24 hours)', () => {
      const raisedAt = new Date('2024-06-01T10:00:00');
      const deadline = calculateSLADeadline(raisedAt, 'urgent', mockSLAConfig);

      const diffHours = (deadline.getTime() - raisedAt.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBe(24); // Exactly 24 hours added
    });

    it('should calculate routine SLA deadline (72 hours / 3 days)', () => {
      const raisedAt = new Date('2024-06-01T10:00:00');
      const deadline = calculateSLADeadline(raisedAt, 'routine', mockSLAConfig);

      const diffHours = (deadline.getTime() - raisedAt.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBe(72); // Exactly 72 hours added
    });

    it('should calculate low priority SLA deadline (14 days)', () => {
      const raisedAt = new Date('2024-06-01T10:00:00');
      const deadline = calculateSLADeadline(raisedAt, 'low', mockSLAConfig);

      const diffDays = (deadline.getTime() - raisedAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(14); // Exactly 14 days added
    });

    it('should handle midnight boundary for emergency', () => {
      const raisedAt = new Date('2024-06-01T22:00:00');
      const deadline = calculateSLADeadline(raisedAt, 'emergency', mockSLAConfig);

      const diffHours = (deadline.getTime() - raisedAt.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBe(4); // Still exactly 4 hours, crossing midnight
      expect(deadline.getDate()).toBeGreaterThan(raisedAt.getDate()); // Crossed to next day
    });

    it('should handle month boundary for low priority', () => {
      const raisedAt = new Date('2024-05-25T10:00:00');
      const deadline = calculateSLADeadline(raisedAt, 'low', mockSLAConfig);

      const diffDays = (deadline.getTime() - raisedAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(14); // Exactly 14 days
      expect(deadline.getMonth()).toBeGreaterThan(raisedAt.getMonth()); // Crossed to next month
    });
  });

  describe('Overdue Detection', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should detect overdue issue (not acknowledged, past deadline)', () => {
      const slaDeadline = new Date('2024-06-01T10:00:00Z');
      vi.setSystemTime(new Date('2024-06-01T12:00:00Z')); // 2 hours past deadline

      const isOverdue = checkIsOverdue(slaDeadline);

      expect(isOverdue).toBe(true);
    });

    it('should not be overdue if acknowledged within SLA', () => {
      const slaDeadline = new Date('2024-06-01T10:00:00Z');
      const acknowledgedAt = new Date('2024-06-01T09:00:00Z'); // 1 hour before deadline

      const isOverdue = checkIsOverdue(slaDeadline, acknowledgedAt);

      expect(isOverdue).toBe(false);
    });

    it('should be overdue if acknowledged after deadline', () => {
      const slaDeadline = new Date('2024-06-01T10:00:00Z');
      const acknowledgedAt = new Date('2024-06-01T11:00:00Z'); // 1 hour after deadline

      const isOverdue = checkIsOverdue(slaDeadline, acknowledgedAt);

      expect(isOverdue).toBe(true);
    });

    it('should not be overdue if resolved (regardless of deadline)', () => {
      const slaDeadline = new Date('2024-06-01T10:00:00Z');
      const acknowledgedAt = new Date('2024-06-01T11:00:00Z');
      const resolvedAt = new Date('2024-06-01T12:00:00Z');

      const isOverdue = checkIsOverdue(slaDeadline, acknowledgedAt, resolvedAt);

      expect(isOverdue).toBe(false);
    });

    it('should not be overdue if not yet reached deadline', () => {
      const slaDeadline = new Date('2024-06-01T10:00:00Z');
      vi.setSystemTime(new Date('2024-06-01T09:00:00Z')); // 1 hour before deadline

      const isOverdue = checkIsOverdue(slaDeadline);

      expect(isOverdue).toBe(false);
    });
  });

  describe('Response Time Calculation', () => {
    it('should calculate response time in hours', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const acknowledgedAt = new Date('2024-06-01T12:30:00Z'); // 2.5 hours later

      const responseTime = calculateResponseTime(raisedAt, acknowledgedAt);

      expect(responseTime).toBe(2.5);
    });

    it('should return null if not yet acknowledged', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');

      const responseTime = calculateResponseTime(raisedAt);

      expect(responseTime).toBeNull();
    });

    it('should handle same-minute acknowledgement', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const acknowledgedAt = new Date('2024-06-01T10:00:30Z'); // 30 seconds later

      const responseTime = calculateResponseTime(raisedAt, acknowledgedAt);

      expect(responseTime).toBe(0); // Less than 1 hour, rounds to 0
    });

    it('should round to 1 decimal place', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const acknowledgedAt = new Date('2024-06-01T12:23:00Z'); // 2.383 hours

      const responseTime = calculateResponseTime(raisedAt, acknowledgedAt);

      expect(responseTime).toBe(2.4); // Rounded to 1 decimal
    });

    it('should handle multi-day response time', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const acknowledgedAt = new Date('2024-06-03T16:00:00Z'); // 54 hours later

      const responseTime = calculateResponseTime(raisedAt, acknowledgedAt);

      expect(responseTime).toBe(54);
    });
  });

  describe('Resolution Time Calculation', () => {
    it('should calculate resolution time in days', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const resolvedAt = new Date('2024-06-04T10:00:00Z'); // 3 days later

      const resolutionTime = calculateResolutionTime(raisedAt, resolvedAt);

      expect(resolutionTime).toBe(3);
    });

    it('should return null if not yet resolved', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');

      const resolutionTime = calculateResolutionTime(raisedAt);

      expect(resolutionTime).toBeNull();
    });

    it('should handle same-day resolution', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const resolvedAt = new Date('2024-06-01T16:00:00Z'); // 6 hours later

      const resolutionTime = calculateResolutionTime(raisedAt, resolvedAt);

      expect(resolutionTime).toBe(0.3); // 0.25 days, rounded to 0.3
    });

    it('should round to 1 decimal place', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const resolvedAt = new Date('2024-06-04T04:00:00Z'); // 2.75 days

      const resolutionTime = calculateResolutionTime(raisedAt, resolvedAt);

      expect(resolutionTime).toBe(2.8); // Rounded to 1 decimal
    });

    it('should handle multi-week resolution time', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const resolvedAt = new Date('2024-06-20T10:00:00Z'); // 19 days later

      const resolutionTime = calculateResolutionTime(raisedAt, resolvedAt);

      expect(resolutionTime).toBe(19);
    });
  });

  describe('SLA Compliance Rate', () => {
    it('should calculate 100% compliance', () => {
      const rate = calculateSLAComplianceRate(10, 10);

      expect(rate).toBe(100);
    });

    it('should calculate 50% compliance', () => {
      const rate = calculateSLAComplianceRate(10, 5);

      expect(rate).toBe(50);
    });

    it('should calculate 0% compliance', () => {
      const rate = calculateSLAComplianceRate(10, 0);

      expect(rate).toBe(0);
    });

    it('should return 100% for zero issues', () => {
      const rate = calculateSLAComplianceRate(0, 0);

      expect(rate).toBe(100); // No issues = perfect compliance
    });

    it('should round to 1 decimal place', () => {
      const rate = calculateSLAComplianceRate(3, 2); // 66.666%

      expect(rate).toBe(66.7);
    });

    it('should handle large numbers', () => {
      const rate = calculateSLAComplianceRate(1000, 823); // 82.3%

      expect(rate).toBe(82.3);
    });
  });

  describe('SLA Display Text', () => {
    it('should show success message for 80%+ compliance', () => {
      const result = getSLADisplayText(85, 4);

      expect(result.text).toBe('usually responds within 4 hours');
      expect(result.color).toBe('success');
      expect(result.displayHours).toBe(4);
    });

    it('should show warning message for 60-80% compliance', () => {
      const result = getSLADisplayText(70, 4);

      expect(result.text).toBe('tries to respond within 28 hours'); // 4 + 24
      expect(result.color).toBe('warning');
      expect(result.displayHours).toBe(28);
    });

    it('should show danger message for <60% compliance', () => {
      const result = getSLADisplayText(50, 4);

      expect(result.text).toContain('52 hours'); // 4 + 48
      expect(result.text).toContain('performance below target');
      expect(result.color).toBe('danger');
      expect(result.displayHours).toBe(52);
    });

    it('should handle singular hour correctly', () => {
      const result = getSLADisplayText(90, 1);

      expect(result.text).toBe('usually responds within 1 hour'); // No 's'
    });

    it('should handle plural hours correctly', () => {
      const result = getSLADisplayText(90, 24);

      expect(result.text).toBe('usually responds within 24 hours'); // With 's'
    });

    it('should handle boundary case (exactly 80%)', () => {
      const result = getSLADisplayText(80, 4);

      expect(result.color).toBe('success');
      expect(result.displayHours).toBe(4);
    });

    it('should handle boundary case (exactly 60%)', () => {
      const result = getSLADisplayText(60, 4);

      expect(result.color).toBe('warning');
      expect(result.displayHours).toBe(28);
    });
  });

  describe('Get SLA Time for Priority', () => {
    it('should return emergency SLA time in hours', () => {
      const slaTime = getSLATimeForPriority('emergency', mockSLAConfig);

      expect(slaTime).toBe(4);
    });

    it('should return urgent SLA time in hours', () => {
      const slaTime = getSLATimeForPriority('urgent', mockSLAConfig);

      expect(slaTime).toBe(24);
    });

    it('should return routine SLA time in hours', () => {
      const slaTime = getSLATimeForPriority('routine', mockSLAConfig);

      expect(slaTime).toBe(72);
    });

    it('should convert low priority days to hours', () => {
      const slaTime = getSLATimeForPriority('low', mockSLAConfig);

      expect(slaTime).toBe(336); // 14 days * 24 hours
    });
  });

  describe('Average Response Time', () => {
    it('should calculate average response time', () => {
      const responseTimes = [2, 4, 6, 8]; // Average = 5

      const average = calculateAverageResponseTime(responseTimes);

      expect(average).toBe(5);
    });

    it('should filter out null values', () => {
      const responseTimes = [2, null, 6, null, 8]; // Average of 2, 6, 8 = 5.33

      const average = calculateAverageResponseTime(responseTimes);

      expect(average).toBe(5.3); // Rounded to 1 decimal
    });

    it('should return 0 for empty array', () => {
      const average = calculateAverageResponseTime([]);

      expect(average).toBe(0);
    });

    it('should return 0 for all null values', () => {
      const average = calculateAverageResponseTime([null, null, null]);

      expect(average).toBe(0);
    });

    it('should round to 1 decimal place', () => {
      const responseTimes = [2.3, 3.7, 4.9]; // Average = 3.633

      const average = calculateAverageResponseTime(responseTimes);

      expect(average).toBe(3.6);
    });
  });

  describe('Approaching SLA Deadline', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should detect approaching deadline (within 25% of time)', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const slaDeadline = new Date('2024-06-01T14:00:00Z'); // 4 hours SLA
      vi.setSystemTime(new Date('2024-06-01T13:00:00Z')); // 1 hour remaining = 25%

      const isApproaching = isApproachingSLADeadline(slaDeadline, raisedAt);

      expect(isApproaching).toBe(true);
    });

    it('should not detect approaching if plenty of time remaining', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const slaDeadline = new Date('2024-06-01T14:00:00Z'); // 4 hours SLA
      vi.setSystemTime(new Date('2024-06-01T11:00:00Z')); // 3 hours remaining = 75%

      const isApproaching = isApproachingSLADeadline(slaDeadline, raisedAt);

      expect(isApproaching).toBe(false);
    });

    it('should return false if already overdue', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const slaDeadline = new Date('2024-06-01T14:00:00Z');
      vi.setSystemTime(new Date('2024-06-01T15:00:00Z')); // 1 hour past deadline

      const isApproaching = isApproachingSLADeadline(slaDeadline, raisedAt);

      expect(isApproaching).toBe(false); // Overdue, not "approaching"
    });

    it('should handle boundary case (exactly 25% remaining)', () => {
      const raisedAt = new Date('2024-06-01T10:00:00Z');
      const slaDeadline = new Date('2024-06-01T14:00:00Z'); // 4 hours SLA
      vi.setSystemTime(new Date('2024-06-01T13:00:00Z')); // Exactly 1 hour = 25%

      const isApproaching = isApproachingSLADeadline(slaDeadline, raisedAt);

      expect(isApproaching).toBe(true);
    });
  });

  describe('SLA Compliance Color', () => {
    it('should return success for 80%+ compliance', () => {
      expect(getSLAComplianceColor(100)).toBe('success');
      expect(getSLAComplianceColor(90)).toBe('success');
      expect(getSLAComplianceColor(80)).toBe('success');
    });

    it('should return warning for 60-80% compliance', () => {
      expect(getSLAComplianceColor(79)).toBe('warning');
      expect(getSLAComplianceColor(70)).toBe('warning');
      expect(getSLAComplianceColor(60)).toBe('warning');
    });

    it('should return danger for <60% compliance', () => {
      expect(getSLAComplianceColor(59)).toBe('danger');
      expect(getSLAComplianceColor(30)).toBe('danger');
      expect(getSLAComplianceColor(0)).toBe('danger');
    });
  });

  describe('Format Time Remaining', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format hours and minutes remaining', () => {
      const slaDeadline = new Date('2024-06-01T14:30:00Z');
      vi.setSystemTime(new Date('2024-06-01T12:00:00Z')); // 2h 30m remaining

      const formatted = formatTimeRemaining(slaDeadline);

      expect(formatted).toBe('2h 30m');
    });

    it('should format minutes only if less than 1 hour', () => {
      const slaDeadline = new Date('2024-06-01T12:45:00Z');
      vi.setSystemTime(new Date('2024-06-01T12:00:00Z')); // 45m remaining

      const formatted = formatTimeRemaining(slaDeadline);

      expect(formatted).toBe('45m');
    });

    it('should show OVERDUE with time past deadline', () => {
      const slaDeadline = new Date('2024-06-01T12:00:00Z');
      vi.setSystemTime(new Date('2024-06-01T14:30:00Z')); // 2h 30m overdue

      const formatted = formatTimeRemaining(slaDeadline);

      expect(formatted).toBe('OVERDUE by 2h 30m');
    });

    it('should handle exactly on deadline', () => {
      const slaDeadline = new Date('2024-06-01T12:00:00Z');
      vi.setSystemTime(new Date('2024-06-01T12:00:00Z'));

      const formatted = formatTimeRemaining(slaDeadline);

      expect(formatted).toBe('0m'); // 0 minutes remaining
    });

    it('should handle hours with zero minutes', () => {
      const slaDeadline = new Date('2024-06-01T14:00:00Z');
      vi.setSystemTime(new Date('2024-06-01T12:00:00Z')); // Exactly 2 hours

      const formatted = formatTimeRemaining(slaDeadline);

      expect(formatted).toBe('2h 0m');
    });
  });
});
