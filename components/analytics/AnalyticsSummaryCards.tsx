'use client';

import { motion } from 'framer-motion';
import { Animated } from '@/components/ui/animated';
import { useAnalyticsSummary } from '@/lib/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Heart, MessageSquare, Trophy, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnalyticsSummaryCards() {
  const { data: summary, isLoading, error } = useAnalyticsSummary();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            {error instanceof Error ? error.message : 'Failed to load analytics'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle empty state: user has no posts at all
  // Check topPost since it's calculated from ALL posts, not just recent ones
  const hasNoData = summary.topPost === null;

  // Format top post caption for display (truncate if too long)
  const formatTopPostCaption = (caption: string) => {
    if (!caption || caption.trim() === '') return 'No caption';
    if (caption.length <= 50) return caption;
    return caption.substring(0, 47) + '...';
  };

  const cards = [
    {
      title: 'Total Engagement',
      value: hasNoData ? '0' : summary.totalEngagements.toLocaleString(),
      description: 'Sum of all interactions',
      change: undefined, // No trend on this card itself
      icon: Heart,
    },
    {
      title: 'Average Engagement Rate',
      value: hasNoData ? 'N/A' : `${summary.averageEngagementRate}%`,
      description: 'Percentage across all posts',
      change: undefined, // No trend on this card itself
      icon: MessageSquare,
    },
    {
      title: 'Top Performing Post',
      value: summary.topPost 
        ? formatTopPostCaption(summary.topPost.caption)
        : 'No posts',
      description: summary.topPost 
        ? `${summary.topPost.engagement.toLocaleString()} engagements`
        : 'No data available',
      change: undefined,
      icon: Trophy,
      isTopPost: true,
    },
    {
      title: 'Trend Indicator',
      value: hasNoData 
        ? 'N/A' 
        : `${summary.changes.totalEngagements >= 0 ? '+' : ''}${summary.changes.totalEngagements}%`,
      description: 'vs. previous period',
      change: hasNoData ? undefined : summary.changes.totalEngagements,
      icon: TrendingUp,
      showTrendInline: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isTopPost = (card as any).isTopPost;
        const showTrendInline = (card as any).showTrendInline;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: index * 0.1,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="h-full transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </CardHeader>
              <CardContent className="px-6">
                {isTopPost ? (
                  <>
                    <Animated type="fadeIn" delay={index * 0.1 + 0.3}>
                      <div className="text-base font-semibold leading-tight mb-2">
                        {card.value}
                      </div>
                    </Animated>
                    <CardDescription className="text-xs">
                      {card.description}
                    </CardDescription>
                  </>
                ) : showTrendInline ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Animated type="scale" delay={index * 0.1 + 0.3}>
                        <div className="text-2xl font-bold">{card.value}</div>
                      </Animated>
                      {card.change !== undefined && (
                        <motion.div
                          className={cn(
                            'flex items-center',
                            card.change >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.4, type: "spring" }}
                        >
                          {card.change >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </motion.div>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {card.description}
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <Animated type="scale" delay={index * 0.1 + 0.3}>
                      <div className="text-2xl font-bold">{card.value}</div>
                    </Animated>
                    <CardDescription className="text-xs mt-1">
                      {card.description}
                    </CardDescription>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

