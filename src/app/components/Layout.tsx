import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Users,
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  ClipboardList,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Settings,
  Camera
} from 'lucide-react';

const AVATAR_MAX_BYTES = 800 * 1024;

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['admin', 'manager']
  },
  {
    path: '/pr/create',
    label: 'Tạo yêu cầu mua hàng',
    icon: <FileText className="w-5 h-5" />,
    roles: ['purchasing', 'manager']
  },
  {
    path: '/pr/tracking',
    label: 'Theo dõi PR',
    icon: <ClipboardList className="w-5 h-5" />,
    roles: ['admin', 'purchasing', 'manager']
  },
  {
    path: '/pr/approval',
    label: 'Duyệt yêu cầu',
    icon: <CheckCircle className="w-5 h-5" />,
    roles: ['admin', 'manager']
  },
  {
    path: '/vendors',
    label: 'Nhà cung cấp',
    icon: <Users className="w-5 h-5" />,
    roles: ['admin', 'purchasing', 'manager']
  },
  {
    path: '/po',
    label: 'Quản lý PO',
    icon: <ShoppingCart className="w-5 h-5" />,
    roles: ['admin', 'purchasing', 'manager']
  },
  {
    path: '/warehouse/receiving',
    label: 'Quản lý kho',
    icon: <Package className="w-5 h-5" />,
    roles: ['admin', 'warehouse']
  },
  {
    path: '/logistics',
    label: 'Logistics',
    icon: <Truck className="w-5 h-5" />,
    roles: ['admin', 'warehouse']
  },
  {
    path: '/finance/reconciliation',
    label: 'Đối soát',
    icon: <DollarSign className="w-5 h-5" />,
    roles: ['admin', 'finance']
  },
  {
    path: '/audit',
    label: 'Audit Log',
    icon: <ClipboardList className="w-5 h-5" />,
    roles: ['admin', 'finance', 'manager']
  }
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();

  useEffect(() => {
    if (settingsOpen && user) {
      setDraftName(user.fullName);
      setDraftAvatar(user.avatarUrl ?? null);
    }
  }, [settingsOpen, user]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen]);

  useEffect(() => {
    if (settingsOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [settingsOpen]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (JPEG, PNG, WebP…)');
      return;
    }
    if (f.size > AVATAR_MAX_BYTES) {
      alert('Ảnh quá lớn. Chọn ảnh dưới 800KB (giới hạn lưu vào database).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setDraftAvatar(reader.result);
    };
    reader.readAsDataURL(f);
  };

  const handleSaveSettings = async () => {
    const name = draftName.trim();
    if (!name) {
      alert('Tên hiển thị không được để trống.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ fullName: name, avatarUrl: draftAvatar });
      setSettingsOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không lưu được. Hãy chắc backend đang chạy.';
      alert(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:block hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-blue-600">SCM System</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Thế Giới Di Động</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Cài đặt"
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <div className="h-8 w-px bg-gray-300 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {user?.fullName?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 hover:bg-red-50 rounded-lg text-red-600"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Panel cài đặt (tên + avatar, lưu localStorage) */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setSettingsOpen(false)}
            aria-hidden
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 360 }}
            className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-100"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 id="settings-title" className="text-lg font-semibold text-gray-900">
                Cài đặt tài khoản
              </h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Ảnh đại diện</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center shrink-0">
                    {draftAvatar ? (
                      <img src={draftAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-semibold text-gray-400">
                        {(draftName || user?.fullName || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-700 w-fit">
                      <Camera className="w-4 h-4" />
                      Chọn ảnh
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                    </label>
                    {draftAvatar && (
                      <button
                        type="button"
                        onClick={() => setDraftAvatar(null)}
                        className="text-sm text-red-600 hover:underline text-left"
                      >
                        Xóa ảnh
                      </button>
                    )}
                    <p className="text-xs text-gray-500">
                      Tối đa ~800KB. Lưu vào database trên server — đổi ảnh mới sẽ thay thế ảnh cũ.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="settings-display-name" className="text-sm font-medium text-gray-700 block mb-2">
                  Tên hiển thị
                </label>
                <input
                  id="settings-display-name"
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                  placeholder="Họ và tên"
                  autoComplete="name"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Tài khoản đăng nhập: <span className="font-mono text-gray-700">{user?.username}</span>
                </p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingProfile}
                className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingProfile ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </motion.aside>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 z-40 transition-all duration-300
          ${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className={`${sidebarOpen ? 'p-4' : 'p-2'} space-y-1 overflow-y-auto h-full`}>
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center ${sidebarOpen ? 'gap-3 px-4 justify-start' : 'px-0 justify-center'} py-3 rounded-lg transition-colors
                ${isActive(item.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
              title={!sidebarOpen ? item.label : undefined}
            >
              {item.icon}
              <span className={`${!sidebarOpen && 'lg:hidden'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`
          pt-16 transition-all duration-300
          ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'}
        `}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
