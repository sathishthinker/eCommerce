'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast-context'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const FIT_TYPES = ['slim', 'regular', 'oversized']

interface VariantRow {
  size: string
  color: string
  color_hex: string
  sku: string
  price: string
  mrp: string
  stock_qty: string
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function NewProductPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  // Basic info
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [fabric, setFabric] = useState('')
  const [fitType, setFitType] = useState('regular')
  const [careInstructions, setCareInstructions] = useState('')

  // Variants
  const [variants, setVariants] = useState<VariantRow[]>([
    { size: 'M', color: '', color_hex: '#000000', sku: '', price: '', mrp: '', stock_qty: '' }
  ])

  useEffect(() => {
    api.admin.getCategories().then(setCategories)
  }, [])

  function addVariant() {
    setVariants(prev => [...prev, { size: 'M', color: '', color_hex: '#000000', sku: '', price: '', mrp: '', stock_qty: '' }])
  }

  function removeVariant(i: number) {
    setVariants(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateVariant(i: number, field: keyof VariantRow, value: string) {
    setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { addToast('Product name is required', 'error'); return }
    if (!categoryId) { addToast('Please select a category', 'error'); return }
    if (variants.length === 0) { addToast('Add at least one variant', 'error'); return }

    for (const v of variants) {
      if (!v.color || !v.sku || !v.price || !v.mrp || !v.stock_qty) {
        addToast('Please fill all variant fields', 'error')
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        category_id: categoryId,
        description,
        fabric,
        fit_type: fitType,
        care_instructions: careInstructions,
        variants: variants.map(v => ({
          size: v.size,
          color: v.color,
          color_hex: v.color_hex,
          sku: v.sku,
          price: Math.round(parseFloat(v.price) * 100),
          mrp: Math.round(parseFloat(v.mrp) * 100),
          stock_qty: parseInt(v.stock_qty),
        })),
      }
      const created = await api.admin.createProduct(payload)
      addToast('Product created!', 'success')
      router.push(`/products/${created.id}`)
    } catch (err: any) {
      addToast(err.message || 'Failed to create product', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Basic Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Classic White Crew Neck"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            />
            {name && (
              <p className="text-xs text-gray-400 mt-1">Slug: {slugify(name)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm bg-white"
            >
              <option value="">Select category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Fit Type</label>
            <select
              value={fitType}
              onChange={e => setFitType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm bg-white"
            >
              {FIT_TYPES.map(f => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Product description..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Fabric</label>
            <input
              type="text"
              value={fabric}
              onChange={e => setFabric(e.target.value)}
              placeholder="e.g. 100% Cotton"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Care Instructions</label>
            <input
              type="text"
              value={careInstructions}
              onChange={e => setCareInstructions(e.target.value)}
              placeholder="e.g. Machine wash cold"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Variants</h2>
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Variant
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 p-4 bg-gray-50 rounded-lg relative">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Size</label>
                <select
                  value={v.size}
                  onChange={e => updateVariant(i, 'size', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:border-amber-400"
                >
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                <input
                  type="text"
                  value={v.color}
                  onChange={e => updateVariant(i, 'color', e.target.value)}
                  placeholder="White"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hex</label>
                <div className="flex gap-1">
                  <input
                    type="color"
                    value={v.color_hex}
                    onChange={e => updateVariant(i, 'color_hex', e.target.value)}
                    className="w-9 h-8 border border-gray-200 rounded cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={v.color_hex}
                    onChange={e => updateVariant(i, 'color_hex', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
                <input
                  type="text"
                  value={v.sku}
                  onChange={e => updateVariant(i, 'sku', e.target.value)}
                  placeholder="TC-001-M-W"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={v.price}
                  onChange={e => updateVariant(i, 'price', e.target.value)}
                  placeholder="599"
                  min={0}
                  step={0.01}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">MRP (₹)</label>
                <input
                  type="number"
                  value={v.mrp}
                  onChange={e => updateVariant(i, 'mrp', e.target.value)}
                  placeholder="799"
                  min={0}
                  step={0.01}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={v.stock_qty}
                    onChange={e => updateVariant(i, 'stock_qty', e.target.value)}
                    placeholder="50"
                    min={0}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400"
                  />
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
        >
          {saving ? 'Creating...' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
