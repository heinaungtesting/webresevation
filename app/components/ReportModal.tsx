'use client';

import { useState, useEffect, Fragment } from 'react';
import { X, Flag, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/app/components/ui/Button';
import { cn } from '@/lib/utils';
import { csrfPost } from '@/lib/csrfClient';

type ReportReason = 'HARASSMENT' | 'NO_SHOW' | 'SPAM' | 'CREEPY_BEHAVIOR' | 'FAKE_PROFILE' | 'OTHER';
type EntityType = 'USER' | 'SESSION';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; icon: string; description: string }[] = [
  {
    value: 'HARASSMENT',
    label: 'Harassment',
    icon: '😤',
    description: 'Bullying, intimidation, or hostile behavior',
  },
  {
    value: 'NO_SHOW',
    label: 'No-Show',
    icon: '👻',
    description: 'Repeatedly not showing up to sessions',
  },
  {
    value: 'SPAM',
    label: 'Spam',
    icon: '📧',
    description: 'Promotional content or spam messages',
  },
  {
    value: 'CREEPY_BEHAVIOR',
    label: 'Creepy Behavior',
    icon: '😬',
    description: 'Inappropriate or uncomfortable behavior',
  },
  {
    value: 'FAKE_PROFILE',
    label: 'Fake Profile',
    icon: '🎭',
    description: 'Misleading or fake information',
  },
  {
    value: 'OTHER',
    label: 'Other',
    icon: '❓',
    description: 'Something else not listed above',
  },
];

export default function ReportModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setDescription('');
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason for your report');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await csrfPost('/api/reports', {
        entity_type: entityType,
        ...(entityType === 'USER' ? { reported_user_id: entityId } : { session_id: entityId }),
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      setSuccess(true);
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-50">
                    <Flag className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Report {entityType === 'USER' ? 'User' : 'Session'}</h2>
                    {entityName && (
                      <p className="text-sm text-slate-500 truncate max-w-[200px]">{entityName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  disabled={loading}
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {success ? (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="inline-flex p-4 rounded-full bg-green-50 mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Report Submitted</h3>
                    <p className="text-slate-500 text-sm">
                      Thank you for helping keep our community safe. Our team will review your report shortly.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {error && (
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl text-red-700 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-3">
                        Why are you reporting this?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {REPORT_REASONS.map((reason) => (
                          <button
                            key={reason.value}
                            onClick={() => setSelectedReason(reason.value)}
                            className={cn(
                              'p-3 rounded-xl text-left transition-all duration-200 border-2',
                              selectedReason === reason.value
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{reason.icon}</span>
                              <span className="font-medium text-sm text-slate-900">{reason.label}</span>
                            </div>
                            <p className="text-xs text-slate-500">{reason.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Additional details (optional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please provide any additional context that might help us understand the issue..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                        rows={3}
                        maxLength={2000}
                      />
                      <p className="text-xs text-slate-400 mt-1 text-right">
                        {description.length}/2000
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              {!success && (
                <div className="p-4 border-t border-slate-100 flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={!selectedReason}
                    className="flex-1"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Submit Report
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
