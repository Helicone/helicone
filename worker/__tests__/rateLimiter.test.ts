import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { checkRateLimit, updateRateLimitCounter } from '../src/lib/clients/KVRateLimiterClient';
import {
  generateCacheKey,
  parseTimestamps,
  binarySearchFirstRelevantIndex,
  calculateRateLimitStatus,
  prepareTimestampsForStorage,
  type RateLimitOptions,
  type RateLimitResponse,
  type KVObject
} from '../src/lib/clients/sharedRateLimiter';

// Mock KV namespace
const mockKV = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
} as any;

// Mock HeliconeProperties
const mockHeliconeProperties = {
  helicone_auth: 'test-auth',
  helicone_property_org_id: 'test-org',
};

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const key1 = generateCacheKey('org1', 'user1');
      const key2 = generateCacheKey('org1', 'user1');
      expect(key1).toBe(key2);
      expect(key1).toContain('org1');
      expect(key1).toContain('user1');
    });

    it('should handle different orgs and users', () => {
      const key1 = generateCacheKey('org1', 'user1');
      const key2 = generateCacheKey('org2', 'user1');
      const key3 = generateCacheKey('org1', 'user2');
      
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe('parseTimestamps', () => {
    it('should parse valid timestamps', () => {
      const timestamps = [{ timestamp: 1704067200000, unit: 1 }];
      const result = parseTimestamps(JSON.stringify(timestamps));
      expect(result).toEqual(timestamps);
    });

    it('should handle invalid JSON gracefully', () => {
      const result = parseTimestamps('invalid json');
      expect(result).toEqual([]);
    });

    it('should handle null values', () => {
      const result = parseTimestamps(null);
      expect(result).toEqual([]);
    });

    it('should handle non-array JSON', () => {
      const result = parseTimestamps('{"invalid": "data"}');
      expect(result).toEqual([]);
    });
  });

  describe('binarySearchFirstRelevantIndex', () => {
    it('should find correct first relevant index', () => {
      const now = Date.now();
      const timestamps = [now - 3000, now - 2000, now - 1000];
      const result = binarySearchFirstRelevantIndex(timestamps, now, 5000);
      expect(result).toBe(0); // All timestamps are relevant
    });

    it('should handle empty array', () => {
      const result = binarySearchFirstRelevantIndex([], Date.now(), 60000);
      expect(result).toBe(-1);
    });

    it('should handle all expired timestamps', () => {
      const now = Date.now();
      const timestamps = [now - 70000, now - 65000, now - 62000];
      const result = binarySearchFirstRelevantIndex(timestamps, now, 60000);
      expect(result).toBe(-1);
    });

    it('should handle mixed relevant and expired timestamps', () => {
      const now = Date.now();
      // Timestamps must be sorted in ascending order (oldest first)
      const timestamps = [now - 70000, now - 50000, now - 30000, now - 1000].sort((a, b) => a - b);
      const result = binarySearchFirstRelevantIndex(timestamps, now, 60000);
      expect(result).toBe(1); // Index 1 is the first relevant timestamp (now - 50000)
    });
  });

  describe('calculateRateLimitStatus', () => {
    it('should calculate status correctly for under limit', () => {
      const now = Date.now();
      const timestamps: KVObject = [
        { timestamp: now - 1000, unit: 1 },
        { timestamp: now - 2000, unit: 1 },
      ];

      const result = calculateRateLimitStatus(timestamps, now, 60000, 10);
      
      expect(result.status).toBe('ok');
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(8);
    });

    it('should calculate status correctly for over limit', () => {
      const now = Date.now();
      const timestamps: KVObject = Array(10).fill(null).map(() => ({
        timestamp: now - 1000,
        unit: 1
      }));

      const result = calculateRateLimitStatus(timestamps, now, 60000, 10);
      
      expect(result.status).toBe('rate_limited');
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(0);
      expect(result.reset).toBeDefined();
    });

    it('should handle empty timestamps', () => {
      const result = calculateRateLimitStatus([], Date.now(), 60000, 10);
      
      expect(result.status).toBe('ok');
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(10);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow request when under limit', async () => {
      mockKV.get.mockResolvedValue(null); // No existing data

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(10);
    });

    it('should reject request when over limit', async () => {
      const now = Date.now();
      const timestamps: KVObject = Array(10).fill(null).map(() => ({
        timestamp: now - 1000,
        unit: 1
      }));
      mockKV.get.mockResolvedValue(JSON.stringify(timestamps));

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('rate_limited');
      expect(result.remaining).toBe(0);
      expect(result.reset).toBeDefined();
    });

    it('should handle KV get errors gracefully', async () => {
      mockKV.get.mockRejectedValue(new Error('KV error'));

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      // Should allow request when KV fails (fail-open)
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(0);
    });

    it('should handle invalid JSON in KV', async () => {
      mockKV.get.mockResolvedValue('invalid json');

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      // Should allow request when JSON is invalid (fail-open)
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(10);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null/undefined KV values', async () => {
      mockKV.get.mockResolvedValue(null);

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(10);
    });

    it('should handle empty string KV values', async () => {
      mockKV.get.mockResolvedValue('');

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(10);
    });

    it('should handle non-array JSON values', async () => {
      mockKV.get.mockResolvedValue('{"invalid": "data"}');

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(10);
    });

    it('should handle array with non-numeric values', async () => {
      mockKV.get.mockResolvedValue(JSON.stringify(['invalid', 'data', 123]));

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(10);
    });

    it('should handle zero quota', async () => {
      mockKV.get.mockResolvedValue(null);

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 0,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('rate_limited');
      expect(result.remaining).toBe(0);
    });

    it('should handle negative quota', async () => {
      mockKV.get.mockResolvedValue(null);

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: -5,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('rate_limited');
      expect(result.remaining).toBe(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle burst traffic correctly', async () => {
      const now = Date.now();
      // Simulate burst of requests
      const burstTimestamps: KVObject = Array(8).fill(null).map(() => ({
        timestamp: now - 100,
        unit: 1
      }));
      mockKV.get.mockResolvedValue(JSON.stringify(burstTimestamps));

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(2);
    });

    it('should handle steady traffic over time', async () => {
      const now = Date.now();
      // Simulate steady traffic: one request every 10 seconds
      const steadyTimestamps: KVObject = [
        { timestamp: now - 50000, unit: 1 }, // 50 seconds ago
        { timestamp: now - 40000, unit: 1 }, // 40 seconds ago
        { timestamp: now - 30000, unit: 1 }, // 30 seconds ago
        { timestamp: now - 20000, unit: 1 }, // 20 seconds ago
        { timestamp: now - 10000, unit: 1 }, // 10 seconds ago
      ];
      mockKV.get.mockResolvedValue(JSON.stringify(steadyTimestamps));

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(5);
    });

    it('should handle rate limit reset after window expires', async () => {
      const now = Date.now();
      // All requests are outside the 60-second window
      const oldTimestamps: KVObject = Array(10).fill(null).map(() => ({
        timestamp: now - 70000,
        unit: 1
      }));
      mockKV.get.mockResolvedValue(JSON.stringify(oldTimestamps));

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      const result = await checkRateLimit({
        heliconeProperties: mockHeliconeProperties,
        userId: 'user1',
        rateLimitOptions,
        organizationId: 'org1',
        rateLimitKV: mockKV,
        cost: 1
      });
      
      // Should allow request since old timestamps are filtered out
      expect(result.status).toBe('ok');
      expect(result.remaining).toBe(10);
    });

    it('should handle concurrent requests from same user', async () => {
      const now = Date.now();
      const existingTimestamps: KVObject = [
        { timestamp: now - 5000, unit: 1 },
        { timestamp: now - 3000, unit: 1 },
        { timestamp: now - 1000, unit: 1 }
      ];
      mockKV.get.mockResolvedValue(JSON.stringify(existingTimestamps));

      const rateLimitOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: 'request'
      };

      // Simulate concurrent requests
      const promises = Array(3).fill(null).map(() => 
        checkRateLimit({
          heliconeProperties: mockHeliconeProperties,
          userId: 'user1',
          rateLimitOptions,
          organizationId: 'org1',
          rateLimitKV: mockKV,
          cost: 1
        })
      );

      const results = await Promise.all(promises);
      
      // All should be allowed
      results.forEach(result => {
        expect(result.status).toBe('ok');
      });
    });
  });
}); 