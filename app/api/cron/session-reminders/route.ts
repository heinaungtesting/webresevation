import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSessionReminderEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Cron job endpoint to send session reminder emails
 * Should be called daily (e.g., via Vercel Cron or external cron service)
 *
 * Finds sessions happening in 24 hours and sends reminder emails to participants
 *
 * Usage:
 * - Set up a cron job to call this endpoint daily
 * - Secure with CRON_SECRET environment variable
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate time window: sessions starting 23-25 hours from now
    const now = new Date();
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find sessions in the time window
    const upcomingSessions = await prisma.session.findMany({
      where: {
        date_time: {
          gte: twentyThreeHoursFromNow,
          lte: twentyFiveHoursFromNow,
        },
      },
      include: {
        sport_center: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                display_name: true,
                notification_email: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${upcomingSessions.length} sessions with reminders to send`);

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send reminder emails to all participants
    for (const session of upcomingSessions) {
      const sessionDateTime = new Date(session.date_time);
      const formattedDateTime = sessionDateTime.toLocaleString('en-US', {
        timeZone: 'Asia/Tokyo', // CRITICAL: Force Tokyo timezone for correct local time
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      for (const participant of session.participants) {
        if (participant.user.notification_email) {
          const userName = participant.user.display_name || participant.user.username || participant.user.email.split('@')[0];

          try {
            await sendSessionReminderEmail(
              participant.user.email,
              userName,
              {
                sportType: session.sport_type.charAt(0).toUpperCase() + session.sport_type.slice(1),
                sportCenter: session.sport_center.name_en,
                dateTime: formattedDateTime,
                address: session.sport_center.address_en,
              }
            );
            emailsSent++;
          } catch (error) {
            console.error(`Failed to send reminder to ${participant.user.email}:`, error);
            emailsFailed++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${upcomingSessions.length} sessions`,
      emailsSent,
      emailsFailed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in session reminders cron:', error);
    return NextResponse.json(
      { error: 'Failed to process session reminders' },
      { status: 500 }
    );
  }
}
