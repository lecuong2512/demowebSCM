# SCM System - Authentication, Permissions & Purchase Request Architecture

## Overview
This is a full-stack Supply Chain Management (SCM) system built with React/TypeScript frontend and Python backend. It implements role-based access control (RBAC) and purchase request workflows.

---

## 1. Authentication & Role System

### 1.1 Role Definitions
**5 User Roles** defined in [scm-backend/init_db.py](scm-backend/init_db.py#L28):
```sql
role TEXT NOT NULL CHECK(role IN ('admin','purchasing','warehouse','finance','manager'))
```

**Role Details:**
| Role | Username | Password | Credentials | Primary Responsibilities |
|------|----------|----------|-------------|-------------------------|
| **admin** | admin | admin123 | U001 (Lê Văn An) | Full system access, all operations |
| **purchasing** | purchasing | pur123 | U002 (Lê Hoàng Hà) | Create PRs, track PRs, manage vendors, manage POs |
| **manager** | manager | mgr123 | U005 (Lê Việt Cường) | Approve/reject PRs, view dashboard, audit logs |
| **warehouse** | warehouse | wh123 | U003 (Đặng Hữu Hiệp) | Receive goods, manage logistics |
| **finance** | finance | fin123 | U004 (Bùi Đình Tuấn) | Finance reconciliation, audit logs |

*Credentials stored in [scm-backend/init_db.py#L185-L189](scm-backend/init_db.py#L185-L189)*

### 1.2 Authentication Flow

#### Backend Authentication ([scm-backend/server.py](scm-backend/server.py))

**Login Process ([lines 249-271](scm-backend/server.py#L249-L271)):**
```python
def login(self):
    # 1. Get username/password from request body
    # 2. Hash password using SHA256
    # 3. Query users table for active user
    # 4. Verify password hash matches
    # 5. Create JWT token with payload:
    #    - id, username, fullName, role, email
    # 6. Log login action
    # 7. Return token + user object
```

**JWT Token Implementation ([server.py](scm-backend/server.py#L21-L54)):**
- JWT Secret: `'scm-secret-key-2026'`
- Token format: `header.payload.signature`
- Expiry: 7 days from creation
- HS256 (HMAC SHA256) algorithm

**Get User from Token ([server.py#L138-L143](scm-backend/server.py#L138-L143)):**
```python
def get_user(self) -> dict | None:
    auth = self.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token = auth[7:]
    return verify_token(token)
```

#### Frontend Authentication ([src/app/context/AuthContext.tsx](src/app/context/AuthContext.tsx))

**User Type Definition:**
```typescript
export type UserRole = 'admin' | 'purchasing' | 'warehouse' | 'finance' | 'manager';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  avatarUrl?: string;
}
```

**Auth Context ([AuthContext.tsx](src/app/context/AuthContext.tsx)):**
- **Persistent Storage**: User object and token saved to localStorage
- **Auto-sync**: On app load (F5), verifies token and syncs user profile from `/api/users/me`
- **Login**: Calls `api.auth.login()`, saves token and user to localStorage
- **Logout**: Clears token and user data
- **Profile Updates**: Can update fullName and avatarUrl

**Quick Login Shortcuts ([src/app/pages/Login.tsx](src/app/pages/Login.tsx#L5-L9)):**
5 quick login buttons for testing each role (used in development/testing)

---

## 2. Role-Based Access Control (RBAC)

### 2.1 Frontend Access Control

**Menu-Based Permission System ([src/app/components/Layout.tsx](src/app/components/Layout.tsx#L32-L78)):**

```typescript
interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];  // Which roles can see this menu item
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Dashboard', roles: ['admin', 'manager'] },
  { path: '/pr/create', label: 'Tạo yêu cầu mua hàng', roles: ['admin', 'purchasing', 'manager'] },
  { path: '/pr/tracking', label: 'Theo dõi PR', roles: ['admin', 'purchasing', 'manager'] },
  { path: '/pr/approval', label: 'Duyệt yêu cầu', roles: ['admin', 'manager'] },
  { path: '/vendors', label: 'Nhà cung cấp', roles: ['admin', 'purchasing', 'manager'] },
  { path: '/po', label: 'Quản lý PO', roles: ['admin', 'purchasing', 'manager'] },
  { path: '/warehouse/receiving', label: 'Nhập kho', roles: ['admin', 'warehouse'] },
  { path: '/logistics', label: 'Logistics', roles: ['admin', 'warehouse'] },
  { path: '/finance/reconciliation', label: 'Đối soát', roles: ['admin', 'finance'] },
  { path: '/audit', label: 'Audit Log', roles: ['admin', 'finance', 'manager'] },
];
```

**Menu Filtering ([Layout.tsx#L178](src/app/components/Layout.tsx#L178)):**
```typescript
const filteredMenuItems = menuItems.filter(item => 
  user && item.roles.includes(user.role)
);
```

**Access Control by Role:**
- **Admin**: See all menu items (full access)
- **Purchasing**: Create/track PRs, manage vendors and POs
- **Manager**: Dashboard, approve/reject PRs, view audit logs
- **Warehouse**: Warehouse receiving, logistics
- **Finance**: Finance reconciliation, audit logs

### 2.2 Backend Permission Checks

**Authentication Verification (all endpoints):**
Every endpoint in the backend starts with:
```python
user = self.get_user()
if not user:
    return self.send_error_json('Unauthorized', 401)
```

**Role-Based Authorization (specific endpoints):**

**Purchase Request Approval ([server.py#L481-L482](scm-backend/server.py#L481-L482)):**
```python
def approve_pr(self, pr_id):
    user = self.get_user()
    if not user:
        return self.send_error_json('Unauthorized', 401)
    if user['role'] not in ('manager', 'admin'):
        return self.send_error_json('Không có quyền duyệt', 403)  # Permission denied
```

**Purchase Request Rejection ([server.py#L568-L569](scm-backend/server.py#L568-L569)):**
```python
def reject_pr(self, pr_id):
    user = self.get_user()
    if not user:
        return self.send_error_json('Unauthorized', 401)
    if user['role'] not in ('manager', 'admin'):
        return self.send_error_json('Không có quyền từ chối', 403)
```

**Only manager and admin can approve/reject PRs.** Other roles cannot access these endpoints.

---

## 3. Purchase Request Implementation

### 3.1 PR Creation Flow

**Frontend Component: [src/app/pages/CreatePR.tsx](src/app/pages/CreatePR.tsx)**

**Process:**
1. User selects a product from dropdown
2. Enters quantity and reason
3. AI suggestion shows recommended quantity (deficit + 30% buffer)
4. Can save as 'draft' or 'pending' (submit for approval)

**API Call:**
```typescript
await api.purchaseRequests.create({
  product_id: selectedProduct.id,
  quantity: quantity,
  reason: reason,
  status: 'draft' | 'pending'
});
```

**Backend Handler: [server.py#L424-L461](scm-backend/server.py#L424-L461)**

```python
def create_pr(self):
    # 1. Verify user is authenticated
    # 2. Validate required fields: product_id, quantity, reason
    # 3. Look up product and calculate AI suggestion
    # 4. Insert PR into database with:
    #    - status: 'draft' or 'pending'
    #    - created_by: user ID
    #    - created_date: today
    # 5. Log action (CREATE_PR or SUBMIT_PR)
    # 6. Return created PR
```

**Database Schema: [init_db.py#L52-L72](scm-backend/init_db.py#L52-L72)**
```sql
CREATE TABLE purchase_requests (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    current_stock INTEGER NOT NULL,
    ai_suggestion INTEGER,
    created_by TEXT NOT NULL,
    created_by_name TEXT NOT NULL,
    created_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK(status IN ('draft','pending','approved','rejected')),
    rejection_reason TEXT,
    approved_by TEXT,
    approved_by_name TEXT,
    approved_date TEXT,
    notes TEXT
)
```

**PR Status Workflow:**
```
┌─────────┐
│  draft  │ (saved but not submitted)
└────┬────┘
     │ (user clicks submit)
     ▼
┌──────────┐
│ pending  │ (waiting for approval)
└────┬────────────┬─────────────────┐
     │            │                 │
  approve      reject            (user can update)
     │            │
     ▼            ▼
┌─────────┐  ┌─────────┐
│approved │  │rejected │
└─────────┘  └─────────┘
```

### 3.2 PR Approval Flow

**Frontend Component: [src/app/pages/PRApproval.tsx](src/app/pages/PRApproval.tsx)**

**Requirements to Approve:**
1. Select a pending PR
2. Optionally adjust quantity
3. Select vendor (auto-selects highest-rated)
4. Enter unit price
5. Set delivery days (default: 7)

**API Call:**
```typescript
await api.purchaseRequests.approve(selectedPR.id, {
  adjusted_quantity: adjustedQty,     // optional
  vendor_id: selectedVendorId,        // required
  unit_price: unitPrice,              // optional (uses product.last_price if not set)
  delivery_days: deliveryDays,        // optional (default: 7)
});
```

**Backend Handler: [server.py#L481-L567](scm-backend/server.py#L481-L567)**

```python
def approve_pr(self, pr_id):
    # 1. Verify user is manager or admin (403 if not)
    # 2. Verify PR exists and status is 'pending'
    # 3. Update PR status to 'approved'
    # 4. AUTO-CREATE Purchase Order:
    #    - Uses selected vendor or highest-rated vendor
    #    - Sets quantity and unit price
    #    - Calculates expected delivery date
    # 5. AUTO-CREATE Shipment:
    #    - Assigns random carrier (Viettel, GHN, J&T, etc.)
    #    - Generates tracking number
    # 6. Log approval + auto-create actions
    # 7. Return updated PR
```

**Automatic Cascading Operations:**
When a PR is approved, the system automatically:
1. ✅ Updates PR status to 'approved'
2. ✅ Creates Purchase Order (PO) linked to the PR
3. ✅ Creates Shipment with carrier and tracking number

### 3.3 PR Rejection Flow

**Backend Handler: [server.py#L568-L592](scm-backend/server.py#L568-L592)**

```python
def reject_pr(self, pr_id):
    # 1. Verify user is manager or admin (403 if not)
    # 2. Verify PR exists
    # 3. Require rejection reason
    # 4. Update PR status to 'rejected'
    # 5. Store rejection reason
    # 6. Log rejection action
    # 7. Return updated PR
```

**Frontend allows rejection with reason:** [src/app/pages/PRApproval.tsx](src/app/pages/PRApproval.tsx)

### 3.4 PR Tracking

**Frontend Component: [src/app/pages/PRTracking.tsx](src/app/pages/PRTracking.tsx)**

**Features:**
- View all PRs (any user can see all PRs - no row-level security)
- Filter by status: draft, pending, approved, rejected
- Search by PR ID, product name, or creator
- Shows:
  - PR ID
  - Product name
  - Quantity
  - Creator
  - Status
  - Approval info
  - Rejection reason (if applicable)

**Summary Statistics:**
- Total requests
- Pending count
- Approved count
- Rejected count

---

## 4. Permission Enforcement Patterns

### 4.1 Backend Permission Check Pattern

Every protected operation follows this pattern:

```python
def operation(self):
    # Step 1: Get current user from JWT token
    user = self.get_user()
    if not user:
        return self.send_error_json('Unauthorized', 401)
    
    # Step 2: Check role-based permission (if needed)
    if user['role'] not in ('manager', 'admin'):
        return self.send_error_json('Không có quyền [action]', 403)
    
    # Step 3: Perform operation
    # ...
```

### 4.2 HTTP Status Codes

- **401 Unauthorized**: User not authenticated (no valid token)
- **403 Forbidden**: User authenticated but lacks required role/permission
- **404 Not Found**: Resource doesn't exist
- **200 OK**: Success

### 4.3 Frontend Permission Check Pattern

Frontend doesn't enforce permissions (server is source of truth), but:
1. Hides UI elements based on role (menu items)
2. Catches 403 errors from server and shows "No Permission" message
3. Never tries to call endpoints user's role can't access

---

## 5. Data Flow Diagram

```
┌─────────────────────┐
│   Frontend (React)  │
│   ─────────────────│
│ • AuthContext      │
│ • API Layer        │
│ • Components       │
└──────────┬──────────┘
           │
         JWT Token (Bearer header)
           │
           ▼
┌─────────────────────┐
│ Backend (Python)    │
│ ─────────────────── │
│ • verify_token()    │
│ • get_user()        │
│ • Role checks       │
│ • Database queries  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   SQLite Database   │
│ ─────────────────── │
│ • Users (role)      │
│ • Purchase Requests │
│ • Purchase Orders   │
│ • Shipments         │
└─────────────────────┘
```

---

## 6. Key Files Reference

### Frontend
- **Authentication**: [src/app/context/AuthContext.tsx](src/app/context/AuthContext.tsx)
- **Login Page**: [src/app/pages/Login.tsx](src/app/pages/Login.tsx)
- **Layout/RBAC**: [src/app/components/Layout.tsx](src/app/components/Layout.tsx)
- **Create PR**: [src/app/pages/CreatePR.tsx](src/app/pages/CreatePR.tsx)
- **PR Approval**: [src/app/pages/PRApproval.tsx](src/app/pages/PRApproval.tsx)
- **PR Tracking**: [src/app/pages/PRTracking.tsx](src/app/pages/PRTracking.tsx)
- **API Layer**: [src/app/services/api.ts](src/app/services/api.ts)

### Backend
- **Server**: [scm-backend/server.py](scm-backend/server.py)
  - Authentication: lines 21-54 (JWT), 249-271 (login)
  - User management: lines 138-143, 281-303
  - Purchase Request: lines 424-461 (create), 481-567 (approve), 568-592 (reject)
  - Permission checks: throughout all endpoint handlers

- **Database Setup**: [scm-backend/init_db.py](scm-backend/init_db.py)
  - User roles: line 28
  - Seed users: lines 185-189
  - Schema: complete database structure

---

## 7. Security Considerations

✅ **Implemented:**
- JWT tokens with expiry (7 days)
- Role-based access control (RBAC) at backend
- Password hashing (SHA256)
- Authorization checks on all sensitive endpoints
- Logging of all actions (audit trail)
- Token verification on every request

⚠️ **Notes for Production:**
- Use HTTPS instead of HTTP
- Use bcrypt or Argon2 instead of SHA256 for password hashing
- Add request rate limiting
- Implement CORS properly (currently allows all origins)
- Add CSRF tokens for state-changing operations
- Use environment variables for JWT secret
- Consider implementing refresh token rotation
- Add audit log retention policies

---

## 8. Testing the System

**Quick Login Credentials:**
```
Admin:       username=admin,      password=admin123
Purchasing:  username=purchasing, password=pur123
Manager:     username=manager,    password=mgr123
Warehouse:   username=warehouse,  password=wh123
Finance:     username=finance,    password=fin123
```

**Test Permission Enforcement:**
1. Login as `purchasing` → Cannot see "Duyệt yêu cầu" menu (requires manager/admin)
2. Login as `manager` → Can see all PR management options
3. Login as `warehouse` → Only sees warehouse-related operations
4. Try approve/reject PR as non-manager → Gets 403 error from server

---

## 9. API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login (no auth required)
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update profile

### Purchase Requests
- `GET /api/purchase-requests` - List all PRs
- `GET /api/purchase-requests/{id}` - Get single PR
- `POST /api/purchase-requests` - Create PR
- `PATCH /api/purchase-requests/{id}/submit` - Submit draft PR
- `PATCH /api/purchase-requests/{id}/approve` - Approve PR (manager/admin only)
- `PATCH /api/purchase-requests/{id}/reject` - Reject PR (manager/admin only)

### Related Operations (auto-triggered)
- `POST /api/purchase-orders` - Auto-created on PR approval
- `POST /api/shipments` - Auto-created on PR approval

