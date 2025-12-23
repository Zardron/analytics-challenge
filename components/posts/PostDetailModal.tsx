'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUIStore } from '@/lib/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  MessageSquare,
  Share2,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  ExternalLink,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function PostDetailModal() {
  const { selectedPost, setSelectedPost } = useUIStore();
  const isOpen = selectedPost !== null;

  if (!selectedPost) return null;

  const engagementTotal =
    (selectedPost.likes || 0) +
    (selectedPost.comments || 0) +
    (selectedPost.shares || 0) +
    (selectedPost.saves || 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setSelectedPost(null)}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="max-w-5xl sm:max-w-5xl md:max-w-5xl lg:max-w-5xl w-full p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Header */}
              <div className="border-b px-4 py-2">
                <DialogHeader className="space-y-0">
                  <DialogTitle className="text-base leading-tight">Post Analytics</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Detailed metrics for this post
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Post Preview with Large Image */}
              <div className="px-4 py-2.5 border-b bg-muted/30">
                <div className="flex flex-col lg:flex-row gap-2.5 items-start">
                  {selectedPost.thumbnail_url && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                      className="shrink-0"
                    >
                      <img
                        src={selectedPost.thumbnail_url}
                        alt="Post thumbnail"
                        className="w-full lg:w-48 h-48 rounded-md object-cover border shadow-sm"
                      />
                    </motion.div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="capitalize text-xs px-1.5 py-0.5">
                        {selectedPost.platform}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-xs px-1.5 py-0.5">
                        {selectedPost.media_type}
                      </Badge>
                      {selectedPost.permalink && (
                        <a
                          href={selectedPost.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-1.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Platform
                        </a>
                      )}
                    </div>
                    {selectedPost.caption && (
                      <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                        {selectedPost.caption}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>
                        {new Date(selectedPost.posted_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                  {/* Left Column - Engagement Metrics */}
                  <div className="lg:col-span-2 space-y-2">
                    <div>
                      <h3 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">
                        Engagement Metrics
                      </h3>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-1.5"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: 0.25, duration: 0.2 }}
                        >
                          <Card className="border hover:border-red-200 transition-colors">
                            <CardContent className="p-2">
                              <div className="flex items-center justify-between mb-0.5">
                                <Heart className="h-3.5 w-3.5 text-red-500" />
                                <span className="text-xs font-medium text-muted-foreground">Likes</span>
                              </div>
                              <div className="text-base font-bold">
                                {(selectedPost.likes || 0).toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: 0.3, duration: 0.2 }}
                        >
                          <Card className="border hover:border-blue-200 transition-colors">
                            <CardContent className="p-2">
                              <div className="flex items-center justify-between mb-0.5">
                                <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-xs font-medium text-muted-foreground">Comments</span>
                              </div>
                              <div className="text-base font-bold">
                                {(selectedPost.comments || 0).toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: 0.35, duration: 0.2 }}
                        >
                          <Card className="border hover:border-green-200 transition-colors">
                            <CardContent className="p-2">
                              <div className="flex items-center justify-between mb-0.5">
                                <Share2 className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-xs font-medium text-muted-foreground">Shares</span>
                              </div>
                              <div className="text-base font-bold">
                                {(selectedPost.shares || 0).toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: 0.4, duration: 0.2 }}
                        >
                          <Card className="border hover:border-purple-200 transition-colors">
                            <CardContent className="p-2">
                              <div className="flex items-center justify-between mb-0.5">
                                <Save className="h-3.5 w-3.5 text-purple-500" />
                                <span className="text-xs font-medium text-muted-foreground">Saves</span>
                              </div>
                              <div className="text-base font-bold">
                                {(selectedPost.saves || 0).toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* Performance Overview */}
                    <div>
                      <h3 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">
                        Performance Overview
                      </h3>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.45, duration: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-1.5"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: 0.5, duration: 0.2 }}
                        >
                          <Card>
                            <CardContent className="p-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs font-medium">Total Engagement</span>
                              </div>
                              <div className="text-base font-bold">
                                {engagementTotal.toLocaleString()}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                                Likes + Comments + Shares + Saves
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: 0.55, duration: 0.2 }}
                        >
                          <Card>
                            <CardContent className="p-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs font-medium text-muted-foreground">Impressions</span>
                              </div>
                              <div className="text-base font-bold">
                                {(selectedPost.impressions || 0).toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: 0.6, duration: 0.2 }}
                        >
                          <Card>
                            <CardContent className="p-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs font-medium text-muted-foreground">Reach</span>
                              </div>
                              <div className="text-base font-bold">
                                {(selectedPost.reach || 0).toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Right Column - Engagement Rate */}
                  <div className="lg:col-span-1">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: 0.65, duration: 0.2 }}
                      className="h-full"
                    >
                      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 h-full">
                        <CardHeader className="pb-1 px-3 pt-3">
                          <CardTitle className="text-xs font-semibold">Engagement Rate</CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="text-center space-y-1">
                            <div className="text-2xl font-bold">
                              {selectedPost.engagement_rate
                                ? `${selectedPost.engagement_rate.toFixed(2)}%`
                                : 'N/A'}
                            </div>
                            {selectedPost.engagement_rate && (
                              <div
                                className={cn(
                                  'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
                                  selectedPost.engagement_rate >= 5
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : selectedPost.engagement_rate >= 2
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                )}
                              >
                                {selectedPost.engagement_rate >= 5
                                  ? 'Excellent'
                                  : selectedPost.engagement_rate >= 2
                                  ? 'Good'
                                  : 'Needs Improvement'}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground leading-tight">
                              (Total Engagement / Reach) × 100
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

