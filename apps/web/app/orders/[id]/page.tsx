'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { orders as ordersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import type { Order, OrderStatus } from '@/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-50' },
  processing: { label: 'Processing', color: 'text-purple-700', bg: 'bg-purple-50' },
  shipped: { label: 'Shipped', color: 'text-orange-700', bg: 'bg-orange-50' },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50' },
};

const TIMELINE_STEPS: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const { user, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user && id) {
      ordersApi.getOrder(Number(id))
        .then((d) => setOrder(d.order))
        .catch(() => router.push('/orders'))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, id, router]);

  const handleCancel = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const data = await ordersApi.cancelOrder(order.id);
      setOrder(data.order);
      success('Order cancelled successfully');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-4">
          <div className="h-8 skeleton rounded w-48 mb-6" />
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-48 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const shortId = String(order.id).padStart(6, '0');
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const currentStep = TIMELINE_STEPS.indexOf(order.status as OrderStatus);
  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Success Banner */}
      {isSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-green-800">Order Placed Successfully!</p>
            <p className="text-sm text-green-700">You&apos;ll receive a WhatsApp confirmation shortly.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-primary uppercase tracking-wider">
              Order #{shortId}
            </h1>
            <StatusBadge status={order.status as OrderStatus} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Placed on {date}</p>
        </div>
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 disabled:opacity-50 transition-colors uppercase tracking-wider"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* Order Timeline */}
      {order.status !== 'cancelled' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="font-black text-primary uppercase tracking-wider text-sm mb-5">
            Order Status
          </h2>
          <div className="flex items-center">
            {TIMELINE_STEPS.map((step, i) => {
              const isCompleted = currentStep >= i;
              const isCurrent = currentStep === i;
              const icons = [
                // confirmed
                <svg key="c" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
                // processing
                <svg key="p" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                // shipped
                <svg key="s" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>,
                // delivered
                <svg key="d" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
              ];
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? isCurrent
                            ? 'bg-accent text-white ring-4 ring-amber-100'
                            : 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {icons[i]}
                    </div>
                    <p className={`text-xs mt-1.5 font-semibold capitalize ${isCompleted ? 'text-primary' : 'text-gray-400'}`}>
                      {STATUS_CONFIG[step]?.label || step}
                    </p>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 transition-all ${
                        currentStep > i ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <h2 className="font-black text-primary uppercase tracking-wider text-sm mb-4">
          Items Ordered
        </h2>
        <div className="space-y-4">
          {order.items?.map((item) => {
            const img = item.variant?.images?.[0]?.url || item.product?.primary_image_url;
            return (
              <div key={item.id} className="flex gap-4 items-start">
                <div className="relative w-16 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {img && (
                    <Image src={img} alt={item.product?.name || ''} fill className="object-cover" sizes="64px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product?.slug || ''}`}>
                    <p className="font-bold text-sm text-primary hover:text-accent transition-colors">
                      {item.product?.name}
                    </p>
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.variant?.color} / {item.variant?.size} × {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-primary">
                    ₹{Math.floor(item.total_price / 100).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-400">
                    ₹{Math.floor(item.unit_price / 100)} each
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Breakdown + Delivery Address */}
      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        {/* Price */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-black text-primary uppercase tracking-wider text-sm mb-4">
            Price Details
          </h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">₹{Math.floor(order.subtotal / 100).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              {order.delivery_charge === 0 ? (
                <span className="text-green-600 font-semibold">FREE</span>
              ) : (
                <span className="font-semibold">₹{Math.floor(order.delivery_charge / 100)}</span>
              )}
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600 font-semibold">-₹{Math.floor(order.discount / 100)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2.5">
              <div className="flex justify-between">
                <span className="font-black text-primary uppercase tracking-wider">Total</span>
                <span className="font-black text-primary text-lg">₹{Math.floor(order.total / 100).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-black text-primary uppercase tracking-wider text-sm mb-4">
            Delivery Address
          </h2>
          {order.address ? (
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-bold text-primary">{order.address.name}</p>
              <p>{order.address.address_line1}</p>
              {order.address.address_line2 && <p>{order.address.address_line2}</p>}
              <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
              <p className="text-gray-500">+91 {order.address.phone}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Address not available</p>
          )}
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <h2 className="font-black text-primary uppercase tracking-wider text-sm mb-3">
          Payment
        </h2>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <div>
            <p className="text-sm font-semibold text-primary capitalize">{order.payment_method}</p>
            <p className="text-xs text-gray-400 capitalize">{order.payment_status}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/orders"
          className="flex-1 text-center py-3 border border-gray-200 rounded-xl font-bold text-sm uppercase tracking-wider hover:border-primary transition-colors"
        >
          All Orders
        </Link>
        <Link
          href="/products"
          className="flex-1 text-center py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
