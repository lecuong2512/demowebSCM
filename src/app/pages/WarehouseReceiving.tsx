import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate, type PurchaseOrder, type GoodsReceipt } from '../services/api';
import { Package, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

export default function WarehouseReceiving() {
  const [availablePOs, setAvailablePOs] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceipt[]>([]);
  const [selectedPO, setSelectedPO] = useState('');
  const [receivedQty, setReceivedQty] = useState(0);
  const [damagedQty, setDamagedQty] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success'|'error'>('success');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poData, grnData] = await Promise.all([
        api.purchaseOrders.list(),
        api.goodsReceipts.list(),
      ]);
      setAvailablePOs(poData.filter(po => po.status === 'shipped' || po.status === 'confirmed'));
      setGrns(grnData);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedPOData = availablePOs.find(po => po.id === selectedPO);

  const handleSubmit = async () => {
    if (!selectedPO || receivedQty <= 0) {
      setMsg('Vui lòng chọn PO và nhập số lượng nhận');
      setMsgType('error');
      return;
    }
    if (damagedQty > receivedQty) {
      setMsg('Số lượng hỏng không thể lớn hơn số lượng nhận');
      setMsgType('error');
      return;
    }
    setSaving(true);
    try {
      await api.goodsReceipts.create({
        po_id: selectedPO,
        received_quantity: receivedQty,
        damaged_quantity: damagedQty,
        notes,
      });
      setMsg(`✅ Đã tạo phiếu nhập kho thành công! Tồn kho đã được cập nhật (+${receivedQty - damagedQty} chiếc)`);
      setMsgType('success');
      setSelectedPO('');
      setReceivedQty(0);
      setDamagedQty(0);
      setNotes('');
      await fetchData();
    } catch (e: any) {
      setMsg(e.message);
      setMsgType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Nhập kho (GRN)</h1>
          <p className="text-gray-600">Tạo phiếu nhập kho từ đơn đặt hàng</p>
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

      {/* Create GRN Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-lg mb-4">Tạo Phiếu Nhập Kho</h2>
        <div className="space-y-5">
          {/* Select PO */}
          <div>
            <label className="block mb-2 font-medium">Chọn đơn hàng (PO) *</label>
            {loading ? (
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ) : availablePOs.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Không có đơn hàng nào đang chờ nhập kho. Cần PO ở trạng thái "Đang giao" hoặc "Đã xác nhận".</span>
              </div>
            ) : (
              <select
                value={selectedPO}
                onChange={(e) => { setSelectedPO(e.target.value); setReceivedQty(0); setDamagedQty(0); }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn PO --</option>
                {availablePOs.map(po => (
                  <option key={po.id} value={po.id}>
                    {po.id} — {po.product_name} ({po.quantity} chiếc) · {po.vendor_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* PO Details */}
          {selectedPOData && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-600 font-medium">Sản phẩm</p>
                <p className="font-semibold">{selectedPOData.product_name}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Nhà cung cấp</p>
                <p className="font-semibold">{selectedPOData.vendor_name}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Số lượng đặt</p>
                <p className="font-semibold text-lg">{selectedPOData.quantity} chiếc</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Tổng tiền</p>
                <p className="font-semibold">{formatCurrency(selectedPOData.total_amount)}</p>
              </div>
            </div>
          )}

          {/* Received Qty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">Số lượng thực nhận *</label>
              <input
                type="number"
                min="0"
                max={selectedPOData?.quantity}
                value={receivedQty || ''}
                onChange={(e) => setReceivedQty(parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số lượng nhận"
              />
              {selectedPOData && receivedQty > 0 && receivedQty < selectedPOData.quantity && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠ Nhận thiếu {selectedPOData.quantity - receivedQty} chiếc so với đơn
                </p>
              )}
            </div>
            <div>
              <label className="block mb-2 font-medium">Số lượng hỏng / lỗi</label>
              <input
                type="number"
                min="0"
                max={receivedQty}
                value={damagedQty || ''}
                onChange={(e) => setDamagedQty(parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Summary */}
          {receivedQty > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center gap-3">
              <Package className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">
                Tồn kho sẽ tăng thêm <strong>{receivedQty - damagedQty} chiếc</strong> (nhận {receivedQty} - hỏng {damagedQty})
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block mb-2 font-medium">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tình trạng hàng, ghi chú bổ sung..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !selectedPO || receivedQty <= 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {saving ? 'Đang xử lý...' : 'Tạo Phiếu Nhập Kho'}
          </button>
        </div>
      </div>

      {/* GRN History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Lịch sử Phiếu Nhập Kho ({grns.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" /></div>
        ) : grns.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Chưa có phiếu nhập kho nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {['Mã GRN', 'Mã PO', 'Ngày nhận', 'SL nhận', 'SL hỏng', 'SL tốt', 'Nhân viên', 'Ghi chú'].map(h => (
                    <th key={h} className="text-left p-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grns.map(grn => (
                  <tr key={grn.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-medium text-blue-600">{grn.id}</td>
                    <td className="p-3 font-mono text-gray-600">{grn.po_id}</td>
                    <td className="p-3 text-gray-600">{formatDate(grn.received_date)}</td>
                    <td className="p-3 font-semibold">{grn.received_quantity}</td>
                    <td className="p-3">
                      {grn.damaged_quantity > 0
                        ? <span className="text-red-600 font-medium">{grn.damaged_quantity}</span>
                        : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="p-3">
                      <span className="text-green-700 font-semibold">{grn.received_quantity - grn.damaged_quantity}</span>
                    </td>
                    <td className="p-3 text-gray-600">{grn.received_by_name}</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{grn.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
