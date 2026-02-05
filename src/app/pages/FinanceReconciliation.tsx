import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function FinanceReconciliation() {
  const reconciliations = [
    {
      id: 'REC001',
      poId: 'PO001',
      grnId: 'GRN045',
      invoiceId: 'INV234',
      product: 'iPhone 15 Pro Max',
      poAmount: 1499500000,
      grnAmount: 1499500000,
      invoiceAmount: 1499500000,
      status: 'matched',
      matchDate: '2026-02-05'
    },
    {
      id: 'REC002',
      poId: 'PO002',
      grnId: 'GRN046',
      invoiceId: 'INV235',
      product: 'Samsung Galaxy Z Fold 5',
      poAmount: 1169700000,
      grnAmount: 1140000000,
      invoiceAmount: 1169700000,
      status: 'mismatch',
      issue: 'Số lượng thực nhận ít hơn PO',
      matchDate: '2026-02-04'
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'matched') {
      return (
        <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
          <CheckCircle className="w-4 h-4" />
          Khớp dữ liệu
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
        <XCircle className="w-4 h-4" />
        Không khớp
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Đối soát Tài chính (3-way Matching)</h1>
        <p className="text-gray-600">Khớp dữ liệu giữa PO - GRN - Invoice</p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">Quy trình đối soát 3 bước</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. So sánh đơn đặt hàng (PO) với phiếu nhập kho (GRN)</li>
          <li>2. So sánh GRN với hóa đơn từ nhà cung cấp (Invoice)</li>
          <li>3. Xác nhận thanh toán khi dữ liệu khớp 100%</li>
        </ol>
      </div>

      {/* Reconciliation Cards */}
      <div className="space-y-4">
        {reconciliations.map((rec) => (
          <div key={rec.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{rec.id}</h3>
                <p className="text-gray-600">{rec.product}</p>
              </div>
              {getStatusBadge(rec.status)}
            </div>

            {/* Issue Alert */}
            {rec.issue && (
              <div className="mb-4 flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">Vấn đề cần xử lý</p>
                  <p className="text-sm text-orange-800">{rec.issue}</p>
                </div>
              </div>
            )}

            {/* 3-way Matching Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Loại chứng từ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã số</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Số tiền</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3">Purchase Order (PO)</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{rec.poId}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {rec.poAmount.toLocaleString()} VNĐ
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className={rec.grnAmount !== rec.poAmount ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3">Goods Receipt Note (GRN)</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{rec.grnId}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {rec.grnAmount.toLocaleString()} VNĐ
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rec.grnAmount === rec.poAmount ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Invoice (Hóa đơn)</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{rec.invoiceId}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {rec.invoiceAmount.toLocaleString()} VNĐ
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
              {rec.status === 'matched' ? (
                <button className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  Xác nhận thanh toán
                </button>
              ) : (
                <>
                  <button className="flex-1 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                    Yêu cầu làm rõ
                  </button>
                  <button className="flex-1 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                    Điều chỉnh chứng từ
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
