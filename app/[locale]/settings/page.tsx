'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Bell, Globe, Save, FileText, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Select from '@/app/components/ui/Select';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';
import { csrfPatch } from '@/lib/csrfClient';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState({
    language_preference: 'en',
    notification_email: true,
    notification_push: true,
  });

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
      setSettings({
        language_preference: data.language_preference || 'en',
        notification_email: data.notification_email ?? true,
        notification_push: data.notification_push ?? true,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: value,
    });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await csrfPatch('/api/users/me', settings);

      setSuccess(true);
      // Reload page if language changed
      if (settings.language_preference !== profile?.language_preference) {
        setTimeout(() => {
          window.location.href = `/${settings.language_preference}/settings`;
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error updating settings:', err);
      setError(err.message || 'Failed to update settings');
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
            message="You need to be logged in to access settings"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text="Loading settings..." fullScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              Settings updated successfully!
            </div>
          )}

          {/* Language Preferences */}
          <Card padding="lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Language & Region
                </h2>
                <Select
                  label="Preferred Language"
                  value={settings.language_preference}
                  onChange={(e) =>
                    handleChange('language_preference', e.target.value)
                  }
                  fullWidth
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'ja', label: '日本語 (Japanese)' },
                  ]}
                />
                <p className="text-sm text-gray-600 mt-2">
                  This will change the language of the entire application.
                </p>
              </div>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card padding="lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Notifications
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">
                        Email Notifications
                      </p>
                      <p className="text-sm text-gray-600">
                        Receive session reminders and updates via email
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.notification_email}
                        onChange={(e) =>
                          handleChange('notification_email', e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">
                        Push Notifications
                      </p>
                      <p className="text-sm text-gray-600">
                        Receive instant notifications for messages and sessions
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.notification_push}
                        onChange={(e) =>
                          handleChange('notification_push', e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </form>

        {/* Legal Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Legal</h2>
          <Card padding="none">
            <Link
              href="/terms"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 group"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    Terms of Service
                  </p>
                  <p className="text-sm text-gray-500">
                    Our rules and guidelines
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </Link>

            <Link
              href="/privacy"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    Privacy Policy
                  </p>
                  <p className="text-sm text-gray-500">
                    How we handle your data
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
