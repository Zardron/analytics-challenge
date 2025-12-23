'use client';

import { PostsTable } from './PostsTable';
import { usePosts } from '@/lib/hooks';
import { useUIStore } from '@/lib/stores';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { useMemo } from 'react';

export function PostsTableWithFilters() {
  const {
    platformFilter,
    mediaTypeFilter,
    dateRange,
    sortField,
    sortOrder,
    setPlatformFilter,
    setMediaTypeFilter,
    resetFilters,
  } = useUIStore();

  const { data: posts, isLoading, error, refetch } = usePosts({
    platform: platformFilter !== 'all' ? platformFilter : undefined,
    mediaType: mediaTypeFilter !== 'all' ? mediaTypeFilter : undefined,
    startDate: dateRange.start ? dateRange.start.toISOString().split('T')[0] : undefined,
    endDate: dateRange.end ? dateRange.end.toISOString().split('T')[0] : undefined,
    sortField,
    sortOrder,
  });

  const hasActiveFilters = useMemo(() => {
    return (
      platformFilter !== 'all' ||
      mediaTypeFilter !== 'all' ||
      dateRange.start !== null ||
      dateRange.end !== null
    );
  }, [platformFilter, mediaTypeFilter, dateRange]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive mb-4">
              Error loading posts: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Posts</CardTitle>
            <CardDescription>
              {posts?.length || 0} {posts?.length === 1 ? 'post' : 'posts'} found
            </CardDescription>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <Select
            value={platformFilter}
            onValueChange={(value) => setPlatformFilter(value as 'instagram' | 'tiktok' | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={mediaTypeFilter}
            onValueChange={(value) => setMediaTypeFilter(value as 'image' | 'video' | 'carousel' | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Media Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <PostsTable data={posts || []} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

