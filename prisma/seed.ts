import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create Sport Centers
  const sportCenters = await Promise.all([
    prisma.sportCenter.create({
      data: {
        name_en: 'Tokyo Sport Center',
        name_ja: '東京スポーツセンター',
        address_en: '1-2-3 Shibuya, Shibuya-ku, Tokyo',
        address_ja: '東京都渋谷区渋谷1-2-3',
        station_en: 'Shibuya Station',
        station_ja: '渋谷駅',
        latitude: 35.6595,
        longitude: 139.7004,
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Shinjuku Sports Plaza',
        name_ja: '新宿スポーツプラザ',
        address_en: '2-3-4 Shinjuku, Shinjuku-ku, Tokyo',
        address_ja: '東京都新宿区新宿2-3-4',
        station_en: 'Shinjuku Station',
        station_ja: '新宿駅',
        latitude: 35.6938,
        longitude: 139.7036,
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Roppongi Tennis Club',
        name_ja: '六本木テニスクラブ',
        address_en: '3-4-5 Roppongi, Minato-ku, Tokyo',
        address_ja: '東京都港区六本木3-4-5',
        station_en: 'Roppongi Station',
        station_ja: '六本木駅',
        latitude: 35.6627,
        longitude: 139.7296,
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Ikebukuro Community Gym',
        name_ja: '池袋コミュニティジム',
        address_en: '1-1-1 Ikebukuro, Toshima-ku, Tokyo',
        address_ja: '東京都豊島区池袋1-1-1',
        station_en: 'Ikebukuro Station',
        station_ja: '池袋駅',
        latitude: 35.7295,
        longitude: 139.7109,
      },
    }),
    prisma.sportCenter.create({
      data: {
        name_en: 'Odaiba Sports Arena',
        name_ja: 'お台場スポーツアリーナ',
        address_en: '1-6-1 Daiba, Minato-ku, Tokyo',
        address_ja: '東京都港区台場1-6-1',
        station_en: 'Odaiba-kaihinkoen Station',
        station_ja: 'お台場海浜公園駅',
        latitude: 35.6249,
        longitude: 139.7756,
      },
    }),
  ]);

  console.log(`Created ${sportCenters.length} sport centers`);

  // Note: We can't create sessions with demo users because we need real Supabase Auth users
  // Sessions will be created by users through the app

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
