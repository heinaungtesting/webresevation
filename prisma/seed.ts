import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate future dates
function getFutureDate(daysFromNow: number, hour: number = 10): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// Helper to get next Saturday at a specific hour
function getNextSaturday(hour: number = 10): Date {
  const date = new Date();
  const dayOfWeek = date.getDay();
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : 6 - dayOfWeek;
  date.setDate(date.getDate() + daysUntilSaturday);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// Helper to get next Sunday at a specific hour
function getNextSunday(hour: number = 10): Date {
  const date = new Date();
  const dayOfWeek = date.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  date.setDate(date.getDate() + daysUntilSunday);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  console.log('Starting database seed for Tokyo International community...');

  // Clean existing data (in reverse order of dependencies)
  console.log('Cleaning existing data...');
  await prisma.userSession.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sportCenter.deleteMany();

  // ============================================
  // SPORT CENTERS
  // ============================================
  console.log('Creating sport centers...');
  const sportCenters = await Promise.all([
    prisma.sportCenter.create({
      data: {
        name_en: 'Tokyo Sport Center',
        name_ja: '\u6771\u4EAC\u30B9\u30DD\u30FC\u30C4\u30BB\u30F3\u30BF\u30FC',
        address_en: '1-2-3 Shibuya, Shibuya-ku, Tokyo',
        address_ja: '\u6771\u4EAC\u90FD\u6E0B\u8C37\u533A\u6E0B\u8C371-2-3',
        station_en: 'Shibuya Station',
        station_ja: '\u6E0B\u8C37\u99C5',
        latitude: 35.6595,
        longitude: 139.7004,
        image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Shinjuku Sports Plaza',
        name_ja: '\u65B0\u5BBF\u30B9\u30DD\u30FC\u30C4\u30D7\u30E9\u30B6',
        address_en: '2-3-4 Shinjuku, Shinjuku-ku, Tokyo',
        address_ja: '\u6771\u4EAC\u90FD\u65B0\u5BBF\u533A\u65B0\u5BBF2-3-4',
        station_en: 'Shinjuku Station',
        station_ja: '\u65B0\u5BBF\u99C5',
        latitude: 35.6938,
        longitude: 139.7036,
        image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Roppongi Tennis Club',
        name_ja: '\u516D\u672C\u6728\u30C6\u30CB\u30B9\u30AF\u30E9\u30D6',
        address_en: '3-4-5 Roppongi, Minato-ku, Tokyo',
        address_ja: '\u6771\u4EAC\u90FD\u6E2F\u533A\u516D\u672C\u67283-4-5',
        station_en: 'Roppongi Station',
        station_ja: '\u516D\u672C\u6728\u99C5',
        latitude: 35.6627,
        longitude: 139.7296,
        image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Ikebukuro Community Gym',
        name_ja: '\u6C60\u888B\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u30B8\u30E0',
        address_en: '1-1-1 Ikebukuro, Toshima-ku, Tokyo',
        address_ja: '\u6771\u4EAC\u90FD\u8C4A\u5CF6\u533A\u6C60\u888B1-1-1',
        station_en: 'Ikebukuro Station',
        station_ja: '\u6C60\u888B\u99C5',
        latitude: 35.7295,
        longitude: 139.7109,
        image_url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800',
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Odaiba Sports Arena',
        name_ja: '\u304A\u53F0\u5834\u30B9\u30DD\u30FC\u30C4\u30A2\u30EA\u30FC\u30CA',
        address_en: '1-6-1 Daiba, Minato-ku, Tokyo',
        address_ja: '\u6771\u4EAC\u90FD\u6E2F\u533A\u53F0\u58341-6-1',
        station_en: 'Odaiba-kaihinkoen Station',
        station_ja: '\u304A\u53F0\u5834\u6D77\u6D5C\u516C\u5712\u99C5',
        latitude: 35.6249,
        longitude: 139.7756,
        image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
      },
    }),
  ]);
  console.log(`Created ${sportCenters.length} sport centers`);

  // ============================================
  // EXPAT USERS (Native English Speakers)
  // ============================================
  console.log('Creating expat users...');
  const expatUsers = await Promise.all([
    prisma.user.create({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'mike.johnson@example.com',
        username: 'mike_hoops',
        display_name: 'Mike Johnson',
        bio: 'American expat in Tokyo. Basketball enthusiast and software engineer. Always looking for pickup games!',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        location: 'Shibuya',
        sport_preferences: ['basketball', 'tennis'],
        skill_levels: { basketball: 'advanced', tennis: 'intermediate' },
        language_preference: 'en',
        native_language: 'en',
        target_language: 'ja',
        language_level: 'BEGINNER',
        email_verified: true,
        reliability_score: 95,
        no_show_count: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'sarah.williams@example.com',
        username: 'sarah_tennis',
        display_name: 'Sarah Williams',
        bio: 'British tennis coach living in Tokyo. Love meeting new players and helping beginners improve!',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        location: 'Roppongi',
        sport_preferences: ['tennis', 'badminton'],
        skill_levels: { tennis: 'advanced', badminton: 'intermediate' },
        language_preference: 'en',
        native_language: 'en',
        target_language: 'ja',
        language_level: 'INTERMEDIATE',
        email_verified: true,
        reliability_score: 100,
        no_show_count: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'james.chen@example.com',
        username: 'james_futsal',
        display_name: 'James Chen',
        bio: 'Canadian-Chinese living in Tokyo for 5 years. Futsal fanatic and language exchange enthusiast!',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
        location: 'Shinjuku',
        sport_preferences: ['futsal', 'soccer'],
        skill_levels: { futsal: 'advanced', soccer: 'intermediate' },
        language_preference: 'en',
        native_language: 'en',
        target_language: 'ja',
        language_level: 'ADVANCED',
        email_verified: true,
        reliability_score: 92,
        no_show_count: 1,
      },
    }),
    prisma.user.create({
      data: {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'emma.davis@example.com',
        username: 'emma_volleyball',
        display_name: 'Emma Davis',
        bio: 'Australian volleyball player. Just moved to Tokyo and excited to join the sports community!',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        location: 'Ikebukuro',
        sport_preferences: ['volleyball', 'basketball'],
        skill_levels: { volleyball: 'advanced', basketball: 'beginner' },
        language_preference: 'en',
        native_language: 'en',
        target_language: 'ja',
        language_level: 'BEGINNER',
        email_verified: true,
        reliability_score: 100,
        no_show_count: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'david.kim@example.com',
        username: 'david_badminton',
        display_name: 'David Kim',
        bio: 'Korean-American tech worker. Badminton is my passion! Looking for regular partners.',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        location: 'Odaiba',
        sport_preferences: ['badminton', 'table-tennis'],
        skill_levels: { badminton: 'advanced', 'table-tennis': 'intermediate' },
        language_preference: 'en',
        native_language: 'en',
        target_language: 'ja',
        language_level: 'INTERMEDIATE',
        email_verified: true,
        reliability_score: 88,
        no_show_count: 1,
      },
    }),
  ]);
  console.log(`Created ${expatUsers.length} expat users`);

  // ============================================
  // JAPANESE LEARNER USERS (Learning English)
  // ============================================
  console.log('Creating Japanese learner users...');
  const japaneseUsers = await Promise.all([
    prisma.user.create({
      data: {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'takeshi.yamamoto@example.com',
        username: 'takeshi_bball',
        display_name: 'Takeshi Yamamoto',
        bio: '\u30D0\u30B9\u30B1\u5927\u597D\u304D\uFF01\u82F1\u8A9E\u3092\u7DF4\u7FD2\u3057\u305F\u3044\u306E\u3067\u3001\u30B9\u30DD\u30FC\u30C4\u3057\u306A\u304C\u3089\u8A71\u305B\u305F\u3089\u5B09\u3057\u3044\u3067\u3059\uFF01',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Takeshi',
        location: 'Shibuya',
        sport_preferences: ['basketball', 'volleyball'],
        skill_levels: { basketball: 'intermediate', volleyball: 'beginner' },
        language_preference: 'ja',
        native_language: 'ja',
        target_language: 'en',
        language_level: 'INTERMEDIATE',
        email_verified: true,
        reliability_score: 100,
        no_show_count: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: '77777777-7777-7777-7777-777777777777',
        email: 'yuki.tanaka@example.com',
        username: 'yuki_tennis',
        display_name: 'Yuki Tanaka',
        bio: '\u30C6\u30CB\u30B9\u30B3\u30FC\u30C1\u3092\u76EE\u6307\u3057\u3066\u3044\u307E\u3059\u3002\u82F1\u8A9E\u3067\u30EC\u30C3\u30B9\u30F3\u3067\u304D\u308B\u3088\u3046\u306B\u306A\u308A\u305F\u3044\uFF01',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
        location: 'Roppongi',
        sport_preferences: ['tennis', 'badminton'],
        skill_levels: { tennis: 'intermediate', badminton: 'beginner' },
        language_preference: 'ja',
        native_language: 'ja',
        target_language: 'en',
        language_level: 'BEGINNER',
        email_verified: true,
        reliability_score: 98,
        no_show_count: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: '88888888-8888-8888-8888-888888888888',
        email: 'kenji.sato@example.com',
        username: 'kenji_futsal',
        display_name: 'Kenji Sato',
        bio: '\u30D5\u30C3\u30C8\u30B5\u30EB\u30C1\u30FC\u30E0\u306E\u30AD\u30E3\u30D7\u30C6\u30F3\u3067\u3059\u3002\u56FD\u969B\u7684\u306A\u30C1\u30FC\u30E0\u3092\u4F5C\u308A\u305F\u3044\uFF01',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kenji',
        location: 'Shinjuku',
        sport_preferences: ['futsal', 'soccer'],
        skill_levels: { futsal: 'advanced', soccer: 'advanced' },
        language_preference: 'ja',
        native_language: 'ja',
        target_language: 'en',
        language_level: 'ADVANCED',
        email_verified: true,
        reliability_score: 100,
        no_show_count: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: '99999999-9999-9999-9999-999999999999',
        email: 'mika.suzuki@example.com',
        username: 'mika_volleyball',
        display_name: 'Mika Suzuki',
        bio: '\u5927\u5B66\u3067\u30D0\u30EC\u30FC\u30DC\u30FC\u30EB\u90E8\u3067\u3057\u305F\u3002\u4ECA\u306F\u8DA3\u5473\u3067\u697D\u3057\u3093\u3067\u3044\u307E\u3059\uFF01',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mika',
        location: 'Ikebukuro',
        sport_preferences: ['volleyball', 'badminton'],
        skill_levels: { volleyball: 'advanced', badminton: 'intermediate' },
        language_preference: 'ja',
        native_language: 'ja',
        target_language: 'en',
        language_level: 'INTERMEDIATE',
        email_verified: true,
        reliability_score: 95,
        no_show_count: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        email: 'hiroshi.nakamura@example.com',
        username: 'hiroshi_badminton',
        display_name: 'Hiroshi Nakamura',
        bio: '\u30D0\u30C9\u30DF\u30F3\u30C8\u30F3\u6B7420\u5E74\uFF01\u5916\u56FD\u4EBA\u306E\u53CB\u9054\u3092\u4F5C\u308A\u305F\u3044\u3067\u3059\u3002',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi',
        location: 'Odaiba',
        sport_preferences: ['badminton', 'table-tennis'],
        skill_levels: { badminton: 'advanced', 'table-tennis': 'advanced' },
        language_preference: 'ja',
        native_language: 'ja',
        target_language: 'en',
        language_level: 'BEGINNER',
        email_verified: true,
        reliability_score: 100,
        no_show_count: 0,
      },
    }),
  ]);
  console.log(`Created ${japaneseUsers.length} Japanese learner users`);

  // ============================================
  // SESSIONS
  // ============================================
  console.log('Creating sessions...');

  // Session 1: Serious Basketball (Competitive)
  const basketballSession = await prisma.session.create({
    data: {
      sport_center_id: sportCenters[0].id, // Tokyo Sport Center
      sport_type: 'basketball',
      skill_level: 'advanced',
      date_time: getNextSaturday(14), // Next Saturday at 2 PM
      duration_minutes: 120,
      max_participants: 10,
      description_en: 'Serious 5v5 basketball game. Looking for skilled players who want competitive play. Full court available!',
      description_ja: '\u672C\u683C\u76845v5\u30D0\u30B9\u30B1\u3002\u7AF6\u6280\u5FD7\u5411\u306E\u4E0A\u7D1A\u8005\u5411\u3051\u3067\u3059\u3002\u30D5\u30EB\u30B3\u30FC\u30C8\u4F7F\u7528\u53EF\u80FD\uFF01',
      primary_language: 'en',
      allow_english: true,
      vibe: 'COMPETITIVE',
      created_by: expatUsers[0].id, // Mike Johnson
    },
  });

  // Session 2: Sunday Morning Tennis (Casual)
  const tennisSession = await prisma.session.create({
    data: {
      sport_center_id: sportCenters[2].id, // Roppongi Tennis Club
      sport_type: 'tennis',
      skill_level: 'intermediate',
      date_time: getNextSunday(9), // Next Sunday at 9 AM
      duration_minutes: 90,
      max_participants: 4,
      description_en: 'Relaxed Sunday morning tennis. All levels welcome! Let\'s have fun and enjoy the morning.',
      description_ja: '\u65E5\u66DC\u306E\u671D\u306E\u30EA\u30E9\u30C3\u30AF\u30B9\u30C6\u30CB\u30B9\u3002\u521D\u5FC3\u8005\u5927\u6B53\u8FCE\uFF01',
      primary_language: 'ja',
      allow_english: true,
      vibe: 'CASUAL',
      created_by: japaneseUsers[1].id, // Yuki Tanaka
    },
  });

  // Session 3: English/Japanese Futsal Exchange (Language Exchange)
  const futsalSession = await prisma.session.create({
    data: {
      sport_center_id: sportCenters[1].id, // Shinjuku Sports Plaza
      sport_type: 'futsal',
      skill_level: 'intermediate',
      date_time: getFutureDate(5, 19), // 5 days from now at 7 PM
      duration_minutes: 120,
      max_participants: 12,
      description_en: 'Futsal + Language Exchange! Half Japanese, half English speakers. Let\'s play and practice languages together!',
      description_ja: '\u30D5\u30C3\u30C8\u30B5\u30EB\u00D7\u8A00\u8A9E\u4EA4\u6D41\uFF01\u65E5\u672C\u4EBA\u3068\u82F1\u8A9E\u30CD\u30A4\u30C6\u30A3\u30D6\u306E\u30DF\u30C3\u30AF\u30B9\u3002\u30B9\u30DD\u30FC\u30C4\u3057\u306A\u304C\u3089\u8A00\u8A9E\u3092\u7DF4\u7FD2\u3057\u3088\u3046\uFF01',
      primary_language: 'ja',
      allow_english: true,
      vibe: 'LANGUAGE_EXCHANGE',
      created_by: japaneseUsers[2].id, // Kenji Sato
    },
  });

  console.log('Created 3 sessions');

  // ============================================
  // USER SESSIONS (Join users to sessions)
  // ============================================
  console.log('Adding participants to sessions...');

  // Basketball session participants
  await Promise.all([
    // Creator auto-joined
    prisma.userSession.create({
      data: {
        user_id: expatUsers[0].id, // Mike (creator)
        session_id: basketballSession.id,
        status: 'REGISTERED',
      },
    }),
    prisma.userSession.create({
      data: {
        user_id: japaneseUsers[0].id, // Takeshi
        session_id: basketballSession.id,
        status: 'REGISTERED',
      },
    }),
    prisma.userSession.create({
      data: {
        user_id: expatUsers[3].id, // Emma
        session_id: basketballSession.id,
        status: 'REGISTERED',
      },
    }),
  ]);

  // Tennis session participants
  await Promise.all([
    // Creator auto-joined
    prisma.userSession.create({
      data: {
        user_id: japaneseUsers[1].id, // Yuki (creator)
        session_id: tennisSession.id,
        status: 'REGISTERED',
      },
    }),
    prisma.userSession.create({
      data: {
        user_id: expatUsers[1].id, // Sarah
        session_id: tennisSession.id,
        status: 'REGISTERED',
      },
    }),
  ]);

  // Futsal session participants (Language Exchange - mixed group)
  await Promise.all([
    // Creator auto-joined
    prisma.userSession.create({
      data: {
        user_id: japaneseUsers[2].id, // Kenji (creator)
        session_id: futsalSession.id,
        status: 'REGISTERED',
      },
    }),
    prisma.userSession.create({
      data: {
        user_id: expatUsers[2].id, // James
        session_id: futsalSession.id,
        status: 'REGISTERED',
      },
    }),
    prisma.userSession.create({
      data: {
        user_id: japaneseUsers[0].id, // Takeshi
        session_id: futsalSession.id,
        status: 'REGISTERED',
      },
    }),
    prisma.userSession.create({
      data: {
        user_id: expatUsers[4].id, // David
        session_id: futsalSession.id,
        status: 'REGISTERED',
      },
    }),
    prisma.userSession.create({
      data: {
        user_id: japaneseUsers[3].id, // Mika
        session_id: futsalSession.id,
        status: 'REGISTERED',
      },
    }),
  ]);

  console.log('Added participants to all sessions');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n========================================');
  console.log('Database seed completed successfully!');
  console.log('========================================');
  console.log(`Sport Centers: ${sportCenters.length}`);
  console.log(`Expat Users: ${expatUsers.length}`);
  console.log(`Japanese Users: ${japaneseUsers.length}`);
  console.log('Sessions:');
  console.log('  - Serious Basketball (COMPETITIVE) - 3 participants');
  console.log('  - Sunday Morning Tennis (CASUAL) - 2 participants');
  console.log('  - Futsal Language Exchange (LANGUAGE_EXCHANGE) - 5 participants');
  console.log('\nNote: Demo users cannot log in (no Supabase Auth).');
  console.log('Create a real account to interact with the seeded data.');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
