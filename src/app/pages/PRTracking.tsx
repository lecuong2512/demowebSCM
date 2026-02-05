import React, { useState } from 'react';
import { mockPurchaseRequests, formatDate } from '../data/mockData';
import { ClipboardList, Search, Filter, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

export default function PRTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPRs = mockPurchaseRequests.filter(pr => {
    const matchesSearch = pr.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pr.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    const labels = {
      draft: 'Nháp',
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Theo dõi Yêu cầu Mua hàng</h1>
        <p className="text-gray-600">Xem trạng thái và tiến trình xử lý các yêu cầu</p>
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
              placeholder="Tìm kiếm theo mã PR hoặc tên sản phẩm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {/* PR List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Mã PR</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Số lượng</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Người tạo</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPRs.map((pr) => (
                <tr key={pr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-blue-600">{pr.id}</span>
                  </td>
                  <td className="px-6 py-4">{pr.productName}</td>
                  <td className="px-6 py-4">{pr.quantity}</td>
                  <td className="px-6 py-4">{pr.createdBy}</td>
                  <td className="px-6 py-4">{formatDate(pr.createdDate)}</td>
                  <td className="px-6 py-4">{getStatusBadge(pr.status)}</td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-700">Xem</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline for selected PR */}
      {filteredPRs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-lg mb-4">Timeline tiến trình (Ví dụ: {filteredPRs[0].id})</h3>
          <div className="space-y-4">
            {[
              { step: 'Tạo yêu cầu', date: filteredPRs[0].createdDate, status: 'completed' },
              { step: 'Gửi duyệt', date: filteredPRs[0].createdDate, status: 'completed' },
              { step: 'Đang chờ duyệt', date: '', status: filteredPRs[0].status === 'pending' ? 'current' : 'completed' },
              { step: 'Hoàn tất', date: filteredPRs[0].approvedDate || '', status: filteredPRs[0].status === 'approved' ? 'completed' : 'pending' }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${item.status === 'completed' ? 'bg-green-100' : item.status === 'current' ? 'bg-blue-100' : 'bg-gray-100'}`}
                >
                  {getStatusIcon(item.status === 'completed' ? 'approved' : item.status === 'current' ? 'pending' : 'draft')}
                </div>
                <div>
                  <p className="font-medium">{item.step}</p>
                  {item.date && <p className="text-sm text-gray-500">{formatDate(item.date)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
