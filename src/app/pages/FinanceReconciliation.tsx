import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate, type FinanceReconciliation, type PurchaseOrder, type GoodsReceipt } from '../services/api';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, DollarSign, FileText, TrendingUp, Clock } from 'lucide-react';

export default function FinanceReconciliationPage() {
  const [recs, setRecs] = useState<FinanceReconciliation[]>([]);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [grns, setGRNs] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reconcile' | 'pos'>('reconcile');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recData, poData, grnData] = await Promise.all([
        api.finance.reconciliations(),
        api.purchaseOrders.list(),
        api.goodsReceipts.list(),
      ]);
      setRecs(recData);
      setPOs(poData);
      setGRNs(grnData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, [string, string, React.ReactNode]> = {
      matched:  ['bg-green-100 text-green-700',  'Khớp dữ liệu',   <CheckCircle className="w-3.5 h-3.5" />],
      mismatch: ['bg-red-100 text-red-700',       'Không khớp',     <XCircle className="w-3.5 h-3.5" />],
      pending:  ['bg-yellow-100 text-yellow-700', 'Chờ xử lý',      <Clock className="w-3.5 h-3.5" />],
      resolved: ['bg-blue-100 text-blue-700',     'Đã giải quyết',  <CheckCircle className="w-3.5 h-3.5" />],
    };
    const [cls, label, icon] = map[status] || ['bg-gray-100 text-gray-700', status, null];
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium w-fit ${cls}`}>
        {icon}{label}
      </span>
    );
  };

  const getPOStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700', confirmed: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-400',
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipped: 'Đang giao',
      delivered: 'Đã giao', overdue: 'Quá hạn', cancelled: 'Đã huỷ',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>{labels[status] || status}</span>;
  };

  const stats = {
    total: recs.length,
    matched: recs.filter(r => r.status === 'matched').length,
    mismatch: recs.filter(r => r.status === 'mismatch').length,
    pending: recs.filter(r => r.status === 'pending').length,
    totalAmount: recs.reduce((a, r) => a + r.po_amount, 0),
    // PO stats
    totalPOs: pos.length,
    deliveredPOs: pos.filter(p => p.status === 'delivered').length,
    pendingPOs: pos.filter(p => p.status === 'pending').length,
    totalPOValue: pos.reduce((a, p) => a + p.total_amount, 0),
    // GRNs linked
    totalGRNs: grns.length,
  };

  // POs that are delivered and have GRN but may not be in reconciliation yet
  const reconciledPOIds = new Set(recs.map(r => r.po_id));
  const deliveredPOsWithGRN = pos.filter(po =>
    po.status === 'delivered' && grns.find(g => g.po_id === po.id)
  );
  const pendingReconciliation = deliveredPOsWithGRN.filter(po => !reconciledPOIds.has(po.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Đối soát Tài chính</h1>
          <p className="text-gray-600">Kiểm tra khớp dữ liệu PO — GRN — Hóa đơn</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đối soát', value: stats.total, color: 'blue', icon: <FileText className="w-5 h-5 text-blue-600" /> },
          { label: 'Khớp dữ liệu', value: stats.matched, color: 'green', icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
          { label: 'Không khớp', value: stats.mismatch, color: 'red', icon: <XCircle className="w-5 h-5 text-red-600" /> },
          { label: 'Chờ xử lý', value: stats.pending, color: 'yellow', icon: <Clock className="w-5 h-5 text-yellow-600" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">{s.label}</p>
              <div className={`p-1.5 bg-${s.color}-50 rounded-lg`}>{s.icon}</div>
            </div>
            <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-blue-100 text-sm">Tổng giá trị đối soát</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-green-100 text-sm">Tổng giá trị PO</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalPOValue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-gray-500 text-sm">PO đã giao / Tổng</p>
              <p className="text-xl font-bold text-purple-700">{stats.deliveredPOs} / {stats.totalPOs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert: POs needing reconciliation */}
      {pendingReconciliation.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="font-semibold text-yellow-800 text-sm">
              {pendingReconciliation.length} đơn hàng đã giao và có phiếu nhập kho — chưa được đối soát
            </span>
          </div>
          <div className="space-y-1">
            {pendingReconciliation.map(po => (
              <div key={po.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm border border-yellow-100">
                <span className="font-mono text-blue-600 font-medium">{po.id}</span>
                <span className="text-gray-600 truncate mx-3">{po.product_name}</span>
                <span className="font-semibold text-gray-700 whitespace-nowrap">{formatCurrency(po.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('reconcile')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'reconcile' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          Đối soát 3 chiều ({recs.length})
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pos' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          Danh sách PO ({pos.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></div>
      ) : activeTab === 'reconcile' ? (
        <div className="space-y-4">
          {recs.map(rec => {
            const hasMismatch = rec.status === 'mismatch';
            const linkedPO = pos.find(p => p.id === rec.po_id);
            const linkedGRN = grns.find(g => g.id === rec.grn_id);
            return (
              <div key={rec.id} className={`bg-white rounded-xl shadow-sm border p-6 ${hasMismatch ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-blue-600">{rec.id}</span>
                      {getStatusBadge(rec.status)}
                      {linkedPO?.pr_id && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded font-mono">{linkedPO.pr_id}</span>
                      )}
                    </div>
                    <p className="font-semibold text-lg mt-1">{rec.product_name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                      {linkedPO && <span>NCC: {linkedPO.vendor_name}</span>}
                      {rec.match_date && <span>Đối soát: {formatDate(rec.match_date)}</span>}
                      {linkedGRN && <span>Nhập kho: {formatDate(linkedGRN.received_date)}</span>}
                    </div>
                  </div>
                </div>

                {/* 3-way match grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: '📋 Purchase Order', id: rec.po_id, amount: rec.po_amount, color: 'blue' as const, sub: linkedPO ? `NCC: ${linkedPO.vendor_name}` : '' },
                    { label: '📦 Phiếu Nhập Kho (GRN)', id: rec.grn_id, amount: rec.grn_amount, color: 'green' as const, sub: linkedGRN ? `Nhận: ${linkedGRN.received_quantity} chiếc` : '' },
                    { label: '🧾 Hóa đơn (Invoice)', id: rec.invoice_id, amount: rec.invoice_amount, color: 'purple' as const, sub: '' },
                  ].map((item, i) => (
                    <div key={i} className={`rounded-xl p-4 bg-${item.color}-50 border border-${item.color}-100`}>
                      <p className={`text-xs font-semibold text-${item.color}-600 mb-1`}>{item.label}</p>
                      <p className={`font-mono text-xs text-${item.color}-400 mb-2`}>{item.id}</p>
                      <p className="font-bold text-lg">{formatCurrency(item.amount)}</p>
                      {item.sub && <p className="text-xs text-gray-500 mt-1">{item.sub}</p>}
                      {hasMismatch && rec.po_amount !== item.amount && item.amount > 0 && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          Chênh: {formatCurrency(Math.abs(rec.po_amount - item.amount))}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {rec.issue && (
                  <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Vấn đề phát hiện</p>
                      <p className="text-sm text-red-600">{rec.issue}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {recs.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có dữ liệu đối soát</p>
              <p className="text-sm mt-1">Dữ liệu sẽ xuất hiện sau khi có phiếu nhập kho và hóa đơn</p>
            </div>
          )}
        </div>
      ) : (
        /* PO Tab */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {['Mã PO', 'PR Nguồn', 'Sản phẩm', 'Nhà cung cấp', 'SL', 'Đơn giá', 'Tổng tiền', 'Ngày đặt', 'Trạng thái', 'Đối soát'].map(h => (
                    <th key={h} className="text-left p-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pos.map(po => {
                  const hasRec = reconciledPOIds.has(po.id);
                  const rec = recs.find(r => r.po_id === po.id);
                  return (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-semibold text-blue-600 whitespace-nowrap">{po.id}</td>
                      <td className="p-3">
                        {po.pr_id
                          ? <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded font-mono">{po.pr_id}</span>
                          : <span className="text-gray-400 text-xs">—</span>
                        }
                      </td>
                      <td className="p-3 font-medium max-w-36 truncate" title={po.product_name}>{po.product_name}</td>
                      <td className="p-3 text-gray-600 max-w-28 truncate" title={po.vendor_name}>{po.vendor_name}</td>
                      <td className="p-3">{po.quantity}</td>
                      <td className="p-3 whitespace-nowrap">{formatCurrency(po.unit_price)}</td>
                      <td className="p-3 font-semibold whitespace-nowrap">{formatCurrency(po.total_amount)}</td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">{formatDate(po.order_date)}</td>
                      <td className="p-3 whitespace-nowrap">{getPOStatusBadge(po.status)}</td>
                      <td className="p-3">
                        {hasRec && rec ? (
                          getStatusBadge(rec.status)
                        ) : po.status === 'delivered' ? (
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded font-medium">Chờ đối soát</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
