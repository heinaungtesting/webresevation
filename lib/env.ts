/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup.
 * Fails fast with clear error messages if any are missing.
 */

import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server
 */
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // Supabase (server-side)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Upstash Redis (optional - falls back to in-memory)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),

  // Sentry (optional in development)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Cron job security
  CRON_SECRET: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Client-side environment variables schema
 * These are exposed to the browser (NEXT_PUBLIC_*)
 */
const clientEnvSchema = z.object({
  // Supabase (client-side)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Sentry (client-side)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

/**
 * Combined environment schema
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema);

export type Env = z.infer<typeof envSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate environment variables
 * Call this at application startup
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      return `  - ${issue.path.join('.')}: ${issue.message}`;
    });

    console.error('\n❌ Invalid environment variables:\n');
    console.error(errors.join('\n'));
    console.error('\nPlease check your .env.local file.\n');

    // In production, throw to prevent startup
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    }

    // In development, warn but continue
    console.warn('⚠️  Continuing in development mode with missing env vars...\n');
  }

  return result.data as Env;
}

/**
 * Get validated environment variables
 * Lazy initialization to avoid issues during build
 */
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

/**
 * Type-safe environment variable access
 */
export const env = new Proxy({} as Env, {
  get(_, prop: string) {
    const validatedEnv = getEnv();
    return validatedEnv[prop as keyof Env];
  },
});

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if a feature is enabled based on env vars
 */
export function isFeatureEnabled(feature: string): boolean {
  const env = getEnv();

  switch (feature) {
    case 'upstash':
      return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
    case 'sentry':
      return !!(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN);
    case 'email':
      return !!env.RESEND_API_KEY;
    default:
      return false;
  }
}
