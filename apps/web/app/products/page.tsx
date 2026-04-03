'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { products as productsApi } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import type { Product, Category } from '@/types';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const FIT_TYPES = ['Regular', 'Slim', 'Oversized'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'featured', label: 'Featured' },
];

function ProductSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-100">
      <div className="aspect-[3/4] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/4" />
        <div className="h-4 skeleton rounded w-1/3" />
      </div>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter state from URL
  const selectedCategories = searchParams.getAll('category');
  const selectedSizes = searchParams.getAll('size');
  const selectedFits = searchParams.getAll('fit_type');
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        params.delete(key);
        if (value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else if (value) {
            params.set(key, value);
          }
        }
      });
      // Reset page on filter change
      if (!('page' in updates)) {
        params.set('page', '1');
      }
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  useEffect(() => {
    productsApi.getCategories().then((d) => setCategories(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = {
      sort,
      page,
      per_page: 12,
    };
    if (selectedCategories.length) params.category = selectedCategories[0];
    if (selectedSizes.length) params.size = selectedSizes;
    if (selectedFits.length) params.fit_type = selectedFits[0];
    if (minPrice) params.min_price = Number(minPrice) * 100;
    if (maxPrice) params.max_price = Number(maxPrice) * 100;
    if (search) params.search = search;

    productsApi
      .getProducts(params as Parameters<typeof productsApi.getProducts>[0])
      .then((data) => {
        setProducts(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const toggleCategory = (slug: string) => {
    const next = selectedCategories.includes(slug)
      ? selectedCategories.filter((c) => c !== slug)
      : [...selectedCategories, slug];
    updateParams({ category: next });
  };

  const toggleSize = (s: string) => {
    const next = selectedSizes.includes(s)
      ? selectedSizes.filter((x) => x !== s)
      : [...selectedSizes, s];
    updateParams({ size: next });
  };

  const toggleFit = (f: string) => {
    const next = selectedFits.includes(f)
      ? selectedFits.filter((x) => x !== f)
      : [...selectedFits, f];
    updateParams({ fit_type: next });
  };

  const clearAllFilters = () => {
    router.push('/products');
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedSizes.length +
    selectedFits.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`w-10 h-10 text-sm font-bold border rounded transition-all ${
                selectedSizes.includes(s)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Fit Type */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Fit Type</h3>
        <div className="space-y-2">
          {FIT_TYPES.map((f) => (
            <label key={f} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedFits.includes(f)}
                onChange={() => toggleFit(f)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Price (₹)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => updateParams({ min_price: e.target.value || null })}
            placeholder="Min"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => updateParams({ max_price: e.target.value || null })}
            placeholder="Max"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 text-sm text-red-500 hover:text-red-700 font-semibold transition-colors border border-red-200 rounded-lg hover:bg-red-50"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-primary uppercase tracking-wider">
          {search ? `Search: "${search}"` : 'All Products'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? 'Loading...' : `${total} products`}
        </p>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategories.map((c) => {
            const cat = categories.find((x) => x.slug === c);
            return (
              <span
                key={c}
                className="inline-flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-medium"
              >
                {cat?.name || c}
                <button onClick={() => toggleCategory(c)} className="ml-1 hover:opacity-70">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
          {selectedSizes.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-medium"
            >
              Size: {s}
              <button onClick={() => toggleSize(s)} className="ml-1 hover:opacity-70">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {selectedFits.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-medium"
            >
              {f} Fit
              <button onClick={() => toggleFit(f)} className="ml-1 hover:opacity-70">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {minPrice && (
            <span className="inline-flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-medium">
              Min ₹{minPrice}
              <button onClick={() => updateParams({ min_price: null })} className="ml-1 hover:opacity-70">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {maxPrice && (
            <span className="inline-flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-medium">
              Max ₹{maxPrice}
              <button onClick={() => updateParams({ max_price: null })} className="ml-1 hover:opacity-70">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-5 pb-3 border-b border-gray-100">
              Filter
            </h2>
            <FilterPanel />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            {/* Mobile filter button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:border-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            {/* Sort */}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-gray-500 font-medium hidden sm:block">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary bg-white"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-400">No products found</h3>
              <p className="text-gray-400 mt-2 text-sm">Try adjusting your filters</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="mt-4 text-accent font-semibold hover:underline text-sm">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  min_price={p.min_price}
                  primary_image_url={p.primary_image_url}
                  fit_type={p.fit_type}
                  is_featured={p.is_featured}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParams({ page: String(p) })}
                  className={`w-10 h-10 text-sm font-bold rounded-lg transition-colors ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'border border-gray-200 hover:border-primary text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= pages}
                onClick={() => updateParams({ page: String(page + 1) })}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-primary uppercase tracking-wider">Filters</h3>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              <FilterPanel />
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold uppercase tracking-wider"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-gray-100">
              <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
