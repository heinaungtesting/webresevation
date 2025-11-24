/**
 * Environment Variable Validation
 *
 * This module validates all environment variables at startup using Zod schemas.
 * It provides type-safe access to environment variables and fails fast if
 * required variables are missing or invalid.
 *
 * Usage:
 * ```typescript
 * import { env } from '@/lib/env';
 * const url = env.NEXT_PUBLIC_SUPABASE_URL;
 * ```
 */

import { z } from 'zod';

// =============================================================================
// Schema Definitions
// =============================================================================

/**
 * Server-side environment variables (not exposed to client)
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  DIRECT_URL: z.string().url().optional(),

  // Supabase (server-side)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Redis (Upstash) - optional, falls back to in-memory
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required for email functionality'),
  EMAIL_FROM: z.string().default('SportsMatch Tokyo <noreply@sportsmatch.tokyo>'),

  // Cron jobs
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),

  // App configuration
  APP_VERSION: z.string().default('1.0.0'),

  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

/**
 * Client-side environment variables (exposed to browser via NEXT_PUBLIC_ prefix)
 */
const clientEnvSchema = z.object({
  // Supabase (client-side)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://webresevation-gbvm9a1l4-heinaungtestings-projects.vercel.app'),

  // Analytics (optional)
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

/**
 * Combined schema for all environment variables
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema);

// =============================================================================
// Type Definitions
// =============================================================================

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = z.infer<typeof envSchema>;

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Formats Zod errors into a readable string
 */
function formatErrors(errors: z.ZodError): string {
  return errors.issues
    .map((err) => {
      const path = err.path.join('.');
      return `  - ${path}: ${err.message}`;
    })
    .join('\n');
}

/**
 * Validates server-side environment variables
 * Called at server startup
 */
function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ Invalid server environment variables:\n');
    console.error(formatErrors(result.error));
    console.error('\nPlease check your .env.local file.\n');

    // In development, don't crash - just warn
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Continuing with missing env vars in development mode...\n');
      return process.env as unknown as ServerEnv;
    }

    throw new Error('Invalid server environment variables');
  }

  return result.data;
}

/**
 * Validates client-side environment variables
 * These are validated at build time and runtime
 */
function validateClientEnv(): ClientEnv {
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  };

  const result = clientEnvSchema.safeParse(clientEnv);

  if (!result.success) {
    console.error('\n❌ Invalid client environment variables:\n');
    console.error(formatErrors(result.error));
    console.error('\nPlease check your .env.local file.\n');

    // In development, don't crash - just warn
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Continuing with missing env vars in development mode...\n');
      return clientEnv as unknown as ClientEnv;
    }

    throw new Error('Invalid client environment variables');
  }

  return result.data;
}

// =============================================================================
// Exported Environment Objects
// =============================================================================

/**
 * Server-side environment variables
 * Only use in server components, API routes, and server actions
 */
export const serverEnv = validateServerEnv();

/**
 * Client-side environment variables
 * Safe to use anywhere (these are public)
 */
export const clientEnv = validateClientEnv();

/**
 * Combined environment (for convenience in server-side code)
 * Only use in server components, API routes, and server actions
 */
export const env = {
  ...serverEnv,
  ...clientEnv,
} as Env;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return serverEnv.NODE_ENV === 'production';
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return serverEnv.NODE_ENV === 'development';
}

/**
 * Check if we're in test environment
 */
export function isTest(): boolean {
  return serverEnv.NODE_ENV === 'test';
}

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!(serverEnv.UPSTASH_REDIS_REST_URL && serverEnv.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Check if Sentry is configured
 */
export function isSentryConfigured(): boolean {
  return !!serverEnv.SENTRY_DSN;
}

/**
 * Get the app URL (with fallback)
 */
export function getAppUrl(): string {
  return clientEnv.NEXT_PUBLIC_APP_URL;
}
