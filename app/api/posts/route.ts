import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/database.types';
import {
  withAuth,
  validateStringParam,
  validateDateParam,
  validateSortOrder,
  sanitizeError,
  ALLOWED_PLATFORMS,
  ALLOWED_MEDIA_TYPES,
  ALLOWED_POST_SORT_FIELDS,
} from '@/lib/utils/validation';

type Post = Tables<'posts'>;

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize query parameters
    const platform = validateStringParam(searchParams.get('platform'), ALLOWED_PLATFORMS);
    const mediaType = validateStringParam(searchParams.get('mediaType'), ALLOWED_MEDIA_TYPES);
    const startDate = validateDateParam(searchParams.get('startDate'));
    const endDate = validateDateParam(searchParams.get('endDate'));

    // Defense-in-depth: Explicitly filter by user_id even though RLS enforces this
    // This ensures data isolation at the application level as well as database level
    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id);

    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }

    if (mediaType && mediaType !== 'all') {
      query = query.eq('media_type', mediaType);
    }

    if (startDate) {
      query = query.gte('posted_at', startDate);
    }

    if (endDate) {
      query = query.lte('posted_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      // Log detailed error server-side only
      console.error('Posts fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Post[],
    });
  } catch (error) {
    // Log detailed error server-side only
    console.error('Posts API error:', error);
    const errorMessage = sanitizeError(error, 'An error occurred while fetching posts');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});

