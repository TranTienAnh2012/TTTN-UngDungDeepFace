import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart2, Calendar, Download, Filter, RefreshCw,
    CheckCircle2, LogIn, LogOut, XCircle, User, BookOpen,
    ChevronDown, Search, Clock
} from 'lucide-react';
import api from '../../../services/api';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN') : '—';

const STATUS_CONFIG = {
    'Completed':        { label: 'Hoàn thành',       cls: 'bg-emerald-100 text-emerald-700' },
    'Checked-in':       { label: 'Đầu giờ',          cls: 'bg-blue-100 text-blue-700' },
    'Only Checked-out': { label: 'Cuối giờ',         cls: 'bg-amber-100 text-amber-700' },
    'Absent':           { label: 'Vắng mặt',         cls: 'bg-red-100 text-red-600' },
};

/* ─── Export CSV ──────────────────────────────────────────────────────────── */
function exportCSV(rows) {
    const cols = [
        'MSSV','Họ và tên','Lớp','Khoa',
        'Mã môn','Tên môn','Phòng','Giảng viên',
        'Ngày','Bắt đầu','Kết thúc',
        'Check-in','Check-out','Trạng thái','Độ chính xác'
    ];
    const lines = [cols.join(',')];
    rows.forEach(r => {
        lines.push([
            r.student_code, `"${r.full_name}"`, r.class_name || '', r.faculty || '',
            r.course_code, `"${r.course_name}"`, r.room_name || '', r.teacher_name || '',
            fmtDate(r.start_time), fmt(r.start_time), fmt(r.end_time),
            fmt(r.check_in_time), fmt(r.check_out_time),
            STATUS_CONFIG[r.status]?.label || r.status,
            r.confidence_score ? (r.confidence_score * 100).toFixed(1) + '%' : ''
        ].join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `bao-cao-diem-danh-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
const AttendanceReport = () => {
    const today = new Date().toISOString().slice(0, 10);

    const [filters, setFilters] = useState({ date_from: today, date_to: today, course_id: '', schedule_id: '' });
    const [courses, setCourses]     = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [report, setReport]       = useState(null);
    const [loading, setLoading]     = useState(false);
    const [search, setSearch]       = useState('');

    // Load courses for filter dropdown
    useEffect(() => {
        api.get('/schedules/today').then(res => {
            if (res.data.success) setSchedules(res.data.data);
        }).catch(() => {});
        // Load all courses from class routes
        api.get('/class/schedules').then(res => {
            if (res.data.success) {
                // extract unique courses
                const seen = new Set();
                const c = [];
                (res.data.data || []).forEach(s => {
                    if (!seen.has(s.course_id)) {
                        seen.add(s.course_id);
                        c.push({ id: s.course_id, course_code: s.course_code, course_name: s.course_name });
                    }
                });
                setCourses(c);
            }
        }).catch(() => {});
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.schedule_id) params.schedule_id = filters.schedule_id;
            else {
                if (filters.date_from) params.date_from = filters.date_from;
                if (filters.date_to)   params.date_to   = filters.date_to;
                if (filters.course_id) params.course_id = filters.course_id;
            }
            const res = await api.get('/attendance/report', { params });
            if (res.data.success) setReport(res.data);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Auto-fetch on mount
    useEffect(() => { fetchReport(); }, []);

    const filteredRows = (report?.data || []).filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.student_code?.toLowerCase().includes(q)
            || r.full_name?.toLowerCase().includes(q)
            || r.class_name?.toLowerCase().includes(q);
    });

    const summary = report?.summary || {};

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                            <BarChart2 size={22} />
                        </div>
                        Báo Cáo Điểm Danh
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Thống kê điểm danh đầu giờ &amp; cuối giờ theo buổi học / môn học</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-40"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                    {report && (
                        <button
                            onClick={() => exportCSV(report.data)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm"
                        >
                            <Download size={16} /> Xuất CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                    {/* Date from */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Từ ngày</label>
                        <input type="date" value={filters.date_from}
                            onChange={e => setFilters(f => ({ ...f, date_from: e.target.value, schedule_id: '' }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                        />
                    </div>
                    {/* Date to */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Đến ngày</label>
                        <input type="date" value={filters.date_to}
                            onChange={e => setFilters(f => ({ ...f, date_to: e.target.value, schedule_id: '' }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                        />
                    </div>
                    {/* Course */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Môn học</label>
                        <div className="relative">
                            <select value={filters.course_id}
                                onChange={e => setFilters(f => ({ ...f, course_id: e.target.value, schedule_id: '' }))}
                                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                            >
                                <option value="">Tất cả môn</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>[{c.course_code}] {c.course_name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Schedule */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Buổi học hôm nay</label>
                        <div className="relative">
                            <select value={filters.schedule_id}
                                onChange={e => setFilters(f => ({ ...f, schedule_id: e.target.value }))}
                                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                            >
                                <option value="">-- Lọc theo ngày --</option>
                                {schedules.map(s => (
                                    <option key={s.id} value={s.id}>[{s.course_code}] {new Date(s.start_time).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Apply */}
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
                    >
                        <Filter size={15} /> Lọc báo cáo
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {report && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Tổng lượt',      value: summary.total     || 0, icon: User,         cls: 'from-gray-600 to-gray-700' },
                        { label: 'Đã Check-in',    value: summary.checkedIn  || 0, icon: LogIn,        cls: 'from-emerald-500 to-emerald-600' },
                        { label: 'Đã Check-out',   value: summary.checkedOut || 0, icon: LogOut,       cls: 'from-blue-500 to-blue-600' },
                        { label: 'Hoàn thành',     value: summary.completed  || 0, icon: CheckCircle2, cls: 'from-indigo-500 to-purple-600' },
                        { label: 'Vắng mặt',       value: summary.absent     || 0, icon: XCircle,      cls: 'from-red-400 to-red-600' },
                    ].map(card => (
                        <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.cls} flex items-center justify-center text-white shrink-0`}>
                                <card.icon size={20} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                                <div className="text-xs text-gray-500 font-medium">{card.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Table header / search */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen size={18} className="text-indigo-500" />
                        Danh sách điểm danh
                        {report && <span className="text-sm text-gray-400 font-normal">({filteredRows.length} sinh viên)</span>}
                    </span>
                    <div className="relative w-full sm:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm MSSV, tên, lớp..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">
                        <RefreshCw size={28} className="animate-spin mr-3" /> Đang tải...
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                        <BarChart2 size={36} className="opacity-30" />
                        <p className="text-sm">Không có dữ liệu. Hãy chọn bộ lọc và nhấn <strong>Lọc báo cáo</strong>.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <th className="px-4 py-3 text-left">Sinh viên</th>
                                    <th className="px-4 py-3 text-left">Môn học</th>
                                    <th className="px-4 py-3 text-center">Ngày</th>
                                    <th className="px-4 py-3 text-center">
                                        <LogIn size={14} className="inline mr-1 text-emerald-500" />Check-in
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        <LogOut size={14} className="inline mr-1 text-blue-500" />Check-out
                                    </th>
                                    <th className="px-4 py-3 text-center">Trạng thái</th>
                                    <th className="px-4 py-3 text-center">Độ chính xác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRows.map((r, i) => {
                                    const st = STATUS_CONFIG[r.status] || { label: r.status, cls: 'bg-gray-100 text-gray-600' };
                                    return (
                                        <tr key={r.id || i} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {r.full_name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{r.full_name}</div>
                                                        <div className="text-xs text-gray-500">{r.student_code} · {r.class_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">{r.course_code}</div>
                                                <div className="text-xs text-gray-500">{r.room_name}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 text-xs">{fmtDate(r.start_time)}</td>
                                            <td className="px-4 py-3 text-center">
                                                {r.check_in_time ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                                        <CheckCircle2 size={14} /> {fmt(r.check_in_time)}
                                                    </span>
                                                ) : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {r.check_out_time ? (
                                                    <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                                                        <Clock size={14} /> {fmt(r.check_out_time)}
                                                    </span>
                                                ) : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 text-xs font-medium">
                                                {r.confidence_score ? `${(r.confidence_score * 100).toFixed(1)}%` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceReport;
