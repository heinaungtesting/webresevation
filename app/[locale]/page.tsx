import Link from 'next/link';
import Button from '@/app/components/ui/Button';
import SessionCard from '@/app/components/SessionCard';
import { prisma } from '@/lib/prisma';
import { Search, Users, Calendar, MapPin } from 'lucide-react';

// Fetch upcoming sessions from database
async function getUpcomingSessions() {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        date_time: {
          gte: new Date(),
        },
      },
      include: {
        sport_center: true,
        _count: {
          select: { user_sessions: true },
        },
      },
      orderBy: {
        date_time: 'asc',
      },
      take: 3, // Show 3 featured sessions
    });

    // Map to include current_participants
    return sessions.map((session: any) => ({
      ...session,
      current_participants: session._count.user_sessions,
      _count: undefined,
    }));
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

export default async function Home() {
  const sessions = await getUpcomingSessions();

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
          {sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session: any) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                No upcoming sessions available
              </p>
              <Link href="/sessions/create">
                <Button variant="primary">Create First Session</Button>
              </Link>
            </div>
          )}
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
