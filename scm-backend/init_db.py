"""
SCM System - Database Initialization & Seed Data
Creates SQLite database with all tables and comprehensive fake data
"""
import sqlite3
import hashlib
import json
import os
from datetime import datetime, timedelta
import random

DB_PATH = os.path.join(os.path.dirname(__file__), 'scm.db')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_tables(conn):
    c = conn.cursor()

    c.executescript("""
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','purchasing','warehouse','finance','manager')),
        email TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        is_active INTEGER DEFAULT 1,
        avatar_data TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 10,
        unit TEXT NOT NULL DEFAULT 'chiếc',
        last_price REAL NOT NULL DEFAULT 0,
        description TEXT,
        sku TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        rating REAL DEFAULT 4.0,
        total_orders INTEGER DEFAULT 0,
        on_time_delivery INTEGER DEFAULT 90,
        quality_score INTEGER DEFAULT 90,
        address TEXT,
        tax_code TEXT,
        bank_account TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS purchase_requests (
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
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','approved','rejected')),
        rejection_reason TEXT,
        approved_by TEXT,
        approved_by_name TEXT,
        approved_date TEXT,
        notes TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
        id TEXT PRIMARY KEY,
        pr_id TEXT,
        vendor_id TEXT NOT NULL,
        vendor_name TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_amount REAL NOT NULL,
        order_date TEXT NOT NULL,
        expected_delivery TEXT NOT NULL,
        actual_delivery TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipped','delivered','overdue','cancelled')),
        days_overdue INTEGER DEFAULT 0,
        created_by TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS goods_receipts (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        received_quantity INTEGER NOT NULL,
        damaged_quantity INTEGER DEFAULT 0,
        received_date TEXT NOT NULL,
        notes TEXT,
        received_by TEXT NOT NULL,
        received_by_name TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        vendor_id TEXT NOT NULL,
        amount REAL NOT NULL,
        invoice_date TEXT NOT NULL,
        due_date TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','matched','mismatch','paid')),
        notes TEXT,
        FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE IF NOT EXISTS finance_reconciliations (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        grn_id TEXT NOT NULL,
        invoice_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        po_amount REAL NOT NULL,
        grn_amount REAL NOT NULL,
        invoice_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','matched','mismatch','resolved')),
        issue TEXT,
        match_date TEXT,
        resolved_by TEXT,
        FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
        FOREIGN KEY (grn_id) REFERENCES goods_receipts(id),
        FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_transit','delayed','delivered')),
        current_location TEXT,
        progress INTEGER DEFAULT 0,
        estimated_arrival TEXT,
        actual_arrival TEXT,
        carrier TEXT,
        tracking_number TEXT,
        issue TEXT,
        FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        action_label TEXT NOT NULL,
        details TEXT NOT NULL,
        ip_address TEXT,
        category TEXT NOT NULL
    );
    """)
    conn.commit()
    print("✓ Tables created")

def seed_users(conn):
    c = conn.cursor()
    users = [
        ('U001', 'admin',      hash_password('admin123'), 'Lê Văn An',      'admin',      'admin@mwg.vn'),
        ('U002', 'purchasing', hash_password('pur123'),   'Lê Hoàng Hà',    'purchasing', 'purchasing@mwg.vn'),
        ('U003', 'warehouse',  hash_password('wh123'),    'Đặng Hữu Hiệp',  'warehouse',  'warehouse@mwg.vn'),
        ('U004', 'finance',    hash_password('fin123'),   'Bùi Đình Tuấn',  'finance',    'finance@mwg.vn'),
        ('U005', 'manager',    hash_password('mgr123'),   'Lê Việt Cường',  'manager',    'manager@mwg.vn'),
        ('U006', 'purchasing2',hash_password('pur123'),   'Trần Minh Khoa', 'purchasing', 'khoa@mwg.vn'),
        ('U007', 'manager2',   hash_password('mgr123'),   'Nguyễn Thị Lan', 'manager',    'lan@mwg.vn'),
    ]
    c.executemany("INSERT OR REPLACE INTO users (id,username,password_hash,full_name,role,email) VALUES (?,?,?,?,?,?)", users)
    conn.commit()
    print(f"✓ Seeded {len(users)} users")

def seed_products(conn):
    c = conn.cursor()
    products = [
        ('P001', 'iPhone 15 Pro Max 256GB',        'Điện thoại',      45,  50,  'chiếc', 29990000),
        ('P002', 'Samsung Galaxy S24 Ultra',        'Điện thoại',      32,  40,  'chiếc', 27990000),
        ('P003', 'MacBook Air M3 15 inch',          'Laptop',          18,  25,  'chiếc', 34990000),
        ('P004', 'Dell XPS 13',                     'Laptop',          22,  20,  'chiếc', 28990000),
        ('P005', 'iPad Pro 12.9 M2',               'Máy tính bảng',   28,  30,  'chiếc', 24990000),
        ('P006', 'AirPods Pro Gen 2',              'Phụ kiện',        150, 100, 'chiếc', 5990000),
        ('P007', 'Apple Watch Series 9',            'Đồng hồ',         35,  40,  'chiếc', 9990000),
        ('P008', 'Sony WH-1000XM5',                'Phụ kiện',        42,  50,  'chiếc', 8990000),
        ('P009', 'Samsung Galaxy Z Fold 5',        'Điện thoại',      12,  20,  'chiếc', 38990000),
        ('P010', 'Dell XPS 15',                    'Laptop',          8,   15,  'chiếc', 32990000),
        ('P011', 'LG OLED TV 65 inch',             'Tivi',            5,   10,  'chiếc', 45990000),
        ('P012', 'iPad Mini 6',                    'Máy tính bảng',   20,  25,  'chiếc', 12990000),
        ('P013', 'Logitech MX Master 3',           'Phụ kiện',        80,  50,  'chiếc', 2490000),
        ('P014', 'Samsung T7 SSD 1TB',             'Lưu trữ',         65,  40,  'chiếc', 1990000),
        ('P015', 'Apple Magic Keyboard',           'Phụ kiện',        55,  30,  'chiếc', 2990000),
        ('P016', 'Lenovo ThinkPad X1 Carbon',      'Laptop',          10,  15,  'chiếc', 42990000),
        ('P017', 'ASUS ROG Zephyrus G14',          'Laptop',          7,   10,  'chiếc', 38990000),
        ('P018', 'Google Pixel 8 Pro',             'Điện thoại',      15,  20,  'chiếc', 22990000),
        ('P019', 'Bose QC45 Headphones',           'Phụ kiện',        38,  30,  'chiếc', 6990000),
        ('P020', 'Samsung 27" 4K Monitor',         'Màn hình',        14,  20,  'chiếc', 12490000),
    ]
    c.executemany("""INSERT OR REPLACE INTO products 
        (id,name,category,current_stock,min_stock,unit,last_price) VALUES (?,?,?,?,?,?,?)""", products)
    conn.commit()
    print(f"✓ Seeded {len(products)} products")

def seed_vendors(conn):
    c = conn.cursor()
    vendors = [
        ('V001', 'Apple Việt Nam',              'Nguyễn Văn A', 'contact@apple.vn',   '024-3974-1234', 4.8, 245, 96, 98, 'Tầng 6, Tòa nhà Keangnam, Hà Nội',       '0101234567', '1234567890-BIDV'),
        ('V002', 'Samsung Electronics Vietnam', 'Trần Thị B',   'info@samsung.vn',    '028-3822-5678', 4.7, 312, 94, 96, 'Khu công nghệ cao, TP.HCM',               '0209876543', '9876543210-VCB'),
        ('V003', 'Dell Technologies Vietnam',   'Lê Văn C',     'sales@dell.vn',      '024-3936-9012', 4.5, 189, 91, 93, 'Tầng 18, Toà nhà Vincom, Hà Nội',        '0312345678', '5678901234-ACB'),
        ('V004', 'Sony Vietnam',                'Phạm Thị D',   'contact@sony.vn',    '028-3827-3456', 4.6, 156, 92, 95, 'Quận 1, TP.HCM',                          '0423456789', '2345678901-TCB'),
        ('V005', 'Phụ Kiện Điện Tử ABC',       'Hoàng Văn E',  'info@pkabc.vn',      '024-3845-7890', 4.3, 423, 88, 90, 'Cầu Giấy, Hà Nội',                       '0534567890', '3456789012-MB'),
        ('V006', 'LG Electronics Vietnam',      'Vũ Thị F',     'contact@lg.vn',      '028-3830-1234', 4.4, 98,  89, 91, 'Quận 7, TP.HCM',                          '0645678901', '4567890123-SHB'),
        ('V007', 'Lenovo Vietnam',              'Đỗ Văn G',     'sales@lenovo.vn',    '024-3960-5678', 4.6, 134, 93, 94, 'Đống Đa, Hà Nội',                        '0756789012', '5678901234-HDBank'),
        ('V008', 'Logitech Vietnam',            'Ngô Thị H',    'info@logitech.vn',   '028-3835-9012', 4.5, 267, 90, 92, 'Bình Thạnh, TP.HCM',                     '0867890123', '6789012345-OCB'),
        ('V009', 'ASUS Vietnam',                'Hà Văn I',     'sales@asus.vn',      '024-3950-3456', 4.3, 112, 87, 89, 'Ba Đình, Hà Nội',                        '0978901234', '7890123456-Sacombank'),
        ('V010', 'Bose Vietnam',                'Mai Thị J',    'contact@bose.vn',    '028-3840-7890', 4.7, 76,  95, 97, 'Quận 3, TP.HCM',                         '0189012345', '8901234567-Eximbank'),
    ]
    c.executemany("""INSERT OR REPLACE INTO vendors 
        (id,name,contact_person,email,phone,rating,total_orders,on_time_delivery,quality_score,address,tax_code,bank_account) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""", vendors)
    conn.commit()
    print(f"✓ Seeded {len(vendors)} vendors")

def seed_purchase_requests(conn):
    c = conn.cursor()
    prs = [
        ('PR001','P001','iPhone 15 Pro Max 256GB',      50,'Dự kiến tăng nhu cầu dịp Tết 2026',                45,60,'U002','Lê Hoàng Hà', '2026-02-01','approved',None,'U005','Lê Việt Cường','2026-02-02'),
        ('PR002','P002','Samsung Galaxy S24 Ultra',     40,'Tồn kho thấp hơn mức tối thiểu',                   32,45,'U002','Lê Hoàng Hà', '2026-02-03','pending', None,None,None,None),
        ('PR003','P003','MacBook Air M3 15 inch',       30,'Khuyến mãi đầu năm học',                           18,35,'U002','Lê Hoàng Hà', '2026-02-04','pending', None,None,None,None),
        ('PR004','P007','Apple Watch Series 9',         25,'Bổ sung tồn kho sau Tết',                          35,20,'U002','Lê Hoàng Hà', '2026-01-28','rejected','Số lượng yêu cầu quá cao so với nhu cầu thực tế',None,None,None),
        ('PR005','P008','Sony WH-1000XM5',              35,'Sản phẩm bán chạy, cần bổ sung',                   42,30,'U002','Lê Hoàng Hà', '2026-02-05','draft',  None,None,None,None),
        ('PR006','P009','Samsung Galaxy Z Fold 5',      30,'Hàng mới ra mắt, cần nhập đủ số lượng',            12,35,'U006','Trần Minh Khoa','2026-01-25','approved',None,'U005','Lê Việt Cường','2026-01-26'),
        ('PR007','P010','Dell XPS 15',                  20,'Tồn kho gần cạn, cần bổ sung gấp',                  8,25,'U006','Trần Minh Khoa','2026-02-01','approved',None,'U007','Nguyễn Thị Lan','2026-02-02'),
        ('PR008','P011','LG OLED TV 65 inch',           10,'Mùa mua sắm cuối năm',                              5,12,'U002','Lê Hoàng Hà', '2026-01-20','approved',None,'U005','Lê Việt Cường','2026-01-21'),
        ('PR009','P016','Lenovo ThinkPad X1 Carbon',   15,'Dự án mới của khách hàng doanh nghiệp',             10,18,'U006','Trần Minh Khoa','2026-02-06','pending', None,None,None,None),
        ('PR010','P020','Samsung 27" 4K Monitor',       20,'Trang bị thêm cho cửa hàng trưng bày',             14,22,'U002','Lê Hoàng Hà', '2026-02-07','draft',  None,None,None,None),
        ('PR011','P013','Logitech MX Master 3',         50,'Phụ kiện bán chạy, cần bổ sung thêm',              80,40,'U002','Lê Hoàng Hà', '2026-01-15','approved',None,'U007','Nguyễn Thị Lan','2026-01-16'),
        ('PR012','P014','Samsung T7 SSD 1TB',           60,'Khuyến mãi combo laptop',                          65,55,'U006','Trần Minh Khoa','2026-01-18','approved',None,'U005','Lê Việt Cường','2026-01-19'),
        ('PR013','P006','AirPods Pro Gen 2',            80,'Dịp Valentine 14/2',                               150,70,'U002','Lê Hoàng Hà', '2026-01-10','rejected','Tồn kho hiện tại đã đủ, chưa cần nhập thêm',None,None,None),
        ('PR014','P017','ASUS ROG Zephyrus G14',        10,'Gaming laptop đang hot',                             7,12,'U006','Trần Minh Khoa','2026-02-08','pending', None,None,None,None),
        ('PR015','P018','Google Pixel 8 Pro',           20,'Thêm lựa chọn Android cao cấp',                   15,22,'U002','Lê Hoàng Hà', '2026-02-09','draft',  None,None,None,None),
    ]
    c.executemany("""INSERT OR REPLACE INTO purchase_requests 
        (id,product_id,product_name,quantity,reason,current_stock,ai_suggestion,
         created_by,created_by_name,created_date,status,rejection_reason,
         approved_by,approved_by_name,approved_date)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", prs)
    conn.commit()
    print(f"✓ Seeded {len(prs)} purchase requests")

def seed_purchase_orders(conn):
    c = conn.cursor()
    pos = [
        ('PO001','PR001','V001','Apple Việt Nam',           'P001','iPhone 15 Pro Max 256GB',    50, 29990000, 1499500000,'2026-02-02','2026-02-10',None,'shipped',  0,'U002'),
        ('PO002','PR006','V002','Samsung Electronics Vietnam','P009','Samsung Galaxy Z Fold 5',  30, 38990000, 1169700000,'2026-01-25','2026-01-31',None,'overdue',  7,'U006'),
        ('PO003','PR007','V003','Dell Technologies Vietnam', 'P010','Dell XPS 15',               20, 32990000,  659800000,'2026-02-01','2026-02-08',None,'confirmed', 0,'U006'),
        ('PO004','PR008','V006','LG Electronics Vietnam',   'P011','LG OLED TV 65 inch',         10, 45990000,  459900000,'2026-01-21','2026-02-01','2026-02-01','delivered',0,'U002'),
        ('PO005','PR011','V008','Logitech Vietnam',          'P013','Logitech MX Master 3',       50,  2490000,  124500000,'2026-01-16','2026-01-23','2026-01-23','delivered',0,'U006'),
        ('PO006','PR012','V002','Samsung Electronics Vietnam','P014','Samsung T7 SSD 1TB',        60,  1990000,  119400000,'2026-01-19','2026-01-26','2026-01-26','delivered',0,'U006'),
        ('PO007',None,   'V001','Apple Việt Nam',           'P007','Apple Watch Series 9',       20,  9990000,  199800000,'2026-01-10','2026-01-20','2026-01-20','delivered',0,'U002'),
        ('PO008',None,   'V004','Sony Vietnam',             'P008','Sony WH-1000XM5',            30,  8990000,  269700000,'2026-01-05','2026-01-15','2026-01-15','delivered',0,'U002'),
        ('PO009',None,   'V001','Apple Việt Nam',           'P006','AirPods Pro Gen 2',          100, 5990000,  599000000,'2025-12-20','2025-12-28','2025-12-28','delivered',0,'U006'),
        ('PO010',None,   'V003','Dell Technologies Vietnam','P004','Dell XPS 13',                25, 28990000,  724750000,'2025-12-15','2025-12-25','2025-12-25','delivered',0,'U002'),
        ('PO011','PR009','V007','Lenovo Vietnam',            'P016','Lenovo ThinkPad X1 Carbon', 15, 42990000,  644850000,'2026-02-06','2026-02-15',None,'pending',  0,'U006'),
        ('PO012','PR003','V001','Apple Việt Nam',            'P003','MacBook Air M3 15 inch',     30, 34990000, 1049700000,'2026-02-04','2026-02-12',None,'pending',  0,'U002'),
    ]
    c.executemany("""INSERT OR REPLACE INTO purchase_orders 
        (id,pr_id,vendor_id,vendor_name,product_id,product_name,quantity,unit_price,total_amount,
         order_date,expected_delivery,actual_delivery,status,days_overdue,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", pos)
    conn.commit()
    print(f"✓ Seeded {len(pos)} purchase orders")

def seed_goods_receipts(conn):
    c = conn.cursor()
    grns = [
        ('GRN001','PO004', 10, 0,'2026-02-01','Nhận đủ hàng, tình trạng tốt','U003','Đặng Hữu Hiệp'),
        ('GRN002','PO005', 50, 1,'2026-01-23','Nhận 50 chiếc, 1 hỏng bao bì ngoài','U003','Đặng Hữu Hiệp'),
        ('GRN003','PO006', 60, 0,'2026-01-26','Nhận đủ 60 chiếc','U003','Đặng Hữu Hiệp'),
        ('GRN004','PO007', 20, 0,'2026-01-20','Nhận đủ hàng','U003','Đặng Hữu Hiệp'),
        ('GRN005','PO008', 28, 2,'2026-01-15','Nhận 30 chiếc, phát hiện 2 chiếc lỗi tai nghe trái','U003','Đặng Hữu Hiệp'),
        ('GRN006','PO009',100, 0,'2025-12-28','Nhận đủ 100 hộp AirPods','U003','Đặng Hữu Hiệp'),
        ('GRN007','PO010', 25, 0,'2025-12-25','Nhận đủ 25 chiếc Dell XPS 13','U003','Đặng Hữu Hiệp'),
    ]
    c.executemany("""INSERT OR REPLACE INTO goods_receipts 
        (id,po_id,received_quantity,damaged_quantity,received_date,notes,received_by,received_by_name)
        VALUES (?,?,?,?,?,?,?,?)""", grns)
    conn.commit()
    print(f"✓ Seeded {len(grns)} goods receipts")

def seed_invoices(conn):
    c = conn.cursor()
    invs = [
        ('INV001','PO004','V006', 459900000,'2026-02-01','2026-03-01','matched'),
        ('INV002','PO005','V008', 124500000,'2026-01-23','2026-02-22','matched'),
        ('INV003','PO006','V002', 119400000,'2026-01-26','2026-02-25','matched'),
        ('INV004','PO007','V001', 199800000,'2026-01-20','2026-02-19','matched'),
        ('INV005','PO008','V004', 269700000,'2026-01-15','2026-02-14','mismatch'),
        ('INV006','PO009','V001', 599000000,'2025-12-28','2026-01-27','matched'),
        ('INV007','PO010','V003', 724750000,'2025-12-25','2026-01-24','matched'),
        ('INV008','PO002','V002',1169700000,'2026-02-01','2026-03-01','pending'),
        ('INV009','PO001','V001',1499500000,'2026-02-10','2026-03-10','pending'),
    ]
    c.executemany("""INSERT OR REPLACE INTO invoices (id,po_id,vendor_id,amount,invoice_date,due_date,status)
        VALUES (?,?,?,?,?,?,?)""", invs)
    conn.commit()
    print(f"✓ Seeded {len(invs)} invoices")

def seed_reconciliations(conn):
    c = conn.cursor()
    recs = [
        ('REC001','PO004','GRN001','INV001','LG OLED TV 65 inch',      459900000, 459900000, 459900000,'matched', None,           '2026-02-02',None),
        ('REC002','PO005','GRN002','INV002','Logitech MX Master 3',     124500000, 121900000, 124500000,'mismatch','1 sản phẩm lỗi - chênh lệch 2.6M','2026-01-24',None),
        ('REC003','PO006','GRN003','INV003','Samsung T7 SSD 1TB',       119400000, 119400000, 119400000,'matched', None,           '2026-01-27',None),
        ('REC004','PO007','GRN004','INV004','Apple Watch Series 9',     199800000, 199800000, 199800000,'matched', None,           '2026-01-21',None),
        ('REC005','PO008','GRN005','INV005','Sony WH-1000XM5',          269700000, 251720000, 269700000,'mismatch','2 chiếc bị lỗi, số lượng thực nhận 28','2026-01-16',None),
        ('REC006','PO009','GRN006','INV006','AirPods Pro Gen 2',        599000000, 599000000, 599000000,'matched', None,           '2025-12-29',None),
        ('REC007','PO010','GRN007','INV007','Dell XPS 13',              724750000, 724750000, 724750000,'matched', None,           '2025-12-26',None),
    ]
    c.executemany("""INSERT OR REPLACE INTO finance_reconciliations 
        (id,po_id,grn_id,invoice_id,product_name,po_amount,grn_amount,invoice_amount,status,issue,match_date,resolved_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""", recs)
    conn.commit()
    print(f"✓ Seeded {len(recs)} reconciliations")

def seed_shipments(conn):
    c = conn.cursor()
    ships = [
        ('SHIP001','PO001','iPhone 15 Pro Max 256GB',  'in_transit','Hà Nội - Trung tâm phân phối',  60,'2026-02-10',None,'Viettel Post','VP20260202001',None),
        ('SHIP002','PO002','Samsung Galaxy Z Fold 5',  'delayed',   'TP.HCM - Kho NCC',              30,'2026-02-08',None,'GHTK',       'GHTK20260125002','Chậm trễ do thủ tục thông quan'),
        ('SHIP003','PO003','Dell XPS 15',             'in_transit','Đà Nẵng - Trung chuyển',         45,'2026-02-12',None,'GHN',        'GHN20260201003',None),
        ('SHIP004','PO011','Lenovo ThinkPad X1 Carbon','pending',   'Kho NCC - Hà Nội',               5,'2026-02-18',None,'J&T Express','JT20260206004',None),
        ('SHIP005','PO012','MacBook Air M3 15 inch',  'pending',   'Kho Apple - TP.HCM',             10,'2026-02-15',None,'Viettel Post','VP20260204005',None),
    ]
    c.executemany("""INSERT OR REPLACE INTO shipments 
        (id,po_id,product_name,status,current_location,progress,estimated_arrival,actual_arrival,carrier,tracking_number,issue)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)""", ships)
    conn.commit()
    print(f"✓ Seeded {len(ships)} shipments")

def seed_audit_logs(conn):
    c = conn.cursor()
    logs = [
        ('LOG001','2026-02-05 14:32:15','U002','Lê Hoàng Hà','CREATE_PR',   'Tạo yêu cầu mua hàng',   'Tạo PR003 - MacBook Air M3 15 inch (30 chiếc)','192.168.1.105','pr'),
        ('LOG002','2026-02-05 10:15:42','U005','Lê Việt Cường','APPROVE_PR', 'Duyệt yêu cầu',          'Duyệt PR001 - iPhone 15 Pro Max (50 chiếc)',   '192.168.1.102','approval'),
        ('LOG003','2026-02-04 16:45:30','U003','Đặng Hữu Hiệp','CREATE_GRN','Tạo phiếu nhập kho',      'Nhập kho GRN001 từ PO004 (10/10 chiếc)',        '192.168.1.108','warehouse'),
        ('LOG004','2026-02-04 11:20:18','U004','Bùi Đình Tuấn','RECONCILE', 'Đối soát tài chính',     'Đối soát REC001: PO004 - GRN001 - INV001',     '192.168.1.110','finance'),
        ('LOG005','2026-02-03 09:05:55','U002','Lê Hoàng Hà','CREATE_PR',   'Tạo yêu cầu mua hàng',   'Tạo PR002 - Samsung Galaxy S24 Ultra (40 chiếc)','192.168.1.105','pr'),
        ('LOG006','2026-02-02 15:30:12','U005','Lê Việt Cường','APPROVE_PR','Duyệt yêu cầu',           'Duyệt PR006 - Samsung Galaxy Z Fold 5 (30 chiếc)','192.168.1.102','approval'),
        ('LOG007','2026-02-02 08:45:00','U001','Lê Văn An',   'LOGIN',       'Đăng nhập',              'Đăng nhập thành công từ 192.168.1.100',         '192.168.1.100','system'),
        ('LOG008','2026-02-01 17:20:33','U003','Đặng Hữu Hiệp','RECEIVE',   'Nhận hàng',              'Nhận hàng PO004 - LG OLED TV (10 chiếc)',       '192.168.1.108','warehouse'),
        ('LOG009','2026-02-01 14:10:45','U006','Trần Minh Khoa','CREATE_PO','Tạo đơn đặt hàng',       'Tạo PO003 - Dell XPS 15 từ PR007',              '192.168.1.106','po'),
        ('LOG010','2026-01-31 16:55:20','U002','Lê Hoàng Hà','REJECT_PR',   'Từ chối yêu cầu',        'Từ chối PR004 - Apple Watch Series 9',          '192.168.1.105','approval'),
        ('LOG011','2026-01-28 10:30:00','U002','Lê Hoàng Hà','CREATE_PR',   'Tạo yêu cầu mua hàng',   'Tạo PR004 - Apple Watch (25 chiếc)',            '192.168.1.105','pr'),
        ('LOG012','2026-01-26 09:15:00','U007','Nguyễn Thị Lan','APPROVE_PR','Duyệt yêu cầu',         'Duyệt PR007 - Dell XPS 15 (20 chiếc)',          '192.168.1.107','approval'),
        ('LOG013','2026-01-25 08:00:00','U006','Trần Minh Khoa','CREATE_PR','Tạo yêu cầu mua hàng',   'Tạo PR006 - Samsung Galaxy Z Fold 5 (30 chiếc)','192.168.1.106','pr'),
        ('LOG014','2026-01-24 16:45:00','U004','Bùi Đình Tuấn','MISMATCH', 'Phát hiện sai lệch',     'REC002 - Logitech MX Master 3 có chênh lệch',   '192.168.1.110','finance'),
        ('LOG015','2026-01-23 14:30:00','U003','Đặng Hữu Hiệp','CREATE_GRN','Tạo phiếu nhập kho',    'Nhập kho GRN002 từ PO005 (50/50 chiếc)',        '192.168.1.108','warehouse'),
    ]
    c.executemany("""INSERT OR REPLACE INTO audit_logs 
        (id,timestamp,user_id,user_name,action,action_label,details,ip_address,category)
        VALUES (?,?,?,?,?,?,?,?,?)""", logs)
    conn.commit()
    print(f"✓ Seeded {len(logs)} audit logs")

def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"✓ Removed old database")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    try:
        create_tables(conn)
        seed_users(conn)
        seed_products(conn)
        seed_vendors(conn)
        seed_purchase_requests(conn)
        seed_purchase_orders(conn)
        seed_goods_receipts(conn)
        seed_invoices(conn)
        seed_reconciliations(conn)
        seed_shipments(conn)
        seed_audit_logs(conn)
        
        # Print summary
        c = conn.cursor()
        tables = ['users','products','vendors','purchase_requests','purchase_orders',
                  'goods_receipts','invoices','finance_reconciliations','shipments','audit_logs']
        print("\n📊 Database Summary:")
        for t in tables:
            count = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            print(f"   {t}: {count} rows")
        
        print(f"\n✅ Database created at: {DB_PATH}")
    finally:
        conn.close()

if __name__ == '__main__':
    main()
