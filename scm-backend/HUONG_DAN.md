# SCM Backend – Hướng dẫn cài đặt & sử dụng

## Yêu cầu
- **Python 3.8+** (không cần cài thêm thư viện, chỉ dùng stdlib)
- **Node.js 18+** (cho frontend Vite)

---

## Bước 1: Khởi động Backend

```bash
cd scm-backend

# Cách 1 – Script tự động (Linux/Mac)
bash start.sh

# Cách 2 – Thủ công
python3 init_db.py   # Tạo database (chỉ cần 1 lần)
python3 server.py    # Khởi động server
```

Server chạy tại: **http://localhost:8000**

---

## Bước 2: Khởi động Frontend

```bash
cd demowebSCM-main   # thư mục gốc dự án
npm install
npm run dev
```

Truy cập: **http://localhost:5173**

---

## Tài khoản đăng nhập

| Username | Password | Vai trò | Trang mặc định |
|---|---|---|---|
| `admin` | `admin123` | Quản trị viên | Dashboard |
| `purchasing` | `pur123` | Mua hàng | Tạo PR |
| `manager` | `mgr123` | Quản lý | Duyệt PR |
| `warehouse` | `wh123` | Kho vận | Nhập kho |
| `finance` | `fin123` | Tài chính | Đối soát |

---

## Dữ liệu ban đầu

| Bảng | Số bản ghi |
|---|---|
| users | 7 |
| products | 20 |
| vendors | 10 |
| purchase_requests | 15 |
| purchase_orders | 12 |
| goods_receipts | 7 |
| invoices | 9 |
| finance_reconciliations | 7 |
| shipments | 5 |
| audit_logs | 15 |

---

## API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/products` | Danh sách sản phẩm |
| GET | `/api/vendors` | Danh sách nhà cung cấp |
| POST | `/api/vendors` | Thêm nhà cung cấp |
| GET | `/api/purchase-requests` | Danh sách PR |
| POST | `/api/purchase-requests` | Tạo PR mới |
| PATCH | `/api/purchase-requests/:id/approve` | Duyệt PR |
| PATCH | `/api/purchase-requests/:id/reject` | Từ chối PR |
| PATCH | `/api/purchase-requests/:id/submit` | Gửi duyệt PR nháp |
| GET | `/api/purchase-orders` | Danh sách PO |
| POST | `/api/purchase-orders` | Tạo PO mới |
| PATCH | `/api/purchase-orders/:id/status` | Cập nhật trạng thái PO |
| GET | `/api/goods-receipts` | Danh sách GRN |
| POST | `/api/goods-receipts` | Tạo phiếu nhập kho |
| GET | `/api/finance/reconciliations` | Đối soát tài chính |
| GET | `/api/shipments` | Lô hàng vận chuyển |
| GET | `/api/audit-logs` | Nhật ký hệ thống |
| GET | `/api/dashboard/stats` | Thống kê dashboard |

---

## Reset dữ liệu

```bash
bash scm-backend/reset_db.sh
```

---

## Cấu trúc thư mục

```
scm-backend/
├── server.py       ← Backend Python (HTTP server + REST API)
├── init_db.py      ← Tạo database + dữ liệu giả
├── scm.db          ← SQLite database (tạo tự động)
├── start.sh        ← Script khởi động
└── reset_db.sh     ← Reset dữ liệu

demowebSCM-main/
└── src/app/
    ├── services/
    │   └── api.ts          ← ★ Kết nối API backend
    ├── context/
    │   └── AuthContext.tsx ← Dùng API thực
    └── pages/              ← Tất cả trang đã cập nhật
        ├── Dashboard.tsx
        ├── CreatePR.tsx
        ├── PRTracking.tsx
        ├── PRApproval.tsx
        ├── VendorList.tsx
        ├── POManagement.tsx
        ├── WarehouseReceiving.tsx
        ├── Logistics.tsx
        ├── FinanceReconciliation.tsx
        └── AuditLog.tsx
```
