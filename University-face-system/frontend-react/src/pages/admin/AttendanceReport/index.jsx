import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart2, Calendar, Download, Filter, RefreshCw,
    CheckCircle2, LogIn, LogOut, XCircle, User, BookOpen,
    ChevronDown, Search, Clock, GraduationCap, MapPin,
    Building2, Layers, Award, FileText, ArrowRight, Eye, Sparkles,
    CheckCircle, Users, ChevronRight, HelpCircle
} from 'lucide-react';
import api from '../../../services/api';
import SessionAttendanceModal from './SessionAttendanceModal';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN') : '—';
const fmtFullDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const STATUS_CONFIG = {
    'Completed': { label: 'Hoàn thành', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    'Checked-in': { label: 'Đầu giờ', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    'Only Checked-out': { label: 'Cuối giờ', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    'Absent': { label: 'Vắng mặt', cls: 'bg-red-100 text-red-700 border-red-200' },
};

/* ─── Export Flat Logs CSV ─────────────────────────────────────────────────── */
function exportCSV(rows) {
    const cols = [
        'MSSV', 'Họ và tên', 'Lớp', 'Khoa',
        'Mã môn', 'Tên môn', 'Phòng', 'Giảng viên',
        'Ngày', 'Bắt đầu', 'Kết thúc',
        'Check-in', 'Check-out', 'Trạng thái', 'Độ chính xác'
    ];
    const lines = [cols.join(',')];
    rows.forEach(r => {
        lines.push([
            r.student_code, `"${r.full_name}"`, `"${r.class_name || ''}"`, `"${r.faculty || ''}"`,
            r.course_code, `"${r.course_name}"`, r.room_name || '', `"${r.teacher_name || ''}"`,
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

    // Active View Tab: 'class_sessions' | 'exam_sessions' | 'history_logs'
    const [activeTab, setActiveTab] = useState('class_sessions');

    // Data states
    const [classSchedules, setClassSchedules] = useState([]);
    const [examSchedules, setExamSchedules] = useState([]);
    const [courses, setCourses] = useState([]);
    const [academicClasses, setAcademicClasses] = useState([]);

    // Detailed logs report
    const [filters, setFilters] = useState({ date_from: today, date_to: today, course_id: '', class_id: '' });
    const [logReport, setLogReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Selected Session Modal state (When user clicks on a box item)
    const [selectedSession, setSelectedSession] = useState(null);
    const [selectedSessionType, setSelectedSessionType] = useState('class');

    // Initial load
    useEffect(() => {
        fetchMetadata();
        fetchClassSessions();
        fetchExamSessions();
        fetchLogReport();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [cRes, clRes] = await Promise.all([
                api.get('/courses'),
                api.get('/academic-classes?limit=100')
            ]);
            if (cRes.data?.success) setCourses(cRes.data.data || []);
            if (clRes.data?.success) setAcademicClasses(clRes.data.data || []);
        } catch (err) {
            console.error('Lỗi tải metadata:', err);
        }
    };

    const fetchClassSessions = async () => {
        try {
            const res = await api.get('/classes/schedules?limit=100');
            if (res.data?.success) {
                setClassSchedules(res.data.data || []);
            }
        } catch (err) {
            console.error('Lỗi tải ca học:', err);
        }
    };

    const fetchExamSessions = async () => {
        try {
            const res = await api.get('/exams/schedules?limit=100');
            if (res.data?.success) {
                setExamSchedules(res.data.data || []);
            }
        } catch (err) {
            console.error('Lỗi tải ca thi:', err);
        }
    };

    const fetchLogReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.course_id) params.course_id = filters.course_id;
            const res = await api.get('/attendance/report', { params });
            if (res.data?.success) setLogReport(res.data);
        } catch (err) {
            console.error('Lỗi tải báo cáo:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const handleRefreshAll = () => {
        setLoading(true);
        Promise.all([fetchClassSessions(), fetchExamSessions(), fetchLogReport()])
            .finally(() => setLoading(false));
    };

    // Filtered Class Sessions
    const filteredClassSessions = classSchedules.filter(s => {
        const q = search.toLowerCase();
        const matchSearch = !search ||
            (s.course_code || '').toLowerCase().includes(q) ||
            (s.course_name || '').toLowerCase().includes(q) ||
            (s.class_code || '').toLowerCase().includes(q) ||
            (s.room_name || '').toLowerCase().includes(q) ||
            (s.teacher_name || '').toLowerCase().includes(q);

        const matchCourse = !filters.course_id || String(s.course_id) === String(filters.course_id);
        const matchClass = !filters.class_id || String(s.class_id) === String(filters.class_id);
        return matchSearch && matchCourse && matchClass;
    });

    // Filtered Exam Sessions
    const filteredExamSessions = examSchedules.filter(e => {
        const q = search.toLowerCase();
        const matchSearch = !search ||
            (e.course_code || '').toLowerCase().includes(q) ||
            (e.course_name || '').toLowerCase().includes(q) ||
            (e.exam_room || '').toLowerCase().includes(q) ||
            (e.academic_class_code || '').toLowerCase().includes(q);

        const matchCourse = !filters.course_id || String(e.course_id) === String(filters.course_id);
        return matchSearch && matchCourse;
    });

    // Filtered Flat Rows
    const filteredLogRows = (logReport?.data || []).filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (r.student_code || '').toLowerCase().includes(q)
            || (r.full_name || '').toLowerCase().includes(q)
            || (r.class_name || '').toLowerCase().includes(q);
    });

    // Class Stats Summary
    const totalClassEnrolled = classSchedules.reduce((acc, c) => acc + (Number(c.total_enrolled) || 0), 0);
    const totalClassAttended = classSchedules.reduce((acc, c) => acc + (Number(c.attended_count) || 0), 0);
    const totalClassAbsent = Math.max(0, totalClassEnrolled - totalClassAttended);

    // Exam Stats Summary
    const totalExamCandidates = examSchedules.reduce((acc, e) => acc + (Number(e.total_candidates) || 0), 0);
    const totalExamCheckedIn = examSchedules.reduce((acc, e) => acc + (Number(e.checked_in_count) || 0), 0);
    const totalExamAbsent = Math.max(0, totalExamCandidates - totalExamCheckedIn);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                            <BarChart2 size={22} />
                        </div>
                        Báo Cáo Điểm Danh Từng Ca
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">
                        Mỗi ca học &amp; ca thi hiển thị dưới dạng <strong>Box Item trực quan</strong>. Nhấp chuột vào từng box để xem chi tiết sinh viên <strong>đã</strong> và <strong>chưa điểm danh</strong>.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefreshAll}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>

                    {activeTab === 'history_logs' && logReport && (
                        <button
                            onClick={() => exportCSV(logReport.data)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
                        >
                            <Download size={15} /> Xuất CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 w-full sm:w-fit">
                <button
                    onClick={() => setActiveTab('class_sessions')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'class_sessions'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <GraduationCap size={16} />
                    <span>Ca Học ({classSchedules.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('exam_sessions')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'exam_sessions'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <Award size={16} />
                    <span>Ca Thi ({examSchedules.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('history_logs')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'history_logs'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <FileText size={16} />
                    <span>Lịch Sử Điểm Danh Chi Tiết</span>
                </button>
            </div>

            {/* Summary KPI Cards depending on active tab */}
            {activeTab === 'class_sessions' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{classSchedules.length}</div>
                            <div className="text-xs text-slate-500 font-semibold">Tổng Ca Học</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                            <Users size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{totalClassEnrolled}</div>
                            <div className="text-xs text-slate-500 font-semibold">Tổng Lượt SV Dự Học</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xs border border-emerald-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-emerald-700">{totalClassAttended}</div>
                            <div className="text-xs text-emerald-600 font-semibold">Đã Điểm Danh ({totalClassEnrolled > 0 ? Math.round((totalClassAttended / totalClassEnrolled) * 100) : 0}%)</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xs border border-rose-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-rose-700">{totalClassAbsent}</div>
                            <div className="text-xs text-rose-600 font-semibold">Vắng Mặt / Chưa Điểm Danh</div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'exam_sessions' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                            <Award size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{examSchedules.length}</div>
                            <div className="text-xs text-slate-500 font-semibold">Tổng Ca Thi</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                            <Users size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{totalExamCandidates}</div>
                            <div className="text-xs text-slate-500 font-semibold">Tổng Thí Sinh Dự Thi</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xs border border-emerald-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-emerald-700">{totalExamCheckedIn}</div>
                            <div className="text-xs text-emerald-600 font-semibold">Đã Vào Phòng Thi ({totalExamCandidates > 0 ? Math.round((totalExamCheckedIn / totalExamCandidates) * 100) : 0}%)</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xs border border-rose-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-rose-700">{totalExamAbsent}</div>
                            <div className="text-xs text-rose-600 font-semibold">Vắng Thi / Chưa Điểm Danh</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Tìm kiếm ca</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm môn học, mã môn, lớp, phòng học, giảng viên..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Lọc môn học</label>
                        <select
                            value={filters.course_id}
                            onChange={e => setFilters(f => ({ ...f, course_id: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả môn học</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>[{c.course_code}] {c.course_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Lọc lớp chính quy</label>
                        <select
                            value={filters.class_id}
                            onChange={e => setFilters(f => ({ ...f, class_id: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả lớp chính quy</option>
                            {academicClasses.map(c => (
                                <option key={c.id} value={c.id}>{c.class_code} - {c.class_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* TAB 1: BOX ITEMS GRID FOR CLASS SESSIONS */}
            {activeTab === 'class_sessions' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <Sparkles size={15} className="text-indigo-600" />
                            Danh sách <strong>{filteredClassSessions.length}</strong> Box Ca Học
                        </div>
                        <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                            👉 Nhấn vào bất kỳ Box nào để xem ai đã / chưa điểm danh
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100">
                            <RefreshCw size={24} className="animate-spin mr-2 text-indigo-600" /> Đang tải danh sách ca học...
                        </div>
                    ) : filteredClassSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 gap-2">
                            <GraduationCap size={40} className="opacity-30" />
                            <p className="text-xs font-semibold text-slate-500">Không tìm thấy ca học nào phù hợp</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredClassSessions.map((s) => {
                                const enrolled = Number(s.total_enrolled) || 0;
                                const attended = Number(s.attended_count) || 0;
                                const absent = Math.max(0, enrolled - attended);
                                const rate = enrolled > 0 ? Math.round((attended / enrolled) * 100) : 0;

                                const now = new Date();
                                const start = new Date(s.start_time);
                                const end = new Date(s.end_time);
                                const isCurrentActive = now >= start && now <= end;
                                const isEnded = now > end;

                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            setSelectedSession(s);
                                            setSelectedSessionType('class');
                                        }}
                                        className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                                    >
                                        {/* Top accent line */}
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400"></div>

                                        <div className="space-y-3.5">
                                            {/* Course badge & status pill */}
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-extrabold text-xs">
                                                    {s.course_code || 'MÔN HỌC'}
                                                </span>
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${isCurrentActive ? 'bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300' :
                                                        isEnded ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {isCurrentActive ? '● Đang Diễn Ra' : isEnded ? 'Đã Kết Thúc' : 'Sắp Tới'}
                                                </span>
                                            </div>

                                            {/* Course Title */}
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                                                    {s.course_name}
                                                </h3>
                                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                                    <span>📅 {fmtFullDate(s.start_time)}</span>
                                                </p>
                                            </div>

                                            {/* Info items */}
                                            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-400 font-medium flex items-center gap-1">
                                                        <Clock size={13} className="text-indigo-500" /> Giờ học:
                                                    </span>
                                                    <span className="font-bold text-slate-800 font-mono">
                                                        {fmt(s.start_time)} – {fmt(s.end_time)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-400 font-medium flex items-center gap-1">
                                                        <MapPin size={13} className="text-indigo-500" /> Phòng học:
                                                    </span>
                                                    <span className="font-bold text-slate-800 truncate max-w-[150px]" title={s.room_name}>
                                                        {s.room_name || s.room_code || 'Chưa xếp'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-400 font-medium flex items-center gap-1">
                                                        <Layers size={13} className="text-indigo-500" /> Lớp SV:
                                                    </span>
                                                    <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100 text-[11px]">
                                                        {s.class_code || 'Chưa gán lớp'}
                                                    </span>
                                                </div>

                                                {s.teacher_name && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-400 font-medium flex items-center gap-1">
                                                            <User size={13} className="text-indigo-500" /> Giảng viên:
                                                        </span>
                                                        <span className="font-bold text-slate-800 truncate max-w-[150px]">
                                                            {s.teacher_name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Attendance Mini Stats */}
                                            <div className="space-y-2 pt-1">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                                                            Đã Điểm Danh
                                                        </span>
                                                        <span className="text-base font-black text-emerald-700">
                                                            {attended} <span className="text-[10px] font-normal">/ {enrolled} SV</span>
                                                        </span>
                                                    </div>

                                                    <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-center">
                                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">
                                                            Chưa Điểm Danh
                                                        </span>
                                                        <span className="text-base font-black text-rose-700">
                                                            {absent} <span className="text-[10px] font-normal">SV</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress bar */}
                                                <div>
                                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                                        <span>Tỷ lệ có mặt</span>
                                                        <span className="text-indigo-700 font-black">{rate}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-300 ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`}
                                                            style={{ width: `${rate}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Action Prompt */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                                            <span>Xem danh sách sinh viên</span>
                                            <div className="w-6 h-6 rounded-full bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
                                                <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: BOX ITEMS GRID FOR EXAM SESSIONS */}
            {activeTab === 'exam_sessions' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <Sparkles size={15} className="text-purple-600" />
                            Danh sách <strong>{filteredExamSessions.length}</strong> Box Ca Thi
                        </div>
                        <span className="text-xs text-purple-700 font-bold bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                            👉 Nhấn vào bất kỳ Box nào để xem danh sách ai đã vào / vắng thi
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100">
                            <RefreshCw size={24} className="animate-spin mr-2 text-purple-600" /> Đang tải danh sách ca thi...
                        </div>
                    ) : filteredExamSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 gap-2">
                            <Award size={40} className="opacity-30" />
                            <p className="text-xs font-semibold text-slate-500">Không tìm thấy ca thi nào phù hợp</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredExamSessions.map((e) => {
                                const candidates = Number(e.total_candidates) || 0;
                                const checkedIn = Number(e.checked_in_count) || 0;
                                const absent = Math.max(0, candidates - checkedIn);
                                const rate = candidates > 0 ? Math.round((checkedIn / candidates) * 100) : 0;

                                const now = new Date();
                                const start = new Date(e.exam_time);
                                const duration = (e.duration_minutes || 90) * 60000;
                                const end = new Date(start.getTime() + duration);
                                const isCurrentActive = now >= start && now <= end;
                                const isEnded = now > end;

                                return (
                                    <div
                                        key={e.id}
                                        onClick={() => {
                                            setSelectedSession(e);
                                            setSelectedSessionType('exam');
                                        }}
                                        className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-purple-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                                    >
                                        {/* Top accent line */}
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-500"></div>

                                        <div className="space-y-3.5">
                                            {/* Course badge & status pill */}
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-mono font-extrabold text-xs">
                                                    {e.course_code || 'MÔN THI'}
                                                </span>
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${isCurrentActive ? 'bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300' :
                                                        isEnded ? 'bg-slate-100 text-slate-600' : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {isCurrentActive ? '● Đang Diễn Ra' : isEnded ? 'Đã Kết Thúc' : 'Sắp Diễn Ra'}
                                                </span>
                                            </div>

                                            {/* Course Title */}
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-purple-600 transition-colors line-clamp-1">
                                                    {e.course_name}
                                                </h3>
                                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                                    <span>📅 {fmtFullDate(e.exam_time)}</span>
                                                </p>
                                            </div>

                                            {/* Info items */}
                                            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-400 font-medium flex items-center gap-1">
                                                        <Clock size={13} className="text-purple-600" /> Giờ thi:
                                                    </span>
                                                    <span className="font-bold text-slate-800 font-mono">
                                                        {fmt(e.exam_time)} ({e.duration_minutes || 90} phút)
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-400 font-medium flex items-center gap-1">
                                                        <MapPin size={13} className="text-purple-600" /> Phòng thi:
                                                    </span>
                                                    <span className="font-bold text-slate-800 truncate max-w-[150px]" title={e.exam_room}>
                                                        {e.exam_room || e.room_code || 'Phòng thi'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-400 font-medium flex items-center gap-1">
                                                        <Layers size={13} className="text-purple-600" /> Lớp dự thi:
                                                    </span>
                                                    <span className="font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-100 text-[11px]">
                                                        {e.academic_class_code || 'Tất cả sinh viên'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-400 font-medium flex items-center gap-1">
                                                        <Award size={13} className="text-purple-600" /> Sơ đồ ghế:
                                                    </span>
                                                    <span className="font-bold text-slate-800">
                                                        {e.seating_rows || 6} hàng × {e.seating_cols || 8} cột
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Attendance Mini Stats */}
                                            <div className="space-y-2 pt-1">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                                                            Đã Điểm Danh
                                                        </span>
                                                        <span className="text-base font-black text-emerald-700">
                                                            {checkedIn} <span className="text-[10px] font-normal">/ {candidates} TS</span>
                                                        </span>
                                                    </div>

                                                    <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-center">
                                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">
                                                            Vắng Thi
                                                        </span>
                                                        <span className="text-base font-black text-rose-700">
                                                            {absent} <span className="text-[10px] font-normal">TS</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress bar */}
                                                <div>
                                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                                        <span>Tỷ lệ có mặt</span>
                                                        <span className="text-purple-700 font-black">{rate}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-300 ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`}
                                                            style={{ width: `${rate}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Action Prompt */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600 group-hover:text-purple-700">
                                            <span>Xem danh sách thí sinh</span>
                                            <div className="w-6 h-6 rounded-full bg-purple-50 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all">
                                                <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: FLAT HISTORY LOGS */}
            {activeTab === 'history_logs' && (
                <div className="bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <BookOpen size={18} className="text-indigo-600" />
                            Toàn Bộ Lịch Sử Điểm Danh
                            <span className="text-xs text-slate-400 font-normal">({filteredLogRows.length} lượt)</span>
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-slate-400">
                            <RefreshCw size={24} className="animate-spin mr-2 text-indigo-600" /> Đang tải lịch sử...
                        </div>
                    ) : filteredLogRows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                            <BarChart2 size={36} className="opacity-30" />
                            <p className="text-xs font-semibold text-slate-500">Không có dữ liệu điểm danh phù hợp</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-100">
                                        <th className="py-3 px-4">Sinh Viên</th>
                                        <th className="py-3 px-4">Môn Học</th>
                                        <th className="py-3 px-4 text-center">Ngày</th>
                                        <th className="py-3 px-4 text-center">Check-in Vào</th>
                                        <th className="py-3 px-4 text-center">Check-out Ra</th>
                                        <th className="py-3 px-4 text-center">Trạng Thái</th>
                                        <th className="py-3 px-4 text-center">Độ Chính Xác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {filteredLogRows.map((r, i) => {
                                        const st = STATUS_CONFIG[r.status] || { label: r.status, cls: 'bg-slate-100 text-slate-700' };
                                        return (
                                            <tr key={r.id || i} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                            {r.full_name?.[0]?.toUpperCase() || 'S'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{r.full_name}</div>
                                                            <div className="text-[11px] font-mono font-bold text-indigo-700">{r.student_code} · {r.class_name || '—'}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-slate-900">{r.course_code}</div>
                                                    <div className="text-[11px] text-slate-500">{r.room_name}</div>
                                                </td>

                                                <td className="py-3 px-4 text-center text-slate-700">{fmtDate(r.start_time)}</td>

                                                <td className="py-3 px-4 text-center">
                                                    {r.check_in_time ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold font-mono">
                                                            <CheckCircle2 size={13} /> {fmt(r.check_in_time)}
                                                        </span>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    {r.check_out_time ? (
                                                        <span className="inline-flex items-center gap-1 text-blue-700 font-bold font-mono">
                                                            <Clock size={13} /> {fmt(r.check_out_time)}
                                                        </span>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${st.cls}`}>
                                                        {st.label}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-4 text-center text-slate-700 font-mono font-bold">
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
            )}

            {/* Session Attendance Detail Modal (Who has/hasn't attended) */}
            <SessionAttendanceModal
                isOpen={!!selectedSession}
                onClose={() => setSelectedSession(null)}
                session={selectedSession}
                sessionType={selectedSessionType}
            />
        </div>
    );
};

export default AttendanceReport;
