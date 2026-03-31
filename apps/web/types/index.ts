export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  color: string;
  color_hex: string;
  size: string;
  price: number;
  mrp: number;
  stock_qty: number;
  sku: string;
  images: ProductImage[];
}

export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  fabric_care?: string;
  category_id: number;
  category?: Category;
  fit_type: string;
  is_featured: boolean;
  is_active: boolean;
  min_price: number;
  max_price: number;
  min_mrp: number;
  primary_image_url?: string;
  variants: ProductVariant[];
  created_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    slug: string;
    primary_image_url?: string;
  };
  variant: {
    id: number;
    color: string;
    color_hex: string;
    size: string;
    price: number;
    mrp: number;
    stock_qty: number;
    images?: ProductImage[];
  };
}

export interface WishlistItem {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    min_price: number;
    primary_image_url?: string;
    fit_type: string;
    is_featured: boolean;
  };
  created_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface OrderItem {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    id: number;
    name: string;
    slug: string;
    primary_image_url?: string;
  };
  variant: {
    id: number;
    color: string;
    size: string;
    images?: ProductImage[];
  };
}

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  coupon_code?: string;
  address: Address;
  items: OrderItem[];
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id: number;
  rating: number;
  title?: string;
  body?: string;
  user: {
    name: string;
  };
  created_at: string;
}

export interface ProductsParams {
  category?: string;
  size?: string | string[];
  min_price?: number;
  max_price?: number;
  color?: string;
  fit_type?: string;
  sort?: string;
  page?: number;
  per_page?: number;
  is_featured?: boolean;
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
