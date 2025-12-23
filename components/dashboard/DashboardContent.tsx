'use client';

import { Animated } from '@/components/ui/animated';
import { AnalyticsSummaryCards } from '@/components/analytics';
import { PostsTableWithFilters, PostDetailModal } from '@/components/posts';
import { EngagementChart } from '@/components/charts';

export function DashboardContent() {
  return (
    <div className="space-y-8">
      <Animated type="fadeInUp" delay={0.1}>
        <div id="analytics-overview" className="scroll-mt-8">
          <Animated type="slideRight" delay={0.2} className="mb-4">
            <h2 className="text-2xl font-semibold">Analytics Overview</h2>
          </Animated>
          <AnalyticsSummaryCards />
        </div>
      </Animated>
      
      <Animated type="fadeInUp" delay={0.25}>
        <div id="engagement-trends" className="scroll-mt-8">
          <Animated type="slideRight" delay={0.35} className="mb-4">
            <h2 className="text-2xl font-semibold">Engagement Trends</h2>
          </Animated>
          <EngagementChart days={30} />
        </div>
      </Animated>
      
      <Animated type="fadeInUp" delay={0.4}>
        <div id="posts" className="scroll-mt-8">
          <Animated type="slideRight" delay={0.5} className="mb-4">
            <h2 className="text-2xl font-semibold">Posts</h2>
          </Animated>
          <PostsTableWithFilters />
        </div>
      </Animated>

      <PostDetailModal />
    </div>
  );
}

