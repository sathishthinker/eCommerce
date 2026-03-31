'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { products as productsApi } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import type { Product, Category } from '@/types';

// ─── Hero Section ──────────────────────────────────────────────────────────
function HeroBanner() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-primary">
      {/* Abstract gradient background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, #f59e0b33 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #ffffff11 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, #f59e0b22 0%, transparent 50%)',
        }}
      />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 text-accent text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-white/20">
          <span className="w-1.5 h-1.5 bg-accent rounded-full inline-block" />
          New Collection 2024
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none mb-6">
          WEAR LESS.
          <br />
          <span className="text-accent">SAY MORE.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Premium men&apos;s t-shirts crafted for the modern man.
          <br className="hidden sm:block" />
          100% cotton. Minimal design. Maximum impact.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-amber-400 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30"
          >
            Shop Now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/products?sort=newest"
            className="inline-flex items-center gap-2 bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:border-white hover:bg-white/10 transition-all duration-300"
          >
            New Arrivals
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-8 mt-16 text-gray-500 text-xs font-medium uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Free Delivery ₹500+
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            100% Cotton
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Easy Returns
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Category Grid ─────────────────────────────────────────────────────────
function CategoryGrid({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-primary uppercase tracking-wider">
            Shop by Category
          </h2>
          <p className="text-gray-500 mt-2 text-sm">Find your perfect fit</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-200 hover:shadow-xl transition-all duration-300"
            >
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-lg leading-tight">{cat.name}</h3>
                <p className="text-gray-300 text-xs mt-1 flex items-center gap-1">
                  Shop now
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── USP Banner ────────────────────────────────────────────────────────────
function USPBanner() {
  const usps = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Free Delivery',
      desc: 'On all orders above ₹500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: '100% Cotton',
      desc: 'Breathable & premium quality',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: 'Easy Returns',
      desc: '7-day hassle-free returns',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Secure Payments',
      desc: 'Razorpay protected checkout',
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {usps.map((usp) => (
            <div
              key={usp.title}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left"
            >
              <div className="text-accent flex-shrink-0">{usp.icon}</div>
              <div>
                <h3 className="font-bold text-primary text-sm">{usp.title}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{usp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product Skeleton ──────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-100">
      <div className="aspect-[3/4] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/4" />
        <div className="h-4 skeleton rounded w-1/3" />
      </div>
    </div>
  );
}

// ─── Newsletter ─────────────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-primary">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 text-accent text-xs font-bold tracking-widest uppercase mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Newsletter
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
          Stay in the Loop
        </h2>
        <p className="text-gray-400 mb-8">
          Get exclusive drops, style tips, and 10% off your first order.
        </p>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-accent text-lg font-semibold">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            You&apos;re subscribed! Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
            />
            <button
              type="submit"
              className="px-7 py-3.5 bg-accent text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-amber-400 transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── Homepage ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);

  useEffect(() => {
    productsApi.getCategories().then((data) => {
      setCategories(data.categories || []);
    }).catch(() => setCategories([]));

    productsApi
      .getProducts({ is_featured: true, per_page: 8 })
      .then((data) => {
        setFeaturedProducts(data.items || []);
      })
      .catch(() => setFeaturedProducts([]))
      .finally(() => setLoadingFeatured(false));

    productsApi
      .getProducts({ sort: 'newest', per_page: 8 })
      .then((data) => {
        setNewArrivals(data.items || []);
      })
      .catch(() => setNewArrivals([]))
      .finally(() => setLoadingNew(false));
  }, []);

  return (
    <div>
      <HeroBanner />
      <USPBanner />

      {/* Category Grid */}
      <CategoryGrid categories={categories} />

      {/* Featured Products */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-primary uppercase tracking-wider">
                Featured Picks
              </h2>
              <p className="text-gray-500 mt-1 text-sm">Handpicked for you</p>
            </div>
            <Link
              href="/products?is_featured=true"
              className="text-sm font-bold text-accent hover:text-amber-600 uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {loadingFeatured
              ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
              : featuredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    slug={p.slug}
                    min_price={p.min_price}
                    primary_image_url={p.primary_image_url}
                    fit_type={p.fit_type}
                    is_featured={p.is_featured}
                  />
                ))}
          </div>

          {!loadingFeatured && featuredProducts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              No featured products available right now.
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-primary uppercase tracking-wider">
                New Arrivals
              </h2>
              <p className="text-gray-500 mt-1 text-sm">Just dropped</p>
            </div>
            <Link
              href="/products?sort=newest"
              className="text-sm font-bold text-accent hover:text-amber-600 uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Horizontal scroll on mobile */}
          <div className="md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6 flex gap-4 overflow-x-auto pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
            {loadingNew
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[240px] md:min-w-0 snap-start">
                    <ProductSkeleton />
                  </div>
                ))
              : newArrivals.slice(0, 8).map((p) => (
                  <div key={p.id} className="min-w-[240px] md:min-w-0 snap-start">
                    <ProductCard
                      id={p.id}
                      name={p.name}
                      slug={p.slug}
                      min_price={p.min_price}
                      primary_image_url={p.primary_image_url}
                      fit_type={p.fit_type}
                      is_featured={p.is_featured}
                    />
                  </div>
                ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
}
