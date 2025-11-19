'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

interface FavoriteButtonProps {
  sessionId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FavoriteButton({
  sessionId,
  size = 'md',
  className = '',
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, sessionId]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/favorite`);
      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || loading) return;

    setLoading(true);
    try {
      if (isFavorited) {
        const response = await fetch(`/api/sessions/${sessionId}/favorite`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsFavorited(false);
        }
      } else {
        const response = await fetch(`/api/sessions/${sessionId}/favorite`, {
          method: 'POST',
        });
        if (response.ok) {
          setIsFavorited(true);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`${buttonSizes[size]} rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50 ${className}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`${sizeClasses[size]} transition-colors ${
          isFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-500'
        }`}
      />
    </button>
  );
}
