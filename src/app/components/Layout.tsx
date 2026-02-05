import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Settings
} from 'lucide-react';

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
    roles: ['admin', 'purchasing', 'manager']
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
    label: 'Nhập kho',
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg hidden sm:block">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <div className="h-8 w-px bg-gray-300 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
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
          ${sidebarOpen ? 'w-64' : 'w-0 lg:w-16'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="p-4 space-y-1 overflow-y-auto h-full">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive(item.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
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
