/**
 * Query keys factory pattern for TanStack Query
 * Centralizes all query keys to ensure consistency and type safety
 */

export const queryKeys = {
  // Posts queries
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters?: {
      platform?: string;
      mediaType?: string;
      startDate?: string;
      endDate?: string;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
    }) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },

  // Analytics queries
  analytics: {
    all: ['analytics'] as const,
    summary: () => [...queryKeys.analytics.all, 'summary'] as const,
  },

  // Daily metrics queries
  dailyMetrics: {
    all: ['daily-metrics'] as const,
    lists: () => [...queryKeys.dailyMetrics.all, 'list'] as const,
    list: (filters?: {
      startDate?: string;
      endDate?: string;
    }) => [...queryKeys.dailyMetrics.lists(), filters] as const,
  },
} as const;

