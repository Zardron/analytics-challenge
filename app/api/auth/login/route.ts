import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeError } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password is not empty and is a string
    if (typeof password !== 'string' || password.trim().length === 0) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Log detailed error server-side only
      console.error('Auth error:', error);
      // Use generic error message to prevent information leakage
      // (e.g., "Invalid login credentials" vs "Email not found" vs "Wrong password")
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!data?.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Don't send sensitive user data in response
    const { id, email: userEmail, created_at } = data.user;
    return NextResponse.json({
      success: true,
      user: {
        id,
        email: userEmail,
        created_at,
      },
    });
  } catch (error) {
    // Log detailed error server-side only
    console.error('Login error:', error);
    const errorMessage = sanitizeError(error, 'An error occurred during login');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

