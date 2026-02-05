# 📖 Hướng Dẫn Chạy Dự Án SCM System

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#%EF%B8%8Fyêu-cầu-hệ-thống)
2. [Cài Đặt Dependencies](#cài-đặt-dependencies)
3. [Chạy Dự Án](#chạy-dự-án)
4. [Cấu Trúc Dự Án](##cấu-trúc-dự-án)
5. [Thông Tin Đăng Nhập](##thông-tin-đăng-nhập)
6. [Troubleshooting](##troubleshooting)

---

## 🖥️ Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết:
- **Node.js**: Phiên bản 18.x trở lên
- **npm**: Phiên bản 9.x trở lên (hoặc yarn/pnpm)
- **Git**: Để clone repository (nếu cần)

### Kiểm Tra Phiên Bản:
```bash
# Kiểm tra Node.js
node --version

# Kiểm tra npm
npm --version
```

> **Lưu ý**: Nếu chưa cài đặt Node.js, vui lòng tải về từ [nodejs.org](https://nodejs.org/)

---

## 📦 Cài Đặt Dependencies

### Bước 1: Mở Terminal/Command Prompt
- **Windows**: Mở PowerShell hoặc Command Prompt
- **Mac/Linux**: Mở Terminal

### Bước 2: Di Chuyển Đến Thư Mục Dự Án
```bash
cd d:\demo2
```

### Bước 3: Cài Đặt Các Package Cần Thiết
```bash
npm install
```

Quá trình cài đặt có thể mất vài phút tùy thuộc vào tốc độ internet của bạn.

> **Lưu ý**: 
> - Nếu gặp lỗi với npm, thử dùng `npm install --legacy-peer-deps`
> - Hoặc có thể dùng `yarn install` hoặc `pnpm install` nếu bạn đã cài đặt yarn/pnpm

---

## 🚀 Chạy Dự Án

### Chạy Development Server

Sau khi cài đặt xong dependencies, chạy lệnh sau:

```bash
npm run dev
```

### Kết Quả Mong Đợi:

Sau khi chạy lệnh, bạn sẽ thấy output tương tự như sau:

```
  VITE v6.3.5  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Truy Cập Ứng Dụng:

1. Mở trình duyệt web (Chrome, Firefox, Edge, Safari...)
2. Truy cập địa chỉ: **http://localhost:5173**
3. Bạn sẽ thấy trang đăng nhập của hệ thống

> **Lưu ý**: 
> - Port mặc định là **5173**. Nếu port này đã được sử dụng, Vite sẽ tự động chọn port khác (5174, 5175...)
> - Để dừng server, nhấn `Ctrl + C` trong terminal

---

## 🏗️ Cấu Trúc Dự Án

```
demo2/
├── src/
│   ├── app/
│   │   ├── components/        # Các component UI
│   │   │   ├── Layout.tsx     # Layout chính
│   │   │   └── ui/            # UI components (shadcn/ui)
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Context quản lý authentication
│   │   ├── pages/             # Các trang của ứng dụng
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CreatePR.tsx
│   │   │   └── ...
│   │   ├── data/
│   │   │   └── mockData.ts    # Dữ liệu mock
│   │   └── App.tsx            # Component chính
│   ├── styles/                # File CSS
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   └── theme.css
│   └── main.tsx               # Entry point
├── index.html                 # HTML template
├── vite.config.ts             # Cấu hình Vite
├── package.json               # Dependencies và scripts
└── postcss.config.mjs         # Cấu hình PostCSS
```

---

## 🔐 Thông Tin Đăng Nhập

Hệ thống có 5 tài khoản mẫu với các vai trò khác nhau:

### 1. Admin (Quản Trị Viên)
- **Username**: `admin`
- **Password**: `admin123`
- **Tên người dùng**: Lê Văn An
- **Quyền**: Toàn quyền truy cập

### 2. Purchasing (Bộ Phận Mua Hàng)
- **Username**: `purchasing`
- **Password**: `pur123`
- **Tên người dùng**: Lê Hoàng Hà
- **Quyền**: Tạo và quản lý Purchase Request

### 3. Warehouse (Kho Vận)
- **Username**: `warehouse`
- **Password**: `wh123`
- **Tên người dùng**: Đặng Hữu Hiệp
- **Quyền**: Quản lý nhận hàng tại kho

### 4. Finance (Tài Chính)
- **Username**: `finance`
- **Password**: `fin123`
- **Tên người dùng**: Bùi Đình Tuấn
- **Quyền**: Đối soát tài chính

### 5. Manager (Quản Lý)
- **Username**: `manager`
- **Password**: `mgr123`
- **Tên người dùng**: Lê Việt Cường
- **Quyền**: Phê duyệt Purchase Request

> **Lưu ý**: Sau khi đăng nhập, hệ thống sẽ tự động chuyển hướng đến trang phù hợp với vai trò của bạn.

---

## 🛠️ Các Lệnh Khác

### Build Production
Để build ứng dụng cho production:

```bash
npm run build
```

File build sẽ được tạo trong thư mục `dist/`

### Preview Production Build
Để xem trước bản build production:

```bash
npm run build
npm run preview
```

---

## 🔧 Troubleshooting

### Lỗi: "Cannot find module"
**Nguyên nhân**: Chưa cài đặt dependencies hoặc cài đặt không đầy đủ

**Giải pháp**:
```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Cài đặt lại
npm install
```

### Lỗi: "Port 5173 is already in use"
**Nguyên nhân**: Port đã được sử dụng bởi ứng dụng khác

**Giải pháp**:
- Đóng ứng dụng đang sử dụng port 5173
- Hoặc Vite sẽ tự động chọn port khác (5174, 5175...)

### Lỗi: "React is not defined"
**Nguyên nhân**: Thiếu React dependencies

**Giải pháp**:
```bash
npm install react react-dom
```

### Lỗi: "Failed to resolve import"
**Nguyên nhân**: Đường dẫn import không đúng hoặc thiếu file

**Giải pháp**: Kiểm tra lại đường dẫn import và đảm bảo file tồn tại

### Trang Trắng Sau Khi Chạy
**Nguyên nhân**: Có thể do lỗi JavaScript trong console

**Giải pháp**:
1. Mở Developer Tools (F12)
2. Kiểm tra tab Console để xem lỗi
3. Kiểm tra tab Network để xem file nào không load được

### Lỗi Tailwind CSS Không Hoạt Động
**Nguyên nhân**: Cấu hình Tailwind chưa đúng

**Giải pháp**: Đảm bảo các file sau tồn tại và được import đúng:
- `src/styles/tailwind.css`
- `src/styles/index.css`
- `postcss.config.mjs`

---

## 📝 Ghi Chú Quan Trọng

1. **Hot Reload**: Vite hỗ trợ Hot Module Replacement (HMR), nghĩa là khi bạn thay đổi code, trình duyệt sẽ tự động reload mà không cần refresh thủ công.

2. **Local Storage**: Thông tin đăng nhập được lưu trong localStorage với key `scm_user`. Để đăng xuất hoàn toàn, có thể xóa localStorage trong Developer Tools.

3. **Mock Data**: Hiện tại hệ thống sử dụng mock data. Tất cả dữ liệu sẽ mất khi refresh trang (trừ thông tin đăng nhập đã lưu trong localStorage).

4. **Browser Support**: Ứng dụng hỗ trợ các trình duyệt hiện đại:
   - Chrome (khuyến nghị)
   - Firefox
   - Edge
   - Safari

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề không được liệt kê ở trên, vui lòng:
1. Kiểm tra lại các bước cài đặt
2. Xem log trong terminal để tìm lỗi cụ thể
3. Kiểm tra Developer Tools trong trình duyệt (F12)

---

## ✅ Checklist Trước Khi Chạy

- [ ] Đã cài đặt Node.js (phiên bản 18+)
- [ ] Đã cài đặt npm
- [ ] Đã chạy `npm install`
- [ ] Không có lỗi trong quá trình cài đặt
- [ ] Đã chạy `npm run dev`
- [ ] Server đã khởi động thành công
- [ ] Có thể truy cập http://localhost:5173

---

**Chúc bạn code vui vẻ! 🎉**

