import { create } from 'zustand';
import type { Tables } from '@/lib/database.types';

type Platform = 'instagram' | 'tiktok' | 'all';
type MediaType = 'image' | 'video' | 'carousel' | 'all';
type SortField = 'posted_at' | 'likes' | 'engagement_rate' | 'reach';
type SortOrder = 'asc' | 'desc';
type ChartViewType = 'line' | 'area';
type Post = Tables<'posts'>;

interface UIState {
  // Filters
  platformFilter: Platform;
  mediaTypeFilter: MediaType;
  dateRange: { start: Date | null; end: Date | null };
  
  // Sorting
  sortField: SortField;
  sortOrder: SortOrder;
  
  // Modal state
  selectedPost: Post | null;
  
  // Chart view state
  chartViewType: ChartViewType;
  
  // Sidebar state
  sidebarOpen: boolean;
  
  // Actions
  setPlatformFilter: (platform: Platform) => void;
  setMediaTypeFilter: (mediaType: MediaType) => void;
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  resetFilters: () => void;
  setSelectedPost: (post: Post | null) => void;
  setChartViewType: (type: ChartViewType) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const initialState = {
  platformFilter: 'all' as Platform,
  mediaTypeFilter: 'all' as MediaType,
  dateRange: { start: null, end: null },
  sortField: 'posted_at' as SortField,
  sortOrder: 'desc' as SortOrder,
  selectedPost: null as Post | null,
  chartViewType: 'line' as ChartViewType,
  sidebarOpen: false,
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,
  setPlatformFilter: (platform) => set({ platformFilter: platform }),
  setMediaTypeFilter: (mediaType) => set({ mediaTypeFilter: mediaType }),
  setDateRange: (range) => set({ dateRange: range }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  resetFilters: () => set(initialState),
  setSelectedPost: (post) => set({ selectedPost: post }),
  setChartViewType: (type) => set({ chartViewType: type }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

