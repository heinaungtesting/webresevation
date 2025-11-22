import { Calendar, Trophy, Users, Star, Shield, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';

interface UserStatsProps {
  stats: {
    total_sessions: number;
    upcoming_sessions: number;
    past_sessions: number;
    created_sessions: number;
    sport_breakdown?: Record<string, number>;
    member_since?: string;
    // Reliability stats
    reliability_score?: number;
    no_show_count?: number;
  };
}

/**
 * Get color classes based on reliability score
 */
function getReliabilityColors(score: number) {
  if (score >= 80) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-100',
      fill: 'bg-green-500',
      label: 'Excellent',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-100',
      fill: 'bg-yellow-500',
      label: 'Good',
    };
  }
  if (score >= 40) {
    return {
      text: 'text-orange-600',
      bg: 'bg-orange-100',
      fill: 'bg-orange-500',
      label: 'Fair',
    };
  }
  return {
    text: 'text-red-600',
    bg: 'bg-red-100',
    fill: 'bg-red-500',
    label: 'Needs Improvement',
  };
}

export default function UserStats({ stats }: UserStatsProps) {
  const reliabilityScore = stats.reliability_score ?? 100;
  const noShowCount = stats.no_show_count ?? 0;
  const reliabilityColors = getReliabilityColors(reliabilityScore);

  const statItems = [
    {
      label: 'Total Sessions',
      value: stats.total_sessions,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Upcoming',
      value: stats.upcoming_sessions,
      icon: Trophy,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Past Sessions',
      value: stats.past_sessions,
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Sessions Created',
      value: stats.created_sessions,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Reliability Score Card */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full -mr-16 -mt-16 opacity-50" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl ${reliabilityColors.bg}`}>
              <Shield className={`w-6 h-6 ${reliabilityColors.text}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reliability Score</h3>
              <p className="text-sm text-gray-500">Based on your attendance history</p>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              {/* Score Display */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-4xl font-bold ${reliabilityColors.text}`}>
                  {reliabilityScore}%
                </span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${reliabilityColors.bg} ${reliabilityColors.text}`}>
                  {reliabilityColors.label}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${reliabilityColors.fill}`}
                  style={{ width: `${reliabilityScore}%` }}
                />
              </div>

              {/* No-show warning if any */}
              {noShowCount > 0 && (
                <div className="flex items-center gap-2 mt-3 text-sm text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    {noShowCount} no-show{noShowCount !== 1 ? 's' : ''} recorded
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reliability Tips */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {reliabilityScore >= 80
                ? 'Great job! Your excellent attendance makes you a trusted player.'
                : reliabilityScore >= 60
                  ? 'Good attendance record. Keep showing up to maintain your score!'
                  : 'Tip: Always attend sessions you sign up for to improve your score.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <Card key={stat.label} padding="md" className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-3`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Sport Breakdown */}
      {stats.sport_breakdown && Object.keys(stats.sport_breakdown).length > 0 && (
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sports Activity
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.sport_breakdown)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([sport, count]) => (
                <div key={sport} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {sport.replace('-', ' ')}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${(count / stats.total_sessions) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
