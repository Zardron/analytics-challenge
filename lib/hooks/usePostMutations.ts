import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { Tables } from '@/lib/database.types';

type Post = Tables<'posts'>;

interface CreatePostParams {
  platform: string;
  mediaType: string;
  caption?: string;
  thumbnailUrl?: string;
  permalink?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  impressions?: number;
  reach?: number;
  postedAt: string;
}

interface UpdatePostParams {
  id: string;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  impressions?: number;
  reach?: number;
  engagementRate?: number;
}

interface PostResponse {
  success: boolean;
  data: Post;
  error?: string;
}

async function createPost(params: CreatePostParams): Promise<Post> {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to create post');
  }

  const result: PostResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to create post');
  }

  return result.data;
}

async function updatePost(params: UpdatePostParams): Promise<Post> {
  const response = await fetch(`/api/posts/${params.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to update post');
  }

  const result: PostResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to update post');
  }

  return result.data;
}

async function deletePost(id: string): Promise<void> {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete post');
  }
}

/**
 * Mutation hook for creating a new post
 * Automatically invalidates posts list and analytics queries
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // Invalidate all posts lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      // Invalidate analytics summary as it depends on posts data
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.summary() });
      // Invalidate daily metrics as they may be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyMetrics.lists() });
    },
  });
}

/**
 * Mutation hook for updating an existing post
 * Automatically invalidates posts list, detail, and analytics queries
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePost,
    onSuccess: (data) => {
      // Invalidate all posts lists
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      // Invalidate the specific post detail
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(data.id) });
      // Invalidate analytics summary
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.summary() });
      // Invalidate daily metrics
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyMetrics.lists() });
    },
  });
}

/**
 * Mutation hook for deleting a post
 * Automatically invalidates posts list and analytics queries
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      // Invalidate all posts lists
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      // Invalidate analytics summary
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.summary() });
      // Invalidate daily metrics
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyMetrics.lists() });
    },
  });
}

