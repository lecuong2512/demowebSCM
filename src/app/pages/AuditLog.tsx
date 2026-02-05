import React, { useState } from 'react';
import { ClipboardList, Search, Filter, User, FileText, Settings, ShoppingCart } from 'lucide-react';

export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const auditLogs = [
    {
      id: 'LOG001',
      timestamp: '2026-02-05 14:32:15',
      user: 'Lê Hoàng Hà',
      userId: 'purchasing',
      action: 'CREATE_PR',
      actionLabel: 'Tạo yêu cầu mua hàng',
      details: 'Tạo PR003 - MacBook Air M3 15 inch (30 chiếc)',
      ipAddress: '192.168.1.105',
      category: 'pr'
    },
    {
      id: 'LOG002',
      timestamp: '2026-02-05 10:15:42',
      user: 'Lê Việt Cường',
      userId: 'manager',
      action: 'APPROVE_PR',
      actionLabel: 'Duyệt yêu cầu',
      details: 'Duyệt PR001 - iPhone 15 Pro Max (50 chiếc)',
      ipAddress: '192.168.1.102',
      category: 'approval'
    },
    {
      id: 'LOG003',
      timestamp: '2026-02-04 16:45:30',
      user: 'Đặng Hữu Hiệp',
      userId: 'warehouse',
      action: 'CREATE_GRN',
      actionLabel: 'Tạo phiếu nhập kho',
      details: 'Nhập kho GRN045 từ PO001 (50/50 chiếc)',
      ipAddress: '192.168.1.108',
      category: 'warehouse'
    },
    {
      id: 'LOG004',
      timestamp: '2026-02-04 11:20:18',
      user: 'Bùi Đình Tuấn',
      userId: 'finance',
      action: 'RECONCILE',
      actionLabel: 'Đối soát',
      details: 'Đối soát REC001: PO001 - GRN045 - INV234',
      ipAddress: '192.168.1.110',
      category: 'finance'
    },
    {
      id: 'LOG005',
      timestamp: '2026-02-03 09:30:05',
      user: 'Lê Hoàng Hà',
      userId: 'purchasing',
      action: 'CREATE_PO',
      actionLabel: 'Tạo đơn đặt hàng',
      details: 'Tạo PO003 cho PR007 - Dell XPS 15',
      ipAddress: '192.168.1.105',
      category: 'po'
    },
    {
      id: 'LOG006',
      timestamp: '2026-02-02 15:45:22',
      user: 'Lê Việt Cường',
      userId: 'manager',
      action: 'REJECT_PR',
      actionLabel: 'Từ chối yêu cầu',
      details: 'Từ chối PR004 - Lý do: Số lượng quá cao',
      ipAddress: '192.168.1.102',
      category: 'approval'
    },
    {
      id: 'LOG007',
      timestamp: '2026-02-01 13:20:10',
      user: 'Lê Văn An',
      userId: 'admin',
      action: 'UPDATE_VENDOR',
      actionLabel: 'Cập nhật nhà cung cấp',
      details: 'Cập nhật thông tin V001 - Apple Việt Nam',
      ipAddress: '192.168.1.100',
      category: 'vendor'
    }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.category === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pr': return <FileText className="w-5 h-5" />;
      case 'approval': return <ClipboardList className="w-5 h-5" />;
      case 'warehouse': return <ShoppingCart className="w-5 h-5" />;
      case 'finance': return <Settings className="w-5 h-5" />;
      case 'po': return <ShoppingCart className="w-5 h-5" />;
      case 'vendor': return <User className="w-5 h-5" />;
      default: return <ClipboardList className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      pr: 'bg-blue-100 text-blue-600',
      approval: 'bg-green-100 text-green-600',
      warehouse: 'bg-purple-100 text-purple-600',
      finance: 'bg-orange-100 text-orange-600',
      po: 'bg-indigo-100 text-indigo-600',
      vendor: 'bg-pink-100 text-pink-600'
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Audit Log - Lịch sử Truy vết</h1>
        <p className="text-gray-600">Theo dõi toàn bộ hoạt động trong hệ thống</p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">🔒 Audit Log đảm bảo tính minh bạch</h3>
        <p className="text-sm text-blue-800">
          Mọi thao tác quan trọng đều được ghi lại với đầy đủ thông tin: ai thực hiện, làm gì, khi nào, từ đâu. 
          Dữ liệu này không thể bị chỉnh sửa sau khi tạo.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo người dùng, hành động..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả hành động</option>
            <option value="pr">Yêu cầu mua hàng</option>
            <option value="approval">Duyệt yêu cầu</option>
            <option value="po">Đơn đặt hàng</option>
            <option value="warehouse">Kho vận</option>
            <option value="finance">Tài chính</option>
            <option value="vendor">Nhà cung cấp</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Thời gian</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Người dùng</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Hành động</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Chi tiết</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{log.user}</p>
                        <p className="text-xs text-gray-500">{log.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getCategoryColor(log.category)}`}>
                      {getCategoryIcon(log.category)}
                      {log.actionLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-600 text-sm mb-1">Tổng hoạt động</p>
          <p className="text-3xl font-semibold text-blue-600">{auditLogs.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-600 text-sm mb-1">Người dùng hoạt động</p>
          <p className="text-3xl font-semibold text-green-600">5</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-600 text-sm mb-1">Hôm nay</p>
          <p className="text-3xl font-semibold text-purple-600">12</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-600 text-sm mb-1">Tuần này</p>
          <p className="text-3xl font-semibold text-orange-600">87</p>
        </div>
      </div>
    </div>
  );
}
