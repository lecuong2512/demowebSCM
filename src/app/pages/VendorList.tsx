import React, { useState, useEffect } from 'react';
import { api, type Vendor } from '../services/api';
import { Users, Star, Mail, Phone, MapPin, Award, Search, ChevronRight, RefreshCw, Plus, X } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export default function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', tax_code: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await api.vendors.list();
      setVendors(data);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, []);

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.contact_person.toLowerCase().includes(search.toLowerCase())
  );

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ));

  const radarData = selected ? [
    { subject: 'Đúng hạn', value: selected.on_time_delivery },
    { subject: 'Chất lượng', value: selected.quality_score },
    { subject: 'Rating', value: selected.rating * 20 },
    { subject: 'Đơn hàng', value: Math.min(selected.total_orders / 5, 100) },
  ] : [];

  const handleAddVendor = async () => {
    if (!form.name || !form.contact_person || !form.email || !form.phone) {
      setMsg('Vui lòng điền đầy đủ thông tin bắt buộc'); return;
    }
    setSaving(true);
    try {
      await api.vendors.create(form);
      setMsg('Đã thêm nhà cung cấp thành công!');
      setShowAdd(false);
      setForm({ name: '', contact_person: '', email: '', phone: '', address: '', tax_code: '' });
      await fetchVendors();
    } catch (e: any) { setMsg(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Danh sách Nhà cung cấp</h1>
          <p className="text-gray-600">Quản lý và đánh giá nhà cung cấp</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchVendors} className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            <Plus className="w-4 h-4" /> Thêm NCC
          </button>
        </div>
      </div>

      {msg && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{msg}</div>}

      {/* Add Vendor Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Thêm Nhà cung cấp mới</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                ['Tên công ty *', 'name'],
                ['Người liên hệ *', 'contact_person'],
                ['Email *', 'email'],
                ['Điện thoại *', 'phone'],
                ['Địa chỉ', 'address'],
                ['Mã số thuế', 'tax_code'],
              ].map(([label, field]) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type="text"
                    value={(form as any)[field]}
                    onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Huỷ</button>
              <button onClick={handleAddVendor} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Thêm NCC'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng NCC', value: vendors.length },
          { label: 'Rating TB', value: vendors.length ? (vendors.reduce((a,v) => a + v.rating, 0) / vendors.length).toFixed(1) : '—' },
          { label: 'Đúng hạn TB', value: vendors.length ? `${Math.round(vendors.reduce((a,v) => a + v.on_time_delivery, 0) / vendors.length)}%` : '—' },
          { label: 'Tổng đơn hàng', value: vendors.reduce((a,v) => a + v.total_orders, 0) },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-600 text-sm">{s.label}</p>
            <p className="text-2xl font-bold text-blue-600">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm nhà cung cấp..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" /></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(v => (
                <button key={v.id} onClick={() => setSelected(v)}
                  className={`w-full text-left p-4 hover:bg-blue-50 transition-colors ${selected?.id === v.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{v.name}</p>
                      <div className="flex items-center gap-1 mt-1">{renderStars(v.rating)}<span className="text-xs text-gray-500 ml-1">{v.rating}</span></div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl">{selected.name}</h3>
                  <div className="flex items-center gap-1 mt-1">{renderStars(selected.rating)}<span className="text-sm text-gray-600 ml-1">{selected.rating}/5</span></div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Hoạt động</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Users className="w-4 h-4" />{selected.contact_person}</div>
                <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" />{selected.email}</div>
                <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" />{selected.phone}</div>
                <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4" />{selected.address}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { label: 'Tổng đơn', value: selected.total_orders },
                  { label: 'Đúng hạn', value: `${selected.on_time_delivery}%` },
                  { label: 'Chất lượng', value: `${selected.quality_score}%` },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="font-bold text-lg">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-semibold mb-3">Đánh giá tổng thể</h4>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name={selected.name} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
