import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Building2 } from 'lucide-react';

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
    
    if (result.success) {
      // Role-based redirect
      const storedUser = JSON.parse(localStorage.getItem('scm_user') || '{}');
      switch (storedUser.role) {
        case 'admin':
          navigate('/dashboard');
          break;
        case 'purchasing':
          navigate('/pr/create');
          break;
        case 'warehouse':
          navigate('/warehouse/receiving');
          break;
        case 'finance':
          navigate('/finance/reconciliation');
          break;
        case 'manager':
          navigate('/pr/approval');
          break;
        default:
          navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Đã xảy ra lỗi');
    }
    
    setIsLoading(false);
  };

  const quickLogin = (role: string, pass: string) => {
    setUsername(role);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-12 text-white shadow-2xl">
            <Building2 className="w-16 h-16 mb-6" />
            <h1 className="text-4xl mb-4">Hệ thống Quản lý Chuỗi cung ứng</h1>
            <p className="text-blue-100 text-lg mb-8">
              Giải pháp SCM toàn diện cho doanh nghiệp bán lẻ
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                <p className="text-blue-100">Quản lý yêu cầu mua hàng thông minh với AI</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                <p className="text-blue-100">Theo dõi đơn hàng và logistics realtime</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                <p className="text-blue-100">Kiểm soát tài chính và audit log minh bạch</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-3xl mb-2">Đăng nhập</h2>
            <p className="text-gray-600">Nhập thông tin tài khoản của bạn</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-gray-700">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-gray-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Tài khoản demo (nhấn để điền nhanh):</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLogin('admin', 'admin123')}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-left"
              >
                <div className="font-semibold">Admin</div>
                <div className="text-gray-500">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('purchasing', 'pur123')}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-left"
              >
                <div className="font-semibold">Mua hàng</div>
                <div className="text-gray-500">purchasing / pur123</div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('manager', 'mgr123')}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-left"
              >
                <div className="font-semibold">Quản lý</div>
                <div className="text-gray-500">manager / mgr123</div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('warehouse', 'wh123')}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-left"
              >
                <div className="font-semibold">Kho vận</div>
                <div className="text-gray-500">warehouse / wh123</div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('finance', 'fin123')}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-left"
              >
                <div className="font-semibold">Tài chính</div>
                <div className="text-gray-500">finance / fin123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
