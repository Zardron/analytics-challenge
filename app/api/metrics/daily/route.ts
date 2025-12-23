import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import type { Tables } from '@/lib/database.types';

/**
 * Next.js Edge Route: /api/metrics/daily
 * 
 * Runs at the edge for low latency, fetching and returning daily metrics for charts.
 * 
 * Edge Runtime Considerations:
 * - Uses edge-compatible APIs only (no Node.js APIs like fs, path, etc.)
 * - Uses createServerClient from @supabase/ssr (edge-compatible)
 * - All validation functions are edge-compatible (no external dependencies)
 * - Minimal dependencies to reduce cold start time
 * 
 * Features:
 * - Authentication validation via Supabase session
 * - Query parameter validation (startDate, endDate)
 * - User-scoped data filtering (defense-in-depth with RLS)
 * - Graceful error handling with appropriate HTTP status codes
 */
export const runtime = 'edge';

type DailyMetric = Tables<'daily_metrics'>;

/**
 * Validates date strings to ensure they're in ISO format.
 * Edge-compatible version (no dependencies on Node.js APIs).
 */
function validateDateParam(value: string | null): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  
  const sanitized = value.trim();
  
  // Validate ISO date format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) {
    // Additional validation: check if it's a valid date
    const date = new Date(sanitized);
    if (!isNaN(date.getTime())) {
      return sanitized;
    }
  }
  
  return null;
}

/**
 * Sanitizes error messages to prevent information leakage in production.
 * Only returns detailed errors in development.
 */
function sanitizeError(error: unknown, genericMessage: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return error instanceof Error ? error.message : genericMessage;
  }
  
  return genericMessage;
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Server configuration error' 
        },
        { status: 500 }
      );
    }

    // Create Supabase client for edge runtime
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Validate authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized' 
        },
        { status: 401 }
      );
    }

    // Validate and sanitize query parameters
    const { searchParams } = new URL(request.url);
    const startDate = validateDateParam(searchParams.get('startDate'));
    const endDate = validateDateParam(searchParams.get('endDate'));

    // Validate date range: endDate must be after startDate if both are provided
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid date range: startDate must be before or equal to endDate' 
        },
        { status: 400 }
      );
    }

    // Build query with user filtering and date range
    // Defense-in-depth: RLS policies enforce user_id filtering at database level
    // Application-level filtering provides additional security layer
    let query = supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      // Log detailed error server-side only
      console.error('Daily metrics fetch error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch daily metrics' 
        },
        { status: 500 }
      );
    }

    // Create response with data
    // Use the supabaseResponse which already has cookies set, but update with our JSON data
    const response = NextResponse.json({
      success: true,
      data: data as DailyMetric[],
    });

    // Copy cookies from supabaseResponse to our response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });

    return response;
  } catch (error) {
    // Log detailed error server-side only
    console.error('Daily metrics API error:', error);
    const errorMessage = sanitizeError(error, 'An error occurred while fetching daily metrics');
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

