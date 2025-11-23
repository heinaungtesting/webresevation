import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('Health Check API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy status when database is connected', async () => {
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.checks.database.status).toBe('pass');
    expect(typeof body.checks.database.latency).toBe('number');
  });

  it('should return unhealthy status when database is down', async () => {
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.checks.database.status).toBe('fail');
    expect(body.checks.database.error).toBe('Connection refused');
  });

  it('should include memory check in response', async () => {
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(body.checks.memory).toBeDefined();
    expect(body.checks.memory.status).toBe('pass');
  });

  it('should include timestamp in response', async () => {
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

    const beforeRequest = new Date().toISOString();
    const response = await GET();
    const body = await response.json();
    const afterRequest = new Date().toISOString();

    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    expect(body.timestamp >= beforeRequest).toBe(true);
    expect(body.timestamp <= afterRequest).toBe(true);
  });

  it('should include version in response', async () => {
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(body.version).toBeDefined();
    expect(typeof body.version).toBe('string');
  });

  it('should include uptime in response', async () => {
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(body.uptime).toBeDefined();
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should include metrics in response', async () => {
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(body.metrics).toBeDefined();
    expect(body.metrics.responseTime).toBeDefined();
    expect(body.metrics.memory).toBeDefined();
    expect(body.metrics.memory.heapUsed).toBeDefined();
    expect(body.metrics.memory.heapTotal).toBeDefined();
    expect(body.metrics.memory.heapUsagePercent).toBeDefined();
  });

  it('should have no-cache headers', async () => {
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
  });

  it('should handle database check errors gracefully', async () => {
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Unexpected error'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.checks.database.status).toBe('fail');
    expect(body.checks.database.error).toBe('Unexpected error');
  });
});
