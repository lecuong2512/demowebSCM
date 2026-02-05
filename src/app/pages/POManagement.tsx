import React from 'react';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { mockPurchaseOrders, formatCurrency, formatDate } from '../data/mockData';

export default function POManagement() {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      confirmed: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      overdue: 'Quá hạn'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Quản lý Đặt hàng (PO)</h1>
          <p className="text-gray-600">Theo dõi đơn đặt hàng và trạng thái giao hàng</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          + Tạo PO mới
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng PO', value: mockPurchaseOrders.length, color: 'blue' },
          { label: 'Đang giao', value: mockPurchaseOrders.filter(po => po.status === 'shipped').length, color: 'purple' },
          { label: 'Quá hạn', value: mockPurchaseOrders.filter(po => po.status === 'overdue').length, color: 'red' },
          { label: 'Đã hoàn tất', value: mockPurchaseOrders.filter(po => po.status === 'delivered').length, color: 'green' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className={`text-3xl font-semibold text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* PO List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Mã PO</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nhà cung cấp</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Số lượng</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ngày giao dự kiến</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockPurchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-blue-600">{po.id}</span>
                  </td>
                  <td className="px-6 py-4">{po.vendorName}</td>
                  <td className="px-6 py-4">{po.productName}</td>
                  <td className="px-6 py-4">{po.quantity}</td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(po.totalAmount)}</td>
                  <td className="px-6 py-4">
                    {formatDate(po.expectedDelivery)}
                    {po.daysOverdue && (
                      <span className="ml-2 text-red-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Quá {po.daysOverdue} ngày
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(po.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
