import React, { useState } from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { mockPurchaseOrders } from '../data/mockData';

export default function WarehouseReceiving() {
  const [selectedPO, setSelectedPO] = useState('');
  const [receivedQty, setReceivedQty] = useState(0);
  const [damagedQty, setDamagedQty] = useState(0);
  const [notes, setNotes] = useState('');

  const availablePOs = mockPurchaseOrders.filter(po => 
    po.status === 'shipped' || po.status === 'delivered'
  );

  const selectedPOData = availablePOs.find(po => po.id === selectedPO);

  const handleSubmit = () => {
    if (!selectedPO || receivedQty <= 0) {
      alert('Vui lòng chọn PO và nhập số lượng nhận');
      return;
    }
    alert('Đã tạo phiếu nhập kho thành công!');
    setSelectedPO('');
    setReceivedQty(0);
    setDamagedQty(0);
    setNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Nhập kho (GRN)</h1>
        <p className="text-gray-600">Tạo phiếu nhập kho từ đơn đặt hàng</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          {/* Select PO */}
          <div>
            <label className="block mb-2 font-medium">Chọn đơn hàng (PO) *</label>
            <select
              value={selectedPO}
              onChange={(e) => setSelectedPO(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn PO --</option>
              {availablePOs.map(po => (
                <option key={po.id} value={po.id}>
                  {po.id} - {po.productName} ({po.quantity} chiếc)
                </option>
              ))}
            </select>
          </div>

          {/* PO Details (Read-only) */}
          {selectedPOData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">Thông tin đơn hàng</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Nhà cung cấp:</span>
                      <span className="ml-2 font-semibold text-blue-900">{selectedPOData.vendorName}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Sản phẩm:</span>
                      <span className="ml-2 font-semibold text-blue-900">{selectedPOData.productName}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Số lượng đặt:</span>
                      <span className="ml-2 font-semibold text-blue-900">{selectedPOData.quantity}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Đơn giá:</span>
                      <span className="ml-2 font-semibold text-blue-900">{selectedPOData.unitPrice.toLocaleString()} VNĐ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Received Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">Số lượng thực nhận *</label>
              <input
                type="number"
                min="0"
                value={receivedQty || ''}
                onChange={(e) => setReceivedQty(parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số lượng"
                disabled={!selectedPO}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Số lượng lỗi/hỏng</label>
              <input
                type="number"
                min="0"
                value={damagedQty || ''}
                onChange={(e) => setDamagedQty(parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số lượng lỗi"
                disabled={!selectedPO}
              />
            </div>
          </div>

          {/* Comparison */}
          {selectedPOData && receivedQty > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đặt hàng</p>
                  <p className="text-2xl font-semibold">{selectedPOData.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Thực nhận</p>
                  <p className={`text-2xl font-semibold ${
                    receivedQty === selectedPOData.quantity ? 'text-green-600' : 
                    receivedQty < selectedPOData.quantity ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {receivedQty}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Chênh lệch</p>
                  <p className={`text-2xl font-semibold ${
                    receivedQty === selectedPOData.quantity ? 'text-gray-600' : 'text-red-600'
                  }`}>
                    {receivedQty - selectedPOData.quantity}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block mb-2 font-medium">Ghi chú nhập kho</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ghi chú về tình trạng hàng, bao bì, v.v..."
              disabled={!selectedPO}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedPO || receivedQty <= 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Xác nhận nhập kho</span>
          </button>
        </div>
      </div>
    </div>
  );
}
