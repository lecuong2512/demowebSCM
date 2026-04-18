import React, { useState, useEffect } from 'react';
import { api, formatCurrency, type Product } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Package, AlertCircle, TrendingUp, Sparkles, Save, Send, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreatePR() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.products.list().then(setProducts).catch(console.error);
  }, []);

  const handleProductChange = (productId: string) => {
    const p = products.find(x => x.id === productId) || null;
    setSelectedProduct(p);
    setQuantity(0);
  };

  const aiSuggestion = selectedProduct
    ? Math.max(Math.max(0, selectedProduct.min_stock - selectedProduct.current_stock) + Math.ceil(selectedProduct.min_stock * 0.3), 10)
    : 0;

  const handleSave = async (submitStatus: 'draft' | 'pending') => {
    if (!selectedProduct || quantity <= 0 || !reason.trim()) {
      setMsg('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setStatus('saving');
    setMsg('');
    try {
      await api.purchaseRequests.create({
        product_id: selectedProduct.id,
        quantity,
        reason,
        status: submitStatus,
      });
      setStatus('saved');
      setMsg(submitStatus === 'pending' ? 'Đã gửi yêu cầu duyệt thành công!' : 'Đã lưu nháp!');
      setTimeout(() => navigate('/pr/tracking'), 1200);
    } catch (e: any) {
      setStatus('error');
      setMsg(e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl mb-1">Tạo Yêu cầu Mua hàng</h1>
          <p className="text-gray-600">Tạo mới Purchase Request (PR)</p>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-lg border ${status === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {msg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Select Product */}
        <div>
          <label className="block mb-2 font-medium">Chọn Sản phẩm *</label>
          <select
            value={selectedProduct?.id || ''}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
            ))}
          </select>
        </div>

        {/* Product Info */}
        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">Tồn kho hiện tại</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{selectedProduct.current_stock}</p>
              <p className="text-xs text-blue-600">{selectedProduct.unit}</p>
            </div>
            <div className={`rounded-lg p-4 ${selectedProduct.current_stock < selectedProduct.min_stock ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Tồn kho tối thiểu</span>
              </div>
              <p className="text-2xl font-bold">{selectedProduct.min_stock}</p>
              {selectedProduct.current_stock < selectedProduct.min_stock && (
                <p className="text-xs text-red-600">⚠ Dưới mức tối thiểu</p>
              )}
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI gợi ý</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{aiSuggestion}</p>
              <p className="text-xs text-purple-600">Dựa trên tồn kho & xu hướng</p>
            </div>
          </div>
        )}

        {/* AI Suggestion Banner */}
        {selectedProduct && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-700">Đề xuất AI</span>
            </div>
            <p className="text-sm text-gray-700">
              Dựa trên tồn kho ({selectedProduct.current_stock}/{selectedProduct.min_stock}), AI khuyến nghị nhập <strong>{aiSuggestion} {selectedProduct.unit}</strong>.
            </p>
            <button
              onClick={() => setQuantity(aiSuggestion)}
              className="mt-2 text-sm text-purple-600 hover:text-purple-800 underline"
            >
              Áp dụng gợi ý này
            </button>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block mb-2 font-medium">Số lượng yêu cầu *</label>
          <input
            type="number"
            min="1"
            value={quantity || ''}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập số lượng"
          />
          {selectedProduct && quantity > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Giá dự kiến: {formatCurrency(selectedProduct.last_price * quantity)}
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block mb-2 font-medium">Lý do yêu cầu *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mô tả lý do cần mua hàng..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={status === 'saving'}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {status === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu nháp
          </button>
          <button
            onClick={() => handleSave('pending')}
            disabled={status === 'saving'}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {status === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gửi duyệt
          </button>
        </div>
      </div>
    </div>
  );
}
