'use client';

import { useState, useEffect } from 'react';
import { Check, X, Users, AlertTriangle, Loader2, CheckCircle, Shield } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Avatar from '@/app/components/ui/Avatar';

interface Participant {
  user_id: string;
  user: {
    id: string;
    email: string;
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    reliability_score: number;
  };
  status: 'REGISTERED' | 'ATTENDED' | 'NO_SHOW';
  marked_at: string;
  attended_at?: string | null;
}

interface AttendanceData {
  session_id: string;
  attendance_marked: boolean;
  session_date: string;
  is_past: boolean;
  participants: Participant[];
}

interface AttendanceTrackerProps {
  sessionId: string;
  isHost: boolean;
  isPast: boolean;
}

export default function AttendanceTracker({
  sessionId,
  isHost,
  isPast,
}: AttendanceTrackerProps) {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  // Don't render if not host or session is not past
  if (!isHost || !isPast) {
    return null;
  }

  useEffect(() => {
    fetchAttendance();
  }, [sessionId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/attendance`);

      if (!response.ok) {
        if (response.status === 403) {
          // Not authorized - hide component
          setData(null);
          return;
        }
        throw new Error('Failed to fetch attendance');
      }

      const attendanceData: AttendanceData = await response.json();
      setData(attendanceData);

      // Initialize attendance state from existing data
      const initialAttendance: Record<string, boolean> = {};
      attendanceData.participants.forEach((p) => {
        if (p.status === 'ATTENDED') {
          initialAttendance[p.user_id] = true;
        } else if (p.status === 'NO_SHOW') {
          initialAttendance[p.user_id] = false;
        } else {
          // Default to attended for new entries
          initialAttendance[p.user_id] = true;
        }
      });
      setAttendance(initialAttendance);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = (userId: string) => {
    if (data?.attendance_marked) return; // Can't modify if already marked

    setAttendance((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleSubmit = async () => {
    if (!data || data.attendance_marked) return;

    try {
      setSubmitting(true);
      setError(null);

      const attendees = Object.entries(attendance).map(([user_id, attended]) => ({
        user_id,
        attended,
      }));

      const response = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendees }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark attendance');
      }

      setSuccess(true);
      // Refresh data
      fetchAttendance();
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      setError(err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDisplayName = (user: Participant['user']) => {
    return user.display_name || user.username || user.email.split('@')[0];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span className="ml-2 text-slate-500">Loading attendance...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Mark Attendance</h3>
            <p className="text-sm text-white/80">
              {data.attendance_marked
                ? 'Attendance has been recorded'
                : 'Check who attended the session'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-600">Attendance has been recorded successfully.</p>
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="space-y-3">
          {data.participants.map((participant) => (
            <div
              key={participant.user_id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                data.attendance_marked
                  ? participant.status === 'ATTENDED'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                  : attendance[participant.user_id]
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={participant.user.avatar_url || undefined}
                  alt={getDisplayName(participant.user)}
                  size="md"
                />
                <div>
                  <p className="font-medium text-slate-900">
                    {getDisplayName(participant.user)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getReliabilityColor(
                        participant.user.reliability_score
                      )}`}
                    >
                      <Shield className="w-3 h-3" />
                      {participant.user.reliability_score}% Reliable
                    </span>
                  </div>
                </div>
              </div>

              {data.attendance_marked ? (
                // Show status badge if already marked
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    participant.status === 'ATTENDED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {participant.status === 'ATTENDED' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Attended</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">No Show</span>
                    </>
                  )}
                </div>
              ) : (
                // Interactive toggle if not yet marked
                <button
                  onClick={() => handleToggleAttendance(participant.user_id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    attendance[participant.user_id]
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {attendance[participant.user_id] ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Present</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">No Show</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {!data.attendance_marked && data.participants.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {Object.values(attendance).filter(Boolean).length} of{' '}
                {data.participants.length} marked as present
              </p>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                variant="primary"
                className="min-w-[160px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Attendance
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Note: Attendance can only be submitted once. Users marked as "No Show" will have their
              reliability score reduced.
            </p>
          </div>
        )}

        {data.participants.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No participants to mark attendance for.</p>
          </div>
        )}
      </div>
    </div>
  );
}
