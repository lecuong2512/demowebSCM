"""
SCM System Backend Server
Pure Python stdlib - no external dependencies needed
Runs on http://localhost:8000
"""
import json
import sqlite3
import hashlib
import hmac
import base64
import time
import os
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'scm.db')
JWT_SECRET = 'scm-secret-key-2026'
PORT = 8000

# ─── Simple JWT ────────────────────────────────────────────────────────────────

def create_token(payload: dict) -> str:
    header = base64.urlsafe_b64encode(json.dumps({'alg':'HS256','typ':'JWT'}).encode()).decode().rstrip('=')
    payload['exp'] = int(time.time()) + 86400 * 7  # 7 days
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    sig_input = f"{header}.{body}".encode()
    sig = hmac.new(JWT_SECRET.encode(), sig_input, hashlib.sha256).digest()
    signature = base64.urlsafe_b64encode(sig).decode().rstrip('=')
    return f"{header}.{body}.{signature}"

def verify_token(token: str) -> dict | None:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header, body, signature = parts
        sig_input = f"{header}.{body}".encode()
        expected_sig = hmac.new(JWT_SECRET.encode(), sig_input, hashlib.sha256).digest()
        expected_b64 = base64.urlsafe_b64encode(expected_sig).decode().rstrip('=')
        if not hmac.compare_digest(signature, expected_b64):
            return None
        pad = 4 - len(body) % 4
        payload = json.loads(base64.urlsafe_b64decode(body + '=' * pad))
        if payload.get('exp', 0) < time.time():
            return None
        return payload
    except Exception:
        return None

# ─── DB helpers ────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def rows_to_list(rows) -> list:
    return [dict(r) for r in rows]


def ensure_user_avatar_column():
    """Migration: thêm cột avatar_data cho DB cũ."""
    with get_db() as conn:
        cols = [r[1] for r in conn.execute('PRAGMA table_info(users)').fetchall()]
        if 'avatar_data' not in cols:
            conn.execute('ALTER TABLE users ADD COLUMN avatar_data TEXT')
            conn.commit()
            print('✓ Migration: users.avatar_data added')


def user_row_to_client(row) -> dict:
    """Chuẩn hoá user từ DB → JSON frontend (camelCase + avatarUrl)."""
    d = dict(row)
    out = {
        'id': d['id'],
        'username': d['username'],
        'fullName': d['full_name'],
        'role': d['role'],
        'email': d['email'],
    }
    ad = d.get('avatar_data')
    if ad:
        out['avatarUrl'] = ad
    return out

def next_id(prefix: str, table: str, id_col: str = 'id') -> str:
    with get_db() as conn:
        rows = conn.execute(f"SELECT {id_col} FROM {table} WHERE {id_col} LIKE '{prefix}%'").fetchall()
        nums = []
        for r in rows:
            m = re.search(r'\d+$', r[0])
            if m:
                nums.append(int(m.group()))
        num = max(nums) + 1 if nums else 1
        return f"{prefix}{num:03d}"

def log_action(user_id, user_name, action, action_label, details, category, ip='127.0.0.1'):
    log_id = next_id('LOG', 'audit_logs')
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with get_db() as conn:
        conn.execute("""INSERT INTO audit_logs (id,timestamp,user_id,user_name,action,action_label,details,ip_address,category)
            VALUES (?,?,?,?,?,?,?,?,?)""", (log_id, ts, user_id, user_name, action, action_label, details, ip, category))
        conn.commit()

# ─── Request Handler ──────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]} {args[1]}")

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, default=str).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, message, status=400):
        self.send_json({'error': message}, status)

    def get_body(self) -> dict:
        length = int(self.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def get_user(self) -> dict | None:
        auth = self.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return None
        token = auth[7:]
        return verify_token(token)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')
        qs = parse_qs(parsed.query)

        routes = {
            '/api/health':                   self.health,
            '/api/users/me':                 self.get_me,
            '/api/products':                 self.get_products,
            '/api/vendors':                  self.get_vendors,
            '/api/purchase-requests':        self.get_prs,
            '/api/purchase-orders':          self.get_pos,
            '/api/goods-receipts':           self.get_grns,
            '/api/finance/reconciliations':  self.get_reconciliations,
            '/api/shipments':                self.get_shipments,
            '/api/audit-logs':               self.get_audit_logs,
            '/api/dashboard/stats':          self.get_dashboard_stats,
        }

        # Dynamic routes
        pr_match = re.match(r'^/api/purchase-requests/(\w+)$', path)
        po_match = re.match(r'^/api/purchase-orders/(\w+)$', path)
        vendor_match = re.match(r'^/api/vendors/(\w+)$', path)
        product_match = re.match(r'^/api/products/(\w+)$', path)

        if path in routes:
            routes[path](qs)
        elif pr_match:
            self.get_pr(pr_match.group(1))
        elif po_match:
            self.get_po(po_match.group(1))
        elif vendor_match:
            self.get_vendor(vendor_match.group(1))
        elif product_match:
            self.get_product(product_match.group(1))
        else:
            self.send_error_json('Not found', 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')

        routes = {
            '/api/auth/login':            self.login,
            '/api/purchase-requests':     self.create_pr,
            '/api/purchase-orders':       self.create_po,
            '/api/goods-receipts':        self.create_grn,
            '/api/vendors':               self.create_vendor,
        }

        if path in routes:
            routes[path]()
        else:
            self.send_error_json('Not found', 404)

    def do_PATCH(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')

        if path == '/api/users/me':
            return self.patch_me()

        pr_approve = re.match(r'^/api/purchase-requests/(\w+)/approve$', path)
        pr_reject  = re.match(r'^/api/purchase-requests/(\w+)/reject$', path)
        pr_submit  = re.match(r'^/api/purchase-requests/(\w+)/submit$', path)
        po_status  = re.match(r'^/api/purchase-orders/(\w+)/status$', path)

        if pr_approve:
            self.approve_pr(pr_approve.group(1))
        elif pr_reject:
            self.reject_pr(pr_reject.group(1))
        elif pr_submit:
            self.submit_pr(pr_submit.group(1))
        elif po_status:
            self.update_po_status(po_status.group(1))
        else:
            self.send_error_json('Not found', 404)

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')

        pr_match = re.match(r'^/api/purchase-requests/(\w+)$', path)
        vendor_match = re.match(r'^/api/vendors/(\w+)$', path)
        product_match = re.match(r'^/api/products/(\w+)$', path)

        if pr_match:
            self.update_pr(pr_match.group(1))
        elif vendor_match:
            self.update_vendor(vendor_match.group(1))
        elif product_match:
            self.update_product(product_match.group(1))
        else:
            self.send_error_json('Not found', 404)

    # ─── Auth ──────────────────────────────────────────────────────────────────

    def health(self, qs=None):
        self.send_json({'status': 'ok', 'timestamp': datetime.now().isoformat()})

    def login(self):
        body = self.get_body()
        username = body.get('username', '').lower().strip()
        password = body.get('password', '')
        if not username or not password:
            return self.send_error_json('Thiếu tên đăng nhập hoặc mật khẩu')

        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        with get_db() as conn:
            user = conn.execute(
                "SELECT * FROM users WHERE username=? AND is_active=1", (username,)
            ).fetchone()

        if not user:
            return self.send_error_json('Tên đăng nhập không tồn tại', 401)
        if user['password_hash'] != pw_hash:
            return self.send_error_json('Mật khẩu không chính xác', 401)

        payload = user_row_to_client(user)
        token = create_token({
            'id': payload['id'],
            'username': payload['username'],
            'fullName': payload['fullName'],
            'role': payload['role'],
            'email': payload['email'],
        })
        log_action(user['id'], user['full_name'], 'LOGIN', 'Đăng nhập',
                   f"Đăng nhập thành công", 'system',
                   self.headers.get('X-Forwarded-For', '127.0.0.1'))
        self.send_json({'token': token, 'user': payload})

    def get_me(self, qs=None):
        u = self.get_user()
        if not u:
            return self.send_error_json('Unauthorized', 401)
        with get_db() as conn:
            row = conn.execute('SELECT * FROM users WHERE id=?', (u['id'],)).fetchone()
        if not row:
            return self.send_error_json('Không tìm thấy người dùng', 404)
        self.send_json(user_row_to_client(row))

    def patch_me(self):
        u = self.get_user()
        if not u:
            return self.send_error_json('Unauthorized', 401)
        body = self.get_body()
        sets = []
        params = []
        if 'fullName' in body:
            fn = (body.get('fullName') or '').strip()
            if not fn:
                return self.send_error_json('Tên hiển thị không được để trống')
            sets.append('full_name=?')
            params.append(fn)
        if 'avatarUrl' in body:
            av = body.get('avatarUrl')
            if av is not None and not isinstance(av, str):
                return self.send_error_json('avatarUrl không hợp lệ')
            if av and len(av) > 900 * 1024:
                return self.send_error_json('Ảnh quá lớn (tối đa ~900KB)')
            sets.append('avatar_data=?')
            params.append(av if av else None)
        if not sets:
            return self.send_error_json('Không có dữ liệu cập nhật')
        params.append(u['id'])
        with get_db() as conn:
            conn.execute(f"UPDATE users SET {', '.join(sets)} WHERE id=?", params)
            conn.commit()
            row = conn.execute('SELECT * FROM users WHERE id=?', (u['id'],)).fetchone()
        log_action(u['id'], row['full_name'], 'UPDATE_PROFILE', 'Cập nhật hồ sơ',
                   'Đổi tên hoặc ảnh đại diện', 'system')
        self.send_json(user_row_to_client(row))

    # ─── Products ──────────────────────────────────────────────────────────────

    def get_products(self, qs=None):
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM products ORDER BY category, name").fetchall()
        self.send_json(rows_to_list(rows))

    def get_product(self, pid):
        with get_db() as conn:
            row = conn.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
        if not row:
            return self.send_error_json('Product not found', 404)
        self.send_json(dict(row))

    def update_product(self, pid):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        body = self.get_body()
        with get_db() as conn:
            conn.execute("""UPDATE products SET name=?, category=?, current_stock=?,
                min_stock=?, unit=?, last_price=? WHERE id=?""",
                (body.get('name'), body.get('category'), body.get('current_stock'),
                 body.get('min_stock'), body.get('unit'), body.get('last_price'), pid))
            conn.commit()
            row = conn.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
        self.send_json(dict(row))

    # ─── Vendors ───────────────────────────────────────────────────────────────

    def get_vendors(self, qs=None):
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM vendors WHERE is_active=1 ORDER BY name").fetchall()
        self.send_json(rows_to_list(rows))

    def get_vendor(self, vid):
        with get_db() as conn:
            row = conn.execute("SELECT * FROM vendors WHERE id=?", (vid,)).fetchone()
        if not row:
            return self.send_error_json('Vendor not found', 404)
        self.send_json(dict(row))

    def create_vendor(self):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        if user['role'] not in ('admin', 'manager'):
            return self.send_error_json('Chỉ admin và quản lý mới có thể thêm nhà cung cấp', 403)
        body = self.get_body()
        vid = next_id('V', 'vendors')
        with get_db() as conn:
            conn.execute("""INSERT INTO vendors (id,name,contact_person,email,phone,address,tax_code,notes)
                VALUES (?,?,?,?,?,?,?,?)""",
                (vid, body.get('name'), body.get('contact_person'), body.get('email'),
                 body.get('phone'), body.get('address',''), body.get('tax_code',''), body.get('notes','')))
            conn.commit()
            row = conn.execute("SELECT * FROM vendors WHERE id=?", (vid,)).fetchone()
        log_action(user['id'], user['fullName'], 'CREATE_VENDOR', 'Thêm nhà cung cấp',
                   f"Thêm vendor {body.get('name')}", 'vendor')
        self.send_json(dict(row), 201)

    def update_vendor(self, vid):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        if user['role'] not in ('admin', 'manager'):
            return self.send_error_json('Chỉ admin và quản lý mới có thể chỉnh sửa nhà cung cấp', 403)
        body = self.get_body()
        with get_db() as conn:
            conn.execute("""UPDATE vendors SET name=?, contact_person=?, email=?,
                phone=?, address=?, notes=? WHERE id=?""",
                (body.get('name'), body.get('contact_person'), body.get('email'),
                 body.get('phone'), body.get('address',''), body.get('notes',''), vid))
            conn.commit()
            row = conn.execute("SELECT * FROM vendors WHERE id=?", (vid,)).fetchone()
        log_action(user['id'], user['fullName'], 'UPDATE_VENDOR', 'Cập nhật nhà cung cấp',
                   f"Cập nhật vendor {vid} - {body.get('name')}", 'vendor')
        self.send_json(dict(row))

    # ─── Purchase Requests ──────────────────────────────────────────────────────

    def get_prs(self, qs=None):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        
        status_filter = qs.get('status', [None])[0] if qs else None
        with get_db() as conn:
            if status_filter and status_filter != 'all':
                rows = conn.execute(
                    "SELECT * FROM purchase_requests WHERE status=? ORDER BY created_date DESC",
                    (status_filter,)).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM purchase_requests ORDER BY created_date DESC").fetchall()
        self.send_json(rows_to_list(rows))

    def get_pr(self, pr_id):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        with get_db() as conn:
            row = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()
        if not row:
            return self.send_error_json('PR not found', 404)
        self.send_json(dict(row))

    def create_pr(self):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        if user['role'] == 'admin':
            return self.send_error_json('Quản trị viên không thể tạo yêu cầu mua hàng', 403)
        body = self.get_body()

        # Validate
        required = ['product_id', 'quantity', 'reason']
        for f in required:
            if not body.get(f):
                return self.send_error_json(f'Thiếu trường: {f}')

        pr_id = next_id('PR', 'purchase_requests')
        today = datetime.now().strftime('%Y-%m-%d')
        status = body.get('status', 'draft')  # draft or pending

        with get_db() as conn:
            product = conn.execute("SELECT * FROM products WHERE id=?", (body['product_id'],)).fetchone()
            if not product:
                return self.send_error_json('Sản phẩm không tồn tại')

            # AI suggestion: deficit + 30% buffer + trend analysis
            deficit = max(0, product['min_stock'] - product['current_stock'])

            # Calculate purchase trend (average monthly consumption over last 3 months)
            three_months_ago = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
            trend_rows = conn.execute("""
                SELECT SUM(gr.received_quantity) as monthly_total, strftime('%Y-%m', gr.received_date) as month
                FROM goods_receipts gr
                JOIN purchase_orders po ON gr.po_id = po.id
                WHERE po.product_id = ? AND gr.received_date >= ?
                GROUP BY strftime('%Y-%m', gr.received_date)
                ORDER BY month DESC
                LIMIT 3
            """, (body['product_id'], three_months_ago)).fetchall()

            avg_monthly_consumption = 0
            if trend_rows:
                total_consumption = sum(row['monthly_total'] for row in trend_rows)
                avg_monthly_consumption = total_consumption / len(trend_rows)

            # AI suggestion: deficit + 30% buffer + 1 month consumption + safety stock
            safety_stock = max(product['min_stock'] * 0.5, 10)  # 50% of min stock or minimum 10
            trend_buffer = avg_monthly_consumption * 0.3  # 30% of average monthly consumption
            ai_suggestion = max(deficit + int(product['min_stock'] * 0.3) + int(trend_buffer) + int(safety_stock), 10)

            conn.execute("""INSERT INTO purchase_requests
                (id,product_id,product_name,quantity,reason,current_stock,ai_suggestion,
                 created_by,created_by_name,created_date,status)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                (pr_id, body['product_id'], product['name'], int(body['quantity']),
                 body['reason'], product['current_stock'], ai_suggestion,
                 user['id'], user['fullName'], today, status))
            conn.commit()
            row = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()

        action = 'SUBMIT_PR' if status == 'pending' else 'CREATE_PR'
        label = 'Gửi yêu cầu mua hàng' if status == 'pending' else 'Tạo yêu cầu nháp'
        log_action(user['id'], user['fullName'], action, label,
                   f"{action} {pr_id} - {product['name']} ({body['quantity']} chiếc)", 'pr')
        self.send_json(dict(row), 201)

    def submit_pr(self, pr_id):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        with get_db() as conn:
            pr = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()
            if not pr:
                return self.send_error_json('PR not found', 404)
            if pr['status'] != 'draft':
                return self.send_error_json('Chỉ có thể gửi yêu cầu ở trạng thái nháp')
            conn.execute("UPDATE purchase_requests SET status='pending' WHERE id=?", (pr_id,))
            conn.commit()
            row = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()
        log_action(user['id'], user['fullName'], 'SUBMIT_PR', 'Gửi yêu cầu duyệt',
                   f"Gửi {pr_id} - {pr['product_name']} lên duyệt", 'pr')
        self.send_json(dict(row))

    def update_pr(self, pr_id):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        if user['role'] == 'admin':
            return self.send_error_json('Quản trị viên không thể chỉnh sửa yêu cầu mua hàng', 403)

        body = self.get_body()
        required = ['product_id', 'quantity', 'reason']
        for f in required:
            if not body.get(f):
                return self.send_error_json(f'Thiếu trường: {f}')

        with get_db() as conn:
            pr = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()
            if not pr:
                return self.send_error_json('PR not found', 404)
            if pr['status'] != 'draft':
                return self.send_error_json('Chỉ có thể chỉnh sửa yêu cầu ở trạng thái nháp')
            if pr['created_by'] != user['id'] and user['role'] not in ('manager',):
                return self.send_error_json('Bạn không có quyền chỉnh sửa nháp này', 403)

            product = conn.execute("SELECT * FROM products WHERE id=?", (body['product_id'],)).fetchone()
            if not product:
                return self.send_error_json('Sản phẩm không tồn tại')

            deficit = max(0, product['min_stock'] - product['current_stock'])
            ai_suggestion = max(deficit + int(product['min_stock'] * 0.3), 10)
            next_status = body.get('status', 'draft')
            if next_status not in ('draft', 'pending'):
                return self.send_error_json('Trạng thái không hợp lệ')

            conn.execute("""UPDATE purchase_requests
                SET product_id=?, product_name=?, quantity=?, reason=?, current_stock=?,
                    ai_suggestion=?, status=?
                WHERE id=?""",
                (body['product_id'], product['name'], int(body['quantity']), body['reason'],
                 product['current_stock'], ai_suggestion, next_status, pr_id))
            conn.commit()
            row = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()

        action = 'UPDATE_PR_DRAFT' if next_status == 'draft' else 'SUBMIT_PR'
        label = 'Cập nhật yêu cầu nháp' if next_status == 'draft' else 'Gửi yêu cầu duyệt'
        log_action(user['id'], user['fullName'], action, label,
                   f"{action} {pr_id} - {row['product_name']} ({row['quantity']} chiếc)", 'pr')
        self.send_json(dict(row))

    def approve_pr(self, pr_id):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        if user['role'] not in ('manager', 'admin'):
            return self.send_error_json('Không có quyền duyệt', 403)

        body = self.get_body()
        today = datetime.now().strftime('%Y-%m-%d')

        with get_db() as conn:
            pr = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()
            if not pr:
                return self.send_error_json('PR not found', 404)
            if pr['status'] != 'pending':
                return self.send_error_json('Chỉ có thể duyệt yêu cầu đang chờ')

            update_qty = body.get('adjusted_quantity') or pr['quantity']

            # Unit price from body or product last price
            product = conn.execute("SELECT * FROM products WHERE id=?", (pr['product_id'],)).fetchone()
            unit_price = float(body.get('unit_price') or (product['last_price'] if product else 0))
            total_amount = int(update_qty) * unit_price

            # Approval authority rule by order value:
            # - < 100M: manager/admin can approve
            # - >= 100M: only admin can approve
            if total_amount >= 100_000_000 and user['role'] != 'admin':
                return self.send_error_json(
                    'Đơn hàng từ 100.000.000 VNĐ trở lên cần phê duyệt bởi giám đốc (admin)',
                    403
                )

            # Update PR status
            conn.execute("""UPDATE purchase_requests 
                SET status='approved', approved_by=?, approved_by_name=?, approved_date=?,
                    quantity=?, notes=?
                WHERE id=?""",
                (user['id'], user['fullName'], today, update_qty,
                 body.get('notes', ''), pr_id))

            # --- Auto-create PO ---
            # Use vendor chosen by approver, fallback to highest-rated
            chosen_vendor_id = body.get('vendor_id', '').strip()
            chosen_vendor = None
            if chosen_vendor_id:
                chosen_vendor = conn.execute(
                    "SELECT * FROM vendors WHERE id=? AND is_active=1", (chosen_vendor_id,)
                ).fetchone()
            if not chosen_vendor:
                chosen_vendor = conn.execute(
                    "SELECT * FROM vendors WHERE is_active=1 ORDER BY rating DESC LIMIT 1"
                ).fetchone()
            if not chosen_vendor:
                chosen_vendor = conn.execute("SELECT * FROM vendors LIMIT 1").fetchone()

            delivery_days = int(body.get('delivery_days') or 7)

            po_id = next_id('PO', 'purchase_orders')
            from datetime import timedelta
            expected_delivery = (datetime.now() + timedelta(days=delivery_days)).strftime('%Y-%m-%d')

            conn.execute("""INSERT INTO purchase_orders
                (id, pr_id, vendor_id, vendor_name, product_id, product_name, quantity,
                 unit_price, total_amount, order_date, expected_delivery, status, created_by)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (po_id, pr_id, chosen_vendor['id'], chosen_vendor['name'],
                 pr['product_id'], pr['product_name'], int(update_qty),
                 unit_price, total_amount, today, expected_delivery,
                 'pending', user['id']))

            # --- Auto-create Shipment with random carrier ---
            import random as _rnd
            carriers = [
                'Viettel Post', 'GHTK', 'GHN Express', 'J&T Express',
                'Ninja Van', 'Best Express'
            ]
            carrier = _rnd.choice(carriers)
            tracking_num = 'TK' + str(_rnd.randint(100000000, 999999999))

            ship_id = next_id('SHIP', 'shipments')
            conn.execute("""INSERT INTO shipments
                (id, po_id, product_name, status, progress, estimated_arrival,
                 current_location, carrier, tracking_number)
                VALUES (?,?,?,?,?,?,?,?,?)""",
                (ship_id, po_id, pr['product_name'], 'pending', 0,
                 expected_delivery, 'Kho nhà cung cấp', carrier, tracking_num))

            conn.commit()
            row = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()

        log_action(user['id'], user['fullName'], 'APPROVE_PR', 'Duyệt yêu cầu mua hàng',
                   f"Duyệt {pr_id} - {pr['product_name']} ({update_qty} chiếc) → {po_id} | NCC: {chosen_vendor['name']}", 'approval')
        log_action(user['id'], user['fullName'], 'AUTO_CREATE_PO', 'Tự động tạo đơn đặt hàng',
                   f"Tạo {po_id} từ {pr_id} - {pr['product_name']} ({update_qty} chiếc) | NCC: {chosen_vendor['name']} | Vận chuyển: {carrier}", 'po')
        self.send_json(dict(row))

    def reject_pr(self, pr_id):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        if user['role'] not in ('manager', 'admin'):
            return self.send_error_json('Không có quyền từ chối', 403)

        body = self.get_body()
        reason = body.get('rejection_reason', '').strip()
        if not reason:
            return self.send_error_json('Cần nhập lý do từ chối')

        with get_db() as conn:
            pr = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()
            if not pr:
                return self.send_error_json('PR not found', 404)
            conn.execute("""UPDATE purchase_requests 
                SET status='rejected', rejection_reason=? WHERE id=?""",
                (reason, pr_id))
            conn.commit()
            row = conn.execute("SELECT * FROM purchase_requests WHERE id=?", (pr_id,)).fetchone()

        log_action(user['id'], user['fullName'], 'REJECT_PR', 'Từ chối yêu cầu mua hàng',
                   f"Từ chối {pr_id} - {pr['product_name']}: {reason[:50]}", 'approval')
        self.send_json(dict(row))

    # ─── Purchase Orders ────────────────────────────────────────────────────────

    def get_pos(self, qs=None):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM purchase_orders ORDER BY order_date DESC").fetchall()
        self.send_json(rows_to_list(rows))

    def get_po(self, po_id):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        with get_db() as conn:
            row = conn.execute("SELECT * FROM purchase_orders WHERE id=?", (po_id,)).fetchone()
        if not row:
            return self.send_error_json('PO not found', 404)
        self.send_json(dict(row))

    def create_po(self):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        body = self.get_body()

        required = ['vendor_id', 'product_id', 'quantity', 'unit_price', 'expected_delivery']
        for f in required:
            if not body.get(f):
                return self.send_error_json(f'Thiếu trường: {f}')

        po_id = next_id('PO', 'purchase_orders')
        today = datetime.now().strftime('%Y-%m-%d')
        qty = int(body['quantity'])
        price = float(body['unit_price'])
        total = qty * price

        with get_db() as conn:
            vendor = conn.execute("SELECT * FROM vendors WHERE id=?", (body['vendor_id'],)).fetchone()
            product = conn.execute("SELECT * FROM products WHERE id=?", (body['product_id'],)).fetchone()
            if not vendor or not product:
                return self.send_error_json('Vendor hoặc sản phẩm không tồn tại')

            conn.execute("""INSERT INTO purchase_orders
                (id,pr_id,vendor_id,vendor_name,product_id,product_name,quantity,unit_price,
                 total_amount,order_date,expected_delivery,status,created_by)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (po_id, body.get('pr_id'), vendor['id'], vendor['name'],
                 product['id'], product['name'], qty, price, total,
                 today, body['expected_delivery'], 'pending', user['id']))
            conn.commit()
            row = conn.execute("SELECT * FROM purchase_orders WHERE id=?", (po_id,)).fetchone()

        log_action(user['id'], user['fullName'], 'CREATE_PO', 'Tạo đơn đặt hàng',
                   f"Tạo {po_id} - {product['name']} ({qty} chiếc) từ {vendor['name']}", 'po')
        self.send_json(dict(row), 201)

    def update_po_status(self, po_id):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        body = self.get_body()
        new_status = body.get('status')
        valid = ('pending','confirmed','shipped','delivered','overdue','cancelled')
        if new_status not in valid:
            return self.send_error_json(f'Trạng thái không hợp lệ. Hợp lệ: {valid}')

        with get_db() as conn:
            po = conn.execute("SELECT * FROM purchase_orders WHERE id=?", (po_id,)).fetchone()
            if not po:
                return self.send_error_json('PO not found', 404)
            actual = datetime.now().strftime('%Y-%m-%d') if new_status == 'delivered' else None
            conn.execute("""UPDATE purchase_orders SET status=?, actual_delivery=?
                WHERE id=?""", (new_status, actual, po_id))
            conn.commit()
            row = conn.execute("SELECT * FROM purchase_orders WHERE id=?", (po_id,)).fetchone()

        log_action(user['id'], user['fullName'], 'UPDATE_PO', 'Cập nhật trạng thái PO',
                   f"PO {po_id} → {new_status}", 'po')
        self.send_json(dict(row))

    # ─── Goods Receipts ─────────────────────────────────────────────────────────

    def get_grns(self, qs=None):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM goods_receipts ORDER BY received_date DESC").fetchall()
        self.send_json(rows_to_list(rows))

    def create_grn(self):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)

        body = self.get_body()
        po_id = body.get('po_id', '').strip()
        received_qty = int(body.get('received_quantity', 0))
        damaged_qty = int(body.get('damaged_quantity', 0))
        notes = body.get('notes', '')

        if not po_id or received_qty <= 0:
            return self.send_error_json('Cần nhập PO và số lượng nhận')

        grn_id = next_id('GRN', 'goods_receipts')
        today = datetime.now().strftime('%Y-%m-%d')

        with get_db() as conn:
            po = conn.execute("SELECT * FROM purchase_orders WHERE id=?", (po_id,)).fetchone()
            if not po:
                return self.send_error_json('PO không tồn tại')

            conn.execute("""INSERT INTO goods_receipts
                (id,po_id,received_quantity,damaged_quantity,received_date,notes,received_by,received_by_name)
                VALUES (?,?,?,?,?,?,?,?)""",
                (grn_id, po_id, received_qty, damaged_qty, today, notes, user['id'], user['fullName']))

            # Update PO status to delivered if received
            conn.execute("UPDATE purchase_orders SET status='delivered', actual_delivery=? WHERE id=?",
                         (today, po_id))

            # Update product stock
            good_qty = received_qty - damaged_qty
            conn.execute("UPDATE products SET current_stock = current_stock + ? WHERE id=?",
                         (good_qty, po['product_id']))

            conn.commit()
            row = conn.execute("SELECT * FROM goods_receipts WHERE id=?", (grn_id,)).fetchone()

        log_action(user['id'], user['fullName'], 'CREATE_GRN', 'Tạo phiếu nhập kho',
                   f"Nhập kho {grn_id} từ {po_id} ({received_qty} chiếc, lỗi: {damaged_qty})", 'warehouse')
        self.send_json(dict(row), 201)

    # ─── Finance ─────────────────────────────────────────────────────────────────

    def get_reconciliations(self, qs=None):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM finance_reconciliations ORDER BY match_date DESC").fetchall()
        self.send_json(rows_to_list(rows))

    # ─── Shipments ───────────────────────────────────────────────────────────────

    def get_shipments(self, qs=None):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM shipments ORDER BY id").fetchall()
        self.send_json(rows_to_list(rows))

    # ─── Audit Logs ──────────────────────────────────────────────────────────────

    def get_audit_logs(self, qs=None):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)
        
        category = qs.get('category', [None])[0] if qs else None
        search = qs.get('search', [None])[0] if qs else None
        limit = int(qs.get('limit', ['100'])[0]) if qs else 100

        with get_db() as conn:
            base_q = "SELECT * FROM audit_logs"
            conditions = []
            params = []
            if category and category != 'all':
                conditions.append("category=?")
                params.append(category)
            if search:
                conditions.append("(user_name LIKE ? OR details LIKE ? OR action_label LIKE ?)")
                params += [f'%{search}%', f'%{search}%', f'%{search}%']
            if conditions:
                base_q += " WHERE " + " AND ".join(conditions)
            base_q += f" ORDER BY timestamp DESC LIMIT {limit}"
            rows = conn.execute(base_q, params).fetchall()
        self.send_json(rows_to_list(rows))

    # ─── Dashboard ───────────────────────────────────────────────────────────────

    def get_dashboard_stats(self, qs=None):
        user = self.get_user()
        if not user:
            return self.send_error_json('Unauthorized', 401)

        with get_db() as conn:
            total_po = conn.execute("SELECT COUNT(*) FROM purchase_orders").fetchone()[0]
            total_spending = conn.execute(
                "SELECT COALESCE(SUM(total_amount),0) FROM purchase_orders WHERE status != 'cancelled'").fetchone()[0]
            low_stock = conn.execute(
                "SELECT COUNT(*) FROM products WHERE current_stock < min_stock").fetchone()[0]
            pending_approvals = conn.execute(
                "SELECT COUNT(*) FROM purchase_requests WHERE status='pending'").fetchone()[0]

            # Monthly trend (last 6 months - use order_date)
            monthly = conn.execute("""
                SELECT 
                    strftime('%m/%Y', order_date) as month,
                    COALESCE(SUM(total_amount),0) as spending,
                    COUNT(*) as orders
                FROM purchase_orders
                WHERE order_date >= date('now', '-6 months')
                  AND status != 'cancelled'
                GROUP BY strftime('%Y-%m', order_date)
                ORDER BY strftime('%Y-%m', order_date)
            """).fetchall()

            # Category distribution
            cat_dist = conn.execute("""
                SELECT p.category, COUNT(*) as value
                FROM purchase_orders po
                JOIN products p ON po.product_id = p.id
                WHERE po.status != 'cancelled'
                GROUP BY p.category
                ORDER BY value DESC
            """).fetchall()

            # Top vendors
            top_vendors = conn.execute("""
                SELECT vendor_name as name, SUM(total_amount) as amount
                FROM purchase_orders
                WHERE status != 'cancelled'
                GROUP BY vendor_id
                ORDER BY amount DESC
                LIMIT 5
            """).fetchall()

        # Format monthly trend
        trend = []
        for r in monthly:
            m, y = r['month'].split('/')
            trend.append({'month': f'T{int(m)}/{y}', 'spending': r['spending'], 'orders': r['orders']})

        # Pad if fewer than 6 months
        if not trend:
            trend = [{'month': 'T2/2026', 'spending': total_spending, 'orders': total_po}]

        self.send_json({
            'totalPurchaseOrders': total_po,
            'totalSpending': total_spending,
            'lowStockAlerts': low_stock,
            'pendingApprovals': pending_approvals,
            'monthlyTrend': trend,
            'categoryDistribution': [{'category': r['category'], 'value': r['value']} for r in cat_dist],
            'topVendors': [{'name': r['name'], 'amount': r['amount']} for r in top_vendors],
        })


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print("⚠️  Database not found! Run: python3 init_db.py")
        exit(1)

    ensure_user_avatar_column()

    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f"""
╔══════════════════════════════════════════════╗
║   SCM Backend Server đang chạy              ║
║   http://localhost:{PORT}                       ║
║                                              ║
║   Endpoints:                                 ║
║   POST /api/auth/login                       ║
║   GET  /api/users/me   PATCH /api/users/me   ║
║   GET  /api/products                         ║
║   GET  /api/vendors                          ║
║   GET  /api/purchase-requests                ║
║   GET  /api/purchase-orders                  ║
║   GET  /api/goods-receipts                   ║
║   GET  /api/finance/reconciliations          ║
║   GET  /api/shipments                        ║
║   GET  /api/audit-logs                       ║
║   GET  /api/dashboard/stats                  ║
║                                              ║
║   Nhấn Ctrl+C để dừng server                ║
╚══════════════════════════════════════════════╝
""")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")
