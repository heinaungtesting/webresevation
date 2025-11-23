'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  ArrowLeft,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Eye,
  User as UserIcon,
  Calendar,
  Loader2,
} from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';
import { formatDate, cn } from '@/lib/utils';
import { csrfPatch, csrfPost } from '@/lib/csrfClient';

interface Report {
  id: string;
  entity_type: 'USER' | 'SESSION';
  reason: string;
  description?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  admin_notes?: string;
  created_at: string;
  reporter: {
    id: string;
    display_name?: string;
    username?: string;
    email: string;
  };
  reported_user?: {
    id: string;
    display_name?: string;
    username?: string;
    email: string;
    is_banned: boolean;
    no_show_count: number;
    reliability_score: number;
  };
  session?: {
    id: string;
    sport_type: string;
    date_time: string;
    creator: {
      id: string;
      display_name?: string;
      username?: string;
    };
  };
}

interface StatusCounts {
  PENDING: number;
  REVIEWED: number;
  RESOLVED: number;
  DISMISSED: number;
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'warning', icon: Clock },
  REVIEWED: { label: 'Reviewed', color: 'info', icon: Eye },
  RESOLVED: { label: 'Resolved', color: 'success', icon: CheckCircle },
  DISMISSED: { label: 'Dismissed', color: 'default', icon: XCircle },
};

const REASON_LABELS: Record<string, { label: string; emoji: string }> = {
  HARASSMENT: { label: 'Harassment', emoji: '😤' },
  NO_SHOW: { label: 'No-Show', emoji: '👻' },
  SPAM: { label: 'Spam', emoji: '📧' },
  CREEPY_BEHAVIOR: { label: 'Creepy Behavior', emoji: '😬' },
  FAKE_PROFILE: { label: 'Fake Profile', emoji: '🎭' },
  OTHER: { label: 'Other', emoji: '❓' },
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({ PENDING: 0, REVIEWED: 0, RESOLVED: 0, DISMISSED: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchReports();
    }
  }, [currentUser, statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/reports?${params}`);
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch reports');

      const data = await response.json();
      setReports(data.reports);
      setCounts(data.counts);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string, adminNotes?: string) => {
    try {
      setActionLoading(true);
      await csrfPatch('/api/admin/reports', {
        report_id: reportId,
        status,
        admin_notes: adminNotes,
      });

      await fetchReports();
      setSelectedReport(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const banUser = async (userId: string) => {
    if (!banReason.trim()) {
      alert('Please provide a reason for banning');
      return;
    }

    try {
      setActionLoading(true);
      await csrfPost('/api/admin/reports', {
        user_id: userId,
        reason: banReason,
      });

      alert('User has been banned successfully');
      await fetchReports();
      setShowBanModal(false);
      setBanReason('');
      setSelectedReport(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <ErrorMessage title="Please log in" message="You need to be logged in to access this page" />
        </div>
      </div>
    );
  }

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text="Loading reports..." fullScreen />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <ErrorMessage message={error} onRetry={fetchReports} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Flag className="w-6 h-6 text-red-500" />
                Reports & Trust
              </h1>
              <p className="text-sm text-gray-600">Manage user reports and safety</p>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const).map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  statusFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {config.label}
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  statusFilter === status ? 'bg-white/20' : 'bg-slate-100'
                )}>
                  {counts[status]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-500">No {statusFilter.toLowerCase()} reports to review.</p>
              </div>
            </Card>
          ) : (
            reports.map((report) => {
              const reasonConfig = REASON_LABELS[report.reason] || { label: report.reason, emoji: '❓' };
              const statusConfig = STATUS_CONFIG[report.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={report.id} padding="lg" className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Report Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{reasonConfig.emoji}</span>
                        <span className="font-semibold text-gray-900">{reasonConfig.label}</span>
                        <Badge variant={statusConfig.color as any} size="sm">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <Badge variant={report.entity_type === 'USER' ? 'info' : 'warning'} size="sm">
                          {report.entity_type === 'USER' ? 'User Report' : 'Session Report'}
                        </Badge>
                      </div>

                      {/* Reported Entity */}
                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        {report.entity_type === 'USER' && report.reported_user && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {report.reported_user.display_name || report.reported_user.username || 'Unknown'}
                                  {report.reported_user.is_banned && (
                                    <Badge variant="danger" size="sm" className="ml-2">Banned</Badge>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">{report.reported_user.email}</p>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs text-gray-500">
                                    Reliability: {report.reported_user.reliability_score}%
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    No-shows: {report.reported_user.no_show_count}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {report.entity_type === 'SESSION' && report.session && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 capitalize">
                                {report.session.sport_type.replace('-', ' ')} Session
                              </p>
                              <p className="text-sm text-gray-500">
                                Created by: {report.session.creator?.display_name || report.session.creator?.username || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(report.session.date_time)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {report.description && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-slate-100">
                            "{report.description}"
                          </p>
                        </div>
                      )}

                      {/* Reporter Info */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Reported by:</span>
                        <span className="font-medium">
                          {report.reporter.display_name || report.reporter.username || report.reporter.email}
                        </span>
                        <span>•</span>
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {report.status === 'PENDING' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'REVIEWED')}
                            loading={actionLoading}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Mark Reviewed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'DISMISSED', 'False positive')}
                            loading={actionLoading}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                          {report.entity_type === 'USER' && report.reported_user && !report.reported_user.is_banned && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowBanModal(true);
                              }}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Ban User
                            </Button>
                          )}
                        </>
                      )}

                      {report.status === 'REVIEWED' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'RESOLVED', 'Issue addressed')}
                            loading={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                          {report.entity_type === 'USER' && report.reported_user && !report.reported_user.is_banned && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowBanModal(true);
                              }}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Ban User
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedReport?.reported_user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card padding="lg" className="max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-100">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Ban User</h3>
                <p className="text-sm text-gray-500">
                  {selectedReport.reported_user.display_name || selectedReport.reported_user.username}
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">
                  This action will permanently ban the user and resolve all pending reports against them.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for ban
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Describe why this user is being banned..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setSelectedReport(null);
                }}
                disabled={actionLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => banUser(selectedReport.reported_user!.id)}
                loading={actionLoading}
                disabled={!banReason.trim()}
                className="flex-1"
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
