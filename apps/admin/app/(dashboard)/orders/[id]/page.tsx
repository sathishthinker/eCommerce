'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/api'
import Badge from '@/components/Badge'
import { useToast } from '@/lib/toast-context'

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'delivered']

function fmt(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

function shortId(id: string) {
  return '#' + id.slice(0, 8).toUpperCase()
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { addToast } = useToast()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [courierName, setCourierName] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.admin.getOrder(id).then(data => {
      setOrder(data)
      setNewStatus(data.status)
    }).finally(() => setLoading(false))
  }, [id])

  async function handleStatusUpdate() {
    if (!newStatus) return
    if (newStatus === 'shipped' && !courierName) {
      addToast('Please enter courier name', 'error')
      return
    }
    setSaving(true)
    try {
      const body: any = { status: newStatus }
      if (newStatus === 'shipped') {
        body.courier_name = courierName
        body.tracking_url = trackingUrl
      }
      await api.admin.updateOrderStatus(id, body)
      setOrder((prev: any) => ({ ...prev, status: newStatus }))
      addToast('Order status updated', 'success')
    } catch (e: any) {
      addToast(e.message || 'Failed to update status', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl h-64 border border-gray-200" />
          <div className="bg-white rounded-xl h-64 border border-gray-200" />
        </div>
      </div>
    )
  }

  if (!order) return <p className="text-gray-500">Order not found.</p>

  const currentStepIndex = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/orders" className="text-gray-400 hover:text-gray-600">Orders</Link>
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-gray-800">{shortId(order.id)}</span>
        <Badge type="order" value={order.status} />
      </div>

      {/* Status Timeline */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Progress</h3>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    i <= currentStepIndex
                      ? 'bg-amber-400 border-amber-400 text-gray-900'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {i <= currentStepIndex ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 capitalize mt-1 text-center">{step}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < currentStepIndex ? 'bg-amber-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: items + status update */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Items ({order.items?.length || 0})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  {item.image_url ? (
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                      <Image src={item.image_url} alt={item.product_name} width={56} height={56} className="object-cover w-full h-full" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{item.product_name}</p>
                    <p className="text-sm text-gray-400">{item.variant_info}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-800">{fmt(item.total_price)}</p>
                    <p className="text-xs text-gray-400">{fmt(item.unit_price)} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price summary */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                  <span>−{fmt(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span>{order.delivery_fee === 0 ? 'Free' : fmt(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{fmt(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Update Status</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              {newStatus === 'shipped' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Courier Name *</label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={e => setCourierName(e.target.value)}
                      placeholder="e.g. Delhivery, DTDC, BlueDart"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tracking URL</label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={e => setTrackingUrl(e.target.value)}
                      placeholder="https://track.courier.com/..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleStatusUpdate}
                disabled={saving || newStatus === order.status}
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >
                {saving ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: customer + payment + address */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Customer</h3>
            <p className="font-medium text-gray-800">{order.user_name || '—'}</p>
            <p className="text-sm text-gray-500 mt-0.5">{order.user_email || ''}</p>
            <p className="text-sm text-gray-500">{order.user_phone || ''}</p>
          </div>

          {/* Delivery Address */}
          {order.address && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
              <p className="font-medium text-gray-800">{order.address.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{order.address.phone}</p>
              <p className="text-sm text-gray-500 mt-1">
                {order.address.line1}
                {order.address.line2 && `, ${order.address.line2}`}
              </p>
              <p className="text-sm text-gray-500">
                {order.address.city}, {order.address.state} — {order.address.pincode}
              </p>
            </div>
          )}

          {/* Payment */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="capitalize font-medium">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge type="payment" value={order.payment_status} />
              </div>
              {order.razorpay_payment_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID</span>
                  <span className="text-xs font-mono text-gray-600">{order.razorpay_payment_id}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Ordered</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
