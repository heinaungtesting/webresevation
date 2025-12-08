'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Edit, MapPin, Calendar, Mail, Sparkles, Trophy, Crown, Target, Award } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';
import UserStats from '@/app/components/profile/UserStats';
import { formatDate } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('profile');
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      Promise.all([fetchProfile(), fetchStats()]).catch(err => {
        console.error('Error fetching profile data:', err);
      });
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/users/me/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Calculate achievements
  const getAchievements = () => {
    if (!stats) return [];

    const achievements = [];
    const totalSessions = stats.total_sessions || 0;
    const createdSessions = stats.created_sessions || 0;
    const reliabilityScore = stats.reliability_score ?? 100;
    const sportCount = stats.sport_breakdown ? Object.keys(stats.sport_breakdown).length : 0;

    // First Session
    if (totalSessions >= 1) {
      achievements.push({
        icon: '🌟',
        title: t('achievements.firstStep.title'),
        description: t('achievements.firstStep.description'),
        color: 'from-yellow-400 to-orange-400',
        unlocked: true,
      });
    }

    // Regular Player
    if (totalSessions >= 10) {
      achievements.push({
        icon: '🏆',
        title: t('achievements.regularPlayer.title'),
        description: t('achievements.regularPlayer.description'),
        color: 'from-blue-400 to-indigo-400',
        unlocked: true,
      });
    }

    // Super Star
    if (totalSessions >= 50) {
      achievements.push({
        icon: '👑',
        title: t('achievements.superStar.title'),
        description: t('achievements.superStar.description'),
        color: 'from-purple-400 to-pink-400',
        unlocked: true,
      });
    }

    // Perfect Attendance
    if (reliabilityScore === 100 && totalSessions >= 5) {
      achievements.push({
        icon: '🎯',
        title: t('achievements.perfectAttendance.title'),
        description: t('achievements.perfectAttendance.description'),
        color: 'from-green-400 to-emerald-400',
        unlocked: true,
      });
    }

    // Sport Enthusiast
    if (sportCount >= 5) {
      achievements.push({
        icon: '💪',
        title: t('achievements.sportEnthusiast.title'),
        description: t('achievements.sportEnthusiast.description'),
        color: 'from-red-400 to-orange-400',
        unlocked: true,
      });
    }

    // Host Master
    if (createdSessions >= 10) {
      achievements.push({
        icon: '🎊',
        title: t('achievements.hostMaster.title'),
        description: t('achievements.hostMaster.description'),
        color: 'from-cyan-400 to-blue-400',
        unlocked: true,
      });
    }

    // Add locked achievements
    if (totalSessions < 50) {
      achievements.push({
        icon: '👑',
        title: t('achievements.superStar.title'),
        description: t('achievements.locked', { count: 50 - totalSessions }),
        color: 'from-gray-300 to-gray-400',
        unlocked: false,
      });
    }

    return achievements;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <Loading text={t('loading')} fullScreen />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage message={error || t('profileNotFound')} onRetry={fetchProfile} />
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || profile.email.split('@')[0];
  const achievements = getAchievements();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cute Header with Sparkles */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-pink-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              {t('title')}
            </h1>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/profile/edit')}
            className="gap-2 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 border-0"
          >
            <Edit className="w-4 h-4" />
            {t('editProfile')}
          </Button>
        </div>

        {/* Kawaii Profile Card */}
        <Card padding="lg" className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-pink-100 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Cute Avatar with Glow */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 p-1">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold bg-gradient-to-br from-pink-500 to-purple-500 bg-clip-text text-transparent">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {/* Kawaii Decoration */}
              <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🌸</div>
            </div>

            {/* Info with Cute Styling */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {displayName}
                </h2>
                <span className="text-xl">💖</span>
              </div>
              {profile.username && (
                <p className="text-purple-600 font-medium mb-3">@{profile.username}</p>
              )}

              {profile.bio && (
                <p className="text-gray-700 mb-4 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-2xl border border-pink-100">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-pink-100">
                  <Mail className="w-4 h-4 text-pink-500" />
                  <span>{profile.email}</span>
                  {profile.email_verified && (
                    <Badge variant="success" size="sm" className="ml-1">
                      {t('verified')}
                    </Badge>
                  )}
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-purple-100">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span>{t('near', { station: profile.location })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-blue-100">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>{t('joined', { date: formatDate(profile.created_at) })}</span>
                </div>
              </div>

              {/* Cute Sport Preferences */}
              {profile.sport_preferences && profile.sport_preferences.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-purple-600 mb-2 flex items-center gap-2">
                    <span>🏃‍♀️</span> {t('favoriteSports')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.sport_preferences.map((sport: string) => (
                      <span
                        key={sport}
                        className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 rounded-full text-sm font-medium border border-purple-200"
                      >
                        {sport.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Achievements Section - Super Kawaii! */}
        {achievements.length > 0 && (
          <Card padding="lg" className="mb-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <h3 className="text-2xl font-bold text-yellow-800">{t('achievements.title')}</h3>
            </div>
            <p className="text-sm text-yellow-700 mb-4">{t('achievements.subtitle')}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`relative p-4 rounded-2xl transition-all duration-300 ${
                    achievement.unlocked
                      ? 'bg-white border-2 border-yellow-200 shadow-md hover:shadow-lg hover:scale-105'
                      : 'bg-gray-50 border-2 border-dashed border-gray-300 opacity-60'
                  }`}
                >
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center text-3xl shadow-lg`}>
                    {achievement.icon}
                  </div>
                  <h4 className={`text-sm font-bold text-center mb-1 ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-xs text-center ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                  {achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <span className="text-lg animate-bounce">✨</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Statistics with Cute Styling */}
        {stats && <UserStats stats={stats} />}
      </div>
    </div>
  );
}
