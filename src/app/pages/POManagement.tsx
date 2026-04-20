import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate, type PurchaseOrder } from '../services/api';
import { ShoppingCart, RefreshCw, Zap } from 'lucide-react';

export default function POManagement() {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const poData = await api.purchaseOrders.list();
      setPOs(poData);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusUpdate = async (poId: string, status: string) => {
    try {
      await api.purchaseOrders.updateStatus(poId, status);
      setMsg(`Đã cập nhật trạng thái PO ${poId}`);
      setTimeout(() => setMsg(''), 3000);
      await fetchData();
    } catch (e: any) { setMsg(e.message); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending:   'bg-gray-100 text-gray-700',
      confirmed: 'bg-blue-100 text-blue-700',
      shipped:   'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      overdue:   'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipped: 'Đang giao',
      delivered: 'Đã giao', overdue: 'Quá hạn', cancelled: 'Đã huỷ',
    };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>{labels[status] || status}</span>;
  };

  const nextStatus: Record<string, string> = {
    pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered',
  };
  const nextLabel: Record<string, string> = {
    pending: 'Xác nhận', confirmed: 'Giao hàng', shipped: 'Đã nhận',
  };

  const stats = [
    { label: 'Tổng PO', value: pos.length, color: 'blue' },
    { label: 'Chờ xác nhận', value: pos.filter(p => p.status === 'pending').length, color: 'yellow' },
    { label: 'Đang giao', value: pos.filter(p => p.status === 'shipped').length, color: 'purple' },
    { label: 'Quá hạn', value: pos.filter(p => p.status === 'overdue').length, color: 'red' },
    { label: 'Hoàn tất', value: pos.filter(p => p.status === 'delivered').length, color: 'green' },
  ];
  const totalPages = Math.max(1, Math.ceil(pos.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPOs = pos.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Quản lý Đặt hàng (PO)</h1>
          <p className="text-gray-600">Đơn đặt hàng được tạo <strong>tự động</strong> khi yêu cầu mua hàng được duyệt</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm">
            <Zap className="w-4 h-4" />
            <span>PO tự động từ PR đã duyệt</span>
          </div>
          <button onClick={fetchData} className="p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{msg}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-600 text-xs mb-1">{s.label}</p>
            <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></div>
      ) : pos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500">Chưa có đơn đặt hàng</h3>
          <p className="text-gray-400 text-sm mt-2">Đơn hàng sẽ tự động tạo khi quản lý duyệt yêu cầu mua hàng (PR)</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {['Mã PO', 'PR nguồn', 'Sản phẩm', 'Nhà cung cấp', 'SL', 'Tổng tiền', 'Ngày đặt', 'Giao dự kiến', 'Trạng thái', 'Hành động'].map(h => (
                    <th key={h} className="text-left p-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedPOs.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-medium text-blue-600 whitespace-nowrap">{po.id}</td>
                    <td className="p-3">
                      {po.pr_id ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded font-mono">{po.pr_id}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 font-medium max-w-36 truncate" title={po.product_name}>{po.product_name}</td>
                    <td className="p-3 text-gray-600 max-w-32 truncate" title={po.vendor_name}>{po.vendor_name}</td>
                    <td className="p-3">{po.quantity}</td>
                    <td className="p-3 font-medium whitespace-nowrap">{formatCurrency(po.total_amount)}</td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">{formatDate(po.order_date)}</td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">{formatDate(po.expected_delivery)}</td>
                    <td className="p-3 whitespace-nowrap">{getStatusBadge(po.status)}</td>
                    <td className="p-3">
                      {nextStatus[po.status] && (
                        <button
                          onClick={() => handleStatusUpdate(po.id, nextStatus[po.status])}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 whitespace-nowrap"
                        >
                          → {nextLabel[po.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Hiển thị {pos.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, pos.length)} / {pos.length} đơn
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="text-gray-600">
                Trang {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border border-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
