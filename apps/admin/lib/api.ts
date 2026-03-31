import type {
  User,
  Product,
  ProductVariant,
  Category,
  Order,
  Coupon,
  AdminDashboard,
  PaginatedResponse,
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

  const isFormData = fetchOptions.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
      await new Promise<void>((resolve) => {
        subscribeTokenRefresh(() => resolve());
      });
    }

    const retryHeaders: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ─── Auth API ──────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),

  getMe: () => apiFetch<any>('/auth/me'),

  refresh: () =>
    apiFetch<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),
};

// ─── Admin API ──────────────────────────────────────────────────────────────
export const admin = {
  getDashboard: () => apiFetch<AdminDashboard>('/admin/dashboard'),

  getOrders: (params: {
    status?: string;
    payment_status?: string;
    page?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.payment_status) query.set('payment_status', params.payment_status);
    if (params.page) query.set('page', String(params.page));
    const qs = query.toString();
    return apiFetch<PaginatedResponse<Order>>(`/admin/orders${qs ? `?${qs}` : ''}`);
  },

  getOrder: (id: string) =>
    apiFetch<any>(`/admin/orders/${id}`),

  updateOrderStatus: (
    id: string,
    data: {
      status: string;
      courier_name?: string;
      tracking_url?: string;
    }
  ) =>
    apiFetch<any>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getProducts: (params: {
    page?: number;
    search?: string;
    category?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    const qs = query.toString();
    return apiFetch<PaginatedResponse<Product>>(`/admin/products${qs ? `?${qs}` : ''}`);
  },

  createProduct: (data: Record<string, any>) =>
    apiFetch<any>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: Record<string, any>) =>
    apiFetch<any>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    apiFetch<any>(`/admin/products/${id}`, { method: 'DELETE' }),

  uploadProductImage: (id: string, formData: FormData) =>
    apiFetch<any>(`/admin/products/${id}/images`, {
      method: 'POST',
      body: formData,
    }),

  createVariant: (productId: string, data: Record<string, any>) =>
    apiFetch<any>(`/admin/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateVariant: (id: string, data: Record<string, any>) =>
    apiFetch<any>(`/admin/variants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getCategories: () =>
    apiFetch<any[]>('/admin/categories'),

  createCategory: (data: {
    name: string;
    slug?: string;
    description?: string;
    image_url?: string;
    sort_order?: number;
  }) =>
    apiFetch<any>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: Partial<Category>) =>
    apiFetch<any>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getCoupons: () => apiFetch<any[]>('/admin/coupons'),

  createCoupon: (data: Record<string, any>) =>
    apiFetch<any>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCoupon: (id: string, data: Record<string, any>) =>
    apiFetch<any>(`/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getUsers: (params: { page?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return apiFetch<PaginatedResponse<User>>(`/admin/users${qs ? `?${qs}` : ''}`);
  },
};

// Unified api namespace for convenient imports
export const api = { auth, admin };
