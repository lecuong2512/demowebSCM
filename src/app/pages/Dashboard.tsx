import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { motion } from 'motion/react';
import { api, formatCurrency, type DashboardStats, type PurchaseOrder, type PurchaseRequest } from '../services/api';
import {
  ShoppingCart, DollarSign, AlertTriangle, FileCheck,
  TrendingUp, TrendingDown, RefreshCw, Truck,
  CheckCircle, BarChart2, Activity
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

/** Cấu hình animation Recharts — vẽ mượt, dễ nhìn */
const CHART_DURATION = 1100;
const CHART_EASING = 'ease-out' as const;
const AREA_STAGGER_MS = 140;

// Custom tooltip
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const chartEnter = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [prs, setPRs] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /** Đổi key khi có dữ liệu mới → Recharts vẽ lại animation */
  const [chartAnimKey, setChartAnimKey] = useState(0);

  const fetchAll = async () => {
    if (!stats) {
      setLoading(true);
    }
    setError('');
    try {
      const [s, poData, prData] = await Promise.all([
        api.dashboard.stats(),
        api.purchaseOrders.list(),
        api.purchaseRequests.list(),
      ]);
      setStats(s); setPOs(poData); setPRs(prData);
      setChartAnimKey((k) => k + 1);
    } catch (e: any) { setError(e.message); }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
      <p className="font-semibold">Lỗi kết nối backend</p>
      <p className="text-sm mt-1">{error}</p>
      <p className="text-sm mt-2 text-gray-600">Hãy chạy: <code className="bg-gray-100 px-1 rounded">python3 server.py</code></p>
      <button onClick={fetchAll} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Thử lại</button>
    </div>
  );

  if (!stats) return null;

  // Derived metrics
  const activePOs = pos.filter((p) => p.status !== 'cancelled');
  const reviewedPRs = prs.filter((p) => p.status !== 'draft');
  const poStatusCounts = {
    pending: pos.filter(p => p.status === 'pending').length,
    confirmed: pos.filter(p => p.status === 'confirmed').length,
    shipped: pos.filter(p => p.status === 'shipped').length,
    delivered: pos.filter(p => p.status === 'delivered').length,
    overdue: pos.filter(p => p.status === 'overdue').length,
  };
  const prStatusCounts = {
    draft: prs.filter(p => p.status === 'draft').length,
    pending: prs.filter(p => p.status === 'pending').length,
    approved: prs.filter(p => p.status === 'approved').length,
    rejected: prs.filter(p => p.status === 'rejected').length,
  };
  const fulfillmentRate = activePOs.length > 0
    ? Math.round((poStatusCounts.delivered / activePOs.length) * 100) : 0;
  const approvalRate = reviewedPRs.length > 0
    ? Math.round((prStatusCounts.approved / reviewedPRs.length) * 100) : 0;

  // PO status donut data
  const poStatusData = [
    { name: 'Đã giao', value: poStatusCounts.delivered, fill: '#10b981' },
    { name: 'Đang giao', value: poStatusCounts.shipped, fill: '#3b82f6' },
    { name: 'Đã xác nhận', value: poStatusCounts.confirmed, fill: '#6366f1' },
    { name: 'Chờ xử lý', value: poStatusCounts.pending, fill: '#f59e0b' },
    { name: 'Quá hạn', value: poStatusCounts.overdue, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  // PR flow data
  const prFlowData = [
    { name: 'Nháp', value: prStatusCounts.draft, fill: '#94a3b8' },
    { name: 'Chờ duyệt', value: prStatusCounts.pending, fill: '#f59e0b' },
    { name: 'Đã duyệt', value: prStatusCounts.approved, fill: '#10b981' },
    { name: 'Từ chối', value: prStatusCounts.rejected, fill: '#ef4444' },
  ];

  const StatCard = ({ title, value, icon, color, sub, trend, trendUp, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-800 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} flex-shrink-0 ml-3`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Tổng quan hệ thống SCM</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4 animate-spin" /> Làm mới
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Đơn Đặt Hàng"
          value={stats.totalPurchaseOrders}
          icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
          sub={`${poStatusCounts.shipped} đang giao • ${poStatusCounts.overdue} quá hạn`}
          onClick={() => navigate('/po')}
        />
        <StatCard
          title="Tổng Chi Tiêu"
          value={formatCurrency(stats.totalSpending)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-50"
          sub={`TB ${pos.length ? formatCurrency(stats.totalSpending / pos.length) : '—'}/đơn`}
          onClick={() => navigate('/finance/reconciliation')}
        />
        <StatCard
          title="Cảnh Báo Tồn Kho"
          value={stats.lowStockAlerts}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          color="bg-amber-50"
          sub="sản phẩm dưới mức tối thiểu"
          trendUp={stats.lowStockAlerts === 0}
          onClick={() => navigate('/warehouse/receiving', { state: { tab: 'inventory' } })}
        />
        <StatCard
          title="Chờ Duyệt"
          value={stats.pendingApprovals}
          icon={<FileCheck className="w-5 h-5 text-violet-600" />}
          color="bg-violet-50"
          sub={`${prStatusCounts.approved} đã duyệt • ${prStatusCounts.rejected} từ chối`}
          onClick={() => navigate('/pr/approval')}
        />
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tỷ lệ hoàn thành', value: `${fulfillmentRate}%`, color: fulfillmentRate >= 70 ? 'text-green-600' : 'text-red-500', bg: 'bg-green-50', icon: <CheckCircle className="w-4 h-4 text-green-600" />, onClick: () => navigate('/po') },
          { label: 'Tỷ lệ duyệt PR', value: `${approvalRate}%`, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Activity className="w-4 h-4 text-blue-600" />, onClick: () => navigate('/pr/tracking') },
          { label: 'Tổng yêu cầu', value: prs.length, color: 'text-purple-600', bg: 'bg-purple-50', icon: <BarChart2 className="w-4 h-4 text-purple-600" />, onClick: () => navigate('/pr/tracking') },
          { label: 'Đơn hàng đang giao', value: poStatusCounts.shipped + poStatusCounts.confirmed, color: 'text-orange-600', bg: 'bg-orange-50', icon: <Truck className="w-4 h-4 text-orange-600" />, onClick: () => navigate('/logistics') },
        ].map((r, i) => (
          <div 
            key={i} 
            onClick={r.onClick}
            className={`${r.bg} rounded-xl p-4 border border-white shadow-sm flex items-center justify-between hover:shadow-md hover:border-gray-200 transition-all cursor-pointer`}
          >
            <div>
              <p className="text-gray-500 text-xs mb-1">{r.label}</p>
              <p className={`text-2xl font-bold ${r.color}`}>{r.value}</p>
            </div>
            <div className="p-2 bg-white rounded-lg shadow-sm">{r.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Spending trend */}
        <motion.div
          key={`area-${chartAnimKey}`}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-hidden"
          initial={chartEnter.initial}
          animate={chartEnter.animate}
          transition={{ ...chartEnter.transition, delay: 0.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Chi Tiêu & Số Đơn Theo Tháng</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">6 tháng gần nhất</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.monthlyTrend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1e9).toFixed(1)}B`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={(v: number, name: string) => name === 'Chi tiêu' ? formatCurrency(v) : v} />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="spending"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#spendGrad)"
                name="Chi tiêu"
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
                isAnimationActive
                animationDuration={CHART_DURATION}
                animationEasing={CHART_EASING}
                animationBegin={0}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#orderGrad)"
                name="Số đơn"
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6 }}
                isAnimationActive
                animationDuration={CHART_DURATION}
                animationEasing={CHART_EASING}
                animationBegin={AREA_STAGGER_MS}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Donut: PO Status */}
        <motion.div
          key={`pie-${chartAnimKey}`}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-hidden"
          initial={chartEnter.initial}
          animate={chartEnter.animate}
          transition={{ ...chartEnter.transition, delay: 0.08 }}
        >
          <h3 className="font-semibold text-gray-800 mb-4">Trạng Thái Đơn Hàng</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={poStatusData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive
                animationDuration={1000}
                animationEasing={CHART_EASING}
                animationBegin={0}
              >
                {poStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => [v, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {poStatusData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                  <span className="text-gray-600">{d.name}</span>
                </div>
                <span className="font-semibold text-gray-700">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar: Category distribution */}
        <motion.div
          key={`bar-cat-${chartAnimKey}`}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-hidden"
          initial={chartEnter.initial}
          animate={chartEnter.animate}
          transition={{ ...chartEnter.transition, delay: 0.12 }}
        >
          <h3 className="font-semibold text-gray-800 mb-4">Phân Bổ Theo Danh Mục</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.categoryDistribution} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={90} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                name="Số đơn"
                radius={[0, 6, 6, 0]}
                isAnimationActive
                animationDuration={950}
                animationEasing={CHART_EASING}
                animationBegin={0}
              >
                {stats.categoryDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar: Top Vendors */}
        <motion.div
          key={`bar-vendor-${chartAnimKey}`}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-hidden"
          initial={chartEnter.initial}
          animate={chartEnter.animate}
          transition={{ ...chartEnter.transition, delay: 0.18 }}
        >
          <h3 className="font-semibold text-gray-800 mb-4">Top Nhà Cung Cấp</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.topVendors} margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + '…' : v} />
              <YAxis tickFormatter={(v) => `${(v/1e9).toFixed(1)}B`} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => formatCurrency(v)} />} />
              <Bar
                dataKey="amount"
                name="Giá trị"
                radius={[6, 6, 0, 0]}
                isAnimationActive
                animationDuration={950}
                animationEasing={CHART_EASING}
                animationBegin={80}
              >
                {stats.topVendors.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Ranking list */}
          <div className="mt-3 space-y-2 border-t border-gray-50 pt-3">
            {stats.topVendors.slice(0, 3).map((v, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                    ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 truncate max-w-36">{v.name}</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">{formatCurrency(v.amount)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* PR Flow */}
      <motion.div
        key={`pr-flow-${chartAnimKey}`}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-hidden"
        initial={chartEnter.initial}
        animate={chartEnter.animate}
        transition={{ ...chartEnter.transition, delay: 0.22 }}
      >
        <h3 className="font-semibold text-gray-800 mb-4">Luồng Yêu Cầu Mua Hàng (PR)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {prFlowData.map((d, i) => {
            const pct = prs.length > 0 ? Math.round((d.value / prs.length) * 100) : 0;
            const circumference = 2 * Math.PI * 15.9;
            const dash = (pct / 100) * circumference;
            return (
              <motion.div
                key={`${d.name}-${chartAnimKey}`}
                className="text-center"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative mx-auto w-20 h-20 mb-3">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    <motion.circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke={d.fill}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: circumference - dash }}
                      transition={{ duration: 1, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold" style={{ color: d.fill }}>{d.value}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">{d.name}</p>
                <p className="text-xs text-gray-400">{pct}%</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
