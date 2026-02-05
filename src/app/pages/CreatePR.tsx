import React, { useState } from 'react';
import { mockProducts, getProductById, formatCurrency, Product } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Save,
  Send,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreatePR() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'editing' | 'saving' | 'saved'>('editing');

  const handleProductChange = (productId: string) => {
    const product = getProductById(productId);
    setSelectedProduct(product || null);
    // Reset quantity when product changes
    setQuantity(0);
  };

  const calculateAISuggestion = (product: Product): number => {
    // AI suggestion logic: based on min stock, current stock, and sales trend
    const deficit = Math.max(0, product.minStock - product.currentStock);
    const buffer = Math.ceil(product.minStock * 0.3); // 30% buffer
    const suggestion = deficit + buffer;
    return Math.max(suggestion, 10); // Minimum suggestion is 10 units
  };

  const handleSaveDraft = () => {
    setStatus('saving');
    setTimeout(() => {
      setStatus('saved');
      alert('Đã lưu nháp thành công!');
    }, 500);
  };

  const handleSubmit = () => {
    if (!selectedProduct || quantity <= 0 || !reason.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    setStatus('saving');
    setTimeout(() => {
      alert('Yêu cầu mua hàng đã được gửi thành công!');
      navigate('/pr/tracking');
    }, 500);
  };

  const isLowStock = selectedProduct && selectedProduct.currentStock < selectedProduct.minStock;
  const aiSuggestion = selectedProduct ? calculateAISuggestion(selectedProduct) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl mb-1">Tạo Yêu cầu Mua hàng (PR)</h1>
          <p className="text-gray-600">Tạo yêu cầu mua hàng mới với hỗ trợ AI</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block mb-2 font-medium">Chọn mặt hàng *</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedProduct?.id || ''}
              onChange={(e) => handleProductChange(e.target.value)}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {mockProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.category})
                </option>
              ))}
            </select>
          </div>

          {/* Product Info Card */}
          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">Thông tin sản phẩm</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-blue-700">Tồn kho hiện tại:</span>
                      <span className={`ml-2 font-semibold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedProduct.currentStock} {selectedProduct.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Mức tồn tối thiểu:</span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {selectedProduct.minStock} {selectedProduct.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Giá gần nhất:</span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {formatCurrency(selectedProduct.lastPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Danh mục:</span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {selectedProduct.category}
                      </span>
                    </div>
                  </div>
                  
                  {isLowStock && (
                    <div className="mt-3 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800">
                        <strong>Cảnh báo:</strong> Tồn kho hiện tại thấp hơn mức tối thiểu {selectedProduct.minStock - selectedProduct.currentStock} {selectedProduct.unit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Suggestion */}
          {selectedProduct && aiSuggestion > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                    Gợi ý AI
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Thông minh</span>
                  </h3>
                  <p className="text-sm text-purple-800 mb-2">
                    Dựa trên lịch sử bán hàng và xu hướng thị trường, chúng tôi gợi ý bạn nên nhập:
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-purple-300">
                      <span className="text-2xl font-bold text-purple-600">{aiSuggestion}</span>
                      <span className="ml-2 text-purple-700">{selectedProduct.unit}</span>
                    </div>
                    <button
                      onClick={() => setQuantity(aiSuggestion)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Áp dụng gợi ý
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-purple-700">
                    <TrendingUp className="w-3 h-3" />
                    <span>Dự đoán tăng nhu cầu 15% trong tháng tới</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block mb-2 font-medium">Số lượng yêu cầu *</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số lượng"
              />
              {selectedProduct && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {selectedProduct.unit}
                </span>
              )}
            </div>
            {quantity > 0 && selectedProduct && (
              <p className="mt-2 text-sm text-gray-600">
                Dự kiến tổng giá trị: <span className="font-semibold text-blue-600">
                  {formatCurrency(quantity * selectedProduct.lastPrice)}
                </span>
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block mb-2 font-medium">Lý do nhập hàng *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Dự kiến tăng nhu cầu dịp Tết, Bổ sung tồn kho sau đợt khuyến mãi, v.v."
            />
            <p className="mt-1 text-sm text-gray-500">{reason.length}/500 ký tự</p>
          </div>

          {/* Created By Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Người tạo: <span className="font-medium text-gray-900">{user?.fullName}</span>
            </p>
            <p className="text-sm text-gray-600">
              Ngày tạo: <span className="font-medium text-gray-900">{new Date().toLocaleDateString('vi-VN')}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveDraft}
              disabled={status === 'saving'}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{status === 'saving' ? 'Đang lưu...' : 'Lưu nháp'}</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedProduct || quantity <= 0 || !reason.trim() || status === 'saving'}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              <span>Gửi yêu cầu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Help Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Mẹo tạo yêu cầu hiệu quả</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Kiểm tra tồn kho hiện tại trước khi tạo yêu cầu</li>
          <li>• Tham khảo gợi ý AI để tối ưu hóa số lượng nhập</li>
          <li>• Ghi rõ lý do để giúp quá trình duyệt nhanh hơn</li>
          <li>• Lưu nháp nếu cần bổ sung thông tin sau</li>
        </ul>
      </div>
    </div>
  );
}
