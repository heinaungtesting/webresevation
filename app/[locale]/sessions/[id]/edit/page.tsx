'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Select from '@/app/components/ui/Select';
import Card from '@/app/components/ui/Card';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { user } = useAuth();
  const [sportCenters, setSportCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    sport_center_id: '',
    sport_type: 'badminton',
    skill_level: 'intermediate',
    date: '',
    time: '',
    duration_minutes: '120',
    max_participants: '',
    description_en: '',
    description_ja: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const sports = [
    { value: 'badminton', label: 'Badminton' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'soccer', label: 'Soccer' },
    { value: 'futsal', label: 'Futsal' },
    { value: 'table-tennis', label: 'Table Tennis' },
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const durations = [
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
    { value: '150', label: '2.5 hours' },
    { value: '180', label: '3 hours' },
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, sessionId]);

  const fetchData = async () => {
    try {
      // Fetch sport centers and session data in parallel
      const [centersResponse, sessionResponse] = await Promise.all([
        fetch('/api/sport-centers'),
        fetch(`/api/sessions/${sessionId}`),
      ]);

      if (!centersResponse.ok) throw new Error('Failed to fetch sport centers');
      if (!sessionResponse.ok) {
        if (sessionResponse.status === 404) {
          throw new Error('Session not found');
        }
        throw new Error('Failed to fetch session');
      }

      const centers = await centersResponse.json();
      const session = await sessionResponse.json();

      setSportCenters(centers);

      // Pre-fill form with session data
      const sessionDate = new Date(session.date_time);
      const dateStr = sessionDate.toISOString().split('T')[0];
      const timeStr = sessionDate.toTimeString().slice(0, 5);

      setFormData({
        sport_center_id: session.sport_center_id,
        sport_type: session.sport_type,
        skill_level: session.skill_level,
        date: dateStr,
        time: timeStr,
        duration_minutes: session.duration_minutes.toString(),
        max_participants: session.max_participants?.toString() || '',
        description_en: session.description_en || '',
        description_ja: session.description_ja || '',
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sport_center_id) {
      newErrors.sport_center_id = 'Please select a sport center';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date + 'T' + formData.time);
      if (selectedDate < new Date()) {
        newErrors.date = 'Date must be in the future';
      }
    }
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }
    if (formData.max_participants && parseInt(formData.max_participants) < 2) {
      newErrors.max_participants = 'Must be at least 2 participants';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const dateTime = new Date(formData.date + 'T' + formData.time);

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport_center_id: formData.sport_center_id,
          sport_type: formData.sport_type,
          skill_level: formData.skill_level,
          date_time: dateTime.toISOString(),
          duration_minutes: parseInt(formData.duration_minutes),
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          description_en: formData.description_en || null,
          description_ja: formData.description_ja || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update session');
      }

      // Success! Redirect to created sessions page
      router.push('/my-sessions/created');
    } catch (err: any) {
      console.error('Error updating session:', err);
      setError(err.message || 'Failed to update session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            title="Please log in"
            message="You need to be logged in to edit sessions"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text="Loading session..." fullScreen />
      </div>
    );
  }

  if (error && !formData.sport_center_id) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage message={error} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/my-sessions/created')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Session</h1>
            <p className="text-gray-600">Update session details</p>
          </div>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Session Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Session Details
              </h2>

              <div className="space-y-4">
                {/* Sport Center */}
                <Select
                  label="Sport Center"
                  name="sport_center_id"
                  value={formData.sport_center_id}
                  onChange={handleChange}
                  error={errors.sport_center_id}
                  fullWidth
                  required
                  options={[
                    { value: '', label: 'Select a sport center...' },
                    ...sportCenters.map((center) => ({
                      value: center.id,
                      label: `${center.name_en} - ${center.address_en}`,
                    })),
                  ]}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sport Type */}
                  <Select
                    label="Sport Type"
                    name="sport_type"
                    value={formData.sport_type}
                    onChange={handleChange}
                    fullWidth
                    required
                    options={sports}
                  />

                  {/* Skill Level */}
                  <Select
                    label="Skill Level"
                    name="skill_level"
                    value={formData.skill_level}
                    onChange={handleChange}
                    fullWidth
                    required
                    options={skillLevels}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={minDate}
                        required
                        className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                    )}
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                        className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {errors.time && (
                      <p className="mt-1 text-sm text-red-600">{errors.time}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duration */}
                  <Select
                    label="Duration"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    fullWidth
                    required
                    options={durations}
                  />

                  {/* Max Participants */}
                  <Input
                    label="Maximum Participants (Optional)"
                    name="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={handleChange}
                    placeholder="Leave empty for unlimited"
                    error={errors.max_participants}
                    fullWidth
                    min="2"
                  />
                </div>

                {/* Description (English) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    name="description_en"
                    value={formData.description_en}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe your session in English..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Description (Japanese) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Japanese)
                  </label>
                  <textarea
                    name="description_ja"
                    value={formData.description_ja}
                    onChange={handleChange}
                    rows={3}
                    placeholder="セッションを日本語で説明してください..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/my-sessions/created')}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                fullWidth
              >
                Update Session
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
