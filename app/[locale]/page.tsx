import { prisma } from '@/lib/prisma';
import HomeFeed from './HomeFeed';

// Fetch upcoming sessions from database
async function getUpcomingSessions() {
  try {
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
    return sessions.map((session: any) => ({
      ...session,
      current_participants: session._count.user_sessions,
      _count: undefined,
    }));
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

// Fetch sessions happening within the next 3 hours
async function getHappeningNowSessions() {
  try {
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

    return sessions.map((session: any) => ({
      ...session,
      current_participants: session._count.user_sessions,
      _count: undefined,
    }));
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
