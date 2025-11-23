import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint for load balancers and monitoring
 *
 * GET /api/health
 *
 * Returns:
 * - 200 OK: Service is healthy
 * - 503 Service Unavailable: Service is unhealthy
 *
 * Response includes:
 * - status: 'healthy' | 'unhealthy'
 * - timestamp: ISO timestamp
 * - checks: Individual health check results
 * - version: Application version (from env)
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'pass' | 'fail'; latency?: number; error?: string }> = {};

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'pass',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const heapUsagePercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

  checks.memory = {
    status: heapUsagePercent < 90 ? 'pass' : 'fail',
    latency: heapUsagePercent,
  };

  // Determine overall health
  const isHealthy = Object.values(checks).every((check) => check.status === 'pass');
  const totalLatency = Date.now() - startTime;

  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: Math.floor(process.uptime()),
    checks,
    metrics: {
      responseTime: totalLatency,
      memory: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        heapUsagePercent: `${heapUsagePercent}%`,
      },
    },
  };

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
