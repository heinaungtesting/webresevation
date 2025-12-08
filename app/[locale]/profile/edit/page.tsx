'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Card from '@/app/components/ui/Card';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';
import AvatarUpload from '@/app/components/profile/AvatarUpload';
import { csrfPatch } from '@/lib/csrfClient';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    location: '',
    sport_preferences: [] as string[],
  });

  const sports = [
    { name: 'badminton', emoji: '🏸' },
    { name: 'basketball', emoji: '🏀' },
    { name: 'volleyball', emoji: '🏐' },
    { name: 'tennis', emoji: '🎾' },
    { name: 'soccer', emoji: '⚽' },
    { name: 'futsal', emoji: '⚽' },
    { name: 'table-tennis', emoji: '🏓' },
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
      setAvatarUrl(data.avatar_url || null);
      setFormData({
        username: data.username || '',
        display_name: data.display_name || '',
        bio: data.bio || '',
        location: data.location || '',
        sport_preferences: data.sport_preferences || [],
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setSuccess(false);
  };

  const toggleSport = (sport: string) => {
    setFormData({
      ...formData,
      sport_preferences: formData.sport_preferences.includes(sport)
        ? formData.sport_preferences.filter((s) => s !== sport)
        : [...formData.sport_preferences, sport],
    });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await csrfPatch('/api/users/me', formData);

      setSuccess(true);
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            title="Please log in"
            message="You need to be logged in to edit your profile"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <Loading text="Loading your cute profile... ✨" fullScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cute Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/profile')}
            className="p-2 hover:bg-white/50 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-purple-600" />
          </Button>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-pink-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Edit Profile ✨
            </h1>
          </div>
        </div>

        {/* Kawaii Form Card */}
        <Card padding="lg" className="bg-white/80 backdrop-blur-sm border-2 border-pink-100 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl text-red-800 text-sm flex items-center gap-2">
                <span>❌</span>
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl text-green-800 text-sm flex items-center gap-2 animate-pulse">
                <span>✨</span>
                Profile updated successfully! Redirecting...
              </div>
            )}

            {/* Cute Avatar Upload Section */}
            <div className="flex justify-center pb-6 border-b-2 border-dashed border-pink-200">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                displayName={formData.display_name || formData.username || profile?.email?.split('@')[0] || 'User'}
                onUploadComplete={(url) => {
                  setAvatarUrl(url);
                  refreshProfile();
                }}
                onDelete={() => {
                  setAvatarUrl(null);
                  refreshProfile();
                }}
              />
            </div>

            {/* Cute Input Fields */}
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-purple-600 mb-2 block flex items-center gap-2">
                  <span>👤</span> Username
                </label>
                <Input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="your-username"
                  fullWidth
                  className="border-2 border-pink-100 focus:border-purple-400 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-600 mb-2 block flex items-center gap-2">
                  <span>✨</span> Display Name
                </label>
                <Input
                  name="display_name"
                  type="text"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="Your Cute Name"
                  fullWidth
                  className="border-2 border-pink-100 focus:border-purple-400 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-600 mb-2 block flex items-center gap-2">
                  <span>💭</span> Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself... ✨"
                  rows={4}
                  className="px-4 py-3 border-2 border-pink-100 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 w-full bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-600 mb-2 block flex items-center gap-2">
                  <span>📍</span> Location
                </label>
                <Input
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Shibuya, Tokyo 🗼"
                  fullWidth
                  className="border-2 border-pink-100 focus:border-purple-400 rounded-2xl"
                />
              </div>

              {/* Super Cute Sport Selection */}
              <div>
                <label className="text-sm font-semibold text-purple-600 mb-3 block flex items-center gap-2">
                  <span>🏃‍♀️</span> Favorite Sports
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sports.map((sport) => (
                    <button
                      key={sport.name}
                      type="button"
                      onClick={() => toggleSport(sport.name)}
                      className={`px-4 py-3 rounded-2xl border-2 transition-all duration-200 text-sm font-medium capitalize flex items-center justify-center gap-2 ${
                        formData.sport_preferences.includes(sport.name)
                          ? 'border-purple-400 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 shadow-md transform scale-105'
                          : 'border-pink-100 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50'
                      }`}
                    >
                      <span className="text-xl">{sport.emoji}</span>
                      <span>{sport.name.replace('-', ' ')}</span>
                      {formData.sport_preferences.includes(sport.name) && <span>✨</span>}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-purple-500 mt-2 text-center">
                  Select your favorite sports! The more, the better~ 💪
                </p>
              </div>
            </div>

            {/* Cute Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/profile')}
                fullWidth
                className="border-2 border-purple-200 text-purple-600 hover:bg-purple-50 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                fullWidth
                className="gap-2 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 border-0 rounded-2xl shadow-lg"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'} ✨
              </Button>
            </div>
          </form>
        </Card>

        {/* Cute Motivational Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-purple-500">
            Make your profile shine! ✨ かわいい~ 🌸
          </p>
        </div>
      </div>
    </div>
  );
}
