import { prisma } from '@/lib/prisma';
import type { User } from '@supabase/supabase-js';

/**
 * Ensures a user exists in the Prisma database.
 * 
 * This is critical because users can exist in Supabase Auth but not in the database if:
 * 1. Database was reset but Supabase auth users remain
 * 2. User was created through Supabase directly (not through signup endpoint)
 * 3. Signup database creation failed but auth succeeded
 * 
 * This function will automatically create the user if missing, preventing
 * foreign key constraint violations (P2003 errors).
 * 
 * @param user - Supabase auth user object
 * @returns The user from the database (existing or newly created)
 * @throws Error if user creation fails (except for duplicate key errors)
 */
export async function ensureUserExists(user: User) {
    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
    });

    if (existingUser) {
        return existingUser;
    }

    // User is authenticated in Supabase but doesn't exist in database
    console.log(`[ensureUserExists] User ${user.id} (${user.email}) not found in database. Creating...`);

    try {
        // Create user in database from Supabase auth data
        const newUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email!,
                email_verified: user.email_confirmed_at ? true : false,
                language_preference: user.user_metadata?.language_preference || 'en',
                // Optional fields from user metadata
                username: user.user_metadata?.username || null,
                display_name: user.user_metadata?.display_name || null,
                avatar_url: user.user_metadata?.avatar_url || null,
            },
        });

        console.log(`[ensureUserExists] User ${user.id} created successfully`);
        return newUser;
    } catch (createError: any) {
        console.error('[ensureUserExists] Failed to create user:', createError);

        // If user creation fails due to duplicate (race condition), fetch and return
        if (createError.code === 'P2002') {
            console.log(`[ensureUserExists] User ${user.id} already exists (race condition), fetching...`);
            const fetchedUser = await prisma.user.findUnique({
                where: { id: user.id },
            });
            if (fetchedUser) return fetchedUser;
        }

        // Re-throw other errors
        throw new Error('Failed to sync user account. Please try logging out and back in.');
    }
}

/**
 * Middleware-like function to ensure user exists before processing request.
 * Use this at the start of API routes that require database user records.
 * 
 * @param user - Supabase auth user object
 * @returns Promise that resolves when user exists in database
 */
export async function requireUserInDatabase(user: User): Promise<void> {
    await ensureUserExists(user);
}
