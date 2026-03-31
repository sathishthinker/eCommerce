'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { products as productsApi } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import ProductCard from '@/components/ProductCard';
import SizeGuide from '@/components/SizeGuide';
import Breadcrumb from '@/components/Breadcrumb';
import type { Product, ProductVariant, Review } from '@/types';

// ─── Star Rating ───────────────────────────────────────────────────────────
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-accent' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Review Card ───────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-sm text-primary">{review.user?.name || 'Anonymous'}</p>
          <StarRating rating={review.rating} />
        </div>
        <p className="text-xs text-gray-400">
          {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      {review.title && <p className="font-semibold text-sm text-gray-800 mb-1">{review.title}</p>}
      {review.body && <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>}
    </div>
  );
}

// ─── Accordion ─────────────────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-semibold text-sm uppercase tracking-wider text-primary">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-4 text-sm text-gray-600 leading-relaxed">{children}</div>}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Selected variant state
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Derive unique colors from variants
  const colorOptions: { color: string; color_hex: string }[] = [];
  if (product) {
    const seen = new Set<string>();
    product.variants.forEach((v) => {
      if (!seen.has(v.color)) {
        seen.add(v.color);
        colorOptions.push({ color: v.color, color_hex: v.color_hex });
      }
    });
  }

  // Sizes available for selected color
  const availableSizes: ProductVariant[] =
    product?.variants.filter((v) => v.color === selectedColor) || [];

  const selectedVariant = availableSizes.find((v) => v.size === selectedSize);

  useEffect(() => {
    setLoading(true);
    productsApi
      .getProduct(slug)
      .then((data) => {
        const p = data.product;
        setProduct(p);
        // Set defaults
        if (p.variants.length > 0) {
          setSelectedColor(p.variants[0].color);
          setMainImage(
            p.variants[0].images?.[0]?.url || p.primary_image_url || ''
          );
        }
        // Load related products
        if (p.category_id) {
          productsApi
            .getProducts({ category: p.category?.slug, per_page: 4 })
            .then((d) => setRelatedProducts(d.items.filter((r) => r.id !== p.id).slice(0, 4)))
            .catch(() => {});
        }
        // Load reviews
        productsApi
          .getReviews(p.id)
          .then((r) => {
            setReviews(r.reviews || []);
            setAvgRating(r.average_rating || 0);
          })
          .catch(() => {});
      })
      .catch(() => {
        router.push('/products');
      })
      .finally(() => setLoading(false));
  }, [slug, router]);

  // Update main image when color changes
  useEffect(() => {
    if (product && selectedColor) {
      const variant = product.variants.find((v) => v.color === selectedColor);
      if (variant?.images?.[0]) {
        setMainImage(variant.images[0].url);
      }
      setSelectedSize('');
    }
  }, [selectedColor, product]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!selectedVariant) {
      error('Please select a size');
      return;
    }
    if (selectedVariant.stock_qty < quantity) {
      error('Not enough stock available');
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(selectedVariant.id, quantity);
      success('Added to bag!');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!product) return;
    setWishlistLoading(true);
    try {
      await toggleWishlist(product.id);
    } finally {
      setWishlistLoading(false);
    }
  };

  // All images from selected color variant
  const variantImages =
    product?.variants.find((v) => v.color === selectedColor)?.images || [];
  const allImages = variantImages.length > 0 ? variantImages : product?.variants[0]?.images || [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 skeleton rounded w-3/4" />
            <div className="h-4 skeleton rounded w-1/4" />
            <div className="h-6 skeleton rounded w-1/3" />
            <div className="h-32 skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);
  const price = selectedVariant?.price || product.min_price;
  const mrp = selectedVariant?.mrp || product.min_mrp;
  const hasDiscount = mrp > price;
  const discountPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const stockQty = selectedVariant?.stock_qty ?? 0;
  const lowStock = selectedSize && stockQty > 0 && stockQty < 5;
  const outOfStock = selectedSize && stockQty === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            ...(product.category ? [{ label: product.category.name, href: `/products?category=${product.category.slug}` }] : []),
            { label: product.name },
          ]}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image Gallery */}
        <div className="flex gap-3">
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex flex-col gap-2 w-16 flex-shrink-0">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImage(img.url)}
                  className={`aspect-square relative rounded-lg overflow-hidden border-2 transition-colors ${
                    mainImage === img.url ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="flex-1 relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                -{discountPct}%
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-black text-primary leading-tight mb-1">
            {product.name}
          </h1>

          {product.fit_type && (
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              {product.fit_type} Fit
            </span>
          )}

          {/* Rating */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={avgRating} />
              <span className="text-sm text-gray-500">
                {avgRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-black text-primary">
              ₹{Math.floor(price / 100).toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through font-medium">
                  ₹{Math.floor(mrp / 100).toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-green-600 font-bold">
                  {discountPct}% OFF
                </span>
              </>
            )}
          </div>

          {/* Color Selector */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                Colour:{' '}
                <span className="font-normal text-gray-600 normal-case tracking-normal">
                  {selectedColor}
                </span>
              </span>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {colorOptions.map(({ color, color_hex }) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-primary scale-110 shadow-md'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color_hex || '#888' }}
                />
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                Size: {selectedSize && <span className="font-normal text-gray-600 normal-case tracking-normal">{selectedSize}</span>}
              </span>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="text-xs text-accent hover:underline font-medium"
              >
                Size Guide
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {availableSizes.map((v) => {
                const outStock = v.stock_qty === 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => !outStock && setSelectedSize(v.size)}
                    disabled={outStock}
                    className={`min-w-[44px] h-11 px-3 text-sm font-bold border rounded-lg transition-all ${
                      selectedSize === v.size
                        ? 'bg-primary text-white border-primary'
                        : outStock
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
            {outOfStock && (
              <p className="mt-2 text-xs text-red-500 font-medium">This size is out of stock</p>
            )}
            {lowStock && (
              <p className="mt-2 text-xs text-amber-600 font-medium">
                Only {stockQty} left — order soon!
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider block mb-2">
              Quantity
            </span>
            <div className="flex items-center border border-gray-200 rounded-lg w-fit">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-12 text-center font-bold text-primary">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock_qty || 10, q + 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !!outOfStock}
              className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {addingToCart ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              )}
              {addingToCart ? 'Adding...' : outOfStock ? 'Out of Stock' : 'Add to Bag'}
            </button>

            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                inWishlist
                  ? 'border-red-400 bg-red-50 text-red-500'
                  : 'border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-400'
              }`}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg
                className="w-5 h-5"
                fill={inWishlist ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 py-4 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Free delivery above ₹500
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              7-day returns
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Secure checkout
            </div>
          </div>

          {/* Accordions */}
          <div className="mt-4">
            <Accordion title="Description">
              <p className="leading-relaxed">{product.description}</p>
            </Accordion>
            {product.fabric_care && (
              <Accordion title="Fabric & Care">
                <p className="leading-relaxed whitespace-pre-line">{product.fabric_care}</p>
              </Accordion>
            )}
            <Accordion title="Size Guide">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left font-bold">Size</th>
                      <th className="px-3 py-2 text-left font-bold">Chest</th>
                      <th className="px-3 py-2 text-left font-bold">Length</th>
                      <th className="px-3 py-2 text-left font-bold">Shoulder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { size: 'S', chest: '36-38"', length: '27"', shoulder: '16.5"' },
                      { size: 'M', chest: '38-40"', length: '28"', shoulder: '17.5"' },
                      { size: 'L', chest: '40-42"', length: '29"', shoulder: '18.5"' },
                      { size: 'XL', chest: '42-44"', length: '30"', shoulder: '19.5"' },
                      { size: 'XXL', chest: '44-46"', length: '31"', shoulder: '20.5"' },
                    ].map((row, i) => (
                      <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 font-bold">{row.size}</td>
                        <td className="px-3 py-2">{row.chest}</td>
                        <td className="px-3 py-2">{row.length}</td>
                        <td className="px-3 py-2">{row.shoulder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-16 border-t border-gray-100 pt-12">
        <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-8">
          Customer Reviews
        </h2>
        {reviews.length > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-8 p-6 bg-gray-50 rounded-2xl">
              <div className="text-center">
                <p className="text-5xl font-black text-primary">{avgRating.toFixed(1)}</p>
                <StarRating rating={avgRating} />
                <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm">No reviews yet. Be the first to review!</p>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-gray-100 pt-12">
          <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-8">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
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
        </section>
      )}

      <SizeGuide isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}
