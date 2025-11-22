/**
 * Health Check Endpoint
 *
 * Used by load balancers, monitoring systems, and orchestration tools
 * to verify the application is running correctly.
 *
 * GET /api/health - Returns health status
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'database',
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Upstash Redis connectivity (if configured)
 */
async function checkRedis(): Promise<HealthCheck | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null; // Not configured, skip check
  }

  const start = Date.now();
  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    if (response.ok) {
      return {
        name: 'redis',
        status: 'healthy',
        latency: Date.now() - start,
      };
    }

    return {
      name: 'redis',
      status: 'degraded',
      latency: Date.now() - start,
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: 'redis',
      status: 'degraded', // Degraded, not unhealthy - app can work without Redis
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const heapPercentage = Math.round((used.heapUsed / used.heapTotal) * 100);

  // Warn if heap usage is above 85%
  if (heapPercentage > 85) {
    return {
      name: 'memory',
      status: 'degraded',
      message: `High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercentage}%)`,
    };
  }

  return {
    name: 'memory',
    status: 'healthy',
    message: `${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercentage}%)`,
  };
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const checks: HealthCheck[] = [];

  // Run all health checks in parallel
  const [dbCheck, redisCheck] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  checks.push(dbCheck);
  if (redisCheck) checks.push(redisCheck);
  checks.push(checkMemory());

  // Determine overall status
  const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
  const hasDegraded = checks.some((c) => c.status === 'degraded');

  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (hasUnhealthy) {
    overallStatus = 'unhealthy';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks,
  };

  // Return 503 for unhealthy, 200 for healthy/degraded
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
