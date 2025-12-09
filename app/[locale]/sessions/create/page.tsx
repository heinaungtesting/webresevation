'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/contexts/AuthContext';
import { ArrowLeft, Calendar, Clock, Users, MapPin, Flame, Coffee, GraduationCap, Languages } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Select from '@/app/components/ui/Select';
import Card from '@/app/components/ui/Card';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';
import { getLanguageOptions } from '@/app/components/ui/LanguageFlag';
import { csrfPost } from '@/lib/csrfClient';

export default function CreateSessionPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('sessions');
  const tCommon = useTranslations('common');
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
    max_participants: '8',
    description_en: '',
    description_ja: '',
    // Language exchange & vibe fields
    primary_language: 'ja',
    allow_english: false,
    vibe: 'CASUAL',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const sports = useMemo(() => [
    { value: 'badminton', label: t('badminton') },
    { value: 'basketball', label: t('basketball') },
    { value: 'volleyball', label: t('volleyball') },
    { value: 'tennis', label: t('tennis') },
    { value: 'soccer', label: t('soccer') },
    { value: 'futsal', label: t('futsal') },
    { value: 'table-tennis', label: t('tableTennis') },
  ], [t]);

  const skillLevels = useMemo(() => [
    { value: 'beginner', label: t('beginner') },
    { value: 'intermediate', label: t('intermediate') },
    { value: 'advanced', label: t('advanced') },
  ], [t]);

  const durations = useMemo(() => [
    { value: '60', label: t('oneHour') },
    { value: '90', label: t('onePointFiveHours') },
    { value: '120', label: t('twoHours') },
    { value: '150', label: t('twoPointFiveHours') },
    { value: '180', label: t('threeHours') },
  ], [t]);

  const vibes = useMemo(() => [
    { value: 'COMPETITIVE', label: t('vibeCompetitive') },
    { value: 'CASUAL', label: t('vibeCasual') },
    { value: 'ACADEMY', label: t('vibeAcademy') },
    { value: 'LANGUAGE_EXCHANGE', label: t('vibeLanguageExchange') },
  ], [t]);

  const languages = useMemo(() => {
    const languageOptions = getLanguageOptions();
    if (!Array.isArray(languageOptions)) return [];
    return languageOptions.map((l) => ({
      value: l.value,
      label: `${l.flag} ${l.label}`,
    }));
  }, []);

  useEffect(() => {
    if (user) {
      fetchSportCenters();
    }
  }, [user]);

  const fetchSportCenters = async () => {
    try {
      const response = await fetch('/api/sport-centers');
      if (!response.ok) throw new Error('Failed to fetch sport centers');
      const data = await response.json();
      setSportCenters(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, sport_center_id: data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching sport centers:', err);
      setError('Failed to load sport centers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sport_center_id) {
      newErrors.sport_center_id = t('pleaseSelectSportCenter');
    }
    if (!formData.date) {
      newErrors.date = t('dateRequired');
    } else {
      const selectedDate = new Date(formData.date + 'T' + (formData.time || '00:00'));
      if (selectedDate < new Date()) {
        newErrors.date = t('dateMustBeFuture');
      }
    }
    if (!formData.time) {
      newErrors.time = t('timeRequired');
    }
    if (formData.max_participants && parseInt(formData.max_participants) < 2) {
      newErrors.max_participants = t('mustAllow2Participants');
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

      const session = await csrfPost('/api/sessions', {
        sport_center_id: formData.sport_center_id,
        sport_type: formData.sport_type,
        skill_level: formData.skill_level,
        date_time: dateTime.toISOString(),
        duration_minutes: parseInt(formData.duration_minutes),
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        description_en: formData.description_en || null,
        description_ja: formData.description_ja || null,
        // Language exchange & vibe fields
        primary_language: formData.primary_language,
        allow_english: formData.allow_english,
        vibe: formData.vibe,
      });

      router.push(`/${locale}/sessions/${session.id}`);
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.message || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            title={t('pleaseLogIn')}
            message={t('needLoginToCreate')}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text={tCommon('loading')} fullScreen />
      </div>
    );
  }

  if (sportCenters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            title={t('noSportCentersAvailable')}
            message={t('noSportCentersMessage')}
          />
        </div>
      </div>
    );
  }

  // Get minimum date (today) in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/sessions`)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{t('createTitle')}</h1>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Sport Center */}
            <Select
              label={t('sportCenter')}
              name="sport_center_id"
              value={formData.sport_center_id}
              onChange={handleChange}
              required
              fullWidth
              error={errors.sport_center_id}
              options={Array.isArray(sportCenters) ? sportCenters.map((center) => ({
                value: center.id,
                label: locale === 'ja' && center.name_ja
                  ? `${center.name_ja} - ${center.address_ja || center.address_en}`
                  : `${center.name_en} - ${center.address_en}`,
              })) : []}
            />

            {/* Sport Type */}
            <Select
              label={t('sportType')}
              name="sport_type"
              value={formData.sport_type}
              onChange={handleChange}
              required
              fullWidth
              options={sports}
            />

            {/* Skill Level */}
            <Select
              label={t('skillLevel')}
              name="skill_level"
              value={formData.skill_level}
              onChange={handleChange}
              required
              fullWidth
              options={skillLevels}
            />

            {/* Session Vibe */}
            <Select
              label={t('sessionVibe')}
              name="vibe"
              value={formData.vibe}
              onChange={handleChange}
              required
              fullWidth
              options={vibes}
            />

            {/* Language Settings */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Languages className="w-4 h-4" />
                {t('languageSettings')}
              </h3>

              <Select
                label={t('primaryLanguage')}
                name="primary_language"
                value={formData.primary_language}
                onChange={handleChange}
                required
                fullWidth
                options={languages}
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="allow_english"
                  checked={formData.allow_english}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">{t('englishFriendly')}</span>
                  <p className="text-xs text-gray-500">
                    {t('englishFriendlyDesc')}
                  </p>
                </div>
              </label>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  {t('date')} <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={today}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[44px]"
                  />
                </div>
                {errors.date && (
                  <span className="text-sm text-red-600">{errors.date}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  {t('time')} <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[44px]"
                  />
                </div>
                {errors.time && (
                  <span className="text-sm text-red-600">{errors.time}</span>
                )}
              </div>
            </div>

            {/* Duration */}
            <Select
              label={t('duration')}
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              required
              fullWidth
              options={durations}
            />

            {/* Max Participants */}
            <Input
              label={t('maxParticipantsOptional')}
              name="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={handleChange}
              placeholder="e.g., 8"
              min="2"
              fullWidth
              error={errors.max_participants}
            />

            {/* Description (English) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {t('descriptionEn')}
              </label>
              <textarea
                name="description_en"
                value={formData.description_en}
                onChange={handleChange}
                placeholder={t('descriptionEnPlaceholder')}
                rows={3}
                className="px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full"
              />
            </div>

            {/* Description (Japanese) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {t('descriptionJa')}
              </label>
              <textarea
                name="description_ja"
                value={formData.description_ja}
                onChange={handleChange}
                placeholder={t('descriptionJaPlaceholder')}
                rows={3}
                className="px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full"
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{t('infoNote')}</strong> {t('infoMessage')}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${locale}/sessions`)}
                fullWidth
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                fullWidth
              >
                {t('createButton')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
