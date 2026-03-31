'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/lib/wishlist-context';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const { items, loading, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-3">
          Sign In to View Wishlist
        </h2>
        <p className="text-gray-500 mb-8">Save your favourite items for later.</p>
        <Link
          href="/auth/login?redirect=/wishlist"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 skeleton rounded w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-gray-100">
              <div className="aspect-[3/4] skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-4 skeleton rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-3">
          Your Wishlist is Empty
        </h2>
        <p className="text-gray-500 mb-8">Save products you love and shop them later.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Discover Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-primary uppercase tracking-wider">
          Wishlist ({items.length})
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => {
          const p = item.product;
          return (
            <div
              key={item.id}
              className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-300"
            >
              {/* Image */}
              <Link href={`/products/${p.slug}`}>
                <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                  {p.primary_image_url ? (
                    <Image
                      src={p.primary_image_url}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Remove from wishlist */}
                  <button
                    onClick={() => toggleWishlist(p.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </Link>

              {/* Info */}
              <div className="p-3">
                <Link href={`/products/${p.slug}`}>
                  <h3 className="text-sm font-semibold text-primary line-clamp-2 hover:text-accent transition-colors">
                    {p.name}
                  </h3>
                </Link>
                <p className="text-base font-black text-primary mt-1">
                  ₹{Math.floor(p.min_price / 100).toLocaleString('en-IN')}
                </p>

                {/* Move to Cart */}
                <button
                  onClick={() => {
                    // Navigate to PDP since we need size selection
                    router.push(`/products/${p.slug}`);
                  }}
                  className="mt-2 w-full py-2 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Select Size & Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
