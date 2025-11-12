/**
 * Mock Supabase Client for Testing
 * Provides a complete mock implementation of Supabase operations
 */

import { vi } from 'vitest';

// In-memory storage for mock database
const mockDatabase = {
  renter_profiles: [] as any[],
  landlord_profiles: [] as any[],
  agency_profiles: [] as any[],
  properties: [] as any[],
  matches: [] as any[],
  ratings: [] as any[],
  agency_link_invitations: [] as any[],
  agency_property_links: [] as any[],
};

// Helper to generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock query builder
class MockQueryBuilder {
  private tableName: string;
  private filters: Array<{ column: string; value: any }> = [];
  private selectedColumns = '*';
  private limitValue?: number;
  private offsetValue?: number;
  private orderByColumn?: string;
  private orderDirection?: 'asc' | 'desc';
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns = '*') {
    this.selectedColumns = columns;
    return this;
  }

  insert(data: any) {
    const table = mockDatabase[this.tableName as keyof typeof mockDatabase];
    const newRecord = {
      ...data,
      id: data.id || generateUUID(),
      created_at: new Date().toISOString(),
    };
    table.push(newRecord);
    this.filters = [{ column: 'id', value: newRecord.id }];
    return this;
  }

  update(data: any) {
    const table = mockDatabase[this.tableName as keyof typeof mockDatabase];
    const index = table.findIndex((record) =>
      this.filters.every((filter) => record[filter.column] === filter.value)
    );

    if (index >= 0) {
      table[index] = { ...table[index], ...data, updated_at: new Date().toISOString() };
    }
    return this;
  }

  delete() {
    const table = mockDatabase[this.tableName as keyof typeof mockDatabase];
    const indicesToDelete = table
      .map((record, index) =>
        this.filters.every((filter) => record[filter.column] === filter.value) ? index : -1
      )
      .filter((i) => i >= 0);

    indicesToDelete.reverse().forEach((index) => table.splice(index, 1));
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  neq(column: string, value: any) {
    // Not implemented for simplicity, can be extended
    return this;
  }

  gt(column: string, value: any) {
    // Not implemented for simplicity, can be extended
    return this;
  }

  gte(column: string, value: any) {
    // Not implemented for simplicity, can be extended
    return this;
  }

  lt(column: string, value: any) {
    // Not implemented for simplicity, can be extended
    return this;
  }

  lte(column: string, value: any) {
    // Not implemented for simplicity, can be extended
    return this;
  }

  like(column: string, pattern: string) {
    // Not implemented for simplicity, can be extended
    return this;
  }

  in(column: string, values: any[]) {
    // Not implemented for simplicity, can be extended
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByColumn = column;
    this.orderDirection = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (error) {
      if (reject) reject(error);
    }
  }

  private async execute() {
    const table = mockDatabase[this.tableName as keyof typeof mockDatabase];

    // Apply filters
    let results = table.filter((record) =>
      this.filters.every((filter) => record[filter.column] === filter.value)
    );

    // Apply ordering
    if (this.orderByColumn) {
      results.sort((a, b) => {
        const aVal = a[this.orderByColumn!];
        const bVal = b[this.orderByColumn!];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.orderDirection === 'desc' ? -comparison : comparison;
      });
    }

    // Apply limit/offset
    if (this.offsetValue !== undefined) {
      results = results.slice(this.offsetValue);
    }
    if (this.limitValue !== undefined) {
      results = results.slice(0, this.limitValue);
    }

    // Handle single vs array
    if (this.isSingle) {
      if (results.length === 0) {
        return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
      }
      return { data: results[0], error: null };
    }

    return { data: results, error: null };
  }
}

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  from: (tableName: string) => new MockQueryBuilder(tableName),
  auth: {
    signUp: vi.fn(async ({ email, password }) => ({
      data: {
        user: { id: generateUUID(), email },
        session: { access_token: 'mock-token' },
      },
      error: null,
    })),
    signInWithPassword: vi.fn(async ({ email, password }) => ({
      data: {
        user: { id: generateUUID(), email },
        session: { access_token: 'mock-token' },
      },
      error: null,
    })),
    signOut: vi.fn(async () => ({ error: null })),
    getSession: vi.fn(async () => ({
      data: { session: null },
      error: null,
    })),
  },
});

// Export mock database for test assertions
export const getMockDatabase = () => mockDatabase;

// Clear mock database
export const clearMockDatabase = () => {
  Object.keys(mockDatabase).forEach((key) => {
    mockDatabase[key as keyof typeof mockDatabase] = [];
  });
};

// Seed mock database with test data
export const seedMockDatabase = (tableName: keyof typeof mockDatabase, data: any[]) => {
  mockDatabase[tableName] = [...data];
};
