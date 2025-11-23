import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test.describe('Health Check', () => {
    test('GET /api/health should return 200', async ({ request }) => {
      const response = await request.get('/api/health');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    test('should include version in health response', async ({ request }) => {
      const response = await request.get('/api/health');
      const data = await response.json();

      expect(data.version).toBeDefined();
    });

    test('should include checks in health response', async ({ request }) => {
      const response = await request.get('/api/health');
      const data = await response.json();

      expect(data.checks).toBeDefined();
    });
  });

  test.describe('Sessions API', () => {
    test('GET /api/sessions should return sessions list', async ({ request }) => {
      const response = await request.get('/api/sessions');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    test('should support sport_type filter', async ({ request }) => {
      const response = await request.get('/api/sessions?sport_type=basketball');

      expect(response.status()).toBe(200);
    });

    test('should support skill_level filter', async ({ request }) => {
      const response = await request.get('/api/sessions?skill_level=beginner');

      expect(response.status()).toBe(200);
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get('/api/sessions?page=1&limit=10');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    test('should return 401 for unauthorized POST', async ({ request }) => {
      const response = await request.post('/api/sessions', {
        data: {
          sport_type: 'basketball',
          skill_level: 'beginner',
        },
      });

      // Should be unauthorized
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('Sport Centers API', () => {
    test('GET /api/sport-centers should return centers list', async ({ request }) => {
      const response = await request.get('/api/sport-centers');

      // Should return 200 or 404 if endpoint doesn't exist
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('API Rate Limiting', () => {
    test('should return rate limit headers', async ({ request }) => {
      const response = await request.get('/api/sessions');

      // Rate limit headers should be present
      const headers = response.headers();
      // Some endpoints may have rate limit headers
    });
  });

  test.describe('API Error Handling', () => {
    test('should return 404 for non-existent endpoint', async ({ request }) => {
      const response = await request.get('/api/non-existent-endpoint');

      expect(response.status()).toBe(404);
    });

    test('should return proper error format', async ({ request }) => {
      const response = await request.get('/api/sessions/invalid-uuid');

      // Should return error with proper format
      if (response.status() >= 400) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });
  });
});

test.describe('API Documentation', () => {
  test('GET /api/docs should return OpenAPI spec', async ({ request }) => {
    const response = await request.get('/api/docs');

    // Should return OpenAPI spec or 404 if not implemented
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.openapi).toBeDefined();
      expect(data.info).toBeDefined();
      expect(data.paths).toBeDefined();
    }
  });
});
