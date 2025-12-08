'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useFavorites } from '@/app/hooks/useFavorites';
import { csrfPost, csrfDelete } from '@/lib/csrfClient';

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
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();
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

  if (!user) return null;

  const currentlyFavorited = isFavorited(sessionId);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    
    setLoading(true);
    try {
      if (currentlyFavorited) {
        await csrfDelete(`/api/sessions/${sessionId}/favorite`);
        removeFavorite(sessionId);
      } else {
        await csrfPost(`/api/sessions/${sessionId}/favorite`, {});
        addFavorite(sessionId);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`${buttonSizes[size]} rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50 ${className}`}
      aria-label={currentlyFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`${sizeClasses[size]} transition-colors ${currentlyFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-500'
          }`}
      />
    </button>
  );
}
