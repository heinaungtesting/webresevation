'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import { Session } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { MapPin, Clock, Users, Info, ArrowLeft } from 'lucide-react';

// Mock data
const mockSession: Session = {
  id: '1',
  sport_center_id: '1',
  sport_type: 'badminton',
  skill_level: 'intermediate',
  date_time: new Date(Date.now() + 86400000).toISOString(),
  duration_minutes: 120,
  max_participants: 8,
  current_participants: 5,
  description_en: 'Fun badminton session for intermediate players. Bring your own racket and shuttlecock. We will have casual doubles games. All skill levels welcome!',
  created_by: 'user1',
  created_at: new Date().toISOString(),
  sport_center: {
    id: '1',
    name_en: 'Tokyo Sport Center',
    name_ja: '東京スポーツセンター',
    address_en: '1-2-3 Shibuya, Tokyo',
    address_ja: '東京都渋谷区1-2-3',
    station_en: 'Shibuya Station',
    station_ja: '渋谷駅',
  },
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(false);

  const session = mockSession; // In real app, fetch by params.id

  const handleAttendance = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual attendance marking
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsAttending(!isAttending);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isFull = session.max_participants && session.current_participants >= session.max_participants;
  const spotsLeft = session.max_participants ? session.max_participants - session.current_participants : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sessions
        </Button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Session Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🏸</span>
                    <h1 className="text-3xl font-bold capitalize">
                      {session.sport_type.replace('-', ' ')}
                    </h1>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="warning">{session.skill_level}</Badge>
                    {isFull && <Badge variant="danger">Full</Badge>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="font-semibold">{session.sport_center?.name_en}</p>
                    <p className="text-sm text-gray-600">{session.sport_center?.address_en}</p>
                    {session.sport_center?.station_en && (
                      <p className="text-sm text-blue-600">
                        📍 Near {session.sport_center.station_en}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-semibold">{formatDate(session.date_time)}</p>
                    <p className="text-sm text-gray-600">
                      Duration: {session.duration_minutes} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-semibold">
                      {session.current_participants}
                      {session.max_participants && ` / ${session.max_participants}`} participants
                    </p>
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <p className="text-sm text-green-600">
                        {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">Description</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {session.description_en || 'No description provided.'}
              </p>
            </Card>

            {/* Attendees Section */}
            <Card padding="lg">
              <h2 className="text-xl font-semibold mb-4">
                Who's Going ({session.current_participants})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...Array(session.current_participants)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="text-sm">Player {i + 1}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Action Card */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="sticky top-4">
              <h3 className="font-semibold text-lg mb-4">Join this session</h3>

              {isAttending ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ You're attending this session
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleAttendance}
                    disabled={loading}
                  >
                    {loading ? 'Canceling...' : 'Cancel Attendance'}
                  </Button>
                  <Button variant="primary" fullWidth>
                    Open Chat Room
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {!isFull ? (
                    <>
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleAttendance}
                        disabled={loading}
                      >
                        {loading ? 'Joining...' : "I'm Going!"}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Free to join • No payment required
                      </p>
                    </>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm font-medium">
                        This session is full
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-sm mb-2">Session Rules</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Be respectful to all players</li>
                  <li>• Arrive on time</li>
                  <li>• Bring your own equipment</li>
                  <li>• Cancel at least 2 hours before if you can't make it</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
