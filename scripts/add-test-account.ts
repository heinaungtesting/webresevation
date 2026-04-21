import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function main() {
  const email = 'test@example.com';
  const password = 'password123';
  const username = 'testuser';

  console.log(`Creating test user with email ${email}...`);

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      username,
      language_preference: 'en'
    }
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
        console.log('User already exists in Supabase. Proceeding to Prisma step or skipping.');
        return;
    }
    console.error('Error creating user in Supabase Auth:', authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`User created in Supabase Auth with ID: ${userId}`);

  // 2. Insert into Prisma User table
  try {
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email,
        username: username,
        display_name: 'Test Account',
        language_preference: 'en',
        email_verified: true,
      }
    });

    console.log('Successfully created test user in database (Prisma).');
    console.log('Login credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (dbError: any) {
    console.error('Error creating user in Prisma:', dbError.message);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
