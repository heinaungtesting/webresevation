import { prisma } from './prisma';

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_admin: true },
    });
    return user?.is_admin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if the currently authenticated user is an admin
 * Throws an error if not authenticated or not an admin
 */
export async function requireAdmin(userId: string | null | undefined): Promise<void> {
  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const admin = await isAdmin(userId);
  if (!admin) {
    throw new Error('Forbidden: Admin access required');
  }
}
