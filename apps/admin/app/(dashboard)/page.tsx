'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'

interface DashboardData {
  total_orders: number
  total_revenue: number
  total_users: number
  total_products: number
  recent_orders: any[]
  low_stock_variants: any[]
}

function fmt(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

function shortId(id: string) {
  return '#' + id.slice(0, 8).toUpperCase()
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({})
  const [stockSaving, setStockSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api.admin.getDashboard().then(setData).finally(() => setLoading(false))
  }, [])

  async function saveStock(variantId: string) {
    const qty = parseInt(stockEdits[variantId])
    if (isNaN(qty) || qty < 0) return
    setStockSaving(prev => ({ ...prev, [variantId]: true }))
    try {
      await api.admin.updateVariant(variantId, { stock_qty: qty })
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          low_stock_variants: prev.low_stock_variants.map(v =>
            v.id === variantId ? { ...v, stock_qty: qty } : v
          ),
        }
      })
      setStockEdits(prev => { const n = { ...prev }; delete n[variantId]; return n })
    } finally {
      setStockSaving(prev => ({ ...prev, [variantId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={fmt(data.total_revenue)}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="amber"
        />
        <StatCard
          title="Total Orders"
          value={data.total_orders.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Total Users"
          value={data.total_users.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Total Products"
          value={data.total_products.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-amber-500 hover:text-amber-600 font-medium">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent_orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No orders yet</td>
                  </tr>
                ) : (
                  data.recent_orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/orders/${order.id}`} className="text-amber-500 hover:underline font-medium">
                          {shortId(order.id)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{order.user_name || '—'}</td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-3 text-gray-700 font-medium">{fmt(order.total)}</td>
                      <td className="px-5 py-3">
                        <Badge type="order" value={order.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Low Stock</h2>
            {data.low_stock_variants.length > 0 && (
              <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                {data.low_stock_variants.length}
              </span>
            )}
          </div>

          {data.low_stock_variants.length === 0 ? (
            <div className="p-5 text-center">
              <svg className="w-10 h-10 text-green-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-400">All variants well stocked</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.low_stock_variants.map((v: any) => (
                <div key={v.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{v.product_name}</p>
                      <p className="text-xs text-gray-400">{v.size} / {v.color} · SKU: {v.sku}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      v.stock_qty === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {v.stock_qty} left
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-amber-400"
                      placeholder="New qty"
                      value={stockEdits[v.id] ?? ''}
                      onChange={e => setStockEdits(prev => ({ ...prev, [v.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => saveStock(v.id)}
                      disabled={!stockEdits[v.id] || stockSaving[v.id]}
                      className="px-3 py-1 text-xs bg-amber-400 text-gray-900 font-semibold rounded disabled:opacity-40 hover:bg-amber-300 transition-colors"
                    >
                      {stockSaving[v.id] ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
