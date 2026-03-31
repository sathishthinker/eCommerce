'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/lib/wishlist-context';
import { useAuth } from '@/lib/auth-context';

interface ProductCardProps {
  id: number;
  name: string;
  slug: string;
  min_price: number;
  primary_image_url?: string;
  fit_type: string;
  is_featured: boolean;
}

export default function ProductCard({
  id,
  name,
  slug,
  min_price,
  primary_image_url,
  fit_type,
  is_featured,
}: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const router = useRouter();
  const inWishlist = isInWishlist(id);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setWishlistLoading(true);
    try {
      await toggleWishlist(id);
    } finally {
      setWishlistLoading(false);
    }
  };

  const priceDisplay = `₹${Math.floor(min_price / 100).toLocaleString('en-IN')}`;

  return (
    <div
      className="group relative bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <Link href={`/products/${slug}`} className="block">
        <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
          {primary_image_url ? (
            <Image
              src={primary_image_url}
              alt={name}
              fill
              className={`object-cover transition-transform duration-500 ${hovered ? 'scale-110' : 'scale-100'}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB/xAAbEAADAAMBAQAAAAAAAAAAAAABAgMABBEhMf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwqbN5cVnJhJOHFZbM0dDsL2cxZUWJLixVJ60DgAA//9k="
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {is_featured && (
              <span className="bg-accent text-white text-xs px-2 py-0.5 rounded font-semibold">
                FEATURED
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              inWishlist
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-white text-gray-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100'
            }`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              className="w-4 h-4"
              fill={inWishlist ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Quick add overlay */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-primary text-white text-xs font-bold tracking-widest uppercase text-center py-2.5 transition-transform duration-300 ${
              hovered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            VIEW PRODUCT
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/products/${slug}`}>
              <h3 className="text-sm font-semibold text-primary line-clamp-2 hover:text-accent transition-colors leading-snug">
                {name}
              </h3>
            </Link>
            {fit_type && (
              <span className="inline-block mt-1 text-xs text-gray-400 font-medium uppercase tracking-wider">
                {fit_type}
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-bold text-primary">{priceDisplay}</span>
          <span className="text-xs text-gray-400">onwards</span>
        </div>
      </div>
    </div>
  );
}
