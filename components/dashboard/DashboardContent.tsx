'use client';

import { AnalyticsSummaryCards } from '@/components/analytics';
import { PostsTableWithFilters, PostDetailModal } from '@/components/posts';
import { EngagementChart } from '@/components/charts';

export function DashboardContent() {
  return (
    <div className="space-y-8">
      <div id="analytics-overview" className="scroll-mt-8">
        <h2 className="text-2xl font-semibold mb-4">Analytics Overview</h2>
        <AnalyticsSummaryCards />
      </div>
      
      <div id="engagement-trends" className="scroll-mt-8">
        <h2 className="text-2xl font-semibold mb-4">Engagement Trends</h2>
        <EngagementChart days={30} />
      </div>
      
      <div id="posts" className="scroll-mt-8">
        <h2 className="text-2xl font-semibold mb-4">Posts</h2>
        <PostsTableWithFilters />
      </div>

      <PostDetailModal />
    </div>
  );
}

