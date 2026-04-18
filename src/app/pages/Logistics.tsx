import React, { useState, useEffect } from 'react';
import { api, formatDate, type Shipment, type PurchaseOrder } from '../services/api';
import { Truck, MapPin, Clock, AlertCircle, CheckCircle, RefreshCw, Package, Link } from 'lucide-react';

export default function Logistics() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shipData, poData] = await Promise.all([
        api.shipments.list(),
        api.purchaseOrders.list(),
      ]);
      setShipments(shipData);
      setPOs(poData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // POs that are confirmed/shipped but have no shipment yet
  const posWithoutShipment = pos.filter(po =>
    ['confirmed', 'shipped'].includes(po.status) &&
    !shipments.find(s => s.po_id === po.id)
  );

  const getStatusBadge = (status: string) => {
    const map: Record<string, [string, string]> = {
      pending:    ['bg-gray-100 text-gray-700', 'Chờ vận chuyển'],
      in_transit: ['bg-blue-100 text-blue-700', 'Đang giao'],
      delayed:    ['bg-red-100 text-red-700', 'Chậm trễ'],
      delivered:  ['bg-green-100 text-green-700', 'Đã giao'],
    };
    const [cls, label] = map[status] || ['bg-gray-100 text-gray-700', status];
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${cls}`}>{label}</span>;
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered':  return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'delayed':    return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'in_transit': return <Truck className="w-5 h-5 text-blue-600" />;
      default:           return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleUpdatePOStatus = async (poId: string, status: string) => {
    setUpdatingId(poId);
    try {
      await api.purchaseOrders.updateStatus(poId, status);
      await fetchData();
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  const stats = {
    total: shipments.length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    pending: shipments.filter(s => s.status === 'pending').length,
  };

  // Find linked PO for a shipment
  const getLinkedPO = (poId: string) => pos.find(p => p.id === poId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Logistics & Vận chuyển</h1>
          <p className="text-gray-600">Theo dõi trạng thái vận chuyển — lô hàng tự động tạo khi duyệt yêu cầu</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng lô hàng', value: stats.total, color: 'blue' },
          { label: 'Đang giao', value: stats.in_transit, color: 'blue' },
          { label: 'Chậm trễ', value: stats.delayed, color: 'red' },
          { label: 'Đã giao', value: stats.delivered, color: 'green' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-600 text-sm">{s.label}</p>
            <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></div>
      ) : (
        <>
          {/* POs confirmed but awaiting pickup — show for logistics awareness */}
          {posWithoutShipment.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Đơn hàng đã xác nhận — chờ lấy hàng ({posWithoutShipment.length})
              </h3>
              <div className="space-y-2">
                {posWithoutShipment.map(po => (
                  <div key={po.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-100">
                    <div>
                      <span className="font-mono text-sm text-blue-600 font-medium">{po.id}</span>
                      <span className="text-gray-400 mx-2">·</span>
                      <span className="text-sm font-medium">{po.product_name}</span>
                      <span className="text-gray-400 mx-2">·</span>
                      <span className="text-sm text-gray-500">{po.vendor_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Giao: {formatDate(po.expected_delivery)}</span>
                      {po.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdatePOStatus(po.id, 'shipped')}
                          disabled={updatingId === po.id}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingId === po.id ? '...' : '→ Bắt đầu giao'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipments list */}
          <div className="space-y-4">
            {shipments.map(ship => {
              const linkedPO = getLinkedPO(ship.po_id);
              return (
                <div key={ship.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(ship.status)}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium text-blue-600">{ship.id}</span>
                          <span className="text-gray-400">·</span>
                          <span className="flex items-center gap-1 font-mono text-sm text-gray-500">
                            <Link className="w-3 h-3" />{ship.po_id}
                          </span>
                          {getStatusBadge(ship.status)}
                          {linkedPO?.pr_id && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded font-mono">
                              {linkedPO.pr_id}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold mt-1">{ship.product_name}</p>
                        {linkedPO && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            NCC: {linkedPO.vendor_name} · SL: {linkedPO.quantity} · Tổng: {new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(linkedPO.total_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {ship.carrier && <p className="font-medium">{ship.carrier}</p>}
                      {ship.tracking_number && <p className="font-mono text-xs">{ship.tracking_number}</p>}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Tiến trình vận chuyển</span>
                      <span>{ship.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          ship.status === 'delayed' ? 'bg-red-500' :
                          ship.status === 'delivered' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${ship.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {ship.current_location && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-400">Vị trí hiện tại</p>
                          <p className="font-medium">{ship.current_location}</p>
                        </div>
                      </div>
                    )}
                    {ship.estimated_arrival && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-400">Dự kiến đến</p>
                          <p className="font-medium">{formatDate(ship.estimated_arrival)}</p>
                        </div>
                      </div>
                    )}
                    {ship.issue && (
                      <div className="flex items-start gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-red-400">Vấn đề</p>
                          <p className="font-medium">{ship.issue}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {shipments.length === 0 && posWithoutShipment.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center text-gray-400">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Không có lô hàng nào</p>
                <p className="text-sm mt-1">Lô hàng sẽ tự động xuất hiện khi yêu cầu mua hàng được duyệt</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
