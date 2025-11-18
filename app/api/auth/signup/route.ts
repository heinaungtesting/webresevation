import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, language = 'en' } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          language_preference: language,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create user in database
    if (data.user) {
      try {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            language_preference: language,
            email_verified: false,
          },
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        // User created in Supabase but not in database
        // You might want to handle this differently
      }
    }

    return NextResponse.json(
      {
        message: 'Signup successful! Please check your email to verify your account.',
        user: data.user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
