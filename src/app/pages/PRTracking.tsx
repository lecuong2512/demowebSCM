import React, { useState, useEffect } from 'react';
import { api, formatDate, type PurchaseRequest } from '../services/api';
import { ClipboardList, Search, Filter, CheckCircle, XCircle, Clock, FileText, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PRTracking() {
  const navigate = useNavigate();
  const [prs, setPrs] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submittingId, setSubmittingId] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const fetchPRs = async () => {
    if (prs.length === 0) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const data = await api.purchaseRequests.list();
      setPrs(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPRs(); }, []);

  const handleSubmitDraft = async (pr: PurchaseRequest) => {
    if (submittingId) return;
    setSubmittingId(pr.id);
    setMsg('');
    try {
      await api.purchaseRequests.submit(pr.id);
      setPrs((prev) => prev.map((item) => (
        item.id === pr.id ? { ...item, status: 'pending' } : item
      )));
      setMsg(`Đã gửi duyệt ${pr.id} thành công`);
      setMsgType('success');
      fetchPRs();
    } catch (e: any) {
      setMsg(e.message || 'Không thể gửi duyệt yêu cầu');
      setMsgType('error');
    } finally {
      setSubmittingId('');
    }
  };

  const filtered = prs.filter(pr => {
    const matchSearch = pr.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.created_by_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || pr.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, [string, string]> = {
      draft:    ['bg-gray-100 text-gray-700', 'Nháp'],
      pending:  ['bg-yellow-100 text-yellow-700', 'Chờ duyệt'],
      approved: ['bg-green-100 text-green-700', 'Đã duyệt'],
      rejected: ['bg-red-100 text-red-700', 'Từ chối'],
    };
    const [cls, label] = map[status] || ['bg-gray-100 text-gray-700', status];
    return <span className={`px-3 py-1 rounded-full text-sm ${cls}`}>{label}</span>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':  return <Clock className="w-5 h-5 text-yellow-600" />;
      default:         return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const counts = {
    total: prs.length,
    pending: prs.filter(p => p.status === 'pending').length,
    approved: prs.filter(p => p.status === 'approved').length,
    rejected: prs.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Theo dõi Yêu cầu Mua hàng</h1>
          <p className="text-gray-600">Xem trạng thái và tiến trình xử lý các yêu cầu</p>
        </div>
        <button onClick={fetchPRs} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg border text-sm ${msgType === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {msg}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng yêu cầu', value: counts.total, color: 'blue' },
          { label: 'Chờ duyệt', value: counts.pending, color: 'yellow' },
          { label: 'Đã duyệt', value: counts.approved, color: 'green' },
          { label: 'Từ chối', value: counts.rejected, color: 'red' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-600 text-sm">{s.label}</p>
            <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, sản phẩm, người tạo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">Hiển thị {filtered.length} / {prs.length} yêu cầu</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-[560px] overflow-y-auto">
            {filtered.map(pr => (
              <div
                key={pr.id}
                onClick={() => pr.status === 'draft' && navigate(`/pr/create?draftId=${pr.id}`)}
                className={`p-4 transition-colors ${pr.status === 'draft' ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(pr.status)}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-medium text-blue-600">{pr.id}</span>
                        {getStatusBadge(pr.status)}
                      </div>
                      <p className="font-medium mt-1">{pr.product_name}</p>
                      <p className="text-sm text-gray-600">{pr.reason}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>SL: <strong>{pr.quantity}</strong></span>
                        <span>Tạo bởi: {pr.created_by_name}</span>
                        <span>Ngày: {formatDate(pr.created_date)}</span>
                        {pr.approved_by_name && <span>Duyệt bởi: {pr.approved_by_name}</span>}
                      </div>
                      {pr.status === 'draft' && (
                        <div className="mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmitDraft(pr);
                            }}
                            disabled={submittingId === pr.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50"
                          >
                            {submittingId === pr.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                            {submittingId === pr.id ? 'Đang gửi duyệt...' : 'Gửi duyệt'}
                          </button>
                          <p className="text-xs text-blue-600 mt-2">Bấm vào dòng nháp để sửa trước khi gửi duyệt</p>
                        </div>
                      )}
                      {pr.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">Lý do từ chối: {pr.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-12 text-center text-gray-400">Không tìm thấy yêu cầu nào</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
