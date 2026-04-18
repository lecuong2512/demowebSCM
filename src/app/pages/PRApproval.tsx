import React, { useState, useEffect } from 'react';
import { api, formatCurrency, type PurchaseRequest, type Vendor } from '../services/api';
import { CheckCircle, XCircle, RefreshCw, Star, Truck, Package } from 'lucide-react';

export default function PRApproval() {
  const [pendingPRs, setPendingPRs] = useState<PurchaseRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adjustedQty, setAdjustedQty] = useState<number | ''>('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prs, vends] = await Promise.all([
        api.purchaseRequests.list('pending'),
        api.vendors.list(),
      ]);
      setPendingPRs(prs);
      setVendors(vends);
      const first = prs[0] || null;
      setSelectedPR(first);
      if (first && vends.length > 0) {
        const best = [...vends].sort((a, b) => b.rating - a.rating)[0];
        setSelectedVendorId(best.id);
        setUnitPrice('');
      }
    } catch (e: any) {
      setMsg(e.message); setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // When PR changes, reset vendor & price
  const selectPR = (pr: PurchaseRequest) => {
    setSelectedPR(pr);
    setDecision(null);
    setMsg('');
    setAdjustedQty('');
    setRejectionReason('');
    setDeliveryDays(7);
    if (vendors.length > 0) {
      const best = [...vendors].sort((a, b) => b.rating - a.rating)[0];
      setSelectedVendorId(best.id);
    }
    setUnitPrice('');
  };

  // When vendor changes, auto-fill price hint
  const handleVendorChange = (vid: string) => {
    setSelectedVendorId(vid);
    setUnitPrice('');
  };

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  const handleApprove = async () => {
    if (!selectedPR) return;
    if (!selectedVendorId) {
      setMsg('Vui lòng chọn nhà cung cấp'); setMsgType('error'); return;
    }
    setSaving(true);
    try {
      await api.purchaseRequests.approve(selectedPR.id, {
        adjusted_quantity: adjustedQty ? Number(adjustedQty) : undefined,
        vendor_id: selectedVendorId,
        unit_price: unitPrice ? Number(unitPrice) : undefined,
        delivery_days: deliveryDays,
      });
      setMsg(`✅ Đã duyệt ${selectedPR.id}! PO và lô hàng vận chuyển đã được tạo tự động.`);
      setMsgType('success');
      setDecision(null);
      setAdjustedQty('');
      setRejectionReason('');
      await fetchData();
    } catch (e: any) {
      setMsg(e.message); setMsgType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPR || !rejectionReason.trim()) {
      setMsg('Vui lòng nhập lý do từ chối'); setMsgType('error');
      return;
    }
    setSaving(true);
    try {
      await api.purchaseRequests.reject(selectedPR.id, rejectionReason);
      setMsg(`Đã từ chối ${selectedPR.id}`);
      setMsgType('success');
      setDecision(null);
      setRejectionReason('');
      await fetchData();
    } catch (e: any) {
      setMsg(e.message); setMsgType('error');
    } finally {
      setSaving(false);
    }
  };

  const qty = adjustedQty || selectedPR?.quantity || 0;
  const price = Number(unitPrice) || 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (pendingPRs.length === 0) return (
    <div className="space-y-6">
      <h1 className="text-3xl mb-1">Duyệt Yêu cầu Mua hàng</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-600">Tất cả yêu cầu đã được xử lý</h3>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">Làm mới</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Duyệt Yêu cầu Mua hàng</h1>
          <p className="text-gray-600">{pendingPRs.length} yêu cầu đang chờ duyệt</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-lg border ${msgType === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PR List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 font-semibold text-sm text-gray-700">
            Danh sách chờ duyệt ({pendingPRs.length})
          </div>
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {pendingPRs.map(pr => (
              <button
                key={pr.id}
                onClick={() => selectPR(pr)}
                className={`w-full text-left p-4 hover:bg-blue-50 transition-colors ${selectedPR?.id === pr.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-blue-600 font-semibold">{pr.id}</span>
                  <span className="text-xs text-gray-400">{pr.created_date}</span>
                </div>
                <p className="font-medium text-sm mt-1 truncate">{pr.product_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{pr.quantity} chiếc • {pr.created_by_name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedPR && (
          <div className="lg:col-span-2 space-y-4">
            {/* PR Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">{selectedPR.id} — {selectedPR.product_name}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-blue-500 text-xs mb-1">Số lượng yêu cầu</p>
                  <p className="font-bold text-xl text-blue-700">{selectedPR.quantity}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-purple-500 text-xs mb-1">AI gợi ý</p>
                  <p className="font-bold text-xl text-purple-700">{selectedPR.ai_suggestion}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs mb-1">Tồn kho</p>
                  <p className="font-bold text-xl text-gray-700">{selectedPR.current_stock}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs mb-1">Người tạo</p>
                  <p className="font-semibold text-sm text-gray-700 truncate">{selectedPR.created_by_name}</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 text-sm">Lý do: </span>
                <span className="text-sm font-medium">{selectedPR.reason}</span>
              </div>
            </div>

            {/* Vendor Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Chọn Nhà Cung Cấp *
              </h3>
              <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                {vendors.map((v, i) => {
                  const isSelected = selectedVendorId === v.id;
                  const isBest = i === [...vendors].sort((a,b) => b.rating - a.rating).findIndex(x => x.id === v.id) && v.rating === Math.max(...vendors.map(x => x.rating));
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVendorChange(v.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{v.name}</p>
                            <p className="text-xs text-gray-500">{v.contact_person} • {v.phone}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs space-y-0.5">
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold text-yellow-600">{v.rating}/5</span>
                          </div>
                          <p className="text-gray-400">Đúng hạn {v.on_time_delivery}%</p>
                          <p className="text-gray-400">Chất lượng {v.quality_score}%</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedVendor && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Đã chọn: <strong>{selectedVendor.name}</strong> — {selectedVendor.email}</span>
                </div>
              )}
            </div>

            {/* PO Parameters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                Thông số Đơn hàng (PO)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Số lượng
                    <span className="text-xs text-gray-400 ml-1">(mặc định: {selectedPR.quantity})</span>
                  </label>
                  <input
                    type="number" min="1"
                    value={adjustedQty}
                    onChange={(e) => setAdjustedQty(e.target.value ? Number(e.target.value) : '')}
                    placeholder={String(selectedPR.quantity)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Đơn giá (VND)</label>
                  <input
                    type="number" min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Nhập đơn giá..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ngày giao (số ngày)</label>
                  <select
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {[3,5,7,10,14,21,30].map(d => (
                      <option key={d} value={d}>{d} ngày</option>
                    ))}
                  </select>
                </div>
              </div>

              {qty > 0 && price > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-green-700">Tổng giá trị PO dự kiến</span>
                  <span className="font-bold text-green-700 text-lg">{formatCurrency(Number(qty) * price)}</span>
                </div>
              )}
            </div>

            {/* Decision */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-lg mb-4">Quyết định</h3>

              {decision === 'reject' && (
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-red-600">Lý do từ chối *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                    placeholder="Nhập lý do rõ ràng..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setDecision(null)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-lg disabled:opacity-50 text-sm"
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Xác nhận từ chối
                    </button>
                  </div>
                </div>
              )}

              {decision !== 'reject' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={saving || !selectedVendorId}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 font-medium"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Duyệt & Tạo PO tự động
                  </button>
                  <button
                    onClick={() => setDecision('reject')}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
