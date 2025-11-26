import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify environment variables are loaded
 * Visit: /api/test-env to check if env vars are set
 * 
 * This endpoint returns true/false for each required env var
 * (without exposing the actual values for security)
 */
export async function GET() {
    const envCheck = {
        // Server-side environment variables
        DATABASE_URL: !!process.env.DATABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        CRON_SECRET: !!process.env.CRON_SECRET,

        // Client-side environment variables (should always be true)
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,

        // Optional variables
        UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,

        // Environment info
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL, // Will be "1" on Vercel
        VERCEL_ENV: process.env.VERCEL_ENV, // "production", "preview", or "development"
    };

    // Count how many required vars are set
    const requiredVars = [
        'DATABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'RESEND_API_KEY',
        'CRON_SECRET',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    const setCount = requiredVars.filter(key => envCheck[key as keyof typeof envCheck]).length;
    const totalRequired = requiredVars.length;

    const allSet = setCount === totalRequired;

    return NextResponse.json({
        status: allSet ? 'OK' : 'MISSING_VARIABLES',
        message: allSet
            ? '✅ All required environment variables are set!'
            : `❌ Missing ${totalRequired - setCount} required environment variable(s)`,
        summary: `${setCount}/${totalRequired} required variables set`,
        details: envCheck,
    }, {
        status: allSet ? 200 : 500,
    });
}
