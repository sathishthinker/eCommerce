import type {
  User,
  Product,
  ProductsParams,
  PaginatedResponse,
  Category,
  CartItem,
  WishlistItem,
  Order,
  Address,
  Review,
} from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── In-memory access token ────────────────────────────────────────────────
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────
interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function attemptRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      setAccessToken(null);
      return null;
    }
    const data = await res.json();
    const token = data.access_token || data.token || null;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  let res = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  // 401 → attempt token refresh and retry once
  if (res.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;
      onRefreshed(newToken);
    } else {
      // Wait for the ongoing refresh
      await new Promise<void>((resolve) => {
        subscribeTokenRefresh(() => resolve());
      });
    }

    const retryHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };
    if (accessToken) {
      retryHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    res = await fetch(url, {
      ...fetchOptions,
      headers: retryHeaders,
      credentials: 'include',
    });
  }

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errorMsg = errData.message || errData.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Handle empty responses (204 No Content etc.)
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ─── Auth API ──────────────────────────────────────────────────────────────
export const auth = {
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) =>
    apiFetch<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => apiFetch<{ user: User }>('/auth/me'),

  updateMe: (data: { name?: string; phone?: string }) =>
    apiFetch<{ user: User }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refreshToken: () =>
    apiFetch<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    }),
};

// ─── Products API ──────────────────────────────────────────────────────────
export const products = {
  getProducts: (params: ProductsParams = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        if (Array.isArray(v)) {
          v.forEach((item) => query.append(k, String(item)));
        } else {
          query.set(k, String(v));
        }
      }
    });
    const qs = query.toString();
    return apiFetch<PaginatedResponse<Product>>(
      `/products${qs ? `?${qs}` : ''}`
    );
  },

  getProduct: (slug: string) =>
    apiFetch<{ product: Product }>(`/products/${slug}`),

  getCategories: () => apiFetch<{ categories: Category[] }>('/categories'),

  getCategory: (slug: string) =>
    apiFetch<{ category: Category }>(`/categories/${slug}`),

  getReviews: (productId: number) =>
    apiFetch<{ reviews: Review[]; average_rating: number }>(
      `/products/${productId}/reviews`
    ),

  createReview: (
    productId: number,
    data: { order_id: number; rating: number; title?: string; body?: string }
  ) =>
    apiFetch<{ review: Review }>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Cart API ──────────────────────────────────────────────────────────────
export const cart = {
  getCart: () => apiFetch<{ items: CartItem[] }>('/cart'),

  addToCart: (variantId: number, quantity: number) =>
    apiFetch<{ items: CartItem[] }>('/cart', {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity }),
    }),

  updateCartItem: (itemId: number, quantity: number) =>
    apiFetch<{ items: CartItem[] }>(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeFromCart: (itemId: number) =>
    apiFetch<{ items: CartItem[] }>(`/cart/${itemId}`, {
      method: 'DELETE',
    }),

  clearCart: () =>
    apiFetch<{ message: string }>('/cart', {
      method: 'DELETE',
    }),
};

// ─── Wishlist API ──────────────────────────────────────────────────────────
export const wishlist = {
  getWishlist: () => apiFetch<{ items: WishlistItem[] }>('/wishlist'),

  addToWishlist: (productId: number) =>
    apiFetch<{ items: WishlistItem[] }>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    }),

  removeFromWishlist: (productId: number) =>
    apiFetch<{ items: WishlistItem[] }>(`/wishlist/${productId}`, {
      method: 'DELETE',
    }),
};

// ─── Orders API ────────────────────────────────────────────────────────────
export const orders = {
  getOrders: () => apiFetch<{ orders: Order[] }>('/orders'),

  getOrder: (id: number) => apiFetch<{ order: Order }>(`/orders/${id}`),

  createOrder: (data: {
    address_id: number;
    payment_method: string;
    coupon_code?: string;
  }) =>
    apiFetch<{
      order: Order;
      razorpay_order_id?: string;
      razorpay_key?: string;
    }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyPayment: (data: {
    order_id: number;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) =>
    apiFetch<{ order: Order; message: string }>('/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelOrder: (id: number) =>
    apiFetch<{ order: Order; message: string }>(`/orders/${id}/cancel`, {
      method: 'POST',
    }),
};

// ─── Addresses API ─────────────────────────────────────────────────────────
export const addresses = {
  getAddresses: () => apiFetch<{ addresses: Address[] }>('/addresses'),

  createAddress: (data: Omit<Address, 'id' | 'user_id'>) =>
    apiFetch<{ address: Address }>('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAddress: (id: number, data: Partial<Omit<Address, 'id' | 'user_id'>>) =>
    apiFetch<{ address: Address }>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAddress: (id: number) =>
    apiFetch<{ message: string }>(`/addresses/${id}`, {
      method: 'DELETE',
    }),
};
