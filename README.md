# Analytics Dashboard

A Next.js analytics dashboard application for tracking social media post performance across Instagram and TikTok.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm/bun
- Supabase account and project
- `.env.local` file with required environment variables

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Apply database migrations:**
   Apply migrations in order using the Supabase dashboard SQL editor or CLI:
   - `supabase/migrations/posts.sql` - Creates posts table
   - `supabase/migrations/daily_metrics.sql` - Creates daily_metrics table
   - `supabase/migrations/rls_policies.sql` - **Critical: Enables RLS and creates security policies**
   
   **Important**: The RLS policies migration must be applied after the table creation migrations. These policies are essential for data security and must not be skipped.

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### Security Note

**⚠️ Critical**: Do not skip the RLS policies migration (`rls_policies.sql`). Without these policies, users can access each other's data, creating a serious security vulnerability. Always apply all migrations in order.

## Security Architecture

This application implements a multi-layered security approach following defense-in-depth principles. Security is enforced at multiple levels: database (RLS policies), API routes (authentication middleware), and application logic (explicit user filtering).

---

### 1. Row Level Security (RLS) Policies

**Decision: Database-level access control via RLS policies**

All database tables (`posts` and `daily_metrics`) have Row Level Security (RLS) enabled, ensuring users can only access their own data at the database level, regardless of how the data is accessed.

#### Implementation

RLS policies are defined in `supabase/migrations/rls_policies.sql` and enforce the following rules:

**For `posts` table:**
- `SELECT`: Users can only view posts where `auth.uid() = user_id`
- `INSERT`: Users can only insert posts with their own `user_id`
- `UPDATE`: Users can only update their own posts (both `USING` and `WITH CHECK` clauses)
- `DELETE`: Users can only delete their own posts

**For `daily_metrics` table:**
- Same policy structure as `posts` - users can only CRUD their own metrics

#### Why RLS Works

1. **Database-Level Enforcement**: RLS policies are enforced by PostgreSQL itself, not application code. This means:
   - Even if application code has bugs, users cannot access other users' data
   - Direct database access (via SQL clients, migrations, etc.) still respects RLS
   - Policies apply to all queries, including aggregations and joins

2. **`auth.uid()` Function**: Supabase automatically provides `auth.uid()` which returns the UUID of the authenticated user making the request. This is:
   - Set automatically by Supabase based on the JWT token
   - Cannot be spoofed by client code (Supabase validates JWT signatures)
   - Consistent across all queries in a single request

3. **Policy Evaluation**: PostgreSQL evaluates RLS policies for every row access:
   - `USING` clause determines if a row can be read/updated/deleted
   - `WITH CHECK` clause determines if a row can be inserted/updated
   - Policies are evaluated before any application logic runs

#### Testing RLS Policies

To verify RLS policies work correctly:

1. **Test with different users**: Create two user accounts and verify each user can only see their own posts
2. **Test with unauthenticated requests**: Direct database queries without authentication should return no rows
3. **Test policy bypass attempts**: Try to manually set `user_id` to another user's ID - the policy should prevent access

**Example test scenario:**
```sql
-- As user A, try to access user B's posts (should return empty)
SELECT * FROM posts WHERE user_id = '<user_b_id>';
-- RLS policy automatically filters this to only user A's posts
-- Result: Empty if user A has no posts, or only user A's posts
```

#### Trade-offs

**Pros:**
- **Strong Security**: Database-level enforcement is the strongest form of access control
- **Defense-in-Depth**: Even if application code fails, data is protected
- **Consistent**: Works for all access patterns (API routes, direct queries, migrations)
- **Performance**: PostgreSQL optimizes RLS policy evaluation

**Cons:**
- **Complexity**: Requires understanding PostgreSQL policies and Supabase auth
- **Debugging**: RLS can make debugging more complex (queries return fewer rows than expected)
- **Migration Complexity**: Policies must be carefully designed to allow migrations to run

---

### 2. Authentication Architecture

**Decision: Server-side authentication with JWT tokens via Supabase Auth**

Authentication is handled server-side using Supabase Auth, which issues JWT tokens that are stored in HTTP-only cookies.

#### Authentication Flow

1. **Login/Signup**: User credentials are sent to `/api/auth/login` or `/api/auth/signup`
2. **Supabase Auth**: Supabase validates credentials and issues a JWT token
3. **Cookie Storage**: JWT is stored in HTTP-only cookies (prevents XSS attacks)
4. **Middleware Validation**: Every request is validated by Next.js middleware (`middleware.ts`)
5. **API Route Protection**: Protected routes use `withAuth()` HOF to ensure authentication

#### Key Security Features

**HTTP-Only Cookies:**
- Cookies cannot be accessed via JavaScript (prevents XSS attacks)
- Automatically sent with requests (no manual token management)
- Secure in production (HTTPS-only)

**Middleware Protection:**
- Runs before any route handler executes
- Redirects unauthenticated users to `/auth/login`
- Returns 401 for API routes
- Prevents authenticated users from accessing auth pages (redirects to dashboard)

**API Route Protection:**
- `withAuth()` higher-order function wraps all protected routes
- Validates user authentication before executing route handler
- Provides authenticated `user` object to route handlers
- Returns 401 Unauthorized if authentication fails

#### Error Handling

**Generic Error Messages:**
- Login errors return "Invalid email or password" (not specific error like "Email not found")
- Prevents information leakage that could help attackers enumerate valid emails
- Detailed errors logged server-side for debugging

**Error Sanitization:**
- `sanitizeError()` function hides detailed errors in production
- Development environment shows detailed errors for debugging
- Production returns generic messages to prevent information leakage

---

### 3. Secrets and Environment Variables

**Decision: Environment variables with validation at startup**

All secrets and configuration are stored in environment variables, validated at application startup, and never committed to version control.

#### Environment Variables

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (public, safe to expose)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key (public, but restricted by RLS)

**Why These Are Public:**
- `NEXT_PUBLIC_` prefix means they're exposed to the browser
- This is safe because:
  - RLS policies restrict data access regardless of how the key is obtained
  - The anon key has limited permissions (cannot bypass RLS)
  - All sensitive operations require authentication via JWT

**What's NOT Exposed:**
- Service role keys (server-side only, if needed)
- Database connection strings
- API secrets (if any third-party integrations)

#### Validation

`lib/utils/env.ts` validates environment variables at startup:
- Checks all required variables are present
- Validates URL format for Supabase URL
- Validates anon key length (basic sanity check)
- Throws descriptive errors if validation fails

#### Secrets Management Best Practices

1. **Never commit `.env.local`**: Already in `.gitignore`
2. **Use different keys per environment**: Development, staging, production
3. **Rotate keys regularly**: Supabase dashboard allows key rotation
4. **Monitor key usage**: Supabase logs show which keys are being used

---

### 4. Data Isolation

**Decision: Multi-layer data isolation (RLS + application-level filtering)**

Data isolation is enforced at two levels:

#### Level 1: Database (RLS Policies)
- Primary enforcement layer
- All queries automatically filtered by `auth.uid() = user_id`
- Cannot be bypassed by application code

#### Level 2: Application (Explicit Filtering)
- Defense-in-depth measure
- All API routes explicitly filter by `user.id`
- Example: `query.eq('user_id', user.id)`

#### Why Both Layers?

**Defense-in-Depth Principle:**
- If RLS is misconfigured, application filtering still protects data
- If application code has bugs, RLS still protects data
- Redundant protection reduces risk of data leakage

**Code Clarity:**
- Explicit filtering makes code intent clear
- Easier for code reviewers to verify security
- Documents expected behavior in code comments

**Future-Proofing:**
- If RLS is temporarily disabled (maintenance, debugging), application layer still works
- Easier to migrate to different database solutions

#### Examples

**Posts API Route:**
```typescript
// Both RLS and explicit filtering
const query = supabase
  .from('posts')
  .select('*')
  .eq('user_id', user.id); // Application-level filter
// RLS policy also enforces auth.uid() = user_id at database level
```

**Daily Metrics API Route:**
```typescript
// Same pattern
const query = supabase
  .from('daily_metrics')
  .select('*')
  .eq('user_id', user.id)
  .order('date', { ascending: true });
```

---

### 5. Input Validation and Sanitization

**Decision: Strict validation with allowlists**

All user input is validated using allowlists and type checking before processing.

#### Query Parameter Validation

**Platform Filter:**
- Only allows: `['all', 'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube']`
- Invalid values return `null` (treated as "all")

**Media Type Filter:**
- Only allows: `['all', 'image', 'video', 'carousel', 'reel', 'story']`
- Invalid values return `null`

**Date Parameters:**
- Must match ISO date format: `YYYY-MM-DD`
- Validated using regex and Date constructor
- Invalid dates return `null`

**Sort Fields:**
- Only allows: `['posted_at', 'impressions', 'likes', 'comments', 'shares', 'reach', 'engagement_rate', 'platform', 'media_type']`
- Prevents SQL injection via sort fields
- Invalid values default to `'posted_at'`

**Sort Order:**
- Only allows: `'asc'` or `'desc'`
- Invalid values default to `'desc'`

#### Email/Password Validation

**Email:**
- Regex validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Trimmed and lowercased before processing
- Prevents invalid email formats

**Password:**
- Minimum length: 6 characters
- Maximum length: 128 characters (prevents DoS via very long passwords)
- Type checking (must be string)

#### SQL Injection Prevention

**Why We're Protected:**
1. **Supabase Client**: Uses parameterized queries under the hood
2. **Allowlists**: Sort fields and filters use allowlists, not string concatenation
3. **Type Validation**: All parameters validated before use
4. **RLS Policies**: Even if injection occurred, RLS would limit damage

**Example (Safe):**
```typescript
// Safe: Uses allowlist
const platform = validateStringParam(searchParams.get('platform'), ALLOWED_PLATFORMS);
query = query.eq('platform', platform); // Supabase client handles parameterization
```

**Example (Would be unsafe, but we don't do this):**
```typescript
// UNSAFE - We don't do this:
query = query.raw(`SELECT * FROM posts WHERE platform = '${userInput}'`);
```

---

### 6. Unauthorized Access Handling

**Decision: Consistent error responses with appropriate status codes**

#### API Routes

**Unauthenticated Requests:**
- Return `401 Unauthorized`
- Generic error message: `{ error: 'Unauthorized' }`
- No information about why authentication failed

**Authenticated but Unauthorized:**
- Should not occur due to RLS + explicit filtering
- If it did occur, would return `403 Forbidden` (future enhancement)

#### Page Routes

**Unauthenticated Access:**
- Redirected to `/auth/login` via middleware
- Preserves original URL for redirect after login (can be added)

**Authenticated Users on Auth Pages:**
- Redirected to `/dashboard`
- Prevents unnecessary auth page access

#### Error Response Consistency

All API routes follow consistent error response format:
```typescript
{
  success: false, // or omitted
  error: "User-friendly error message"
}
```

Success responses:
```typescript
{
  success: true,
  data: { ... }
}
```

---

### 7. Security Trade-offs and Design Decisions

#### Trade-off: RLS Complexity vs. Security

**Decision**: Accept RLS complexity for stronger security

- **Trade-off**: RLS adds complexity to development and debugging
- **Benefit**: Database-level enforcement is the strongest form of access control
- **Mitigation**: Clear documentation, explicit application-level filtering as backup

#### Trade-off: Public API Keys vs. Service Role Keys

**Decision**: Use public anon keys (safe due to RLS)

- **Trade-off**: Public keys are exposed in client code
- **Benefit**: Simpler architecture, works with RLS
- **Mitigation**: RLS policies restrict what can be accessed even with the key

#### Trade-off: Generic vs. Specific Error Messages

**Decision**: Generic error messages in production

- **Trade-off**: Less helpful for legitimate users
- **Benefit**: Prevents information leakage to attackers
- **Mitigation**: Detailed errors in development, generic in production

#### Trade-off: Defense-in-Depth vs. Code Duplication

**Decision**: Explicit filtering even with RLS

- **Trade-off**: Slight code duplication (RLS + explicit filter)
- **Benefit**: Multiple layers of protection
- **Mitigation**: Clear comments explain why both are needed

---

### 8. Security Checklist

This application implements the following security measures:

- ✅ **RLS Policies**: Enabled on all tables with user-specific policies
- ✅ **Authentication**: Server-side JWT validation via Supabase Auth
- ✅ **Authorization**: Middleware + API route protection
- ✅ **Input Validation**: All user input validated with allowlists
- ✅ **SQL Injection Prevention**: Parameterized queries + allowlists
- ✅ **Error Sanitization**: Generic errors in production, detailed in development
- ✅ **Secrets Management**: Environment variables, not committed
- ✅ **Data Isolation**: RLS + explicit application-level filtering
- ✅ **HTTP-Only Cookies**: JWT tokens in HTTP-only cookies (XSS protection)
- ✅ **HTTPS**: Enforced in production (Supabase requirement)

---

## Architecture Decisions

This document outlines the key architectural decisions made during development, including the reasoning behind each choice and trade-offs considered.

---

## 1. Where Should Engagement Metrics Be Aggregated?

**Decision: API Route (`/api/analytics/summary`)**

Engagement metrics are aggregated server-side in the `/api/analytics/summary` API route, which computes totals, averages, and trend calculations before sending data to the client.

**Security Consideration**: Server-side aggregation ensures:
- User data is filtered by RLS policies before aggregation
- Business logic cannot be manipulated by clients
- Sensitive calculation logic remains server-side

### Implementation Details

The API route:
- Fetches all posts for the authenticated user from Supabase
- Calculates metrics (total engagement, average engagement rate, top post) server-side
- Computes trend comparisons between the last 30 days and the previous 30 days
- Returns pre-aggregated data in a single response

### Reasoning

**Why API Route over Client-Side:**
- **Performance**: Reduces data transfer - only aggregated results are sent, not all raw post data
- **Consistency**: Ensures all clients see the same calculated values
- **Security**: Keeps business logic server-side, preventing manipulation; ensures RLS policies are applied before aggregation
- **Data Privacy**: Raw post data never leaves the server; only aggregated metrics are exposed
- **Caching**: Server responses can be cached more effectively (via Next.js caching or CDN)
- **Scalability**: As data grows, aggregating on the server prevents client-side performance issues

**Why API Route over Database Functions/Views:**
- **Flexibility**: Easier to modify calculation logic without database migrations
- **Type Safety**: TypeScript provides better type checking and IDE support
- **Testing**: Easier to unit test JavaScript/TypeScript functions
- **Complexity**: Avoids maintaining database-specific functions that may be harder to version control

**Trade-offs:**
- **Latency**: Adds a network round-trip, but this is minimal compared to the benefits
- **Server Load**: Aggregation happens on each request (mitigated by TanStack Query caching)
- **Real-time**: Data is not real-time, but 2-minute stale time is acceptable for analytics

**Alternative Considered:**
- **Hybrid Approach**: Could cache aggregated results in Redis or a materialized view, but adds infrastructure complexity without significant benefit for current scale

---

## 2. State Management: Zustand vs. TanStack Query vs. URL State

**Decision: Hybrid approach with clear separation of concerns**

### State Management Map

| State | Location | Reasoning |
|-------|----------|-----------|
| **Current platform filter** (All / Instagram / TikTok) | Zustand (`uiStore`) | UI preference, not shareable, doesn't need persistence |
| **Current sort column and direction** | Zustand (`uiStore`) | UI preference, ephemeral, changes frequently |
| **Selected post** (for modal) | Zustand (`uiStore`) | Component state, temporary, doesn't need persistence |
| **Chart view type** (line / area) | Zustand (`uiStore`) | UI preference, user-specific, ephemeral |
| **Posts data from Supabase** | TanStack Query | Server state, needs caching, refetching, error handling |
| **Daily metrics data from Supabase** | TanStack Query | Server state, needs caching, refetching, error handling |
| **Analytics summary data** | TanStack Query | Server state, needs caching, refetching, error handling |
| **User authentication state** | Zustand (`authStore`) | Client-side auth state, needs to persist across navigation |
| **Sidebar open/closed** | Zustand (`uiStore`) | UI state, ephemeral |

### Detailed Reasoning

#### Zustand (`uiStore`) - UI State
**Used for:**
- Filters (platform, media type, date range)
- Sorting preferences
- Modal state (selected post)
- Chart view type
- Sidebar state

**Why Zustand:**
- **Performance**: Lightweight, no unnecessary re-renders
- **Simplicity**: Easy to use, minimal boilerplate
- **Persistence**: Can easily add persistence if needed (e.g., localStorage)
- **Type Safety**: Full TypeScript support
- **Not Shareable**: These are UI preferences that don't need to be in URL

#### TanStack Query - Server State
**Used for:**
- Posts data
- Daily metrics
- Analytics summary

**Why TanStack Query:**
- **Caching**: Automatic caching with configurable stale times
- **Refetching**: Automatic background refetching and invalidation
- **Error Handling**: Built-in error states and retry logic
- **Loading States**: Automatic loading state management
- **Deduplication**: Prevents duplicate requests
- **Optimistic Updates**: Can be extended for mutations

**Configuration:**
- Posts: 1-minute stale time (frequently changing)
- Daily Metrics: 5-minute stale time (less frequently changing)
- Analytics Summary: 2-minute stale time (moderate change frequency)

#### URL State - Not Used
**Why not URL state:**
- **Complexity**: Would require URL parsing/syncing logic
- **Not Needed**: Filters are not shareable links in this use case
- **UX**: Users don't need to bookmark filtered views
- **Trade-off**: If shareable filtered views become a requirement, we can migrate filters to URL state

### Future Considerations

If the product requires:
- **Shareable filtered views**: Move filters to URL query parameters
- **Deep linking to specific posts**: Add post ID to URL
- **Persistent user preferences**: Add localStorage persistence to Zustand stores

---

## 3. Empty State Handling Strategy

**Decision: Graceful degradation with informative empty states**

### Implementation Strategy

#### API Routes
All API routes return empty arrays or zero values when no data exists:
- `/api/posts`: Returns `[]` when user has no posts
- `/api/daily-metrics`: Returns `[]` when user has no metrics
- `/api/analytics/summary`: Returns zero values for all metrics when no posts exist

**Key Design:**
- Never return `null` or `undefined` for arrays - always return `[]`
- Numeric values default to `0` (not `null`)
- Engagement rate shows `"N/A"` when there are no posts (can't calculate rate without data)
- Trend percentage shows `"N/A"` when there's no previous period to compare

#### Component Empty States

**1. Analytics Summary Cards**
- Shows `0` for total engagement when no posts
- Shows `"N/A"` for average engagement rate (no posts = no rate to calculate)
- Shows `"No posts"` for top performing post
- Shows `"N/A"` for trend indicator when no data exists

**2. Posts Table**
- Empty state: "No posts found" with helpful message
- Filtered empty state: "No results found" with suggestion to adjust filters
- Distinguishes between "no data" vs "no results after filtering"

**3. Engagement Chart**
- Checks `chartData.length === 0` before rendering
- Shows "No data available" message instead of crashing
- Handles edge case where scales would fail with empty data

**4. Post Detail Modal**
- Only renders when `selectedPost !== null`
- Handles missing optional fields gracefully (shows "N/A" or defaults)

### Edge Cases Handled

#### Data Edge Cases

1. **New user with zero posts:**
   - All summary cards show appropriate empty states
   - Posts table shows empty state
   - Chart shows empty state
   - No crashes or errors

2. **User with posts but no engagement:**
   - Total engagement shows `0` (not `null`)
   - Engagement rate calculated as `0%` (not `null`)
   - Chart handles zero values correctly

3. **User with posts but no daily metrics:**
   - Chart shows empty state
   - Doesn't crash on empty data array

4. **Division by zero:**
   - Engagement rate calculation checks for zero reach before dividing
   - Returns `null` which displays as "N/A" in UI

5. **Missing optional fields:**
   - All optional fields (caption, thumbnail, etc.) have fallbacks
   - Never crashes on `null` or `undefined` values

#### Security Edge Cases

6. **Unauthenticated access to protected routes:**
   - API routes return `401 Unauthorized` with generic error message
   - Page routes redirect to `/auth/login` via middleware
   - No sensitive information leaked in error messages

7. **Invalid or expired JWT tokens:**
   - Middleware detects invalid tokens and redirects to login
   - API routes return `401 Unauthorized`
   - User must re-authenticate

8. **Malformed query parameters:**
   - All parameters validated with allowlists
   - Invalid values return `null` or default values
   - Prevents SQL injection and parameter manipulation

9. **Very long input values:**
   - Password length limited to 128 characters (prevents DoS)
   - Email trimmed and validated
   - Query parameters sanitized

10. **Cross-user data access attempts:**
    - RLS policies prevent access even if `user_id` is manipulated
    - Application-level filtering provides defense-in-depth
    - Even with compromised application logic, RLS protects data

11. **Empty or missing environment variables:**
    - Validated at startup via `validateEnvironmentVariables()`
    - Application fails fast with descriptive error
    - Prevents runtime errors from missing configuration

### Design Principles

1. **Never show errors for empty data** - Empty data is a valid state, not an error
2. **Provide context** - Empty states explain why there's no data
3. **Suggest actions** - When appropriate, suggest what users can do (e.g., "adjust filters")
4. **Consistent messaging** - Use consistent language across empty states
5. **Graceful degradation** - App remains functional even with no data

---

## 4. Trend Percentage Calculation

**Decision: Last 30 days vs. Previous 30 days**

The trend indicator compares engagement metrics from the **last 30 days** against the **previous 30 days** (days 31-60).

### Implementation

```typescript
// Last 30 days: today - 30 days ago
const last30DaysStart = new Date(now);
last30DaysStart.setDate(last30DaysStart.getDate() - 30);

// Previous 30 days: 31-60 days ago
const previous30DaysStart = new Date(last30DaysStart);
previous30DaysStart.setDate(previous30DaysStart.getDate() - 30);
```

### Reasoning

**Why 30-day periods:**
- **Data Availability**: Most users will have data spanning at least 60 days for meaningful comparison
- **Meaningful Comparison**: 30 days provides enough data points to smooth out daily fluctuations
- **Industry Standard**: Monthly comparisons are common in analytics dashboards
- **Balanced**: Not too short (7 days = too noisy) nor too long (monthly = too slow to show trends)

**Why not 7 days:**
- Too short - daily fluctuations can skew results
- Less meaningful for strategic decision-making
- Requires more frequent data collection

**Why not monthly (calendar month):**
- Calendar months have different lengths (28-31 days)
- Comparison periods would be inconsistent
- More complex date calculations
- Less intuitive for users

**Why not rolling windows:**
- Fixed 30-day periods are easier to understand
- Clear "previous period" definition
- Predictable comparison periods

### Calculation Formula

```typescript
const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};
```

**Edge Cases:**
- If previous period is 0 and current > 0: Returns `100%` (infinite growth)
- If previous period is 0 and current is 0: Returns `0%` (no change)
- If previous period > 0: Standard percentage change formula

### UX Considerations

- **Clarity**: Description says "vs. previous period" - users understand it's comparing time periods
- **Display**: Shows `+X%` for increases, `-X%` for decreases
- **Visual**: Color-coded (green for positive, red for negative) with trend icons
- **Context**: Tooltip/description explains the comparison period

### Alternative Approaches Considered

1. **Last 7 days vs. Previous 7 days**
   - Rejected: Too short, too noisy
   
2. **This month vs. Last month (calendar)**
   - Rejected: Inconsistent period lengths, more complex

3. **Rolling 30-day average**
   - Rejected: Less intuitive, harder to explain

4. **Year-over-year**
   - Rejected: Requires 1 year of data, not practical for new users

---

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **State Management**: 
  - Zustand (UI state)
  - TanStack Query (Server state)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Visx (D3-based)
- **Authentication**: Supabase Auth

## Project Structure

```
app/
  api/              # API routes
  auth/             # Authentication pages
  dashboard/        # Dashboard page
components/
  analytics/        # Analytics components
  charts/           # Chart components
  dashboard/        # Dashboard layout components
  posts/            # Post-related components
  ui/               # Reusable UI components
lib/
  hooks/            # React Query hooks
  stores/           # Zustand stores
  supabase/         # Supabase client configuration
  utils/            # Utility functions
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
