'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

const DELIVERY_THRESHOLD = 50000; // 500 in paise
const DELIVERY_CHARGE = 9900; // 99 in paise

export default function CartPage() {
  const { items, loading, itemCount, subtotal, updateItem, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();
  const [coupon, setCoupon] = useState('');
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  const deliveryCharge = subtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = subtotal + deliveryCharge;

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await updateItem(itemId, quantity);
    } catch {
      error('Failed to update quantity');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await removeItem(itemId);
      success('Item removed from cart');
    } catch {
      error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (!user) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 skeleton rounded w-40 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="w-20 h-24 skeleton rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/2" />
                  <div className="h-6 skeleton rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (!itemCount && !loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-3">
          Your Bag is Empty
        </h2>
        <p className="text-gray-500 mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Start Shopping
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-primary uppercase tracking-wider">
          Your Bag ({itemCount})
        </h1>
        <button
          onClick={async () => {
            await clearCart();
            success('Cart cleared');
          }}
          className="text-sm text-red-500 hover:text-red-700 font-semibold transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const updating = updatingItems.has(item.id);
            const itemImage =
              item.variant.images?.[0]?.url || item.product.primary_image_url;

            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-colors"
              >
                {/* Image */}
                <Link href={`/products/${item.product.slug}`}>
                  <div className="relative w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    {itemImage ? (
                      <Image
                        src={itemImage}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-bold text-primary text-sm hover:text-accent transition-colors leading-snug">
                        {item.product.name}
                      </h3>
                    </Link>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex gap-3 mt-1 mb-3">
                    <span className="text-xs text-gray-500">
                      Color: <strong className="text-primary">{item.variant.color}</strong>
                    </span>
                    <span className="text-xs text-gray-500">
                      Size: <strong className="text-primary">{item.variant.size}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity */}
                    <div className={`flex items-center border border-gray-200 rounded-lg ${updating ? 'opacity-50' : ''}`}>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={updating || item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary disabled:opacity-40 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-primary">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updating || item.quantity >= item.variant.stock_qty}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary disabled:opacity-40 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-black text-primary">
                        ₹{Math.floor((item.variant.price * item.quantity) / 100).toLocaleString('en-IN')}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-400">
                          ₹{Math.floor(item.variant.price / 100)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-amber-600 font-semibold transition-colors mt-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
            <h2 className="font-black text-primary uppercase tracking-wider text-lg mb-5">
              Order Summary
            </h2>

            {/* Coupon */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent uppercase"
                />
                <button className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors uppercase tracking-wider">
                  Apply
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-primary">
                  ₹{Math.floor(subtotal / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                {deliveryCharge === 0 ? (
                  <span className="text-green-600 font-semibold">FREE</span>
                ) : (
                  <span className="font-semibold text-primary">
                    ₹{Math.floor(deliveryCharge / 100)}
                  </span>
                )}
              </div>
              {deliveryCharge > 0 && (
                <p className="text-xs text-gray-400">
                  Add ₹{Math.floor((DELIVERY_THRESHOLD - subtotal) / 100)} more for free delivery
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between">
                <span className="font-black text-primary text-lg uppercase tracking-wider">Total</span>
                <span className="font-black text-primary text-xl">
                  ₹{Math.floor(total / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure checkout powered by Razorpay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
