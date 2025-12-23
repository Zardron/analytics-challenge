'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BarChart3, FileText, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard#analytics-overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Analytics',
    href: '/dashboard#engagement-trends',
    icon: BarChart3,
  },
  {
    title: 'Posts',
    href: '/dashboard#posts',
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    // Set initial hash from URL
    setActiveHash(window.location.hash.slice(1));
    
    // Listen for hash changes
    const handleHashChange = () => {
      setActiveHash(window.location.hash.slice(1));
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    setSidebarOpen(false); // Close sidebar on logout
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  // Close sidebar when clicking on a link on mobile
  const handleLinkClick = () => {
    // Use media query to check if mobile (less than lg breakpoint)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <h2 className="text-xl font-semibold text-sidebar-foreground">Analytics Challenge</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Extract the hash from href for active state checking
          const hash = item.href.split('#')[1] || '';
          const isActive = pathname === '/dashboard' && (
            (item.title === 'Dashboard' && (!activeHash || activeHash === 'analytics-overview')) ||
            (hash && activeHash === hash)
          );
          
          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={(e) => {
                // Handle smooth scroll for hash links on the same page
                if (pathname === '/dashboard' && item.href.includes('#')) {
                  e.preventDefault();
                  const targetId = item.href.split('#')[1];
                  const element = document.getElementById(targetId);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                  // Update URL without reloading
                  window.history.pushState(null, '', item.href);
                }
                handleLinkClick();
              }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-sidebar-border p-4">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="h-4 w-4" />
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
    </>
  );
}

