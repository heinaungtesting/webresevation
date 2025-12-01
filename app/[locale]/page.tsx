import { prisma } from '@/lib/prisma';
import { sessionCache, sessionListKey } from '@/lib/cache';
import HomeFeed from './HomeFeed';

// Fetch upcoming sessions from database with caching
async function getUpcomingSessions() {
  try {
    const cacheKey = sessionListKey({ type: 'upcoming', limit: 20 });
    
    // Try to get from cache first
    const cached = await sessionCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const sessions = await prisma.session.findMany({
      where: {
        date_time: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        sport_type: true,
        skill_level: true,
        date_time: true,
        duration_minutes: true,
        max_participants: true,
        description_en: true,
        description_ja: true,
        primary_language: true,
        allow_english: true,
        vibe: true,
        created_by: true,
        sport_center: {
          select: {
            id: true,
            name_en: true,
            name_ja: true,
            address_en: true,
            address_ja: true,
            station_en: true,
            station_ja: true,
          },
        },
        _count: {
          select: { user_sessions: true },
        },
      },
      orderBy: {
        date_time: 'asc',
      },
      take: 20, // Limit initial load
    });

    // Map to include current_participants
    const result = sessions.map((session: any) => ({
      ...session,
      current_participants: session._count.user_sessions,
      _count: undefined,
    }));

    // Cache the result
    await sessionCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

// Fetch sessions happening within the next 3 hours with caching
async function getHappeningNowSessions() {
  try {
    const cacheKey = sessionListKey({ type: 'happening_now' });
    
    // Try to get from cache first (shorter TTL for time-sensitive data)
    const cached = await sessionCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const sessions = await prisma.session.findMany({
      where: {
        date_time: {
          gte: now,
          lte: threeHoursLater,
        },
      },
      select: {
        id: true,
        sport_type: true,
        skill_level: true,
        date_time: true,
        duration_minutes: true,
        max_participants: true,
        description_en: true,
        primary_language: true,
        allow_english: true,
        vibe: true,
        sport_center: {
          select: {
            id: true,
            name_en: true,
            name_ja: true,
            station_en: true,
          },
        },
        _count: {
          select: { user_sessions: true },
        },
      },
      orderBy: {
        date_time: 'asc',
      },
      take: 10,
    });

    const result = sessions.map((session: any) => ({
      ...session,
      current_participants: session._count.user_sessions,
      _count: undefined,
    }));

    // Cache with shorter TTL for time-sensitive data
    await sessionCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error fetching happening now sessions:', error);
    return [];
  }
}

export default async function Home() {
  const [sessions, happeningNow] = await Promise.all([
    getUpcomingSessions(),
    getHappeningNowSessions(),
  ]);

  return <HomeFeed sessions={sessions} happeningNow={happeningNow} />;
}
