import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/database.types';
import { withAuth, validateDateParam, sanitizeError } from '@/lib/utils/validation';

type DailyMetric = Tables<'daily_metrics'>;

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize date parameters
    const startDate = validateDateParam(searchParams.get('startDate'));
    const endDate = validateDateParam(searchParams.get('endDate'));

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

    const { data, error } = await query;

    if (error) {
      // Log detailed error server-side only
      console.error('Daily metrics fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch daily metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as DailyMetric[],
    });
  } catch (error) {
    // Log detailed error server-side only
    console.error('Daily metrics API error:', error);
    const errorMessage = sanitizeError(error, 'An error occurred while fetching daily metrics');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});

