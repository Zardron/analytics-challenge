import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { validateEnvironmentVariables } from '@/lib/utils/env';

// Validate environment variables on module load (client-side)
if (typeof window !== 'undefined') {
  try {
    validateEnvironmentVariables();
  } catch (error) {
    console.error('Environment variable validation failed:', error);
    // In production, this should fail fast, but in development we can be more lenient
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

