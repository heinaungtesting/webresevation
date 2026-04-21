import { PrismaClient, SessionVibe, LanguageLevel } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate future dates
function getFutureDate(daysFromNow: number, hour: number = 10, minutes: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minutes, 0, 0);
  return date;
}

async function main() {
  console.log('Starting rich database seed for Tokyo International community...');

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
        name_en: 'Tokyo Metropolitan Gymnasium',
        name_ja: '東京体育館',
        address_en: '1-17-1 Sendagaya, Shibuya-ku, Tokyo',
        address_ja: '東京都渋谷区千駄ケ谷1-17-1',
        station_en: 'Sendagaya Station',
        station_ja: '千駄ケ谷駅',
        latitude: 35.6797,
        longitude: 139.7126,
        image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Minato Ward Sports Center',
        name_ja: '港区スポーツセンター',
        address_en: '1-16-1 Shibaura, Minato-ku, Tokyo',
        address_ja: '東京都港区芝浦1-16-1',
        station_en: 'Tamachi Station',
        station_ja: '田町駅',
        latitude: 35.6455,
        longitude: 139.7501,
        image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Shinjuku Sports Center',
        name_ja: '新宿区立新宿スポーツセンター',
        address_en: '3-5-1 Okubo, Shinjuku-ku, Tokyo',
        address_ja: '東京都新宿区大久保3-5-1',
        station_en: 'Shin-Okubo Station',
        station_ja: '新大久保駅',
        latitude: 35.7051,
        longitude: 139.7042,
        image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Meguro Kumin Center',
        name_ja: '目黒区民センター',
        address_en: '2-4-36 Meguro, Meguro-ku, Tokyo',
        address_ja: '東京都目黒区目黒2-4-36',
        station_en: 'Meguro Station',
        station_ja: '目黒駅',
        latitude: 35.6372,
        longitude: 139.7088,
        image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Yoyogi National Stadium Futsal Courts',
        name_ja: '代々木競技場フットサルコート',
        address_en: '2-1-1 Jinnan, Shibuya-ku, Tokyo',
        address_ja: '東京都渋谷区神南2-1-1',
        station_en: 'Harajuku Station',
        station_ja: '原宿駅',
        latitude: 35.6678,
        longitude: 139.7001,
        image_url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800',
      },
    })
  ]);

  // ============================================
  // USERS
  // ============================================
  console.log('Creating 30 users (15 Expat/English, 15 Japanese)...');
  
  const enNames = [
    "Mike Johnson", "Sarah Williams", "James Chen", "Emma Davis", "David Kim",
    "Alex Miller", "Emily Wilson", "Tom Brown", "Jessica Taylor", "Daniel Anderson",
    "Sophie Thomas", "Chris Moore", "Rachel White", "Kevin Harris", "Lisa Martin"
  ];
  
  const jaNames = [
    "Takeshi Yamamoto", "Yuki Tanaka", "Kenji Sato", "Mika Suzuki", "Hiroshi Nakamura",
    "Taro Yamada", "Hanako Ito", "Daiki Watanabe", "Sakura Kobayashi", "Kenta Kato",
    "Yui Yoshida", "Ryota Sasaki", "Rina Yamaguchi", "Kazuya Matsumoto", "Ayaka Inoue"
  ];

  const allUsers = [];

  for (let i = 0; i < 15; i++) {
    // English User
    const eName = enNames[i];
    const usernameE = eName.toLowerCase().replace(' ', '_') + '_' + Math.floor(Math.random() * 1000);
    allUsers.push(await prisma.user.create({
      data: {
        email: `${usernameE}@example.com`,
        username: usernameE,
        display_name: eName,
        bio: `Hi, I'm ${eName}. Love playing sports around Tokyo! Always looking for a good game and to meet new people.`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${eName.replace(' ', '')}`,
        location: 'Tokyo',
        sport_preferences: ['basketball', 'futsal', 'badminton', 'table-tennis'].sort(() => 0.5 - Math.random()).slice(0, 2),
        language_preference: 'en',
        native_language: 'en',
        target_language: 'ja',
        language_level: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'][Math.floor(Math.random() * 3)] as LanguageLevel,
        email_verified: true,
        reliability_score: 90 + Math.floor(Math.random() * 11),
      }
    }));

    // Japanese User
    const jName = jaNames[i];
    const usernameJ = 'ja_' + jName.toLowerCase().replace(' ', '_') + '_' + Math.floor(Math.random() * 1000);
    allUsers.push(await prisma.user.create({
      data: {
        email: `${usernameJ}@example.com`,
        username: usernameJ,
        display_name: jName,
        bio: `${jName}です！スポーツを通じていろんな方と交流したいです。英語も練習中なので、Language Exchangeセッションも大歓迎！`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${jName.replace(' ', '')}`,
        location: 'Tokyo',
        sport_preferences: ['basketball', 'futsal', 'badminton', 'table-tennis'].sort(() => 0.5 - Math.random()).slice(0, 2),
        language_preference: 'ja',
        native_language: 'ja',
        target_language: 'en',
        language_level: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'][Math.floor(Math.random() * 3)] as LanguageLevel,
        email_verified: true,
        reliability_score: 90 + Math.floor(Math.random() * 11),
      }
    }));
  }

  // ============================================
  // SESSIONS
  // ============================================
  console.log('Creating 15 active sports sessions...');
  
  const sessionsData = [
    {
      sport_type: 'basketball', title_en: 'Competitive 5v5 Basketball', title_ja: '競技志向 5v5 バスケ', vibe: SessionVibe.COMPETITIVE, max_participants: 15,
      desc_en: 'Serious full-court games, please know the rules well.', desc_ja: 'ルールを把握している経験者向けのガチバスケです。'
    },
    {
      sport_type: 'badminton', title_en: 'Weekend Morning Badminton', title_ja: '週末朝活バドミントン', vibe: SessionVibe.CASUAL, max_participants: 8,
      desc_en: 'Casual rallies to start the weekend right! All levels welcome.', desc_ja: '週末の朝に軽く体を動かしましょう！全レベル歓迎します。'
    },
    {
      sport_type: 'futsal', title_en: 'Intl Futsal Exchange', title_ja: '国際交流フットサル', vibe: SessionVibe.LANGUAGE_EXCHANGE, max_participants: 12,
      desc_en: 'Mix of English & Japanese speakers. Good vibes only.', desc_ja: '英語と日本語を交えて楽しく蹴りましょう！'
    },
    {
      sport_type: 'table-tennis', title_en: 'Table Tennis Tournament', title_ja: '卓球ミニ大会', vibe: SessionVibe.COMPETITIVE, max_participants: 10,
      desc_en: 'Mini round-robin matches. Bring your own paddle if possible.', desc_ja: 'マイラケット持参推奨。総当たり戦をやります。'
    },
    {
      sport_type: 'basketball', title_en: 'Casual Half-Court Hoops', title_ja: 'ゆるっとハーフコートバスケ', vibe: SessionVibe.CASUAL, max_participants: 10,
      desc_en: 'Just shooting around and playing 3v3 or 4v4 half court.', desc_ja: '3on3やシューティングメインのゆるいバスケです。'
    },
    {
      sport_type: 'futsal', title_en: 'Advanced Futsal Scrimmage', title_ja: '上級者向けフットサル', vibe: SessionVibe.COMPETITIVE, max_participants: 15,
      desc_en: 'Fast-paced futsal for experienced players. High intensity.', desc_ja: '経験者向けの強度の高いフットサルです。'
    },
    {
      sport_type: 'badminton', title_en: 'Badminton Intensive', title_ja: 'バドミントン特訓', vibe: SessionVibe.ACADEMY, max_participants: 6,
      desc_en: 'Focusing on footwork, clears, and smashes. For those wanting to improve.', desc_ja: 'フットワークやスマッシュの基礎練習をメインに行います。'
    },
    {
      sport_type: 'table-tennis', title_en: 'Casual Ping Pong Night', title_ja: 'エンジョイ卓球ナイト', vibe: SessionVibe.CASUAL, max_participants: 8,
      desc_en: 'Relaxed games after work. Easy pace, great for beginners!', desc_ja: '仕事終わりのエンジョイ卓球！初心者大歓迎です。'
    },
    {
      sport_type: 'basketball', title_en: 'Bilingual Basketball', title_ja: 'バイリンガルバスケ', vibe: SessionVibe.LANGUAGE_EXCHANGE, max_participants: 12,
      desc_en: 'Practice English and Japanese while playing pickup basketball.', desc_ja: 'バスケを通じて言葉の壁を越えましょう！'
    },
    {
      sport_type: 'futsal', title_en: 'Sunday Afternoon Futsal', title_ja: '日曜昼下がりのフットサル', vibe: SessionVibe.CASUAL, max_participants: 14,
      desc_en: 'Friendly matches for everyone. Teams balanced by skill level.', desc_ja: 'レベル分けしてフレンドリーマッチを行います。'
    },
    {
      sport_type: 'badminton', title_en: 'Competitive Doubles', title_ja: 'ダブルス実践練習（中級〜）', vibe: SessionVibe.COMPETITIVE, max_participants: 8,
      desc_en: 'Doubles match play only. Intermediate to Advanced players.', desc_ja: 'ダブルスのゲーム練習メインです。中級者以上。'
    },
    {
      sport_type: 'table-tennis', title_en: 'Language Exchange Ping Pong', title_ja: '言語交換卓球', vibe: SessionVibe.LANGUAGE_EXCHANGE, max_participants: 6,
      desc_en: 'Chat while we rally! Perfect for practicing your target language.', desc_ja: 'ラリーを続けながら楽しく会話しましょう！'
    },
    {
      sport_type: 'basketball', title_en: 'Beginner Basketball Clinic', title_ja: '初心者バスケ教室', vibe: SessionVibe.ACADEMY, max_participants: 10,
      desc_en: 'Learning basic dribbles, passes, and shooting forms.', desc_ja: 'ドリブル、パス、シュートの基礎を教えます。'
    },
    {
      sport_type: 'futsal', title_en: 'Women & Beginners Futsal', title_ja: '女性＆初心者フットサル', vibe: SessionVibe.CASUAL, max_participants: 12,
      desc_en: 'Safe and friendly environment for women and newcomers to futsal.', desc_ja: '女性や初心者が安心して楽しめる環境です。'
    },
    {
      sport_type: 'badminton', title_en: 'Friday Night Feathers', title_ja: '華金バドミントン', vibe: SessionVibe.CASUAL, max_participants: 10,
      desc_en: 'Start your weekend with an active Friday night session.', desc_ja: '週末の始まりをバドミントンで迎えましょう！'
    }
  ];

  const skillLevels = ['beginner', 'intermediate', 'advanced'];

  let sessionCount = 0;
  for (const sData of sessionsData) {
    const creator = allUsers[Math.floor(Math.random() * allUsers.length)];
    const sportCenter = sportCenters[Math.floor(Math.random() * sportCenters.length)];
    const skillLevel = skillLevels[Math.floor(Math.random() * skillLevels.length)];
    
    // Spread the dates across the next 14 days
    const daysOffset = Math.floor(Math.random() * 14) + 1;
    const hour = Math.floor(Math.random() * 11) + 9; // 9 AM to 8 PM

    const session = await prisma.session.create({
      data: {
        sport_center_id: sportCenter.id,
        sport_type: sData.sport_type,
        skill_level: skillLevel,
        date_time: getFutureDate(daysOffset, hour),
        duration_minutes: 90 + Math.floor(Math.random() * 2) * 30, // 90 or 120
        max_participants: sData.max_participants,
        description_en: sData.desc_en,
        description_ja: sData.desc_ja,
        primary_language: Math.random() > 0.5 ? 'en' : 'ja',
        allow_english: true,
        vibe: sData.vibe,
        created_by: creator.id,
      }
    });

    // Add random participants
    const numParticipants = Math.floor(Math.random() * (sData.max_participants - 2)) + 2;
    
    // Ensure creator is included
    const participants = [creator];
    // Shuffle the rest of the users safely
    const otherUsers = allUsers.filter(u => u.id !== creator.id).sort(() => 0.5 - Math.random());
    
    for (const u of otherUsers) {
      if (participants.length >= numParticipants) break;
      participants.push(u);
    }

    for (const p of participants) {
      await prisma.userSession.create({
        data: {
          user_id: p.id,
          session_id: session.id,
          status: 'REGISTERED',
        }
      });
    }

    sessionCount++;
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n========================================');
  console.log('Database seed completed successfully!');
  console.log('========================================');
  console.log(`Sport Centers: ${sportCenters.length}`);
  console.log(`Total Users: ${allUsers.length}`);
  console.log(`Total Sessions: ${sessionCount}`);
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
