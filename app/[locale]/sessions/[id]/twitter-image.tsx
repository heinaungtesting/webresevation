import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

// Image metadata
export const runtime = 'edge';
export const alt = 'SportsMatch Session';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Sport emoji mapping
const SPORT_EMOJIS: Record<string, string> = {
  badminton: '🏸',
  tennis: '🎾',
  basketball: '🏀',
  soccer: '⚽',
  volleyball: '🏐',
  baseball: '⚾',
  'table-tennis': '🏓',
  swimming: '🏊',
  running: '🏃',
  cycling: '🚴',
  golf: '⛳',
  boxing: '🥊',
  yoga: '🧘',
  gym: '💪',
  default: '🏆',
};

// Vibe configurations
const VIBE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  COMPETITIVE: { label: 'Competitive', emoji: '🏆', color: '#ef4444' },
  CASUAL: { label: 'Casual', emoji: '☕', color: '#10b981' },
  ACADEMY: { label: 'Academy', emoji: '🎓', color: '#8b5cf6' },
  LANGUAGE_EXCHANGE: { label: 'Language Exchange', emoji: '🗣️', color: '#3b82f6' },
};

// Format date for display
function formatDateTime(date: Date): { date: string; time: string } {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return {
    date: date.toLocaleDateString('en-US', options),
    time: date.toLocaleTimeString('en-US', timeOptions),
  };
}

export default async function Image({ params }: { params: { id: string; locale: string } }) {
  // Fetch session data
  let session: any = null;

  try {
    session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        sport_center: true,
        _count: {
          select: { user_sessions: true },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching session for Twitter image:', error);
  }

  // Fallback if session not found
  if (!session) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
          }}
        >
          <div style={{ fontSize: 80, marginBottom: 20 }}>🏸</div>
          <div style={{ fontSize: 48, fontWeight: 'bold', color: 'white' }}>
            SportsMatch Tokyo
          </div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', marginTop: 16 }}>
            Find your next game
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const sportEmoji = SPORT_EMOJIS[session.sport_type.toLowerCase()] || SPORT_EMOJIS.default;
  const vibeConfig = VIBE_CONFIG[session.vibe] || VIBE_CONFIG.CASUAL;
  const { date, time } = formatDateTime(new Date(session.date_time));
  const participantCount = session._count?.user_sessions || 0;

  // Simplified Twitter card design
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0ea5e9 100%)',
          padding: 48,
        }}
      >
        {/* Main Card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 32,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: 48,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 40,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
              <span style={{ fontSize: 32 }}>🏸</span>
              <span style={{ fontSize: 28, fontWeight: 'bold' }}>SportsMatch Tokyo</span>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '8px 20px',
                background: vibeConfig.color,
                borderRadius: 20,
                color: 'white',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {vibeConfig.emoji} {vibeConfig.label}
            </div>
          </div>

          {/* Sport & Details */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 48 }}>
            {/* Sport Icon */}
            <div
              style={{
                fontSize: 120,
                width: 180,
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 32,
              }}
            >
              {sportEmoji}
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'white' }}>
              <div style={{ fontSize: 64, fontWeight: 'bold', textTransform: 'capitalize' }}>
                {session.sport_type.replace('-', ' ')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 28 }}>
                <span>📅 {date} at {time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 24, opacity: 0.9 }}>
                <span>📍 {session.sport_center?.name_en || 'TBD'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 22, opacity: 0.8 }}>
                <span>👥 {participantCount} joined</span>
                <span>⏱️ {session.duration_minutes}min</span>
                <span
                  style={{
                    padding: '4px 12px',
                    background: 'rgba(251, 191, 36, 0.3)',
                    borderRadius: 8,
                    color: '#fbbf24',
                    textTransform: 'capitalize',
                  }}
                >
                  {session.skill_level}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 32,
              padding: '16px 32px',
              background: 'rgba(59, 130, 246, 0.3)',
              borderRadius: 16,
              color: 'white',
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            Click to join the game! Free to play 🎯
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
