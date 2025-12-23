'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/authStore';

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear all React Query cache to prevent showing previous user's data
      queryClient.clear();
      // Clear auth store
      clearAuth();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}

