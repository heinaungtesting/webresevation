'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import { Session } from '@/types';
import { formatDate } from '@/lib/utils';
import { MapPin, Clock, Users, Info, ArrowLeft, Loader2, Flag, MoreVertical, Bell, BellOff, ExternalLink, Navigation } from 'lucide-react';
import ReviewSection from '@/app/components/sessions/ReviewSection';
import FavoriteButton from '@/app/components/sessions/FavoriteButton';
import AttendanceTracker from '@/app/components/sessions/AttendanceTracker';
import ReportModal from '@/app/components/ReportModal';
import StudentBadge from '@/app/components/ui/StudentBadge';
import SessionMap from '@/app/components/SessionMap';
import { csrfPost, csrfDelete } from '@/lib/csrfClient';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  // Waitlist state
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [waitlistCount, setWaitlistCount] = useState(0);
  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'USER' | 'SESSION'; id: string; name?: string } | null>(null);

  useEffect(() => {
    fetchSession();
    if (user) {
      fetchWaitlistStatus();
    }
  }, [params.id, user]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${params.id}`);

      if (!response.ok) {
        throw new Error('Session not found');
      }

      const data = await response.json();
      setSession(data);

      // Check if user is attending
      if (user && data.participants) {
        const isUserAttending = data.participants.some((p: any) => p.id === user.id);
        setIsAttending(isUserAttending);
      }
    } catch (err) {
      setError('Failed to load session');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlistStatus = async () => {
    try {
      const response = await fetch(`/api/sessions/${params.id}/waitlist`);
      if (response.ok) {
        const data = await response.json();
        setWaitlistCount(data.count);
        setWaitlistPosition(data.userPosition);
        setIsOnWaitlist(data.userPosition !== null);
      }
    } catch (err) {
      console.error('Error fetching waitlist:', err);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) {
      router.push(`/login?redirectTo=/sessions/${params.id}`);
      return;
    }

    setActionLoading(true);
    try {
      const data = await csrfPost(`/api/sessions/${params.id}/waitlist`, {});

      setIsOnWaitlist(true);
      setWaitlistPosition(data.position);
      setWaitlistCount((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to join waitlist');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    setActionLoading(true);
    try {
      await csrfDelete(`/api/sessions/${params.id}/waitlist`);

      setIsOnWaitlist(false);
      setWaitlistPosition(null);
      setWaitlistCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message || 'Failed to leave waitlist');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttendance = async () => {
    if (!user) {
      router.push(`/login?redirectTo=/sessions/${params.id}`);
      return;
    }

    setActionLoading(true);
    try {
      if (isAttending) {
        // Cancel attendance
        await csrfDelete('/api/attendance', {
          body: JSON.stringify({ session_id: session?.id }),
          headers: { 'Content-Type': 'application/json' },
        });

        setIsAttending(false);
        // Refresh session data
        await fetchSession();
      } else {
        // Mark attendance (join session)
        await csrfPost('/api/attendance', { session_id: session?.id });

        setIsAttending(true);
        // Refresh session data
        await fetchSession();
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card padding="lg">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
              <Button onClick={() => router.push('/sessions')}>
                Back to Sessions
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isFull = session.max_participants && session.current_participants >= session.max_participants;
  const spotsLeft = session.max_participants ? session.max_participants - session.current_participants : null;

  // Handler for opening report modal
  const openReportModal = (type: 'USER' | 'SESSION', id: string, name?: string) => {
    setReportTarget({ type, id, name });
    setReportModalOpen(true);
  };

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
                <div className="flex items-center gap-2">
                  <FavoriteButton sessionId={session.id} size="lg" />
                  {user && user.id !== session.created_by && (
                    <button
                      onClick={() => openReportModal('SESSION', session.id, `${session.sport_type} session`)}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Report this session"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  )}
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

            {/* Map Section */}
            {session.sport_center?.latitude && session.sport_center?.longitude && (
              <Card padding="lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-semibold">Location</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const address = encodeURIComponent(
                          session.sport_center?.address_en ||
                          `${session.sport_center?.latitude},${session.sport_center?.longitude}`
                        );
                        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                      }}
                      className="text-sm flex items-center justify-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      <span className="hidden sm:inline">Open in Maps</span>
                      <span className="sm:hidden">Open Map</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const destination = `${session.sport_center?.latitude},${session.sport_center?.longitude}`;
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                      }}
                      className="text-sm flex items-center justify-center"
                    >
                      <Navigation className="w-4 h-4 mr-1.5" />
                      Get Directions
                    </Button>
                  </div>
                </div>

                {/* Location Details */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <p className="font-semibold text-gray-900 mb-1">
                    {session.sport_center?.name_en}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {session.sport_center?.address_en}
                  </p>
                  {session.sport_center?.station_en && (
                    <div className="flex items-center gap-1.5 text-sm text-blue-600">
                      <span>🚉</span>
                      <span>Near {session.sport_center.station_en}</span>
                    </div>
                  )}
                </div>

                {/* Map */}
                <div className="h-[300px] sm:h-[400px]">
                  <SessionMap
                    sessions={[session]}
                    height="100%"
                    showLegend={false}
                  />
                </div>
              </Card>
            )}

            {/* Attendees Section */}
            <Card padding="lg">
              <h2 className="text-xl font-semibold mb-4">
                Who's Going ({session.current_participants})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {session.participants && session.participants.length > 0 ? (
                  session.participants.map((participant: any) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                      <div className="flex items-center gap-2 min-w-0">
                        {participant.avatar_url ? (
                          <img
                            src={participant.avatar_url}
                            alt={participant.display_name || participant.username || 'Player'}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold flex-shrink-0">
                            {(participant.display_name || participant.username || 'P').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm truncate font-medium">
                              {participant.display_name || participant.username || 'Player'}
                            </span>
                            {participant.is_verified_student && <StudentBadge size="sm" />}
                          </div>
                          {participant.reliability_score !== undefined && participant.reliability_score < 80 && (
                            <span className="text-xs text-amber-600">Reliability: {participant.reliability_score}%</span>
                          )}
                        </div>
                      </div>
                      {user && user.id !== participant.id && (
                        <button
                          onClick={() => openReportModal('USER', participant.id, participant.display_name || participant.username)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                          title="Report user"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  [...Array(session.current_participants)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold">
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-sm">Player {i + 1}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Reviews Section */}
            <ReviewSection
              sessionId={session.id}
              sessionDate={session.date_time}
              hasAttended={isAttending}
            />

            {/* Attendance Tracker - Only visible to host after session ends */}
            <AttendanceTracker
              sessionId={session.id}
              isHost={user?.id === session.created_by}
              isPast={new Date(session.date_time) < new Date()}
            />
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
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      'Cancel Attendance'
                    )}
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => router.push(`/chat/${session.id}`)}
                  >
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
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Joining...' : "I'm Going!"}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Free to join • No payment required
                      </p>
                    </>
                  ) : isOnWaitlist ? (
                    /* User is on waitlist */
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell className="w-4 h-4 text-amber-600" />
                          <p className="text-amber-800 text-sm font-medium">
                            You're #{waitlistPosition} on the waitlist
                          </p>
                        </div>
                        <p className="text-amber-700 text-xs">
                          We'll notify you when a spot opens up!
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={handleLeaveWaitlist}
                        disabled={actionLoading}
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Leaving...
                          </>
                        ) : (
                          <>
                            <BellOff className="w-4 h-4 mr-2" />
                            Leave Waitlist
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* Session is full, show waitlist option */
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm font-medium">
                          This session is full
                        </p>
                        {waitlistCount > 0 && (
                          <p className="text-red-600 text-xs mt-1">
                            {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} on waitlist
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        onClick={handleJoinWaitlist}
                        disabled={actionLoading}
                        className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Bell className="w-4 h-4 mr-2" />
                            Join Waitlist
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Get notified when a spot opens up
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

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReportTarget(null);
          }}
          entityType={reportTarget.type}
          entityId={reportTarget.id}
          entityName={reportTarget.name}
        />
      )}
    </div>
  );
}
