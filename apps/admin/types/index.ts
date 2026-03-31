export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  orders_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
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
  variant_id?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  fabric?: string;
  fabric_care?: string;
  care_instructions?: string;
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
  images?: ProductImage[];
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
    color_hex?: string;
    size: string;
    sku?: string;
    images?: ProductImage[];
  };
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

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
  courier_name?: string;
  tracking_url?: string;
  address: Address;
  items: OrderItem[];
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_value: number;
  max_uses?: number;
  used_count: number;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
}

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

export interface AdminDashboard {
  total_orders: number;
  total_revenue: number;
  total_users: number;
  total_products: number;
  recent_orders: Order[];
  low_stock_variants: (ProductVariant & {
    product_name: string;
  })[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  pages: number;
  current_page: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}
