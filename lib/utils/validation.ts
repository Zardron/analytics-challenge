import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Checks if a user is authenticated and returns the user.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

/**
 * Returns an unauthorized response if user is not authenticated.
 * Otherwise returns the authenticated user.
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      user: null,
    };
  }
  
  return { error: null, user };
}

/**
 * Sanitizes error messages to prevent information leakage in production.
 * Only returns detailed errors in development.
 */
export function sanitizeError(error: unknown, genericMessage: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return error instanceof Error ? error.message : genericMessage;
  }
  
  return genericMessage;
}

/**
 * Validates and sanitizes query parameters to prevent injection attacks.
 */
export function validateStringParam(value: string | null, allowedValues?: string[]): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  
  // Remove any potential SQL injection characters
  const sanitized = value.trim();
  
  // If allowed values are specified, check against them
  if (allowedValues && allowedValues.length > 0) {
    return allowedValues.includes(sanitized) ? sanitized : null;
  }
  
  // Basic sanitization: only allow alphanumeric, dash, underscore, and spaces
  if (/^[a-zA-Z0-9_\-\s]+$/.test(sanitized)) {
    return sanitized;
  }
  
  return null;
}

/**
 * Validates date strings to ensure they're in ISO format.
 */
export function validateDateParam(value: string | null): string | null {
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
 * Validates sort order parameter.
 */
export function validateSortOrder(value: string | null): 'asc' | 'desc' {
  if (value === 'asc' || value === 'desc') {
    return value;
  }
  return 'desc';
}

/**
 * Allowed platform values for validation
 */
export const ALLOWED_PLATFORMS = ['all', 'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'];

/**
 * Allowed media type values for validation
 */
export const ALLOWED_MEDIA_TYPES = ['all', 'image', 'video', 'carousel', 'reel', 'story'];

/**
 * Allowed sort fields for posts
 */
export const ALLOWED_POST_SORT_FIELDS = [
  'posted_at',
  'impressions',
  'likes',
  'comments',
  'shares',
  'reach',
  'engagement_rate',
  'platform',
  'media_type',
];

/**
 * Validates email format.
 * Returns null if valid, error message if invalid.
 */
export function validateEmail(email: unknown): string | null {
  if (!email) {
    return 'Email is required';
  }

  if (typeof email !== 'string') {
    return 'Email must be a string';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Invalid email format';
  }

  return null;
}

/**
 * Validates password requirements.
 * Returns null if valid, error message if invalid.
 */
export function validatePassword(password: unknown): string | null {
  if (!password) {
    return 'Password is required';
  }

  if (typeof password !== 'string') {
    return 'Password must be a string';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  // Prevent very long passwords (potential DoS)
  if (password.length > 128) {
    return 'Password is too long';
  }

  return null;
}

/**
 * Validates signup credentials (email and password).
 * Returns null if valid, error message if invalid.
 */
export function validateSignupCredentials(email: unknown, password: unknown): string | null {
  const emailError = validateEmail(email);
  if (emailError) {
    return emailError;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return passwordError;
  }

  return null;
}

/**
 * Type for protected route handlers that require authentication
 */
type ProtectedRouteHandler = (
  request: NextRequest,
  user: User
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that wraps a route handler with authentication.
 * Automatically checks if user is authenticated before executing the handler.
 * Returns 401 Unauthorized if user is not authenticated.
 * 
 * @example
 * export const GET = withAuth(async (request, user) => {
 *   // Your protected route logic here
 *   return NextResponse.json({ data: 'protected data' });
 * });
 */
export function withAuth(handler: ProtectedRouteHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { error: authError, user } = await requireAuth();
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      return await handler(request, user);
    } catch (error) {
      console.error('Protected route error:', error);
      const errorMessage = sanitizeError(error, 'An error occurred processing the request');
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper function for protected page routes.
 * Returns the authenticated user or redirects to login if not authenticated.
 * 
 * @example
 * export default async function ProtectedPage() {
 *   const user = await requireAuthForPage();
 *   return <div>Welcome {user.email}</div>;
 * }
 */
export async function requireAuthForPage(): Promise<User> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/login');
  }
  
  // TypeScript doesn't know redirect() never returns, so we assert non-null
  return user!;
}

