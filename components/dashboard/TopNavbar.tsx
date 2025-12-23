'use client';

import { motion } from 'framer-motion';
import { Animated } from '@/components/ui/animated';
import { User, Menu } from 'lucide-react';
import { useUIStore } from '@/lib/stores/uiStore';
import { Button } from '@/components/ui/button';

interface TopNavbarProps {
  userEmail?: string;
}

export function TopNavbar({ userEmail }: TopNavbarProps) {
  const { toggleSidebar } = useUIStore();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Welcome Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <Animated type="slideRight" delay={0}>
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </Animated>
            <Animated type="slideRight" delay={0.1}>
              <p className="text-sm text-muted-foreground">
                Welcome back, {userEmail || 'User'}!
              </p>
            </Animated>
          </div>
        </div>

        {/* User Info */}
        <Animated type="slideLeft" delay={0.2}>
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <User className="h-4 w-4" />
            </motion.div>
            <span className="text-sm font-medium text-muted-foreground">
              {userEmail || 'User'}
            </span>
          </div>
        </Animated>
      </div>
    </nav>
  );
}

