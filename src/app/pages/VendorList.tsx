import React, { useState } from 'react';
import { mockVendors, formatCurrency, Vendor } from '../data/mockData';
import {
  Users,
  Star,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Award,
  Package,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function VendorList() {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = mockVendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getPerformanceData = (vendor: Vendor) => [
    { metric: 'Giao hàng đúng hạn', value: vendor.onTimeDelivery },
    { metric: 'Chất lượng', value: vendor.qualityScore },
    { metric: 'Phản hồi', value: 92 },
    { metric: 'Giá cả', value: 88 },
    { metric: 'Hỗ trợ', value: 90 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1">Quản lý Nhà cung cấp</h1>
          <p className="text-gray-600">Danh sách và đánh giá nhà cung cấp</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          + Thêm nhà cung cấp
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhà cung cấp..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Lọc</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor List */}
        <div className="lg:col-span-1 space-y-4">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => setSelectedVendor(vendor)}
              className={`
                bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all hover:shadow-md
                ${selectedVendor?.id === vendor.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{vendor.name}</h3>
                  <p className="text-sm text-gray-600">{vendor.contact}</p>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 ${selectedVendor?.id === vendor.id ? 'text-blue-500' : ''}`} />
              </div>

              <div className="flex items-center gap-1 mb-3">
                {renderStars(vendor.rating)}
                <span className="ml-2 text-sm font-medium">{vendor.rating.toFixed(1)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-blue-600 text-xs mb-1">Tổng đơn hàng</p>
                  <p className="font-semibold text-blue-900">{vendor.totalOrders}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-green-600 text-xs mb-1">Đúng hạn</p>
                  <p className="font-semibold text-green-900">{vendor.onTimeDelivery}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vendor Details */}
        <div className="lg:col-span-2">
          {selectedVendor ? (
            <div className="space-y-6">
              {/* Vendor Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">{selectedVendor.name}</h2>
                    <div className="flex items-center gap-1 mb-4">
                      {renderStars(selectedVendor.rating)}
                      <span className="ml-2 font-medium">{selectedVendor.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm ml-2">({selectedVendor.totalOrders} đơn hàng)</span>
                    </div>
                  </div>
                  <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <span className="font-medium">Đối tác ưu tiên</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Người liên hệ</p>
                      <p className="font-medium">{selectedVendor.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedVendor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Điện thoại</p>
                      <p className="font-medium">{selectedVendor.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Địa chỉ</p>
                      <p className="font-medium">{selectedVendor.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Giao đúng hạn</p>
                      <p className="text-2xl font-semibold text-green-600">{selectedVendor.onTimeDelivery}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${selectedVendor.onTimeDelivery}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Chất lượng</p>
                      <p className="text-2xl font-semibold text-blue-600">{selectedVendor.qualityScore}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${selectedVendor.qualityScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                      <p className="text-2xl font-semibold text-purple-600">{selectedVendor.totalOrders}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-lg mb-4">Biểu đồ hiệu quả tổng thể</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={getPerformanceData(selectedVendor)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name={selectedVendor.name}
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-lg mb-4">Lịch sử giao dịch (6 tháng)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { month: 'T8', orders: 38 },
                        { month: 'T9', orders: 42 },
                        { month: 'T10', orders: 45 },
                        { month: 'T11', orders: 39 },
                        { month: 'T12', orders: 52 },
                        { month: 'T1', orders: 48 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Tạo đơn hàng mới
                </button>
                <button className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                  Xem lịch sử đơn hàng
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">Chọn nhà cung cấp</h3>
              <p className="text-gray-500">Chọn một nhà cung cấp từ danh sách để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
