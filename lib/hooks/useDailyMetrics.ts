import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { queryKeys } from './queryKeys';

type DailyMetric = Tables<'daily_metrics'>;

interface UseDailyMetricsParams {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

interface DailyMetricsResponse {
  success: boolean;
  data: DailyMetric[];
  error?: string;
}

async function fetchDailyMetrics(params: UseDailyMetricsParams): Promise<DailyMetric[]> {
  const searchParams = new URLSearchParams();
  
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);

  const response = await fetch(`/api/daily-metrics?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch daily metrics');
  }

  const result: DailyMetricsResponse = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch daily metrics');
  }

  return result.data;
}

export function useDailyMetrics(params: UseDailyMetricsParams = {}) {
  return useQuery({
    queryKey: queryKeys.dailyMetrics.list(params),
    queryFn: () => fetchDailyMetrics(params),
    enabled: params.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

