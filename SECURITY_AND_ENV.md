# Security and Environment Configuration

This document outlines the security practices and environment variable configuration for the Analytics Dashboard application.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Environment Variable Example File](#environment-variable-example-file)
3. [Vercel Deployment](#vercel-deployment)
4. [Secure API Routes](#secure-api-routes)
5. [Secret Management](#secret-management)
6. [Input Validation](#input-validation)
7. [CORS Considerations](#cors-considerations)

---

## Environment Variables

### Storage and Security

**✅ All secrets are stored in `.env.local` and never committed to git**

The `.env.local` file is automatically ignored by git (via `.gitignore`). This ensures that sensitive credentials are never exposed in version control.

### Required Environment Variables

The application requires the following environment variables:

| Variable | Description | Public/Private | Required |
|----------|-------------|----------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Public | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Public | Yes |
| `NEXT_PUBLIC_SITE_URL` | Site URL for redirects | Public | No |

### Why These Variables Are Safe to Expose

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. This is safe because:

1. **Row Level Security (RLS)**: Supabase RLS policies enforce data access restrictions at the database level, regardless of how the key is obtained
2. **Limited Permissions**: The anonymous key has restricted permissions and cannot bypass RLS policies
3. **Authentication Required**: All sensitive operations require authenticated JWT tokens, not just the anon key

### Environment Variable Validation

The application validates all required environment variables at startup via `lib/utils/env.ts`:

- Checks that all required variables are present
- Validates URL format for Supabase URL
- Validates anon key length (basic sanity check)
- Throws descriptive errors if validation fails

**Location**: `lib/utils/env.ts`

```typescript
// Example validation
validateEnvironmentVariables(); // Called at app startup
```

### Best Practices

1. **Never commit `.env.local`**: Already in `.gitignore`
2. **Use different keys per environment**: Development, staging, and production should use separate Supabase projects or keys
3. **Rotate keys regularly**: Supabase dashboard allows key rotation
4. **Monitor key usage**: Supabase logs show which keys are being used
5. **Use `.env.local` for local development**: Next.js automatically loads this file
6. **Use Vercel environment variables for production**: Configure via Vercel dashboard

---

## Environment Variable Example File

### `.env.example`

A `.env.example` file is provided in the repository root that documents all required environment variables without exposing actual values.

**Purpose**: 
- Serves as documentation for required environment variables
- Helps new developers set up the project quickly
- Provides a template for creating `.env.local`

**Contents**:
```env
# Supabase Configuration
# Get these values from your Supabase project dashboard (Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Site URL (Optional)
# Used for email redirects after authentication
# Defaults to http://localhost:3000 if not set
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Setup Instructions

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your actual values from the Supabase dashboard:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key
   - Paste them into `.env.local`

3. Verify the setup:
   ```bash
   npm run dev
   ```
   The application will validate environment variables at startup and throw descriptive errors if any are missing.

---

## Vercel Deployment

### Environment Variable Configuration

When deploying to Vercel, environment variables must be configured via the Vercel dashboard, not committed to the repository.

### Steps to Configure Environment Variables in Vercel

1. **Navigate to Project Settings**:
   - Go to your project in Vercel dashboard
   - Click on "Settings" → "Environment Variables"

2. **Add Environment Variables**:
   - Click "Add New"
   - Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the variable value
   - Select the environments where it applies (Production, Preview, Development)
   - Click "Save"

3. **Required Variables for Vercel**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (optional, defaults to Vercel deployment URL)

4. **Redeploy After Changes**:
   - After adding/changing environment variables, redeploy your application
   - Vercel will automatically use the new environment variables

### Environment-Specific Configuration

**Production**:
- Use production Supabase project credentials
- Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g., `https://your-app.vercel.app`)

**Preview/Development**:
- Can use the same Supabase project or a separate development project
- Set `NEXT_PUBLIC_SITE_URL` to preview URL or localhost

### Vercel Security Features

- **Encrypted Storage**: Environment variables are encrypted at rest
- **Access Control**: Only team members with appropriate permissions can view/edit variables
- **Audit Logs**: Vercel logs who accessed/changed environment variables
- **No Exposure**: Environment variables are never exposed in build logs or client bundles (except `NEXT_PUBLIC_*` variables, which are intentionally public)

---

## Secure API Routes

### Authentication Verification

**✅ All API routes verify authentication before returning data**

All protected API routes use the `withAuth()` higher-order function to ensure only authenticated users can access data.

### Implementation

**Location**: `lib/utils/validation.ts`

```typescript
export function withAuth(handler: ProtectedRouteHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { error: authError, user } = await requireAuth();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return await handler(request, user);
  };
}
```

### Usage Example

```typescript
// app/api/posts/route.ts
export const GET = withAuth(async (request: NextRequest, user) => {
  // user is guaranteed to be authenticated here
  // All queries are filtered by user.id
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id);
  
  return NextResponse.json({ success: true, data });
});
```

### Protected Routes

All data-accessing API routes are protected:

- `/api/posts` - Requires authentication
- `/api/analytics/summary` - Requires authentication
- `/api/daily-metrics` - Requires authentication
- `/api/metrics/daily` - Requires authentication

### Authentication Flow

1. **Client Request**: Client sends request with HTTP-only cookie containing JWT
2. **Middleware Validation**: Next.js middleware validates session
3. **API Route Protection**: `withAuth()` verifies authentication
4. **User Context**: Authenticated user object is passed to route handler
5. **Data Filtering**: All queries explicitly filter by `user.id`

### Unauthenticated Access Handling

**API Routes**:
- Return `401 Unauthorized` status code
- Generic error message: `{ error: 'Unauthorized' }`
- No information about why authentication failed (prevents information leakage)

**Page Routes**:
- Redirected to `/auth/login` via middleware
- Original URL can be preserved for redirect after login

### Defense-in-Depth

Authentication is enforced at multiple levels:

1. **Middleware**: Validates session before route handler executes
2. **API Route Wrapper**: `withAuth()` double-checks authentication
3. **Database RLS**: Row Level Security policies enforce user isolation
4. **Application Filtering**: Explicit `user_id` filtering in queries

---

## Secret Management

### No Exposed Secrets

**✅ `SUPABASE_SERVICE_ROLE_KEY` is never exposed client-side**

The application does **not** use the Supabase service role key. Instead, it uses:

- **Client-side**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe to expose, protected by RLS)
- **Server-side**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same key, but server-side usage)

### Why Service Role Key Is Not Used

1. **Security Risk**: Service role key bypasses RLS policies and has full database access
2. **Not Needed**: The anon key with RLS policies provides sufficient security
3. **Client Exposure Risk**: If service role key were used, it could accidentally be exposed in client bundles

### Current Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ Uses NEXT_PUBLIC_SUPABASE_ANON_KEY
       │ (Protected by RLS policies)
       ▼
┌─────────────┐
│  Supabase   │
│  Database   │
│  (with RLS) │
└─────────────┘
```

### If Service Role Key Were Needed

**⚠️ Never do this in this application**, but if you needed service role key for admin operations:

1. **Server-only**: Store as `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix)
2. **Never import in client components**: Only use in API routes or server components
3. **Separate Supabase client**: Create a separate client instance for admin operations
4. **Audit usage**: Log all operations using service role key
5. **Minimize usage**: Only use for operations that truly require bypassing RLS

### Secret Scanning

**Best Practices**:
- Use tools like `git-secrets` or GitHub's secret scanning
- Never commit secrets, even in comments or documentation
- Rotate keys if accidentally exposed
- Use different keys for different environments

---

## Input Validation

### Sanitization and Validation

**✅ All user inputs and query parameters are sanitized and validated**

All user inputs are validated using allowlists, type checking, and format validation before processing.

### Implementation

**Location**: `lib/utils/validation.ts`

### Query Parameter Validation

#### Platform Filter
```typescript
const ALLOWED_PLATFORMS = [
  'all', 'instagram', 'facebook', 
  'twitter', 'linkedin', 'tiktok', 'youtube'
];

const platform = validateStringParam(
  searchParams.get('platform'), 
  ALLOWED_PLATFORMS
);
// Invalid values return null (treated as "all")
```

#### Media Type Filter
```typescript
const ALLOWED_MEDIA_TYPES = [
  'all', 'image', 'video', 
  'carousel', 'reel', 'story'
];

const mediaType = validateStringParam(
  searchParams.get('mediaType'), 
  ALLOWED_MEDIA_TYPES
);
```

#### Date Parameters
```typescript
const startDate = validateDateParam(searchParams.get('startDate'));
// Must match ISO format: YYYY-MM-DD
// Invalid dates return null
```

#### Sort Fields
```typescript
const ALLOWED_POST_SORT_FIELDS = [
  'posted_at', 'impressions', 'likes', 
  'comments', 'shares', 'reach', 
  'engagement_rate', 'platform', 'media_type'
];

// Prevents SQL injection via sort fields
const sortField = validateStringParam(
  searchParams.get('sortBy'), 
  ALLOWED_POST_SORT_FIELDS
) || 'posted_at'; // Default fallback
```

#### Sort Order
```typescript
const sortOrder = validateSortOrder(searchParams.get('sortOrder'));
// Only allows 'asc' or 'desc'
// Invalid values default to 'desc'
```

### Form Input Validation

#### Email Validation
```typescript
export function validateEmail(email: unknown): string | null {
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Invalid email format';
  }
  
  return null; // Valid
}
```

#### Password Validation
```typescript
export function validatePassword(password: unknown): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  
  // Prevent DoS via very long passwords
  if (password.length > 128) {
    return 'Password is too long';
  }
  
  return null; // Valid
}
```

### SQL Injection Prevention

**Why We're Protected**:

1. **Supabase Client**: Uses parameterized queries under the hood
2. **Allowlists**: Sort fields and filters use allowlists, not string concatenation
3. **Type Validation**: All parameters validated before use
4. **RLS Policies**: Even if injection occurred, RLS would limit damage

**Safe Example**:
```typescript
// ✅ Safe: Uses allowlist
const platform = validateStringParam(
  searchParams.get('platform'), 
  ALLOWED_PLATFORMS
);
query = query.eq('platform', platform); 
// Supabase client handles parameterization
```

**Unsafe Example (We Don't Do This)**:
```typescript
// ❌ UNSAFE - We don't do this:
query = query.raw(`SELECT * FROM posts WHERE platform = '${userInput}'`);
```

### XSS Prevention

**Client-side Rendering**:
- React automatically escapes content in JSX
- User-generated content is sanitized before display
- No `dangerouslySetInnerHTML` usage

**API Responses**:
- All responses are JSON (not HTML)
- Content-Type headers are set correctly
- No script injection via API responses

### Validation Best Practices

1. **Validate Early**: Validate inputs as soon as they're received
2. **Use Allowlists**: Prefer allowlists over blocklists
3. **Type Checking**: Always check types before processing
4. **Sanitize Strings**: Trim and sanitize string inputs
5. **Length Limits**: Enforce maximum lengths to prevent DoS
6. **Format Validation**: Validate formats (dates, emails, URLs)

---

## CORS Considerations

### Understanding CORS

CORS (Cross-Origin Resource Sharing) headers are needed when:
- A web page from one origin (domain) makes a request to a different origin
- The browser enforces the Same-Origin Policy

### Current Architecture

**This application does NOT require CORS headers** because:

1. **Same-Origin Requests**: 
   - Frontend and API routes are on the same domain
   - Next.js API routes are served from the same origin as the frontend
   - No cross-origin requests are made

2. **Supabase Client**:
   - Supabase client handles CORS automatically
   - Supabase dashboard allows configuring allowed origins
   - Browser makes direct requests to Supabase (with proper CORS headers from Supabase)

### When CORS Headers Would Be Needed

**If you were to**:
- Host the frontend on a different domain than the API
- Make API requests from a mobile app or external website
- Use a separate API server

**Then you would need**:
```typescript
// In API route
return NextResponse.json(data, {
  headers: {
    'Access-Control-Allow-Origin': 'https://your-frontend-domain.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true', // If using cookies
  },
});
```

### Supabase CORS Configuration

**Supabase Dashboard**:
1. Go to Settings → API
2. Configure "Allowed CORS Origins"
3. Add your frontend domain(s)
4. Supabase will automatically add CORS headers to responses

**Example**:
```
Allowed CORS Origins:
- http://localhost:3000 (development)
- https://your-app.vercel.app (production)
```

### Security Considerations

**If CORS is needed**:

1. **Be Specific**: Only allow specific origins, not `*`
   ```typescript
   // ❌ Bad
   'Access-Control-Allow-Origin': '*'
   
   // ✅ Good
   'Access-Control-Allow-Origin': 'https://your-app.vercel.app'
   ```

2. **Use Credentials Carefully**: Only enable `Access-Control-Allow-Credentials` if needed
3. **Limit Methods**: Only allow HTTP methods that are actually used
4. **Limit Headers**: Only allow headers that are necessary
5. **Environment-Specific**: Use different CORS settings for dev/staging/production

### Current Status

**✅ No CORS configuration needed** - All requests are same-origin

---

## Security Checklist

This application implements the following security measures:

- ✅ **Environment Variables**: All secrets in `.env.local`, never committed
- ✅ **Environment Example**: `.env.example` documents required variables
- ✅ **Vercel Deployment**: Environment variables configured via Vercel dashboard
- ✅ **Secure API Routes**: All routes verify authentication before returning data
- ✅ **No Exposed Secrets**: Service role key never used or exposed
- ✅ **Input Validation**: All user inputs and query parameters validated
- ✅ **CORS Considerations**: Understood and not needed for current architecture
- ✅ **RLS Policies**: Database-level access control
- ✅ **Authentication**: Server-side JWT validation
- ✅ **Authorization**: Middleware + API route protection
- ✅ **SQL Injection Prevention**: Parameterized queries + allowlists
- ✅ **Error Sanitization**: Generic errors in production
- ✅ **Data Isolation**: RLS + explicit application-level filtering
- ✅ **HTTP-Only Cookies**: JWT tokens in HTTP-only cookies (XSS protection)
- ✅ **HTTPS**: Enforced in production

---

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Why This Matters

**Security is non-negotiable.** We need engineers who think about data protection, secret management, and secure deployments from day one. This document serves as both a guide for implementation and a checklist for security review.

