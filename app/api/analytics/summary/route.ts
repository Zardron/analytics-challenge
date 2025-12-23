import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth, sanitizeError } from '@/lib/utils/validation';

/**
 * Next.js API Route: /api/analytics/summary
 * 
 * Validates authenticated user via Supabase session and aggregates engagement metrics server-side.
 * Returns computed summary data including total engagement, averages, and trends.
 * 
 * Features:
 * - Authentication validation via withAuth wrapper
 * - Server-side aggregation of engagement metrics
 * - Computed summary data (totals, averages, trends, percentage changes)
 * - Graceful error handling with appropriate HTTP status codes
 * - Defense-in-depth: RLS policies + application-level user filtering
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const supabase = await createClient();

    // Fetch posts - RLS policies ensure users can only see their own posts
    // Defense-in-depth: Also explicitly filter by user_id at application level
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id);
      // RLS policy also enforces auth.uid() = user_id at database level

    if (postsError) {
      // Log detailed error server-side only
      console.error('Posts fetch error:', postsError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch analytics data' 
        },
        { status: 500 }
      );
    }

    // Handle case where user has no posts
    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalPosts: 0,
          totalViews: 0,
          totalEngagements: 0,
          averageEngagementRate: 0,
          totalReach: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          topPost: null,
          changes: {
            totalPosts: 0,
            totalViews: 0,
            totalEngagements: 0,
            averageEngagementRate: 0,
            totalReach: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
          },
        },
      });
    }

    // Calculate date boundaries for comparison (last 30 days vs previous 30 days)
    const now = new Date();
    const last30DaysStart = new Date(now);
    last30DaysStart.setDate(last30DaysStart.getDate() - 30);
    const previous30DaysStart = new Date(last30DaysStart);
    previous30DaysStart.setDate(previous30DaysStart.getDate() - 30);

    // Filter posts for last 30 days
    const recentPosts = posts?.filter(post => {
      const postDate = new Date(post.posted_at);
      return postDate >= last30DaysStart;
    }) || [];

    // Filter posts for previous 30 days
    const previousPosts = posts?.filter(post => {
      const postDate = new Date(post.posted_at);
      return postDate >= previous30DaysStart && postDate < last30DaysStart;
    }) || [];

    // Helper function to calculate metrics for a set of posts
    const calculateMetrics = (postList: typeof posts) => {
      const totalPosts = postList?.length || 0;
      const totalViews = postList?.reduce((sum, post) => sum + (post.impressions || 0), 0) || 0;
      const totalLikes = postList?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;
      const totalComments = postList?.reduce((sum, post) => sum + (post.comments || 0), 0) || 0;
      const totalShares = postList?.reduce((sum, post) => sum + (post.shares || 0), 0) || 0;
      const totalReach = postList?.reduce((sum, post) => sum + (post.reach || 0), 0) || 0;
      const totalEngagements = totalLikes + totalComments + totalShares + (postList?.reduce((sum, post) => sum + (post.saves || 0), 0) || 0);
      const postsWithEngagementRate = postList?.filter(post => post.engagement_rate !== null) || [];
      const averageEngagementRate = postsWithEngagementRate.length > 0
        ? postsWithEngagementRate.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / postsWithEngagementRate.length
        : 0;

      return {
        totalPosts,
        totalViews,
        totalEngagements,
        averageEngagementRate,
        totalReach,
        totalLikes,
        totalComments,
        totalShares,
      };
    };

    // Calculate metrics for both periods (for trend comparison)
    const recentMetrics = calculateMetrics(recentPosts);
    const previousMetrics = calculateMetrics(previousPosts);

    // Calculate metrics for ALL posts (for Total Engagement and Average Engagement Rate)
    const allPostsMetrics = calculateMetrics(posts);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    // Find top performing post (highest engagement)
    const findTopPost = (postList: typeof posts) => {
      if (!postList || postList.length === 0) return null;
      
      let topPost = postList[0];
      let maxEngagement = (topPost.likes || 0) + (topPost.comments || 0) + (topPost.shares || 0) + (topPost.saves || 0);
      
      for (const post of postList) {
        const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0) + (post.saves || 0);
        if (engagement > maxEngagement) {
          maxEngagement = engagement;
          topPost = post;
        }
      }
      
      return {
        id: topPost.id,
        caption: topPost.caption || 'No caption',
        engagement: maxEngagement,
        postedAt: topPost.posted_at,
      };
    };

    // Find top performing post from all posts (highest engagement)
    const topPost = findTopPost(posts);

    // Calculate trend indicator: percentage change for Total Engagement vs previous period
    const trendIndicator = calculateChange(recentMetrics.totalEngagements, previousMetrics.totalEngagements);

    return NextResponse.json({
      success: true,
      data: {
        totalPosts: recentMetrics.totalPosts,
        totalViews: recentMetrics.totalViews,
        // Total Engagement: Sum of all interactions (from ALL posts)
        totalEngagements: allPostsMetrics.totalEngagements,
        // Average Engagement Rate: Percentage across all posts (from ALL posts)
        averageEngagementRate: Number(allPostsMetrics.averageEngagementRate.toFixed(2)),
        totalReach: recentMetrics.totalReach,
        totalLikes: recentMetrics.totalLikes,
        totalComments: recentMetrics.totalComments,
        totalShares: recentMetrics.totalShares,
        topPost,
        changes: {
          totalPosts: calculateChange(recentMetrics.totalPosts, previousMetrics.totalPosts),
          totalViews: calculateChange(recentMetrics.totalViews, previousMetrics.totalViews),
          totalEngagements: trendIndicator,
          averageEngagementRate: calculateChange(recentMetrics.averageEngagementRate, previousMetrics.averageEngagementRate),
          totalReach: calculateChange(recentMetrics.totalReach, previousMetrics.totalReach),
          totalLikes: calculateChange(recentMetrics.totalLikes, previousMetrics.totalLikes),
          totalComments: calculateChange(recentMetrics.totalComments, previousMetrics.totalComments),
          totalShares: calculateChange(recentMetrics.totalShares, previousMetrics.totalShares),
        },
      },
    });
  } catch (error) {
    // Log detailed error server-side only
    console.error('Analytics summary error:', error);
    const errorMessage = sanitizeError(error, 'Failed to fetch analytics summary');
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
});

