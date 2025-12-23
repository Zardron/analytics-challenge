'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Animated, AnimatedInput, AnimatedButton } from '@/components/ui/animated';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      setSuccess(data.message || 'Account created successfully!');
      
      // If user is automatically signed in (email confirmation disabled), redirect to dashboard
      if (data.session) {
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      } else {
        // If email confirmation is required, show message and redirect to login
        setSuccess(
          'Account created! Please check your email to confirm your account, then you can sign in.'
        );
        setTimeout(() => {
          router.push('/auth/login');
        }, 4000);
      }
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
            Create your account
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

            {success && (
              <Animated
                type="slideRight"
                className="rounded-md bg-green-50 p-4 text-sm text-green-800 border border-green-200"
              >
                {success}
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
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <AnimatedInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
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
              {loading ? 'Creating account...' : 'Create account'}
            </AnimatedButton>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-black hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </Animated>
      </Animated>
    </div>
  );
}

