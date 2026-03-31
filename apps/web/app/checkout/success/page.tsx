'use client';

import React from 'react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated checkmark */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ animation: 'none' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-black text-primary uppercase tracking-wider mb-3">
          Order Placed!
        </h1>
        <p className="text-gray-600 mb-2 text-lg">
          Your order has been successfully placed.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          You&apos;ll receive a WhatsApp confirmation shortly with your order details and tracking info.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Track Order
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-primary px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest hover:border-primary transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
