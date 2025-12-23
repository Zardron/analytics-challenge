import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
import { validateEnvironmentVariables } from '@/lib/utils/env';

// Validate environment variables on module load (server-side)
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('Environment variable validation failed:', error);
  // In production, this should fail fast
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            console.error('Error setting cookies:', cookiesToSet);
          }
        },
      },
    }
  );
}

