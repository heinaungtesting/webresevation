'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { AlertCircle, ArrowLeft, CheckCircle, Save, Sparkles } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Card from '@/app/components/ui/Card';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';
import AvatarUpload from '@/app/components/profile/AvatarUpload';
import { csrfPatch } from '@/lib/csrfClient';
import { useTranslations } from 'next-intl';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const t = useTranslations('profile');
  const tSessions = useTranslations('sessions');
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

    // Fix 4.1: Username validation
    if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      setError(t('edit.invalidUsername'));
      setSaving(false);
      return;
    }

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
            title={t('pleaseLogin')}
            message={t('needLogin')}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text={t('edit.loading')} fullScreen />
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
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('edit.title')}
            </h1>
          </div>
        </div>

        {/* Form Card */}
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {t('edit.success')}
              </div>
            )}

            {/* Avatar Upload Section */}
            <div className="flex justify-center pb-6 border-b border-gray-200">
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

            {/* Input Fields */}
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                  {t('edit.username')}
                </label>
                <Input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={t('edit.usernamePlaceholder')}
                  fullWidth
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                  {t('edit.displayName')}
                </label>
                <Input
                  name="display_name"
                  type="text"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder={t('edit.displayNamePlaceholder')}
                  fullWidth
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                  {t('edit.bio')}
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder={t('edit.bioPlaceholder')}
                  rows={4}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 w-full bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                  {t('edit.location')}
                </label>
                <Input
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t('edit.locationPlaceholder')}
                  fullWidth
                />
              </div>

              {/* Sport Selection */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  {t('edit.favoriteSports')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sports.map((sport) => (
                    <button
                      key={sport.name}
                      type="button"
                      onClick={() => toggleSport(sport.name)}
                      className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium capitalize flex items-center justify-center gap-2 ${
                        formData.sport_preferences.includes(sport.name)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-white bg-white text-gray-700 hover:border-gray-200 shadow-sm'
                      }`}
                    >
                      <span className="text-xl">{sport.emoji}</span>
                      <span className="capitalize">{tSessions(sport.name)}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {t('edit.selectSports')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/profile')}
                fullWidth
              >
                {t('edit.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                fullWidth
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? t('edit.saving') : t('edit.saveChanges')}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {t('edit.motivational')}
          </p>
        </div>
      </div>
    </div>
  );
}
