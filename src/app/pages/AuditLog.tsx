import React, { useState, useEffect } from 'react';
import { api, type AuditLog } from '../services/api';
import { ClipboardList, Search, User, FileText, Settings, ShoppingCart, Package, DollarSign, RefreshCw } from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; color: string; icon: any }> = {
  pr:       { label: 'Yêu cầu mua', color: 'bg-blue-100 text-blue-700', icon: FileText },
  approval: { label: 'Phê duyệt',   color: 'bg-green-100 text-green-700', icon: FileText },
  po:       { label: 'Đặt hàng',    color: 'bg-purple-100 text-purple-700', icon: ShoppingCart },
  warehouse:{ label: 'Kho vận',     color: 'bg-orange-100 text-orange-700', icon: Package },
  finance:  { label: 'Tài chính',   color: 'bg-yellow-100 text-yellow-700', icon: DollarSign },
  system:   { label: 'Hệ thống',    color: 'bg-gray-100 text-gray-700', icon: Settings },
  vendor:   { label: 'Nhà cung cấp',color: 'bg-pink-100 text-pink-700', icon: User },
};

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.auditLogs.list({
        category: category !== 'all' ? category : undefined,
        search: search || undefined,
        limit: 200,
      });
      setLogs(data);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [category]);

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    return log.user_name.toLowerCase().includes(s) ||
           log.details.toLowerCase().includes(s) ||
           log.action_label.toLowerCase().includes(s) ||
           log.id.toLowerCase().includes(s);
  });

  const getCategoryBadge = (cat: string) => {
    const meta = CATEGORY_META[cat] || CATEGORY_META['system'];
    const Icon = meta.icon;
    return (
      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
        <Icon className="w-3 h-3" />{meta.label}
      </span>
    );
  };

  const categoryCounts = Object.keys(CATEGORY_META).reduce((acc, cat) => ({
    ...acc,
    [cat]: logs.filter(l => l.category === cat).length,
  }), {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Nhật ký Hệ thống</h1>
          <p className="text-gray-600">Lịch sử toàn bộ hoạt động trong hệ thống SCM</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Tất cả ({logs.length})
        </button>
        {Object.entries(CATEGORY_META).map(([cat, meta]) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {meta.label} {categoryCounts[cat] > 0 && <span className="opacity-70">({categoryCounts[cat]})</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo người dùng, hành động, chi tiết..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-sm">Hiển thị {filteredLogs.length} bản ghi</span>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{log.user_name}</span>
                      {getCategoryBadge(log.category)}
                      <span className="text-xs text-gray-400 font-mono">{log.id}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{log.action_label}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{log.details}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                      <span>{log.timestamp}</span>
                      {log.ip_address && <span>IP: {log.ip_address}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Không tìm thấy bản ghi nào</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
