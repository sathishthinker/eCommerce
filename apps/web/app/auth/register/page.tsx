'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      error('Password must be at least 8 characters');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      success('Account created! Welcome to Threadco.');
      router.replace('/');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const passwordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { strength: score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { strength: score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { strength: score, label: 'Good', color: 'bg-blue-500' };
    return { strength: score, label: 'Strong', color: 'bg-green-500' };
  };

  const pwdStrength = passwordStrength(form.password);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4" stroke="#f59e0b" strokeWidth="2.5" />
            </svg>
            <span className="text-2xl font-black tracking-widest text-primary uppercase">THREADCO</span>
          </Link>
          <h1 className="text-2xl font-black text-primary uppercase tracking-wider mt-5 mb-1">
            Create Account
          </h1>
          <p className="text-gray-500 text-sm">Join Threadco today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Full Name *
            </label>
            <input
              {...field('name')}
              required
              autoComplete="name"
              placeholder="John Doe"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              {...field('email')}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Mobile Number *
            </label>
            <div className="flex">
              <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm font-medium text-gray-600">
                +91
              </div>
              <input
                type="tel"
                {...field('phone')}
                required
                maxLength={10}
                placeholder="9876543210"
                autoComplete="tel"
                className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...field('password')}
                required
                autoComplete="new-password"
                placeholder="Min 8 characters"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${pwdStrength.color}`}
                    style={{ width: `${(pwdStrength.strength / 4) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  pwdStrength.strength <= 1 ? 'text-red-500' :
                  pwdStrength.strength === 2 ? 'text-yellow-500' :
                  pwdStrength.strength === 3 ? 'text-blue-500' : 'text-green-500'
                }`}>
                  {pwdStrength.label}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                {...field('confirmPassword')}
                required
                autoComplete="new-password"
                placeholder="Re-enter password"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors pr-12 ${
                  form.confirmPassword && form.confirmPassword !== form.password
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                {showConfirm ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {form.confirmPassword && form.confirmPassword !== form.password && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-accent font-bold hover:text-amber-600 transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
