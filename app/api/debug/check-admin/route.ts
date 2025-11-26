import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to check current user's admin status
 * Visit: /api/debug/check-admin
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
            return NextResponse.json({
                authenticated: false,
                error: authError.message,
            });
        }

        if (!user) {
            return NextResponse.json({
                authenticated: false,
                message: 'No user session found',
            });
        }

        // Check user in database
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                is_admin: true,
                created_at: true,
            },
        });

        return NextResponse.json({
            authenticated: true,
            supabase_user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
            database_user: dbUser
                ? {
                    id: dbUser.id,
                    email: dbUser.email,
                    is_admin: dbUser.is_admin,
                    created_at: dbUser.created_at,
                }
                : null,
            status: {
                user_exists_in_db: !!dbUser,
                is_admin: dbUser?.is_admin || false,
                can_access_admin: dbUser?.is_admin === true,
            },
        });
    } catch (error: any) {
        console.error('Error checking admin status:', error);
        return NextResponse.json(
            {
                error: 'Failed to check admin status',
                details: error.message,
            },
            { status: 500 }
        );
    }
}
