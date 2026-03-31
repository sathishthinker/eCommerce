'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import Badge from '@/components/Badge'

const STATUS_TABS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

function fmt(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

function shortId(id: string) {
  return '#' + id.slice(0, 8).toUpperCase()
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page }
      if (activeTab !== 'all') params.status = activeTab
      if (paymentFilter) params.payment_status = paymentFilter
      const res = await api.admin.getOrders(params)
      setOrders(res.items || [])
      setTotal(res.total || 0)
      setPages(res.pages || 1)
    } finally {
      setLoading(false)
    }
  }, [page, activeTab, paymentFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  function exportCSV() {
    const headers = ['Order ID', 'Customer', 'Email', 'Date', 'Items', 'Total', 'Status', 'Payment']
    const rows = orders.map(o => [
      shortId(o.id),
      o.user_name || '',
      o.user_email || '',
      formatDate(o.created_at),
      o.items_count || '',
      fmt(o.total),
      o.status,
      o.payment_status,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1) }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={paymentFilter}
            onChange={e => { setPaymentFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">{total} orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">No orders found</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="text-amber-500 hover:underline font-medium">
                        {shortId(order.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{order.user_name || '—'}</div>
                      <div className="text-xs text-gray-400">{order.user_email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(order.total)}</td>
                    <td className="px-4 py-3"><Badge type="order" value={order.status} /></td>
                    <td className="px-4 py-3"><Badge type="payment" value={order.payment_status} /></td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
