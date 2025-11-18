import Link from 'next/link';
import Button from './components/ui/Button';
import SessionCard from './components/SessionCard';
import { Session } from '@/types';
import { Search, Users, Calendar, MapPin } from 'lucide-react';

// Mock data for demo
const mockSessions: Session[] = [
  {
    id: '1',
    sport_center_id: '1',
    sport_type: 'badminton',
    skill_level: 'intermediate',
    date_time: new Date(Date.now() + 86400000).toISOString(),
    duration_minutes: 120,
    max_participants: 8,
    current_participants: 5,
    description_en: 'Fun badminton session for intermediate players',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    sport_center: {
      id: '1',
      name_en: 'Tokyo Sport Center',
      name_ja: '東京スポーツセンター',
      address_en: 'Shibuya, Tokyo',
      address_ja: '東京都渋谷区',
    },
  },
  {
    id: '2',
    sport_center_id: '2',
    sport_type: 'basketball',
    skill_level: 'beginner',
    date_time: new Date(Date.now() + 172800000).toISOString(),
    duration_minutes: 90,
    max_participants: 10,
    current_participants: 3,
    description_en: 'Casual basketball game for beginners',
    created_by: 'user2',
    created_at: new Date().toISOString(),
    sport_center: {
      id: '2',
      name_en: 'Shinjuku Sports Plaza',
      name_ja: '新宿スポーツプラザ',
      address_en: 'Shinjuku, Tokyo',
      address_ja: '東京都新宿区',
    },
  },
  {
    id: '3',
    sport_center_id: '3',
    sport_type: 'tennis',
    skill_level: 'advanced',
    date_time: new Date(Date.now() + 259200000).toISOString(),
    duration_minutes: 120,
    max_participants: 4,
    current_participants: 4,
    description_en: 'Advanced tennis doubles match',
    created_by: 'user3',
    created_at: new Date().toISOString(),
    sport_center: {
      id: '3',
      name_en: 'Roppongi Tennis Club',
      name_ja: '六本木テニスクラブ',
      address_en: 'Roppongi, Tokyo',
      address_ja: '東京都港区六本木',
    },
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Find Your Sports Partner in Tokyo
            </h1>
            <p className="text-xl sm:text-2xl mb-8 text-blue-100">
              Connect with players, join sessions, and stay active
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <Link href="/sessions" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" fullWidth className="bg-white text-blue-600 hover:bg-gray-100">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Sessions
                </Button>
              </Link>
              <Link href="/signup" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" fullWidth className="border-white text-white hover:bg-blue-700">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Find Partners</h3>
              <p className="text-gray-600">
                Connect with players of similar skill levels and interests
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Join Sessions</h3>
              <p className="text-gray-600">
                Browse and join sports sessions at convenient times
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Venues</h3>
              <p className="text-gray-600">
                Find sessions at top sport centers across Tokyo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Sessions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Upcoming Sessions
            </h2>
            <Link href="/sessions">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join our community and find your next game today
          </p>
          <Link href="/signup">
            <Button variant="primary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
