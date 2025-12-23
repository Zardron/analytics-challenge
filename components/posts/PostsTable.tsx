'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Tables } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores';

type Post = Tables<'posts'>;

interface PostsTableProps {
  data: Post[];
  isLoading?: boolean;
  columns?: ColumnDef<Post>[];
}

// Helper function to truncate text
function truncateText(text: string | null, maxLength: number = 50): string {
  if (!text) return 'No caption';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Sortable header component
function SortableHeader({
  column,
  children,
}: {
  column: any;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="h-8 px-2 -ml-2 hover:bg-transparent"
    >
      {children}
      {column.getIsSorted() === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}

const defaultColumns: ColumnDef<Post>[] = [
  {
    accessorKey: 'thumbnail_url',
    header: 'Thumbnail',
    cell: ({ row }) => {
      const url = row.getValue('thumbnail_url') as string | null;
      return (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0">
          {url ? (
            <img
              src={url}
              alt="Post thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: 'caption',
    header: 'Caption',
    cell: ({ row }) => {
      const caption = row.getValue('caption') as string | null;
      const truncated = truncateText(caption, 60);
      return (
        <div className="max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
          <p className="text-sm text-muted-foreground line-clamp-2 wrap-break-word">
            {truncated}
          </p>
        </div>
      );
    },
    enableSorting: false,
    size: 250,
  },
  {
    accessorKey: 'platform',
    header: ({ column }) => <SortableHeader column={column}>Platform</SortableHeader>,
    cell: ({ row }) => {
      const platform = row.getValue('platform') as string;
      return (
        <span className="capitalize font-medium text-sm">
          {platform === 'tiktok' ? 'TikTok' : platform}
        </span>
      );
    },
    filterFn: (row, id, value) => {
      if (value === 'all') return true;
      return row.getValue(id) === value;
    },
    size: 100,
  },
  {
    accessorKey: 'likes',
    header: ({ column }) => <SortableHeader column={column}>Likes</SortableHeader>,
    cell: ({ row }) => {
      const likes = row.getValue('likes') as number | null;
      return (
        <span className="font-medium text-sm">
          {likes?.toLocaleString() ?? 0}
        </span>
      );
    },
    size: 100,
  },
  {
    accessorKey: 'comments',
    header: ({ column }) => <SortableHeader column={column}>Comments</SortableHeader>,
    cell: ({ row }) => {
      const comments = row.getValue('comments') as number | null;
      return (
        <span className="text-sm">
          {comments?.toLocaleString() ?? 0}
        </span>
      );
    },
    size: 100,
  },
  {
    accessorKey: 'shares',
    header: ({ column }) => <SortableHeader column={column}>Shares</SortableHeader>,
    cell: ({ row }) => {
      const shares = row.getValue('shares') as number | null;
      return (
        <span className="text-sm">
          {shares?.toLocaleString() ?? 0}
        </span>
      );
    },
    size: 100,
  },
  {
    accessorKey: 'engagement_rate',
    header: ({ column }) => (
      <SortableHeader column={column}>Engagement Rate</SortableHeader>
    ),
    cell: ({ row }) => {
      const rate = row.getValue('engagement_rate') as number | null;
      return (
        <span
          className={cn(
            'font-medium text-sm',
            rate && rate > 5
              ? 'text-green-600 dark:text-green-400'
              : '',
            rate && rate < 2 ? 'text-red-600 dark:text-red-400' : ''
          )}
        >
          {rate ? `${rate.toFixed(2)}%` : 'N/A'}
        </span>
      );
    },
    size: 130,
  },
  {
    accessorKey: 'posted_at',
    header: ({ column }) => <SortableHeader column={column}>Posted Date</SortableHeader>,
    cell: ({ row }) => {
      const date = row.getValue('posted_at') as string;
      return (
        <span className="text-sm whitespace-nowrap">
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      );
    },
    size: 120,
  },
];

export function PostsTable({
  data,
  isLoading = false,
  columns = defaultColumns,
}: PostsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'posted_at', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { setSelectedPost, platformFilter } = useUIStore();

  // Apply platform filter to column filters
  useMemo(() => {
    if (platformFilter && platformFilter !== 'all') {
      setColumnFilters([{ id: 'platform', value: platformFilter }]);
    } else {
      setColumnFilters([]);
    }
  }, [platformFilter]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-16 bg-muted animate-pulse rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const filteredRows = table.getFilteredRowModel().rows;

  if (data.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">No posts found</p>
            <p className="text-sm text-muted-foreground">
              There are no posts to display at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredRows.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">No results found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters to see more posts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedPost(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "align-middle",
                      cell.column.id === 'caption' && "whitespace-normal",
                      cell.column.id !== 'caption' && "whitespace-nowrap"
                    )}
                    style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}

