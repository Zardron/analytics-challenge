import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { queryKeys } from './queryKeys';

type Post = Tables<'posts'>;

interface UsePostsParams {
  platform?: string;
  mediaType?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
}

interface PostsResponse {
  success: boolean;
  data: Post[];
  error?: string;
}

async function fetchPosts(params: UsePostsParams): Promise<Post[]> {
  const searchParams = new URLSearchParams();
  
  if (params.platform) searchParams.set('platform', params.platform);
  if (params.mediaType) searchParams.set('mediaType', params.mediaType);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.sortField) searchParams.set('sortField', params.sortField);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(`/api/posts?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  const result: PostsResponse = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch posts');
  }

  return result.data;
}

export function usePosts(params: UsePostsParams = {}) {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => fetchPosts(params),
    enabled: params.enabled !== false,
    staleTime: 60 * 1000, // 1 minute
  });
}

