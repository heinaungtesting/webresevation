import { Calendar, Trophy, Users, Star } from 'lucide-react';
import Card from '../ui/Card';

interface UserStatsProps {
  stats: {
    total_sessions: number;
    upcoming_sessions: number;
    past_sessions: number;
    created_sessions: number;
    sport_breakdown?: Record<string, number>;
    member_since?: string;
  };
}

export default function UserStats({ stats }: UserStatsProps) {
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
