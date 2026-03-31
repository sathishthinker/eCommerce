'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import Modal from '@/components/Modal'

interface CouponForm {
  code: string
  description: string
  discount_type: 'percent' | 'flat'
  discount_value: string
  min_order_value: string
  max_uses: string
  expires_at: string
}

const emptyForm: CouponForm = {
  code: '', description: '', discount_type: 'percent',
  discount_value: '', min_order_value: '', max_uses: '', expires_at: ''
}

function fmt(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

function formatDate(dt: string) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CouponsPage() {
  const { addToast } = useToast()
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<CouponForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.admin.getCoupons().then(setCoupons).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!form.code.trim()) { addToast('Coupon code is required', 'error'); return }
    if (!form.discount_value) { addToast('Discount value is required', 'error'); return }
    setSaving(true)
    try {
      const payload: any = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        min_order_value: form.min_order_value ? Math.round(parseFloat(form.min_order_value) * 100) : 0,
      }
      if (form.discount_type === 'percent') {
        payload.discount_percent = parseFloat(form.discount_value)
      } else {
        payload.discount_flat = Math.round(parseFloat(form.discount_value) * 100)
      }
      if (form.max_uses) payload.max_uses = parseInt(form.max_uses)
      if (form.expires_at) payload.expires_at = form.expires_at

      const created = await api.admin.createCoupon(payload)
      setCoupons(prev => [created, ...prev])
      addToast('Coupon created!', 'success')
      setModalOpen(false)
      setForm(emptyForm)
    } catch (err: any) {
      addToast(err.message || 'Failed to create coupon', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(coupon: any) {
    try {
      await api.admin.updateCoupon(coupon.id, { is_active: !coupon.is_active })
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      addToast(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}`, 'success')
    } catch {
      addToast('Failed to update', 'error')
    }
  }

  function discountDisplay(c: any) {
    if (c.discount_percent) return `${c.discount_percent}%`
    if (c.discount_flat) return `${fmt(c.discount_flat)} off`
    return '—'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{coupons.length} coupons</span>
        <button
          onClick={() => { setForm(emptyForm); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Min Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Uses</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No coupons yet</td></tr>
              ) : (
                coupons.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono font-semibold text-gray-800">{c.code}</span>
                        {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">{discountDisplay(c)}</td>
                    <td className="px-4 py-3 text-gray-600">{c.min_order_value ? fmt(c.min_order_value) : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.expires_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                          c.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Coupon">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Coupon Code *</label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="SAVE20"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. 20% off on all orders"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          {/* Discount type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Discount Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, discount_type: 'percent' }))}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  form.discount_type === 'percent'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, discount_type: 'flat' }))}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  form.discount_type === 'flat'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Flat Amount (₹)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {form.discount_type === 'percent' ? 'Discount %' : 'Discount Amount (₹)'} *
            </label>
            <input
              type="number"
              value={form.discount_value}
              onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))}
              placeholder={form.discount_type === 'percent' ? '20' : '100'}
              min={0}
              max={form.discount_type === 'percent' ? 100 : undefined}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Min Order (₹)</label>
              <input
                type="number"
                value={form.min_order_value}
                onChange={e => setForm(p => ({ ...p, min_order_value: e.target.value }))}
                placeholder="500"
                min={0}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Max Uses</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))}
                placeholder="Unlimited"
                min={1}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Expiry Date</label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              {saving ? 'Creating...' : 'Create Coupon'}
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
