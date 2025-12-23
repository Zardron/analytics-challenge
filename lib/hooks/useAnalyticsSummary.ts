import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

interface AnalyticsSummary {
  totalPosts: number;
  totalViews: number;
  totalEngagements: number;
  averageEngagementRate: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  topPost: {
    id: string;
    caption: string;
    engagement: number;
    postedAt: string;
  } | null;
  changes: {
    totalPosts: number;
    totalViews: number;
    totalEngagements: number;
    averageEngagementRate: number;
    totalReach: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
}

interface AnalyticsSummaryResponse {
  success: boolean;
  data: AnalyticsSummary;
  error?: string;
}

async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await fetch('/api/analytics/summary');
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics summary');
  }

  const result: AnalyticsSummaryResponse = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch analytics summary');
  }

  return result.data;
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: queryKeys.analytics.summary(),
    queryFn: fetchAnalyticsSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

