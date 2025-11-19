import Link from 'next/link';
import Button from '@/app/components/ui/Button';
import SessionCard from '@/app/components/SessionCard';
import { Session } from '@/types';
import { Search, Users, Calendar, MapPin, ArrowRight, Sparkles, Trophy, Star } from 'lucide-react';

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
      name_ja: 'Tokyo Sport Center',
      address_en: 'Shibuya, Tokyo',
      address_ja: 'Shibuya, Tokyo',
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
      name_ja: 'Shinjuku Sports Plaza',
      address_en: 'Shinjuku, Tokyo',
      address_ja: 'Shinjuku, Tokyo',
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
      name_ja: 'Roppongi Tennis Club',
      address_en: 'Roppongi, Tokyo',
      address_ja: 'Roppongi, Tokyo',
    },
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-midnight overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-violet/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-cyan/20 rounded-full blur-3xl animate-float animation-delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-8 animate-fadeInDown">
              <Sparkles className="w-4 h-4 text-accent-amber" />
              <span className="text-sm font-medium text-slate-700">The #1 Sports Community in Tokyo</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fadeInUp">
              <span className="text-white">Find Your</span>
              <br />
              <span className="text-gradient-ocean">Sports Partner</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl sm:text-2xl mb-10 text-slate-300 max-w-2xl mx-auto animate-fadeInUp animation-delay-200">
              Connect with players, join sessions, and stay active in Tokyo's most vibrant sports community
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-xl mx-auto animate-fadeInUp animation-delay-300">
              <Link href="/sessions" className="w-full sm:w-auto">
                <Button variant="gradient" size="lg" fullWidth className="group">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Sessions
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/signup" className="w-full sm:w-auto">
                <Button variant="glass" size="lg" fullWidth>
                  Sign Up Free
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fadeInUp animation-delay-500">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">500+</div>
                <div className="text-sm text-slate-400">Active Players</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">50+</div>
                <div className="text-sm text-slate-400">Venues</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">8</div>
                <div className="text-sm text-slate-400">Sports</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Why Choose <span className="text-gradient">SportsMatch</span>?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to find games, connect with players, and stay active
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            <div className="group p-8 rounded-2xl glass hover-lift hover-glow transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-ocean text-white mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">Find Partners</h3>
              <p className="text-slate-600 leading-relaxed">
                Connect with players of similar skill levels and interests. Build your sports network in Tokyo.
              </p>
            </div>

            <div className="group p-8 rounded-2xl glass hover-lift hover-glow transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-primary text-white mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">Join Sessions</h3>
              <p className="text-slate-600 leading-relaxed">
                Browse and join sports sessions at convenient times. Never miss a game again.
              </p>
            </div>

            <div className="group p-8 rounded-2xl glass hover-lift hover-glow transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-sunset text-white mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">Local Venues</h3>
              <p className="text-slate-600 leading-relaxed">
                Find sessions at top sport centers across Tokyo. Quality facilities guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Sessions */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                Upcoming Sessions
              </h2>
              <p className="text-slate-600">Join a game today and meet new players</p>
            </div>
            <Link href="/sessions">
              <Button variant="outline" className="group">
                View All Sessions
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Session cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockSessions.map((session, index) => (
              <div
                key={session.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <SessionCard session={session} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Loved by Players
            </h2>
            <p className="text-lg text-slate-600">
              Join thousands of satisfied sports enthusiasts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Finally found consistent badminton partners in Tokyo. The app makes it so easy to find games!",
                author: "Yuki T.",
                sport: "Badminton",
              },
              {
                quote: "Great way to meet people and stay active. I've made lasting friendships through SportsMatch.",
                author: "Alex M.",
                sport: "Basketball",
              },
              {
                quote: "The quality of players and venues is excellent. Highly recommend for serious tennis players.",
                author: "Sarah K.",
                sport: "Tennis",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white shadow-soft hover-lift transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent-amber text-accent-amber" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-ocean flex items-center justify-center text-white font-semibold">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.sport} Player</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-ocean" />
        <div className="absolute inset-0 bg-mesh opacity-30" />

        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-float animation-delay-300" />

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-8">
            <Trophy className="w-4 h-4 text-accent-amber" />
            <span className="text-sm font-medium text-white">Start your journey today</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-10 text-white/80 max-w-2xl mx-auto">
            Join our community and find your next game today. It's free to sign up!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button variant="primary" size="lg" className="bg-white text-primary-600 hover:bg-slate-100 shadow-large hover:shadow-xl group">
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/sessions">
              <Button variant="glass" size="lg" className="text-white border-white/30 hover:bg-white/10">
                Browse Sessions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="h-16 bg-white" />
    </div>
  );
}
