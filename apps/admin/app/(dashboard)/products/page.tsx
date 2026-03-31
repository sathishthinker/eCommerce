'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast-context'

function fmt(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

export default function ProductsPage() {
  const { addToast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    api.admin.getCategories().then(setCategories)
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page }
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      const res = await api.admin.getProducts(params)
      setProducts(res.items || [])
      setTotal(res.total || 0)
      setPages(res.pages || 1)
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  async function toggleActive(productId: string, current: boolean) {
    try {
      await api.admin.updateProduct(productId, { is_active: !current })
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !current } : p))
      addToast(`Product ${!current ? 'activated' : 'deactivated'}`, 'success')
    } catch {
      addToast('Failed to update product', 'error')
    }
  }

  async function deleteProduct(productId: string, name: string) {
    if (!confirm(`Deactivate "${name}"?`)) return
    try {
      await api.admin.deleteProduct(productId)
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: false } : p))
      addToast('Product deactivated', 'success')
    } catch {
      addToast('Failed to delete product', 'error')
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-1">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white w-52"
            />
            <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <Link
          href="/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="text-sm text-gray-500">{total} products</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Variants</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">From</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">No products found</td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.primary_image_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                            <Image src={product.primary_image_url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.fit_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.category_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{product.variants_count || 0}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {product.min_price ? fmt(product.min_price) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.total_stock ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                          product.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id, product.name)}
                          className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
