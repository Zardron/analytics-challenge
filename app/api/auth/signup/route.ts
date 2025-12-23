import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeError, validateSignupCredentials } from '@/lib/utils/validation';
import { getSiteUrl } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    const validationError = validateSignupCredentials(email, password);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        // For development: if email confirmation is disabled, this will auto-confirm
      },
    });

    if (error) {
      // Log detailed error server-side only
      console.error('Supabase signup error:', error);
      
      // Sanitize error messages to prevent information leakage
      // Map common Supabase errors to generic messages
      let errorMessage = 'Signup failed. Please try again.';
      if (error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password does not meet requirements';
      } else if (error.message.includes('email')) {
        errorMessage = 'Invalid email address';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Check if email confirmation is required
    const requiresEmailConfirmation = !data.session && data.user.email_confirmed_at === null;
    
    // Don't send sensitive user data in response
    const { id, email: userEmail, created_at, email_confirmed_at } = data.user;
    
    return NextResponse.json({
      success: true,
      user: {
        id,
        email: userEmail,
        created_at,
        email_confirmed_at,
      },
      session: data.session ? { expires_at: data.session.expires_at } : null,
      requiresEmailConfirmation,
      message: data.session
        ? 'User created and signed in successfully!'
        : 'User created. Please check your email to confirm your account before signing in.',
    });
  } catch (error) {
    // Log detailed error server-side only
    console.error('Signup error:', error);
    const errorMessage = sanitizeError(error, 'An error occurred during signup');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

