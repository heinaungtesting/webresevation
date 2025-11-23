import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheGetOrSet,
  sessionCache,
  userCache,
  sportCenterCache,
  sessionListKey,
  sessionKey,
  userProfileKey,
  getCacheStats,
} from '@/lib/cache';

// Mock Redis
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => null),
}));

describe('Cache Module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('cacheSet and cacheGet', () => {
    it('should store and retrieve a value', async () => {
      const key = 'test-key-1';
      const value = { name: 'test', count: 42 };

      await cacheSet(key, value, { ttl: 60 });
      const retrieved = await cacheGet<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheGet('non-existent-key');
      expect(result).toBeNull();
    });

    it('should expire entries after TTL', async () => {
      const key = 'expiring-key';
      const value = 'expiring-value';

      await cacheSet(key, value, { ttl: 10 }); // 10 seconds TTL

      // Value should exist immediately
      expect(await cacheGet(key)).toBe(value);

      // Advance time past TTL
      vi.advanceTimersByTime(11 * 1000);

      // Value should be expired
      expect(await cacheGet(key)).toBeNull();
    });

    it('should use default TTL of 300 seconds', async () => {
      const key = 'default-ttl-key';
      const value = 'test-value';

      await cacheSet(key, value);

      // Value should exist at 299 seconds
      vi.advanceTimersByTime(299 * 1000);
      expect(await cacheGet(key)).toBe(value);

      // Value should expire at 301 seconds
      vi.advanceTimersByTime(2 * 1000);
      expect(await cacheGet(key)).toBeNull();
    });

    it('should support custom prefix', async () => {
      const key = 'prefixed-key';
      const value = 'prefixed-value';

      await cacheSet(key, value, { prefix: 'custom' });
      const retrieved = await cacheGet(key, { prefix: 'custom' });

      expect(retrieved).toBe(value);

      // Different prefix should not find it
      const notFound = await cacheGet(key, { prefix: 'other' });
      expect(notFound).toBeNull();
    });
  });

  describe('cacheDelete', () => {
    it('should delete a cached value', async () => {
      const key = 'delete-test';
      await cacheSet(key, 'value');

      expect(await cacheGet(key)).toBe('value');

      await cacheDelete(key);

      expect(await cacheGet(key)).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(cacheDelete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('cacheGetOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'get-or-set-existing';
      const cachedValue = 'cached';
      const computeFn = vi.fn().mockResolvedValue('computed');

      await cacheSet(key, cachedValue);
      const result = await cacheGetOrSet(key, computeFn);

      expect(result).toBe(cachedValue);
      expect(computeFn).not.toHaveBeenCalled();
    });

    it('should compute and cache value if not exists', async () => {
      const key = 'get-or-set-new';
      const computedValue = { data: 'computed' };
      const computeFn = vi.fn().mockResolvedValue(computedValue);

      const result = await cacheGetOrSet(key, computeFn);

      expect(result).toEqual(computedValue);
      expect(computeFn).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await cacheGetOrSet(key, computeFn);
      expect(result2).toEqual(computedValue);
      expect(computeFn).toHaveBeenCalledTimes(1);
    });

    it('should handle compute function errors', async () => {
      const key = 'error-key';
      const error = new Error('Compute failed');
      const computeFn = vi.fn().mockRejectedValue(error);

      await expect(cacheGetOrSet(key, computeFn)).rejects.toThrow('Compute failed');
    });
  });

  describe('Pre-configured caches', () => {
    describe('sessionCache', () => {
      it('should use correct prefix and TTL', async () => {
        const key = 'session-1';
        const value = { id: '1', sport_type: 'badminton' };

        await sessionCache.set(key, value);
        expect(await sessionCache.get(key)).toEqual(value);

        // Should expire after 60 seconds
        vi.advanceTimersByTime(61 * 1000);
        expect(await sessionCache.get(key)).toBeNull();
      });
    });

    describe('userCache', () => {
      it('should use correct prefix and TTL', async () => {
        const key = 'user-1';
        const value = { id: '1', username: 'testuser' };

        await userCache.set(key, value);
        expect(await userCache.get(key)).toEqual(value);

        // Should exist at 4 minutes
        vi.advanceTimersByTime(4 * 60 * 1000);
        expect(await userCache.get(key)).toEqual(value);

        // Should expire after 5 minutes
        vi.advanceTimersByTime(2 * 60 * 1000);
        expect(await userCache.get(key)).toBeNull();
      });
    });

    describe('sportCenterCache', () => {
      it('should use correct prefix and TTL', async () => {
        const key = 'center-1';
        const value = { id: '1', name_en: 'Tokyo Sports Center' };

        await sportCenterCache.set(key, value);
        expect(await sportCenterCache.get(key)).toEqual(value);

        // Should exist at 59 minutes
        vi.advanceTimersByTime(59 * 60 * 1000);
        expect(await sportCenterCache.get(key)).toEqual(value);

        // Should expire after 1 hour
        vi.advanceTimersByTime(2 * 60 * 1000);
        expect(await sportCenterCache.get(key)).toBeNull();
      });
    });
  });

  describe('Cache key generators', () => {
    describe('sessionListKey', () => {
      it('should generate consistent keys for same params', () => {
        const params1 = { sport_type: 'badminton', page: 1 };
        const params2 = { page: 1, sport_type: 'badminton' };

        expect(sessionListKey(params1)).toBe(sessionListKey(params2));
      });

      it('should generate different keys for different params', () => {
        const params1 = { sport_type: 'badminton' };
        const params2 = { sport_type: 'basketball' };

        expect(sessionListKey(params1)).not.toBe(sessionListKey(params2));
      });

      it('should handle empty params', () => {
        expect(sessionListKey({})).toBe('list:all');
      });

      it('should ignore null and undefined values', () => {
        const params = { sport_type: 'badminton', skill_level: null, page: undefined };
        expect(sessionListKey(params)).toBe('list:sport_type=badminton');
      });
    });

    describe('sessionKey', () => {
      it('should generate correct key format', () => {
        const id = 'abc-123';
        expect(sessionKey(id)).toBe('detail:abc-123');
      });
    });

    describe('userProfileKey', () => {
      it('should generate correct key format', () => {
        const userId = 'user-456';
        expect(userProfileKey(userId)).toBe('profile:user-456');
      });
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      // Add some entries
      await cacheSet('stat-test-1', 'value1');
      await cacheSet('stat-test-2', 'value2');

      const stats = await getCacheStats();

      expect(stats).toHaveProperty('type');
      expect(stats).toHaveProperty('memoryEntries');
      expect(stats).toHaveProperty('redisConnected');
      expect(stats.type).toBe('memory'); // Redis not configured in tests
      expect(stats.memoryEntries).toBeGreaterThanOrEqual(2);
    });
  });
});
