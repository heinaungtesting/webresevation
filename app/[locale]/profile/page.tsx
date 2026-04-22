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
import { sportIdToSessionKey } from '@/lib/utils/sportTranslation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.1, ease: 'easeOut' as const },
  }),
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('profile');
  const tSessions = useTranslations('sessions');
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
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
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
      <div className="min-h-screen bg-gray-50">
        <Loading text={t('loading')} fullScreen />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage message={error || t('profileNotFound')} onRetry={fetchProfile} />
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || profile.email.split('@')[0];
  const achievements = getAchievements();

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-6"
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('title')}
            </h1>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/profile/edit')}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            <span>{t('editProfile')}</span>
          </Button>
        </motion.div>

        {/* Profile Card */}
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 p-1">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-primary-500">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {displayName}
                </h2>
              </div>
              {profile.username && (
                <p className="text-gray-500 font-medium mb-3">@{profile.username}</p>
              )}

              {profile.bio && (
                <p className="text-slate-700 mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-sm sm:text-base">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="max-w-[160px] sm:max-w-none truncate">{profile.email}</span>
                  {profile.email_verified && (
                    <Badge variant="success" size="sm" className="ml-1">
                      {t('verified')}
                    </Badge>
                  )}
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{t('near', { station: profile.location })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{t('joined', { date: formatDate(profile.created_at) })}</span>
                </div>
              </div>

              {/* Sport Preferences */}
              {profile.sport_preferences && profile.sport_preferences.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    {t('favoriteSports')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.sport_preferences.map((sport: string) => (
                      <span
                        key={sport}
                        className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-200"
                      >
                        {tSessions(sportIdToSessionKey(sport))}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
        </motion.div>

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
          <Card padding="lg" className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t('achievements.title')}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">{t('achievements.subtitle')}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`relative p-3 sm:p-4 rounded-2xl transition-all duration-300 ${
                    achievement.unlocked
                      ? 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                      : 'bg-slate-50 border border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center text-2xl sm:text-3xl shadow-sm text-white`}>
                    {achievement.icon}
                  </div>
                  <h4 className={`text-xs sm:text-sm font-bold text-center mb-1 ${achievement.unlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-xs text-center ${achievement.unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          </motion.div>
        )}

        {/* Statistics */}
        {stats && (
          <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
            <UserStats stats={stats} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
