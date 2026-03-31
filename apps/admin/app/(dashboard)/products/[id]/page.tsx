'use client'

import { useEffect, useState, useRef, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast-context'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const FIT_TYPES = ['slim', 'regular', 'oversized']

function fmt(paise: number) {
  return (paise / 100).toFixed(2)
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [product, setProduct] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'variants' | 'images'>('details')

  // Basic info state
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [fabric, setFabric] = useState('')
  const [fitType, setFitType] = useState('regular')
  const [careInstructions, setCareInstructions] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)

  // Image upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadVariantId, setUploadVariantId] = useState('')
  const [uploadAltText, setUploadAltText] = useState('')
  const [uploadIsPrimary, setUploadIsPrimary] = useState(false)
  const [uploading, setUploading] = useState(false)

  // New variant state
  const [newVariant, setNewVariant] = useState({ size: 'M', color: '', color_hex: '#000000', sku: '', price: '', mrp: '', stock_qty: '' })
  const [addingVariant, setAddingVariant] = useState(false)

  // Variant inline edit
  const [variantEdits, setVariantEdits] = useState<Record<string, { price: string; mrp: string; stock_qty: string }>>({})
  const [savingVariant, setSavingVariant] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([
      api.admin.getProducts({ id }),
      api.admin.getCategories(),
    ]).then(([prodRes, cats]) => {
      const data = (prodRes as any).items?.find((p: any) => p.id === id) || prodRes
      if (data) {
        setProduct(data)
        setName(data.name || '')
        setCategoryId(data.category_id || '')
        setDescription(data.description || '')
        setFabric(data.fabric || '')
        setFitType(data.fit_type || 'regular')
        setCareInstructions(data.care_instructions || '')
        setIsFeatured(data.is_featured || false)
        setIsActive(data.is_active !== false)
      }
      setCategories(Array.isArray(cats) ? cats : (cats as any).categories || [])
    }).catch(() => null).finally(() => setLoading(false))
  }, [id])

  async function saveDetails(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await api.admin.updateProduct(id, {
        name, category_id: categoryId, description, fabric, fit_type: fitType,
        care_instructions: careInstructions, is_featured: isFeatured, is_active: isActive,
      })
      setProduct((prev: any) => ({ ...prev, ...updated }))
      addToast('Product updated!', 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to update', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload() {
    if (!uploadFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      if (uploadVariantId) formData.append('variant_id', uploadVariantId)
      if (uploadAltText) formData.append('alt_text', uploadAltText)
      formData.append('is_primary', String(uploadIsPrimary))
      const newImg = await api.admin.uploadProductImage(id, formData)
      setProduct((prev: any) => ({ ...prev, images: [...(prev.images || []), newImg] }))
      setUploadFile(null)
      setUploadAltText('')
      setUploadIsPrimary(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      addToast('Image uploaded!', 'success')
    } catch (err: any) {
      addToast(err.message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function addVariantSubmit(e: FormEvent) {
    e.preventDefault()
    setAddingVariant(true)
    try {
      const v = newVariant
      const created = await api.admin.createVariant(id, {
        size: v.size, color: v.color, color_hex: v.color_hex, sku: v.sku,
        price: Math.round(parseFloat(v.price) * 100),
        mrp: Math.round(parseFloat(v.mrp) * 100),
        stock_qty: parseInt(v.stock_qty),
      })
      setProduct((prev: any) => ({ ...prev, variants: [...(prev.variants || []), created] }))
      setNewVariant({ size: 'M', color: '', color_hex: '#000000', sku: '', price: '', mrp: '', stock_qty: '' })
      addToast('Variant added!', 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to add variant', 'error')
    } finally {
      setAddingVariant(false)
    }
  }

  function startEditVariant(variant: any) {
    setVariantEdits(prev => ({
      ...prev,
      [variant.id]: {
        price: fmt(variant.price),
        mrp: fmt(variant.mrp),
        stock_qty: String(variant.stock_qty),
      }
    }))
  }

  async function saveVariantEdit(variantId: string) {
    const edit = variantEdits[variantId]
    if (!edit) return
    setSavingVariant(prev => ({ ...prev, [variantId]: true }))
    try {
      await api.admin.updateVariant(variantId, {
        price: Math.round(parseFloat(edit.price) * 100),
        mrp: Math.round(parseFloat(edit.mrp) * 100),
        stock_qty: parseInt(edit.stock_qty),
      })
      setProduct((prev: any) => ({
        ...prev,
        variants: prev.variants.map((v: any) => v.id === variantId ? {
          ...v,
          price: Math.round(parseFloat(edit.price) * 100),
          mrp: Math.round(parseFloat(edit.mrp) * 100),
          stock_qty: parseInt(edit.stock_qty),
        } : v)
      }))
      setVariantEdits(prev => { const n = { ...prev }; delete n[variantId]; return n })
      addToast('Variant updated!', 'success')
    } catch {
      addToast('Failed to update variant', 'error')
    } finally {
      setSavingVariant(prev => ({ ...prev, [variantId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-4xl">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="bg-white rounded-xl h-64 border border-gray-200" />
      </div>
    )
  }

  if (!product) return <p className="text-gray-500">Product not found.</p>

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/products" className="text-gray-400 hover:text-gray-600">Products</Link>
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-gray-800">{product.name}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {(['details', 'variants', 'images'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <form onSubmit={saveDetails} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Product Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm bg-white">
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Fit Type</label>
              <select value={fitType} onChange={e => setFitType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm bg-white">
                {FIT_TYPES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Fabric</label>
              <input type="text" value={fabric} onChange={e => setFabric(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Care Instructions</label>
              <input type="text" value={careInstructions} onChange={e => setCareInstructions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-amber-400 focus:ring-amber-400" />
                <span className="text-sm text-gray-600">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-amber-400 focus:ring-amber-400" />
                <span className="text-sm text-gray-600">Active</span>
              </label>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Existing Variants</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Color</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price (₹)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">MRP (₹)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(product.variants || []).map((v: any) => {
                    const edit = variantEdits[v.id]
                    return (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{v.size}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: v.color_hex }} />
                            {v.color}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{v.sku}</td>
                        <td className="px-4 py-3">
                          {edit ? (
                            <input type="number" value={edit.price} onChange={e => setVariantEdits(p => ({ ...p, [v.id]: { ...p[v.id], price: e.target.value } }))}
                              className="w-20 px-2 py-1 border border-amber-400 rounded text-sm focus:outline-none" />
                          ) : fmt(v.price)}
                        </td>
                        <td className="px-4 py-3">
                          {edit ? (
                            <input type="number" value={edit.mrp} onChange={e => setVariantEdits(p => ({ ...p, [v.id]: { ...p[v.id], mrp: e.target.value } }))}
                              className="w-20 px-2 py-1 border border-amber-400 rounded text-sm focus:outline-none" />
                          ) : fmt(v.mrp)}
                        </td>
                        <td className="px-4 py-3">
                          {edit ? (
                            <input type="number" value={edit.stock_qty} onChange={e => setVariantEdits(p => ({ ...p, [v.id]: { ...p[v.id], stock_qty: e.target.value } }))}
                              className="w-20 px-2 py-1 border border-amber-400 rounded text-sm focus:outline-none" />
                          ) : (
                            <span className={v.stock_qty < 5 ? 'text-red-600 font-semibold' : ''}>{v.stock_qty}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {edit ? (
                            <div className="flex gap-1">
                              <button onClick={() => saveVariantEdit(v.id)} disabled={savingVariant[v.id]}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                {savingVariant[v.id] ? '...' : 'Save'}
                              </button>
                              <button onClick={() => setVariantEdits(p => { const n = { ...p }; delete n[v.id]; return n })}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => startEditVariant(v)}
                              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Edit</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Variant */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Add New Variant</h3>
            <form onSubmit={addVariantSubmit} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Size</label>
                <select value={newVariant.size} onChange={e => setNewVariant(p => ({ ...p, size: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:border-amber-400">
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                <input type="text" value={newVariant.color} onChange={e => setNewVariant(p => ({ ...p, color: e.target.value }))}
                  placeholder="White" required
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hex</label>
                <input type="color" value={newVariant.color_hex} onChange={e => setNewVariant(p => ({ ...p, color_hex: e.target.value }))}
                  className="w-full h-8 border border-gray-200 rounded cursor-pointer p-0.5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
                <input type="text" value={newVariant.sku} onChange={e => setNewVariant(p => ({ ...p, sku: e.target.value }))}
                  placeholder="TC-001-M-W" required
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                <input type="number" value={newVariant.price} onChange={e => setNewVariant(p => ({ ...p, price: e.target.value }))}
                  placeholder="599" min={0} required
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">MRP (₹)</label>
                <input type="number" value={newVariant.mrp} onChange={e => setNewVariant(p => ({ ...p, mrp: e.target.value }))}
                  placeholder="799" min={0} required
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                <div className="flex gap-1">
                  <input type="number" value={newVariant.stock_qty} onChange={e => setNewVariant(p => ({ ...p, stock_qty: e.target.value }))}
                    placeholder="50" min={0} required
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>
              <div className="col-span-full">
                <button type="submit" disabled={addingVariant}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors">
                  {addingVariant ? 'Adding...' : 'Add Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          {/* Existing images */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Product Images</h3>
            {(!product.images || product.images.length === 0) ? (
              <p className="text-gray-400 text-sm">No images yet. Upload one below.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {product.images.map((img: any) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <Image src={img.url} alt={img.alt_text || product.name} width={120} height={120} className="object-cover w-full h-full" />
                    </div>
                    {img.is_primary && (
                      <span className="absolute top-1 left-1 text-xs bg-amber-400 text-gray-900 font-semibold px-1.5 py-0.5 rounded">Primary</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload new image */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Upload Image</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Select File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Variant (optional)</label>
                  <select value={uploadVariantId} onChange={e => setUploadVariantId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm bg-white">
                    <option value="">All variants</option>
                    {(product.variants || []).map((v: any) => (
                      <option key={v.id} value={v.id}>{v.size} / {v.color}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Alt Text</label>
                  <input type="text" value={uploadAltText} onChange={e => setUploadAltText(e.target.value)}
                    placeholder="Describe the image"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={uploadIsPrimary} onChange={e => setUploadIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-amber-400" />
                <span className="text-sm text-gray-600">Set as primary image</span>
              </label>

              <button
                onClick={handleImageUpload}
                disabled={!uploadFile || uploading}
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
