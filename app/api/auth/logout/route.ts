import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeError } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    // Sign out regardless of authentication state (idempotent operation)
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log detailed error server-side only
    console.error('Logout error:', error);
    const errorMessage = sanitizeError(error, 'An error occurred during logout');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

