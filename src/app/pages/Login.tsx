import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Building2 } from 'lucide-react';

const QUICK_LOGINS = [
  { role: 'admin',      pass: 'admin123', label: 'Admin',     color: 'bg-gray-800 text-white' },
  { role: 'purchasing', pass: 'pur123',   label: 'Mua hàng',  color: 'bg-blue-600 text-white' },
  { role: 'manager',    pass: 'mgr123',   label: 'Quản lý',   color: 'bg-purple-600 text-white' },
  { role: 'warehouse',  pass: 'wh123',    label: 'Kho vận',   color: 'bg-orange-600 text-white' },
  { role: 'finance',    pass: 'fin123',   label: 'Tài chính', color: 'bg-green-600 text-white' },
];

const ROLE_REDIRECT: Record<string, string> = {
  admin:      '/dashboard',
  purchasing: '/pr/create',
  warehouse:  '/warehouse/receiving',
  finance:    '/finance/reconciliation',
  manager:    '/pr/approval',
};

/** Ảnh nền (Vite: thư mục public/) */
const LOGIN_BG = '/Picture/supply-chain-network-guidance-to-design-it-right.webp';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);
    if (result.success) {
      const stored = JSON.parse(localStorage.getItem('scm_user') || '{}');
      navigate(ROLE_REDIRECT[stored.role] || '/dashboard');
    } else {
      setError(result.error || 'Đăng nhập thất bại');
    }
  };

  const quickLogin = async (role: string, pass: string) => {
    setIsLoading(true);
    setError('');
    const result = await login(role, pass);
    setIsLoading(false);
    if (result.success) {
      navigate(ROLE_REDIRECT[role] || '/dashboard');
    } else {
      setError(result.error || 'Lỗi kết nối. Hãy chắc server Python đang chạy.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${LOGIN_BG})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-blue-950/80 to-slate-900/90 backdrop-blur-[1px]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight px-1">
            Hệ thống Quản lý Chuỗi cung ứng
          </h1>
          <p className="text-blue-200 mt-2 text-sm sm:text-base max-w-md mx-auto">
            Giải pháp SCM toàn diện cho doanh nghiệp bán lẻ
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Đăng nhập</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="admin, purchasing, manager..."
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-xs text-gray-500 text-center mb-3">Đăng nhập nhanh theo vai trò:</p>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_LOGINS.map(({ role, pass, label, color }) => (
                <button
                  key={role}
                  onClick={() => quickLogin(role, pass)}
                  disabled={isLoading}
                  className={`py-2 px-1 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50 ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
