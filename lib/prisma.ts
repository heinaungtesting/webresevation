/**
 * Prisma Client Singleton
 *
 * This module provides a single instance of the Prisma client.
 * Features:
 * - Singleton pattern to prevent multiple instances
 * - Connection pooling configuration for serverless
 * - Query logging in development
 * - Graceful error handling
 *
 * For serverless environments (Vercel, AWS Lambda):
 * - Uses connection pooling via DATABASE_URL (e.g., PgBouncer, Supabase Pooler)
 * - Direct connection via DIRECT_URL for migrations
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

import { PrismaClient } from '@prisma/client';

// Type for Prisma client constructor options
type PrismaClientOptions = ConstructorParameters<typeof PrismaClient>[0];

// Global type declaration for singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Environment checks
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Prisma client configuration
 */
const prismaClientOptions: PrismaClientOptions = {
  // Log configuration
  log: isDevelopment
    ? [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ]
    : [{ emit: 'stdout', level: 'error' }],

  // Error formatting
  errorFormat: isDevelopment ? 'pretty' : 'minimal',
};

/**
 * Create Prisma client
 * Note: Query logging is handled via the log configuration above.
 * For slow query monitoring in production, use database-level tools.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient(prismaClientOptions);
}

/**
 * Initialize Prisma client
 */
let prismaInstance: PrismaClient | undefined;

try {
  // Use existing instance in development (hot reload)
  // Create new instance in production
  if (isDevelopment) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    prismaInstance = globalForPrisma.prisma;
  } else {
    prismaInstance = createPrismaClient();
  }
} catch (error) {
  console.error('[Prisma] Failed to initialize client:', error);
  // Don't throw - let individual queries fail with better error messages
}

/**
 * Exported Prisma client
 */
export const prisma = prismaInstance as PrismaClient;

/**
 * Check if database is connected
 */
export async function isDatabaseConnected(): Promise<boolean> {
  if (!prisma) return false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Get database connection info (for health checks)
 */
export async function getDatabaseInfo(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  if (!prisma) {
    return { connected: false, error: 'Prisma client not initialized' };
  }

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return { connected: true, latency };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Disconnect from database (for graceful shutdown)
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    console.log('[Prisma] Disconnected from database');
  }
}

// Retryable Prisma error codes (connection/timeout issues)
const RETRYABLE_ERROR_CODES = ['P2024', 'P2028'];

/**
 * Check if an error is a retryable Prisma error
 */
function isRetryablePrismaError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: string }).code;
  return typeof code === 'string' && RETRYABLE_ERROR_CODES.includes(code);
}

/**
 * Execute with retry logic (for transient failures)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable (connection/timeout errors)
      if (!isRetryablePrismaError(error) || attempt === maxRetries) {
        throw lastError;
      }

      console.warn(
        `[Prisma] Retry attempt ${attempt}/${maxRetries} after error: ${lastError.message}`
      );

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

export default prisma;
