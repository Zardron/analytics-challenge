/**
 * Gets the site URL from environment variables with a fallback.
 * Works in both server and client contexts.
 */
export function getSiteUrl(): string {
  // In browser/client context, use window.location
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  }
  
  // In server context, use environment variable with fallback
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

/**
 * Validates that all required environment variables are set.
 * Should be called at application startup.
 */
export function validateEnvironmentVariables() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missing: string[] = [];

  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  // Validate URL format
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must use http or https protocol');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
    }
    throw error;
  }

  // Validate anon key is not empty (format validation is complex, so just check it exists)
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.length < 20) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid');
  }

  // Validate NEXT_PUBLIC_SITE_URL if provided (optional but should be valid if set)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL);
      if (!['http:', 'https:'].includes(siteUrl.protocol)) {
        throw new Error('NEXT_PUBLIC_SITE_URL must use http or https protocol');
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('NEXT_PUBLIC_SITE_URL must be a valid URL');
      }
      throw error;
    }
  }
}

