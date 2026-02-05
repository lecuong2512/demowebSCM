// Mock data for the SCM system

export interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  lastPrice: number;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  rating: number;
  totalOrders: number;
  onTimeDelivery: number;
  qualityScore: number;
  address: string;
}

export interface PurchaseRequest {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  currentStock: number;
  aiSuggestion?: number;
  createdBy: string;
  createdDate: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface PurchaseOrder {
  id: string;
  prId: string;
  vendorId: string;
  vendorName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  orderDate: string;
  expectedDelivery: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'overdue';
  daysOverdue?: number;
}

export interface GoodsReceipt {
  id: string;
  poId: string;
  receivedQuantity: number;
  damagedQuantity: number;
  receivedDate: string;
  notes: string;
  receivedBy: string;
}

// Mock Products
export const mockProducts: Product[] = [
  { id: 'P001', name: 'iPhone 15 Pro Max 256GB', category: 'Điện thoại', currentStock: 45, minStock: 50, unit: 'chiếc', lastPrice: 29990000 },
  { id: 'P002', name: 'Samsung Galaxy S24 Ultra', category: 'Điện thoại', currentStock: 32, minStock: 40, unit: 'chiếc', lastPrice: 27990000 },
  { id: 'P003', name: 'MacBook Air M3 15 inch', category: 'Laptop', currentStock: 18, minStock: 25, unit: 'chiếc', lastPrice: 34990000 },
  { id: 'P004', name: 'Dell XPS 13', category: 'Laptop', currentStock: 22, minStock: 20, unit: 'chiếc', lastPrice: 28990000 },
  { id: 'P005', name: 'iPad Pro 12.9 M2', category: 'Máy tính bảng', currentStock: 28, minStock: 30, unit: 'chiếc', lastPrice: 24990000 },
  { id: 'P006', name: 'AirPods Pro Gen 2', category: 'Phụ kiện', currentStock: 150, minStock: 100, unit: 'chiếc', lastPrice: 5990000 },
  { id: 'P007', name: 'Apple Watch Series 9', category: 'Đồng hồ', currentStock: 35, minStock: 40, unit: 'chiếc', lastPrice: 9990000 },
  { id: 'P008', name: 'Sony WH-1000XM5', category: 'Phụ kiện', currentStock: 42, minStock: 50, unit: 'chiếc', lastPrice: 8990000 },
];

// Mock Vendors
export const mockVendors: Vendor[] = [
  {
    id: 'V001',
    name: 'Apple Việt Nam',
    contact: 'Nguyễn Văn A',
    email: 'contact@apple.vn',
    phone: '024-3974-xxxx',
    rating: 4.8,
    totalOrders: 245,
    onTimeDelivery: 96,
    qualityScore: 98,
    address: 'Tầng 6, Tòa nhà Keangnam, Hà Nội'
  },
  {
    id: 'V002',
    name: 'Samsung Electronics Vietnam',
    contact: 'Trần Thị B',
    email: 'info@samsung.vn',
    phone: '028-3822-xxxx',
    rating: 4.7,
    totalOrders: 312,
    onTimeDelivery: 94,
    qualityScore: 96,
    address: 'Khu công nghệ cao, TP.HCM'
  },
  {
    id: 'V003',
    name: 'Dell Technologies Vietnam',
    contact: 'Lê Văn C',
    email: 'sales@dell.vn',
    phone: '024-3936-xxxx',
    rating: 4.5,
    totalOrders: 189,
    onTimeDelivery: 91,
    qualityScore: 93,
    address: 'Tầng 18, Toà nhà Vincom, Hà Nội'
  },
  {
    id: 'V004',
    name: 'Sony Vietnam',
    contact: 'Phạm Thị D',
    email: 'contact@sony.vn',
    phone: '028-3827-xxxx',
    rating: 4.6,
    totalOrders: 156,
    onTimeDelivery: 92,
    qualityScore: 95,
    address: 'Quận 1, TP.HCM'
  },
  {
    id: 'V005',
    name: 'Phụ Kiện Điện Tử ABC',
    contact: 'Hoàng Văn E',
    email: 'info@pkabc.vn',
    phone: '024-3845-xxxx',
    rating: 4.3,
    totalOrders: 423,
    onTimeDelivery: 88,
    qualityScore: 90,
    address: 'Cầu Giấy, Hà Nội'
  }
];

// Mock Purchase Requests
export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'PR001',
    productId: 'P001',
    productName: 'iPhone 15 Pro Max 256GB',
    quantity: 50,
    reason: 'Dự kiến tăng nhu cầu dịp Tết 2026',
    currentStock: 45,
    aiSuggestion: 60,
    createdBy: 'Lê Hoàng Hà',
    createdDate: '2026-02-01',
    status: 'approved',
    approvedBy: 'Lê Việt Cường',
    approvedDate: '2026-02-02'
  },
  {
    id: 'PR002',
    productId: 'P002',
    productName: 'Samsung Galaxy S24 Ultra',
    quantity: 40,
    reason: 'Tồn kho thấp hơn mức tối thiểu',
    currentStock: 32,
    aiSuggestion: 45,
    createdBy: 'Lê Hoàng Hà',
    createdDate: '2026-02-03',
    status: 'pending',
  },
  {
    id: 'PR003',
    productId: 'P003',
    productName: 'MacBook Air M3 15 inch',
    quantity: 30,
    reason: 'Khuyến mãi đầu năm học',
    currentStock: 18,
    aiSuggestion: 35,
    createdBy: 'Lê Hoàng Hà',
    createdDate: '2026-02-04',
    status: 'pending',
  },
  {
    id: 'PR004',
    productId: 'P007',
    productName: 'Apple Watch Series 9',
    quantity: 25,
    reason: 'Bổ sung tồn kho sau Tết',
    currentStock: 35,
    aiSuggestion: 20,
    createdBy: 'Lê Hoàng Hà',
    createdDate: '2026-01-28',
    status: 'rejected',
    rejectionReason: 'Số lượng yêu cầu quá cao so với nhu cầu thực tế. Đề xuất giảm xuống 15 chiếc.'
  },
  {
    id: 'PR005',
    productId: 'P008',
    productName: 'Sony WH-1000XM5',
    quantity: 35,
    reason: 'Sản phẩm bán chạy, cần bổ sung',
    currentStock: 42,
    aiSuggestion: 30,
    createdBy: 'Lê Hoàng Hà',
    createdDate: '2026-02-05',
    status: 'draft',
  }
];

// Mock Purchase Orders
export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO001',
    prId: 'PR001',
    vendorId: 'V001',
    vendorName: 'Apple Việt Nam',
    productName: 'iPhone 15 Pro Max 256GB',
    quantity: 50,
    unitPrice: 29990000,
    totalAmount: 1499500000,
    orderDate: '2026-02-02',
    expectedDelivery: '2026-02-10',
    status: 'shipped',
  },
  {
    id: 'PO002',
    prId: 'PR006',
    vendorId: 'V002',
    vendorName: 'Samsung Electronics Vietnam',
    productName: 'Samsung Galaxy Z Fold 5',
    quantity: 30,
    unitPrice: 38990000,
    totalAmount: 1169700000,
    orderDate: '2026-01-25',
    expectedDelivery: '2026-01-31',
    status: 'overdue',
    daysOverdue: 5,
  },
  {
    id: 'PO003',
    prId: 'PR007',
    vendorId: 'V003',
    vendorName: 'Dell Technologies Vietnam',
    productName: 'Dell XPS 15',
    quantity: 20,
    unitPrice: 32990000,
    totalAmount: 659800000,
    orderDate: '2026-02-01',
    expectedDelivery: '2026-02-08',
    status: 'confirmed',
  }
];

// Mock Dashboard Stats
export interface DashboardStats {
  totalPurchaseOrders: number;
  totalSpending: number;
  lowStockAlerts: number;
  pendingApprovals: number;
  monthlyTrend: Array<{ month: string; spending: number; orders: number }>;
  categoryDistribution: Array<{ category: string; value: number }>;
  topVendors: Array<{ name: string; amount: number }>;
}

export const mockDashboardStats: DashboardStats = {
  totalPurchaseOrders: 245,
  totalSpending: 45678900000,
  lowStockAlerts: 8,
  pendingApprovals: 12,
  monthlyTrend: [
    { month: 'T8/2025', spending: 3200000000, orders: 45 },
    { month: 'T9/2025', spending: 3500000000, orders: 52 },
    { month: 'T10/2025', spending: 4100000000, orders: 58 },
    { month: 'T11/2025', spending: 3800000000, orders: 49 },
    { month: 'T12/2025', spending: 5200000000, orders: 67 },
    { month: 'T1/2026', spending: 6100000000, orders: 78 },
  ],
  categoryDistribution: [
    { category: 'Điện thoại', value: 45 },
    { category: 'Laptop', value: 25 },
    { category: 'Máy tính bảng', value: 15 },
    { category: 'Phụ kiện', value: 10 },
    { category: 'Đồng hồ', value: 5 },
  ],
  topVendors: [
    { name: 'Apple Việt Nam', amount: 15600000000 },
    { name: 'Samsung Vietnam', amount: 12400000000 },
    { name: 'Dell Vietnam', amount: 8900000000 },
    { name: 'Sony Vietnam', amount: 5200000000 },
    { name: 'Phụ Kiện ABC', amount: 3400000000 },
  ]
};

// Helper function to get product by id
export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find(p => p.id === id);
};

// Helper function to get vendor by id
export const getVendorById = (id: string): Vendor | undefined => {
  return mockVendors.find(v => v.id === id);
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};
