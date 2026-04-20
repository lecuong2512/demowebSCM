import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api, formatCurrency, formatDate, type PurchaseOrder, type GoodsReceipt, type Product } from '../services/api';
import { Package, CheckCircle, RefreshCw, AlertCircle, AlertTriangle, TrendingUp } from 'lucide-react';

export default function WarehouseReceiving() {
  const location = useLocation();
  const [tab, setTab] = useState<'receive'|'inventory'>(location.state?.tab === 'inventory' ? 'inventory' : 'receive');
  const [availablePOs, setAvailablePOs] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceipt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
      const [poData, grnData, productData] = await Promise.all([
        api.purchaseOrders.list(),
        api.goodsReceipts.list(),
        api.products.list(),
      ]);
      setAvailablePOs(poData.filter(po => po.status === 'shipped' || po.status === 'confirmed'));
      setGrns(grnData);
      setProducts(productData);
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

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Quản lý Kho</h1>
          <p className="text-gray-600">Nhập kho, theo dõi tồn kho và quản lý sản phẩm</p>
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

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200 w-fit">
        <button
          onClick={() => setTab('receive')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            tab === 'receive' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📥 Nhập Kho
        </button>
        <button
          onClick={() => setTab('inventory')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            tab === 'inventory' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📦 Thông Tin Kho ({products.length})
        </button>
      </div>

      {/* Tab: Nhập Kho */}
      {tab === 'receive' && (
        <>
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
        </>
      )}

      {/* Tab: Thông Tin Kho */}
      {tab === 'inventory' && (
        <>
          {/* Inventory Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tồn kho bình thường</p>
                  <p className="text-2xl font-bold text-gray-900">{products.filter(p => p.current_stock > p.min_stock).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-orange-200 p-4 bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Cảnh báo tồn kho thấp</p>
                  <p className="text-2xl font-bold text-orange-900">{lowStockProducts.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Sản phẩm tồn kho thấp:</h3>
                  <div className="flex flex-wrap gap-2">
                    {lowStockProducts.map(p => (
                      <span key={p.id} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                        {p.name} ({p.current_stock}/{p.min_stock})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-lg">Chi Tiết Tồn Kho</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" /></div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Chưa có sản phẩm nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      {['Sản phẩm', 'SKU', 'Danh mục', 'Tồn kho', 'Tối thiểu', 'Trạng thái', 'Giá cuối cùng', 'Đơn vị'].map(h => (
                        <th key={h} className="text-left p-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(product => {
                      const isLowStock = product.current_stock <= product.min_stock;
                      return (
                        <tr key={product.id} className={isLowStock ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}>
                          <td className="p-3 font-medium text-gray-900">{product.name}</td>
                          <td className="p-3 font-mono text-gray-600 text-xs">{product.sku || '—'}</td>
                          <td className="p-3 text-gray-600">{product.category}</td>
                          <td className="p-3">
                            <span className={`font-bold ${isLowStock ? 'text-orange-700' : 'text-green-700'}`}>
                              {product.current_stock}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{product.min_stock}</td>
                          <td className="p-3">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                                <AlertTriangle className="w-3 h-3" /> Cảnh báo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                ✓ Bình thường
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium">{formatCurrency(product.last_price)}</td>
                          <td className="p-3 text-gray-600">{product.unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
