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
    console.error('Error fetching session for OG image:', error);
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
  const spotsText = session.max_participants
    ? `${participantCount}/${session.max_participants} players`
    : `${participantCount} players`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0ea5e9 100%)',
          padding: 48,
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            display: 'flex',
          }}
        />

        {/* Logo & Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 36 }}>🏸</span>
              SportsMatch Tokyo
            </div>
          </div>

          {/* Vibe Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 24,
              background: vibeConfig.color,
              color: 'white',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            <span>{vibeConfig.emoji}</span>
            {vibeConfig.label}
          </div>
        </div>

        {/* Main Content Card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 24,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Left Side - Sport Info */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 48,
            }}
          >
            {/* Sport Icon & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
              <div
                style={{
                  fontSize: 96,
                  width: 140,
                  height: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 28,
                }}
              >
                {sportEmoji}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 'bold',
                    color: 'white',
                    textTransform: 'capitalize',
                    lineHeight: 1.1,
                  }}
                >
                  {session.sport_type.replace('-', ' ')}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      padding: '4px 12px',
                      background: 'rgba(251, 191, 36, 0.3)',
                      borderRadius: 8,
                      color: '#fbbf24',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {session.skill_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Date & Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'white' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    fontSize: 24,
                  }}
                >
                  📅
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 28, fontWeight: 600 }}>{date}</span>
                  <span style={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' }}>{time}</span>
                </div>
              </div>

              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'white' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    fontSize: 24,
                  }}
                >
                  📍
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 24, fontWeight: 600 }}>
                    {session.sport_center?.name_en || 'TBD'}
                  </span>
                  {session.sport_center?.station_en && (
                    <span style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.7)' }}>
                      Near {session.sport_center.station_en}
                    </span>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'white' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    fontSize: 24,
                  }}
                >
                  👥
                </div>
                <span style={{ fontSize: 24, fontWeight: 600 }}>{spotsText}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Call to Action */}
          <div
            style={{
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.3) 0%, rgba(14, 165, 233, 0.3) 100%)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              padding: 32,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: 12,
                }}
              >
                Join the Game!
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.4,
                }}
              >
                Click to view details and sign up
              </div>

              {/* Duration badge */}
              <div
                style={{
                  marginTop: 24,
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'white',
                  fontSize: 18,
                }}
              >
                <span>⏱️</span>
                {session.duration_minutes} minutes
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 24,
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: 16,
          }}
        >
          <span>sportsmatch.tokyo</span>
          <span>Free to join • No payment required</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
