'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

/**
 * Hook that fetches all user favorites once and provides lookup
 * This prevents N+1 queries by batching all favorite checks
 */
export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/me/favorites/ids');
        if (response.ok) {
          const data = await response.json();
          setFavorites(new Set(data.sessionIds));
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [user]);
  
  const addFavorite = (sessionId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      newSet.add(sessionId);
      return newSet;
    });
  };
  
  const removeFavorite = (sessionId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      newSet.delete(sessionId);
      return newSet;
    });
  };
  
  const isFavorited = (id: string) => favorites.has(id);
  
  return { favorites, loading, isFavorited, addFavorite, removeFavorite };
}
