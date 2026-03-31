'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orders as ordersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Order, OrderStatus } from '@/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-50' },
  processing: { label: 'Processing', color: 'text-purple-700', bg: 'bg-purple-50' },
  shipped: { label: 'Shipped', color: 'text-orange-700', bg: 'bg-orange-50' },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/orders');
      return;
    }
    if (user) {
      ordersApi.getOrders().then((d) => setOrderList(d.orders || [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-8 skeleton rounded w-40 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (orderList.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-3">
          No Orders Yet
        </h2>
        <p className="text-gray-500 mb-8">Start shopping and your orders will appear here.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-black text-primary uppercase tracking-wider mb-8">
        My Orders
      </h1>

      <div className="space-y-4">
        {orderList.map((order) => {
          const shortId = String(order.id).padStart(6, '0');
          const date = new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          });

          return (
            <div
              key={order.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="font-black text-primary text-sm">Order #{shortId}</p>
                    <StatusBadge status={order.status as OrderStatus} />
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{date}</p>
                  <p className="text-xs text-gray-500">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-primary">
                    ₹{Math.floor(order.total / 100).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{order.payment_method}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-amber-600 transition-colors uppercase tracking-wider"
                >
                  View Details
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
