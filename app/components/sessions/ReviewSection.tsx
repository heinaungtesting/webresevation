'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StarRating from './StarRating';
import { formatDate } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface ReviewSectionProps {
  sessionId: string;
  sessionDate: string;
  hasAttended: boolean;
}

export default function ReviewSection({
  sessionId,
  sessionDate,
  hasAttended,
}: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  const isPastSession = new Date(sessionDate) < new Date();
  const canReview = user && hasAttended && isPastSession && !hasReviewed;

  useEffect(() => {
    fetchReviews();
  }, [sessionId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data.reviews);
      setAverageRating(data.averageRating);
      setTotalReviews(data.totalReviews);

      // Check if user has already reviewed
      if (user) {
        const userReview = data.reviews.find((r: Review) => r.user.id === user.id);
        setHasReviewed(!!userReview);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRating) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/sessions/${sessionId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          comment: newComment,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      // Refresh reviews
      await fetchReviews();
      setShowForm(false);
      setNewRating(0);
      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getUserName = (reviewUser: Review['user']) => {
    return reviewUser.display_name || reviewUser.username || 'Anonymous';
  };

  return (
    <Card padding="lg" className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
        {totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} size="sm" />
            <span className="text-sm text-gray-600">
              {averageRating.toFixed(1)} ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      {/* Review Form */}
      {canReview && !showForm && (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="mb-4 w-full"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Write a Review
        </Button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <StarRating
              rating={newRating}
              interactive
              onChange={setNewRating}
              size="lg"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (optional)
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setNewRating(0);
                setNewComment('');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              Submit Review
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No reviews yet. {isPastSession && hasAttended && !hasReviewed && 'Be the first to review!'}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="flex items-start gap-3">
                {review.user.avatar_url ? (
                  <Image
                    src={review.user.avatar_url}
                    alt={getUserName(review.user)}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                    unoptimized={review.user.avatar_url.includes('dicebear')}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">
                      {getUserName(review.user).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {getUserName(review.user)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.comment && (
                    <p className="mt-2 text-gray-600 text-sm">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
