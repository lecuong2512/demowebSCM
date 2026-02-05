import React, { useState } from 'react';
import { mockPurchaseRequests, mockVendors, formatCurrency } from '../data/mockData';
import { CheckCircle, XCircle, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

export default function PRApproval() {
  const pendingPRs = mockPurchaseRequests.filter(pr => pr.status === 'pending');
  const [selectedPR, setSelectedPR] = useState(pendingPRs[0] || null);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adjustedQuantity, setAdjustedQuantity] = useState<number | null>(null);

  const handleApprove = () => {
    if (adjustedQuantity && adjustedQuantity !== selectedPR.quantity && !rejectionReason.trim()) {
      alert('Vui lòng nhập lý do điều chỉnh số lượng');
      return;
    }
    alert('Đã duyệt yêu cầu thành công!');
    setDecision(null);
    setRejectionReason('');
    setAdjustedQuantity(null);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    alert('Đã từ chối yêu cầu!');
    setDecision(null);
    setRejectionReason('');
  };

  if (!selectedPR) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl mb-1">Duyệt Yêu cầu Mua hàng</h1>
          <p className="text-gray-600">Không có yêu cầu nào đang chờ duyệt</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600">Tất cả yêu cầu đã được xử lý</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Duyệt Yêu cầu Mua hàng</h1>
        <p className="text-gray-600">Xem xét và phê duyệt các yêu cầu mua hàng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PR List */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold mb-3">Yêu cầu chờ duyệt ({pendingPRs.length})</h3>
            <div className="space-y-2">
              {pendingPRs.map((pr) => (
                <div
                  key={pr.id}
                  onClick={() => setSelectedPR(pr)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedPR.id === pr.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm">{pr.id}</div>
                  <div className="text-sm text-gray-600 truncate">{pr.productName}</div>
                  <div className="text-xs text-gray-500 mt-1">{pr.createdBy}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PR Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold mb-1">{selectedPR.id}</h2>
                <p className="text-gray-600">{selectedPR.productName}</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                Chờ duyệt
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Người tạo</p>
                <p className="font-medium">{selectedPR.createdBy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                <p className="font-medium">{selectedPR.createdDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Số lượng yêu cầu</p>
                <p className="font-medium text-xl text-blue-600">{selectedPR.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tồn kho hiện tại</p>
                <p className="font-medium text-xl">{selectedPR.currentStock}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Lý do nhập hàng</p>
              <p className="bg-gray-50 p-3 rounded-lg">{selectedPR.reason}</p>
            </div>

            {selectedPR.currentStock < 50 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">Cảnh báo tồn kho thấp</p>
                  <p className="text-sm text-orange-800">Sản phẩm này đang có tồn kho thấp hơn mức tối thiểu</p>
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestion */}
          {selectedPR.aiSuggestion && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    Đề xuất AI
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Thông minh</span>
                  </h3>
                  <p className="text-purple-800 mb-3">
                    Dựa trên phân tích dữ liệu lịch sử bán hàng, AI gợi ý:
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-purple-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Số lượng đề xuất</p>
                        <p className="text-2xl font-bold text-purple-600">{selectedPR.aiSuggestion}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">So với yêu cầu</p>
                        <p className={`text-lg font-semibold ${
                          selectedPR.aiSuggestion > selectedPR.quantity ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {selectedPR.aiSuggestion > selectedPR.quantity ? '+' : ''}
                          {selectedPR.aiSuggestion - selectedPR.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-purple-700 mt-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Dự đoán tăng 15% nhu cầu trong tháng tới
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Vendor Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-lg mb-4">So sánh giá nhà cung cấp</h3>
            <div className="space-y-3">
              {mockVendors.slice(0, 3).map((vendor, index) => (
                <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-xs text-gray-500">Rating: {vendor.rating}/5</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(30000000 - index * 1000000)}</p>
                    <p className="text-xs text-gray-500">Giao trong 5-7 ngày</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-lg mb-4">Quyết định duyệt</h3>
            
            {/* Adjust Quantity */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Điều chỉnh số lượng (không bắt buộc)</label>
              <input
                type="number"
                value={adjustedQuantity || selectedPR.quantity}
                onChange={(e) => setAdjustedQuantity(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số lượng điều chỉnh"
              />
            </div>

            {/* Rejection Reason */}
            {(decision === 'reject' || (adjustedQuantity && adjustedQuantity !== selectedPR.quantity)) && (
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-red-600">
                  Lý do {decision === 'reject' ? 'từ chối' : 'điều chỉnh'} *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nhập lý do rõ ràng để người tạo yêu cầu hiểu..."
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setDecision('approve'); handleApprove(); }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Duyệt yêu cầu</span>
              </button>
              <button
                onClick={() => setDecision('reject')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
                <span>Từ chối</span>
              </button>
            </div>

            {decision === 'reject' && (
              <button
                onClick={handleReject}
                className="w-full mt-3 px-6 py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors"
              >
                Xác nhận từ chối
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
