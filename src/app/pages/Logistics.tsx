import React from 'react';
import { Truck, MapPin, Clock, AlertCircle } from 'lucide-react';

export default function Logistics() {
  const shipments = [
    {
      id: 'SHIP001',
      poId: 'PO001',
      product: 'iPhone 15 Pro Max',
      status: 'in_transit',
      currentLocation: 'Hà Nội - Trung tâm phân phối',
      progress: 60,
      estimatedArrival: '2026-02-10',
      carrier: 'Viettel Post'
    },
    {
      id: 'SHIP002',
      poId: 'PO002',
      product: 'Samsung Galaxy Z Fold 5',
      status: 'delayed',
      currentLocation: 'TP.HCM - Kho NCC',
      progress: 30,
      estimatedArrival: '2026-02-08',
      carrier: 'GHTK',
      issue: 'Chậm trễ do thời tiết xấu'
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      in_transit: 'bg-blue-100 text-blue-700',
      delayed: 'bg-red-100 text-red-700',
      delivered: 'bg-green-100 text-green-700'
    };
    const labels: Record<string, string> = {
      pending: 'Chờ vận chuyển',
      in_transit: 'Đang giao',
      delayed: 'Chậm trễ',
      delivered: 'Đã giao'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Quản lý Logistics</h1>
        <p className="text-gray-600">Theo dõi lộ trình và trạng thái giao hàng</p>
      </div>

      {/* Shipment Cards */}
      <div className="space-y-4">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{shipment.id}</h3>
                <p className="text-gray-600">PO: {shipment.poId} - {shipment.product}</p>
              </div>
              {getStatusBadge(shipment.status)}
            </div>

            {/* Issue Alert */}
            {shipment.issue && (
              <div className="mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Sự cố phát sinh</p>
                  <p className="text-sm text-red-800">{shipment.issue}</p>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tiến độ giao hàng</span>
                <span className="text-sm text-gray-600">{shipment.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    shipment.status === 'delayed' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${shipment.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Vị trí hiện tại</p>
                  <p className="font-medium">{shipment.currentLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Dự kiến đến</p>
                  <p className="font-medium">{shipment.estimatedArrival}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Đơn vị vận chuyển</p>
                  <p className="font-medium">{shipment.carrier}</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Xem lịch sử chi tiết →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tracking History Example */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-lg mb-4">Lịch sử vận chuyển (SHIP001)</h3>
        <div className="space-y-4">
          {[
            { time: '2026-02-08 14:30', location: 'Hà Nội - Trung tâm phân phối', status: 'Đang vận chuyển' },
            { time: '2026-02-07 09:15', location: 'Hà Nội - Hub chính', status: 'Đã nhận hàng' },
            { time: '2026-02-06 16:45', location: 'TP.HCM - Xuất kho', status: 'Xuất hàng từ nhà cung cấp' },
            { time: '2026-02-05 10:00', location: 'TP.HCM - Kho NCC', status: 'Đã xác nhận đơn hàng' }
          ].map((event, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{event.status}</p>
                <p className="text-sm text-gray-600">{event.location}</p>
                <p className="text-xs text-gray-500 mt-1">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
