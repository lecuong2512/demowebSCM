import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { mockDashboardStats, formatCurrency } from '../data/mockData';
import {
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [dateFilter, setDateFilter] = useState('6months');
  const stats = mockDashboardStats;

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-2xl font-semibold mb-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1">Dashboard Tổng quan</h1>
          <p className="text-gray-600">Theo dõi hiệu suất và các chỉ số quan trọng</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">6 tháng qua</span>
          </button>
          <button className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng đơn mua hàng"
          value={stats.totalPurchaseOrders}
          icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          trend="+12.5%"
        />
        <StatCard
          title="Chi phí mua hàng"
          value={formatCurrency(stats.totalSpending)}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          trend="+8.2%"
        />
        <StatCard
          title="Cảnh báo thiếu hàng"
          value={stats.lowStockAlerts}
          icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          title="Chờ duyệt"
          value={stats.pendingApprovals}
          icon={<FileCheck className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Chi phí & Số lượng đơn hàng theo tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'spending') {
                    return [formatCurrency(value), 'Chi phí'];
                  }
                  return [value, 'Số đơn'];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spending"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Chi phí (VNĐ)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={2}
                name="Số đơn"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Phân bố theo danh mục</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Vendors */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Top nhà cung cấp</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topVendors} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
              />
              <Bar dataKey="amount" fill="#3b82f6" name="Tổng giá trị" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Thao tác nhanh</h3>
          <div className="space-y-3">
            <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-left transition-colors">
              <div className="font-medium">Tạo yêu cầu mới</div>
              <div className="text-sm text-blue-600">Tạo PR mới</div>
            </button>
            <button className="w-full p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-left transition-colors">
              <div className="font-medium">Duyệt yêu cầu</div>
              <div className="text-sm text-green-600">12 yêu cầu chờ duyệt</div>
            </button>
            <button className="w-full p-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-left transition-colors">
              <div className="font-medium">Cảnh báo tồn kho</div>
              <div className="text-sm text-orange-600">8 sản phẩm thiếu hàng</div>
            </button>
            <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-left transition-colors">
              <div className="font-medium">Theo dõi PO</div>
              <div className="text-sm text-purple-600">15 đơn đang giao</div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Hoạt động gần đây</h3>
        <div className="space-y-4">
          {[
            { user: 'Lê Hoàng Hà', action: 'đã tạo yêu cầu mua hàng', item: 'PR003', time: '5 phút trước', color: 'blue' },
            { user: 'Lê Việt Cường', action: 'đã duyệt yêu cầu', item: 'PR001', time: '15 phút trước', color: 'green' },
            { user: 'Đặng Hữu Hiệp', action: 'đã nhập kho', item: 'GRN045', time: '1 giờ trước', color: 'purple' },
            { user: 'Bùi Đình Tuấn', action: 'đã đối soát hóa đơn', item: 'INV234', time: '2 giờ trước', color: 'orange' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 rounded-full bg-${activity.color}-100 flex items-center justify-center text-${activity.color}-600 flex-shrink-0`}>
                {activity.user.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>
                  {' '}{activity.action}{' '}
                  <span className="font-medium text-blue-600">{activity.item}</span>
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
