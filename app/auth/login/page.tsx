'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/authStore';
import { Animated, AnimatedInput, AnimatedButton } from '@/components/ui/animated';
import type { User } from '@supabase/supabase-js';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Clear all React Query cache completely to prevent showing previous user's data
      // This is critical when switching between users
      queryClient.clear();
      
      // Update auth store with user data if available
      // Construct a minimal User object from the response
      if (data.user) {
        const user = {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          // Add other required User fields with defaults
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          confirmation_sent_at: undefined,
          recovery_sent_at: undefined,
          email_change_sent_at: undefined,
          new_email: undefined,
          invited_at: undefined,
          action_link: undefined,
          email_confirmed_at: data.user.created_at,
          phone_confirmed_at: undefined,
          confirmed_at: data.user.created_at,
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated',
          updated_at: new Date().toISOString(),
        } as unknown as User;
        setUser(user);
      }

      // Navigate to dashboard and refresh to ensure fresh data is fetched
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
      <Animated type="slideUp" className="w-full max-w-md space-y-8" duration={0.5}>
        <div className="text-center">
          <Animated type="scale" delay={0.2} duration={0.6} className="text-4xl font-bold text-gray-900 mb-2">
            Analytics Challenge
          </Animated>
          <Animated
            type="width"
            delay={0.4}
            duration={0.6}
            className="h-1 bg-black mx-auto rounded-full"
          >
            <span className="sr-only">Underline</span>
          </Animated>
          <Animated type="fadeInUp" delay={0.3} className="mt-6 text-3xl font-bold tracking-tight text-gray-800">
            Sign in to your account
          </Animated>
        </div>

        <Animated type="fadeIn" delay={0.4} className="mt-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Animated
                type="slideRight"
                className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-200"
              >
                {error}
              </Animated>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <AnimatedInput
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <AnimatedInput
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  disabled={loading}
                />
              </div>
            </div>

            <AnimatedButton
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full rounded-md bg-black px-4 py-2.5 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </AnimatedButton>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="font-medium text-black hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </Animated>
      </Animated>
    </div>
  );
}

