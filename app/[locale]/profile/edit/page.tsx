'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
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
    'badminton',
    'basketball',
    'volleyball',
    'tennis',
    'soccer',
    'futsal',
    'table-tennis',
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
      <div className="min-h-screen bg-gray-50 py-8">
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
      <div className="min-h-screen bg-gray-50">
        <Loading text="Loading profile..." fullScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/profile')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        </div>

        {/* Form */}
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                Profile updated successfully! Redirecting...
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex justify-center pb-4 border-b border-gray-200">
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

            <Input
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="your-username"
              fullWidth
            />

            <Input
              label="Display Name"
              name="display_name"
              type="text"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Your Name"
              fullWidth
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows={4}
                className="px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[44px] w-full"
              />
            </div>

            <Input
              label="Location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Shibuya, Tokyo"
              fullWidth
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Favorite Sports
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sports.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium capitalize ${formData.sport_preferences.includes(sport)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                  >
                    {sport.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/profile')}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                fullWidth
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
