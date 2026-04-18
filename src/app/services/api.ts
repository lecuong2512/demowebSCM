// API Service Layer - connects to Python backend
// All frontend data calls go through here

const BASE_URL = 'http://localhost:8000/api';

function getToken(): string | null {
  const user = localStorage.getItem('scm_auth_token');
  return user || null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },

  users: {
    me: {
      get: () => request<User>('/users/me'),
      patch: (data: { fullName?: string; avatarUrl?: string | null }) =>
        request<User>('/users/me', {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
    },
  },

  products: {
    list: () => request<Product[]>('/products'),
    get: (id: string) => request<Product>(`/products/${id}`),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  vendors: {
    list: () => request<Vendor[]>('/vendors'),
    get: (id: string) => request<Vendor>(`/vendors/${id}`),
    create: (data: Partial<Vendor>) =>
      request<Vendor>('/vendors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Vendor>) =>
      request<Vendor>(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  purchaseRequests: {
    list: (status?: string) =>
      request<PurchaseRequest[]>(`/purchase-requests${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<PurchaseRequest>(`/purchase-requests/${id}`),
    create: (data: CreatePRData) =>
      request<PurchaseRequest>('/purchase-requests', { method: 'POST', body: JSON.stringify(data) }),
    submit: (id: string) =>
      request<PurchaseRequest>(`/purchase-requests/${id}/submit`, { method: 'PATCH' }),
    approve: (id: string, data: ApproveData) =>
      request<PurchaseRequest>(`/purchase-requests/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    reject: (id: string, reason: string) =>
      request<PurchaseRequest>(`/purchase-requests/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejection_reason: reason }),
      }),
  },

  purchaseOrders: {
    list: () => request<PurchaseOrder[]>('/purchase-orders'),
    get: (id: string) => request<PurchaseOrder>(`/purchase-orders/${id}`),
    create: (data: CreatePOData) =>
      request<PurchaseOrder>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      request<PurchaseOrder>(`/purchase-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  goodsReceipts: {
    list: () => request<GoodsReceipt[]>('/goods-receipts'),
    create: (data: CreateGRNData) =>
      request<GoodsReceipt>('/goods-receipts', { method: 'POST', body: JSON.stringify(data) }),
  },

  finance: {
    reconciliations: () => request<FinanceReconciliation[]>('/finance/reconciliations'),
  },

  shipments: {
    list: () => request<Shipment[]>('/shipments'),
  },

  auditLogs: {
    list: (params?: { category?: string; search?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.category) qs.set('category', params.category);
      if (params?.search) qs.set('search', params.search);
      if (params?.limit) qs.set('limit', String(params.limit));
      return request<AuditLog[]>(`/audit-logs?${qs.toString()}`);
    },
  },

  dashboard: {
    stats: () => request<DashboardStats>('/dashboard/stats'),
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'purchasing' | 'warehouse' | 'finance' | 'manager';
  email: string;
  /** Ảnh đại diện (data URL), lưu trong database (PATCH /users/me) */
  avatarUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  last_price: number;
  description?: string;
  sku?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  rating: number;
  total_orders: number;
  on_time_delivery: number;
  quality_score: number;
  address: string;
  tax_code?: string;
  bank_account?: string;
  notes?: string;
}

export interface PurchaseRequest {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  reason: string;
  current_stock: number;
  ai_suggestion?: number;
  created_by: string;
  created_by_name: string;
  created_date: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_date?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  pr_id?: string;
  vendor_id: string;
  vendor_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  order_date: string;
  expected_delivery: string;
  actual_delivery?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'overdue' | 'cancelled';
  days_overdue?: number;
  created_by: string;
  notes?: string;
}

export interface GoodsReceipt {
  id: string;
  po_id: string;
  received_quantity: number;
  damaged_quantity: number;
  received_date: string;
  notes: string;
  received_by: string;
  received_by_name: string;
  status: string;
}

export interface FinanceReconciliation {
  id: string;
  po_id: string;
  grn_id: string;
  invoice_id: string;
  product_name: string;
  po_amount: number;
  grn_amount: number;
  invoice_amount: number;
  status: 'pending' | 'matched' | 'mismatch' | 'resolved';
  issue?: string;
  match_date?: string;
  resolved_by?: string;
}

export interface Shipment {
  id: string;
  po_id: string;
  product_name: string;
  status: 'pending' | 'in_transit' | 'delayed' | 'delivered';
  current_location?: string;
  progress: number;
  estimated_arrival?: string;
  actual_arrival?: string;
  carrier?: string;
  tracking_number?: string;
  issue?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  action_label: string;
  details: string;
  ip_address?: string;
  category: string;
}

export interface DashboardStats {
  totalPurchaseOrders: number;
  totalSpending: number;
  lowStockAlerts: number;
  pendingApprovals: number;
  monthlyTrend: Array<{ month: string; spending: number; orders: number }>;
  categoryDistribution: Array<{ category: string; value: number }>;
  topVendors: Array<{ name: string; amount: number }>;
}

export interface CreatePRData {
  product_id: string;
  quantity: number;
  reason: string;
  status?: 'draft' | 'pending';
}

export interface ApproveData {
  adjusted_quantity?: number;
  vendor_id?: string;
  unit_price?: number;
  delivery_days?: number;
  notes?: string;
}

export interface CreatePOData {
  pr_id?: string;
  vendor_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  expected_delivery: string;
  notes?: string;
}

export interface CreateGRNData {
  po_id: string;
  received_quantity: number;
  damaged_quantity: number;
  notes: string;
}

// Helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString));
}

export function saveToken(token: string) {
  localStorage.setItem('scm_auth_token', token);
}

export function removeToken() {
  localStorage.removeItem('scm_auth_token');
}
