import React, { useState, useEffect } from 'react';
import { 
    X, Calendar as CalendarIcon, Clock, MapPin, BookOpen, Users, User, 
    GraduationCap, Building2, Search, CheckCircle2, XCircle, 
    AlertCircle, Download, ShieldCheck, RefreshCw, Layers, Check, 
    AlertTriangle, ChevronLeft, ChevronRight, Sparkles, Play
} from 'lucide-react';
import api from '../../../services/api';

const SessionAttendanceModal = ({ isOpen, onClose, session, sessionType = 'class' }) => {
    const [students, setStudents] = useState([]);
    const [courseSessions, setCourseSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    
    // Main View Tab: 'roster' (Danh sách sinh viên) | 'calendar' (Lịch & Tiến trình học)
    const [viewMode, setViewMode] = useState('roster');
    
    // Roster filter tab: 'all' | 'attended' | 'absent'
    const [activeTab, setActiveTab] = useState('all'); 
    const [error, setError] = useState('');

    // Calendar state
    const [calDate, setCalDate] = useState(new Date());
    const [selectedCalDay, setSelectedCalDay] = useState(null);

    useEffect(() => {
        if (isOpen && session?.id) {
            fetchStudents();
            const rawDate = session.exam_time || session.start_time;
            if (rawDate) {
                const sDate = new Date(rawDate);
                setCalDate(new Date(sDate.getFullYear(), sDate.getMonth(), 1));
                setSelectedCalDay(sDate.getDate());
            }
        }
    }, [isOpen, session, sessionType]);

    const fetchStudents = async () => {
        if (!session?.id) return;
        setLoading(true);
        setError('');
        try {
            if (sessionType === 'exam') {
                const res = await api.get(`/exams/eligibility?schedule_id=${session.id}`);
                if (res.data?.success) {
                    setStudents(res.data.data || []);
                } else {
                    setError(res.data?.message || 'Không thể tải danh sách sinh viên dự thi');
                }
            } else {
                let res;
                try {
                    res = await api.get(`/schedules/${session.id}/students`);
                } catch {
                    try {
                        res = await api.get(`/classes/schedules/${session.id}/students`);
                    } catch {
                        res = await api.get(`/schedules/all`);
                    }
                }
                if (res.data?.success) {
                    setStudents(res.data.data || []);
                    if (res.data.course_sessions) {
                        setCourseSessions(res.data.course_sessions);
                    }
                } else {
                    setError(res.data?.message || 'Không thể tải danh sách sinh viên ca học');
                }
            }
        } catch (err) {
            console.error('Lỗi tải danh sách sinh viên ca:', err);
            setError(err.response?.data?.message || 'Không thể tải dữ liệu điểm danh');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !session) return null;

    const formatTimeOnly = (dt) => {
        if (!dt) return '—';
        return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateOnly = (dt) => {
        if (!dt) return '—';
        return new Date(dt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Calculate status for each student
    const isExam = sessionType === 'exam';
    const processedStudents = students.map(s => {
        const hasAttended = isExam 
            ? Boolean(s.check_in_time || s.attendance_id || (s.attendance_status && s.attendance_status !== 'Absent') || s.is_verified)
            : Boolean(s.check_in_time || s.check_out_time || (s.attendance_status && s.attendance_status !== 'Absent'));

        return {
            ...s,
            hasAttended,
            officialClass: s.student_official_class || s.academic_class_code || s.class_name || '—',
            facultyName: s.faculty_name || s.faculty_code || '—'
        };
    });

    const attendedList = processedStudents.filter(s => s.hasAttended);
    const absentList   = processedStudents.filter(s => !s.hasAttended);

    const attendedCount = attendedList.length;
    const absentCount   = absentList.length;
    const totalCount    = processedStudents.length;
    const attendanceRate = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

    // Filter displayed list by active tab and search query
    let displayedStudents = processedStudents;
    if (activeTab === 'attended') displayedStudents = attendedList;
    if (activeTab === 'absent')   displayedStudents = absentList;

    if (search.trim()) {
        const q = search.toLowerCase();
        displayedStudents = displayedStudents.filter(s =>
            (s.student_code || '').toLowerCase().includes(q) ||
            (s.full_name || '').toLowerCase().includes(q) ||
            (s.officialClass || '').toLowerCase().includes(q) ||
            (s.facultyName || '').toLowerCase().includes(q)
        );
    }

    const handleExportCSV = () => {
        const title = isExam ? 'Bao_Cao_Diem_Danh_Ca_Thi' : 'Bao_Cao_Diem_Danh_Ca_Hoc';
        const headers = isExam
            ? ['STT', 'MSSV', 'Họ và Tên', 'Lớp Chính Quy', 'Khoa', 'Số Ghế', 'Giờ Điểm Danh', 'Trạng Thái', 'Độ Khớp Face']
            : ['STT', 'MSSV', 'Họ và Tên', 'Lớp Chính Quy', 'Khoa', 'Loại SV', 'Check-in', 'Check-out', 'Trạng Thái', 'Độ Khớp Face'];

        const lines = [headers.join(',')];
        
        displayedStudents.forEach((s, idx) => {
            if (isExam) {
                const seatStr = (s.seat_row !== null && s.seat_col !== null) ? `Hàng ${s.seat_row + 1} Cột ${s.seat_col + 1}` : 'Tự do';
                lines.push([
                    idx + 1,
                    s.student_code,
                    `"${s.full_name}"`,
                    `"${s.officialClass}"`,
                    `"${s.facultyName}"`,
                    `"${seatStr}"`,
                    formatTimeOnly(s.check_in_time),
                    s.hasAttended ? 'Đã vào phòng thi' : 'Vắng thi',
                    s.confidence_score ? (s.confidence_score * 100).toFixed(1) + '%' : (s.face_registered ? 'Đã có Face' : 'Chưa có Face')
                ].join(','));
            } else {
                lines.push([
                    idx + 1,
                    s.student_code,
                    `"${s.full_name}"`,
                    `"${s.officialClass}"`,
                    `"${s.facultyName}"`,
                    s.enrollment_type === 'retake' ? 'Học lại' : s.enrollment_type === 'supplementary' ? 'Học ghép' : 'Chính quy',
                    formatTimeOnly(s.check_in_time),
                    formatTimeOnly(s.check_out_time),
                    s.hasAttended ? 'Có mặt' : 'Vắng mặt',
                    s.confidence_score ? (s.confidence_score * 100).toFixed(1) + '%' : (s.face_registered ? 'Đã có Face' : 'Chưa có Face')
                ].join(','));
            }
        });

        const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `${title}_${session.course_code || 'MON'}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = () => {
        if (!session?.id) return;
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const typeParam = isExam ? '?type=exam' : '?type=class';
        window.open(`${API_BASE}/api/attendance/export/${session.id}${typeParam}`, '_blank');
    };

    // Calendar generation helpers
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const monthNames = [
        'Tháng 1 (January)', 'Tháng 2 (February)', 'Tháng 3 (March)', 'Tháng 4 (April)',
        'Tháng 5 (May)', 'Tháng 6 (June)', 'Tháng 7 (July)', 'Tháng 8 (August)',
        'Tháng 9 (September)', 'Tháng 10 (October)', 'Tháng 11 (November)', 'Tháng 12 (December)'
    ];

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const changeMonth = (delta) => {
        setCalDate(new Date(year, month + delta, 1));
    };

    const sessionDatesMap = {};
    (courseSessions.length > 0 ? courseSessions : [session]).forEach(cs => {
        const rawDate = cs.start_time || cs.exam_time;
        if (!rawDate) return;
        const d = new Date(rawDate);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const dayNum = d.getDate();
            if (!sessionDatesMap[dayNum]) sessionDatesMap[dayNum] = [];
            sessionDatesMap[dayNum].push(cs);
        }
    });

    const sessionDateRaw = session.exam_time || session.start_time;
    const currentScheduleDate = sessionDateRaw ? new Date(sessionDateRaw) : new Date();
    const isCurrentScheduleMonth = currentScheduleDate.getFullYear() === year && currentScheduleDate.getMonth() === month;
    const currentScheduleDay = isCurrentScheduleMonth ? currentScheduleDate.getDate() : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
                
                {/* Header Section */}
                <div className="px-6 py-4 bg-[#175b9f] text-white flex items-start justify-between flex-shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-lg bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                                {session.course_code || 'HỌC PHẦN'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/40 text-indigo-100 text-xs font-bold">
                                {isExam ? 'Ca Thi Cuối Kỳ' : 'Ca Học Tín Chỉ'}
                            </span>
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-white pt-0.5">
                            {session.course_name || 'Chi Tiết Buổi Điểm Danh'}
                        </h2>
                        <p className="text-xs text-indigo-200 flex items-center gap-3 pt-0.5">
                            <span>📅 {formatDateOnly(session.exam_time || session.start_time)}</span>
                            <span>•</span>
                            <span>⏰ {formatTimeOnly(session.exam_time || session.start_time)} – {formatTimeOnly(session.exam_end_time || session.end_time)}</span>
                            <span>•</span>
                            <span>📍 {session.room_name || session.exam_room || 'Phòng học'}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                            title="Xuất Excel danh sách điểm danh với thời gian Check-in / Check-out"
                        >
                            <Download size={14} />
                            <span>Xuất Excel (.xlsx)</span>
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
                        >
                            <Download size={14} />
                            <span>Xuất CSV</span>
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title="Đóng"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Primary Mode Switcher Tabs */}
                <div className="px-6 pt-3 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('roster')}
                            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
                                viewMode === 'roster'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Users size={15} />
                            <span>Danh Sách Thí Sinh / Sinh Viên ({totalCount})</span>
                        </button>

                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
                                viewMode === 'calendar'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <CalendarIcon size={15} />
                            <span>Lịch &amp; Tiến Trình Học Phần</span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                {courseSessions.length || 1} Buổi
                            </span>
                        </button>
                    </div>

                    <div className="text-xs font-semibold text-slate-500 pb-1">
                        Sĩ số: <strong className="text-indigo-600">{totalCount} SV</strong> | Có mặt: <strong className="text-emerald-600">{attendedCount} ({attendanceRate}%)</strong>
                    </div>
                </div>

                {/* VIEW MODE 1: ROSTER & ATTENDANCE */}
                {viewMode === 'roster' && (
                    <div className="flex flex-col flex-grow overflow-hidden">
                        {/* 3 Summary Badges */}
                        <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
                            {/* Tab: ĐÃ ĐIỂM DANH */}
                            <button
                                onClick={() => setActiveTab('attended')}
                                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center justify-between ${
                                    activeTab === 'attended'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                                        : 'bg-white text-slate-800 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30 shadow-xs'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                        activeTab === 'attended' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <p className={`text-[10px] uppercase font-extrabold tracking-wider ${
                                            activeTab === 'attended' ? 'text-emerald-100' : 'text-emerald-700'
                                        }`}>
                                            Đã Điểm Danh
                                        </p>
                                        <p className="text-lg font-black">{attendedCount} <span className="text-xs font-normal opacity-80">sinh viên</span></p>
                                    </div>
                                </div>
                                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                    activeTab === 'attended' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                    {attendanceRate}%
                                </span>
                            </button>

                            {/* Tab: CHƯA ĐIỂM DANH */}
                            <button
                                onClick={() => setActiveTab('absent')}
                                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center justify-between ${
                                    activeTab === 'absent'
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200'
                                        : 'bg-white text-slate-800 border-rose-200 hover:border-rose-400 hover:bg-rose-50/30 shadow-xs'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                        activeTab === 'absent' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        <XCircle size={20} />
                                    </div>
                                    <div>
                                        <p className={`text-[10px] uppercase font-extrabold tracking-wider ${
                                            activeTab === 'absent' ? 'text-rose-100' : 'text-rose-700'
                                        }`}>
                                            Chưa Điểm Danh (Vắng)
                                        </p>
                                        <p className="text-lg font-black">{absentCount} <span className="text-xs font-normal opacity-80">sinh viên</span></p>
                                    </div>
                                </div>
                                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                    activeTab === 'absent' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'
                                }`}>
                                    {totalCount > 0 ? 100 - attendanceRate : 0}%
                                </span>
                            </button>

                            {/* Tab: TẤT CẢ */}
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center justify-between ${
                                    activeTab === 'all'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-300'
                                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                        activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className={`text-[10px] uppercase font-extrabold tracking-wider ${
                                            activeTab === 'all' ? 'text-slate-300' : 'text-slate-500'
                                        }`}>
                                            Tổng Sĩ Số Ca
                                        </p>
                                        <p className="text-lg font-black">{totalCount} <span className="text-xs font-normal opacity-80">sinh viên</span></p>
                                    </div>
                                </div>
                                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                    activeTab === 'all' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
                                }`}>
                                    100%
                                </span>
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input
                                    type="text"
                                    placeholder="Tìm MSSV, tên sinh viên, lớp, khoa..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 outline-none"
                                />
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="overflow-y-auto flex-grow p-6">
                            {loading ? (
                                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                                    <RefreshCw size={24} className="animate-spin text-indigo-600" />
                                    <p className="text-xs font-semibold">Đang tải danh sách sinh viên...</p>
                                </div>
                            ) : error ? (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-medium text-center border border-red-100">
                                    {error}
                                </div>
                            ) : displayedStudents.length === 0 ? (
                                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                                    <Users size={32} className="text-slate-300" />
                                    <p className="text-xs font-semibold">Không tìm thấy sinh viên phù hợp</p>
                                </div>
                            ) : (
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-100">
                                            <th className="py-3 px-3">STT</th>
                                            <th className="py-3 px-3">MSSV</th>
                                            <th className="py-3 px-3">Họ và Tên</th>
                                            <th className="py-3 px-3">Lớp Sinh Viên</th>
                                            <th className="py-3 px-3">Khoa</th>
                                            {isExam ? (
                                                <th className="py-3 px-3 text-center">Vị Trí Ghế</th>
                                            ) : (
                                                <>
                                                    <th className="py-3 px-3 text-center">Vào Lớp</th>
                                                    <th className="py-3 px-3 text-center">Ra Lớp</th>
                                                </>
                                            )}
                                            <th className="py-3 px-3 text-center">Trạng Thái</th>
                                            <th className="py-3 px-3 text-center">Face ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {displayedStudents.map((st, idx) => (
                                            <tr key={st.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3 px-3 text-slate-400 font-mono font-bold">{idx + 1}</td>
                                                <td className="py-3 px-3 font-mono font-bold text-slate-900">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        {st.student_code}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-bold text-slate-900">
                                                    {st.full_name}
                                                </td>
                                                <td className="py-3 px-3 text-slate-600">
                                                    {st.officialClass}
                                                </td>
                                                <td className="py-3 px-3 text-slate-500">
                                                    {st.facultyName}
                                                </td>

                                                {isExam ? (
                                                    <td className="py-3 px-3 text-center">
                                                        {st.seat_row !== null && st.seat_col !== null ? (
                                                            <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-xs">
                                                                Hàng {st.seat_row + 1} - Cột {st.seat_col + 1}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs font-mono">Tự do</span>
                                                        )}
                                                    </td>
                                                ) : (
                                                    <>
                                                        <td className="py-3 px-3 text-center">
                                                            {st.check_in_time ? (
                                                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold font-mono">
                                                                    <Clock size={12} />
                                                                    {formatTimeOnly(st.check_in_time)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            {st.check_out_time ? (
                                                                <span className="inline-flex items-center gap-1 text-blue-700 font-bold font-mono">
                                                                    <Clock size={12} />
                                                                    {formatTimeOnly(st.check_out_time)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                    </>
                                                )}

                                                <td className="py-3 px-3 text-center">
                                                    {st.hasAttended ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <CheckCircle2 size={12} className="text-emerald-700" />
                                                            {isExam 
                                                                ? 'Đã vào phòng thi' 
                                                                : (st.check_in_time && st.check_out_time ? 'Hoàn thành' : 'Đã check-in')}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                            <XCircle size={12} className="text-rose-600" />
                                                            {isExam ? 'Vắng thi' : 'Vắng mặt'}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-3 text-center">
                                                    {st.face_registered ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            <ShieldCheck size={12} className="text-emerald-600" />
                                                            Đã có Face
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                                            Chưa nạp
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW MODE 2: CALENDAR & TIMELINE */}
                {viewMode === 'calendar' && (
                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left Column: Interactive Month Calendar Card (Light Theme) */}
                            <div className="lg:col-span-5 bg-white border border-slate-200 text-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                                <div>
                                    {/* Month Navigation Header */}
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div>
                                            <h3 className="font-extrabold text-sm text-slate-900 tracking-wide">
                                                {monthNames[month]}
                                            </h3>
                                            <p className="text-[11px] text-slate-400 font-mono">Năm {year}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => changeMonth(-1)}
                                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                                                title="Tháng trước"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                onClick={() => changeMonth(1)}
                                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                                                title="Tháng sau"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Days of Week Header */}
                                    <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 py-3">
                                        <span>Su</span>
                                        <span>Mo</span>
                                        <span>Tu</span>
                                        <span>We</span>
                                        <span>Th</span>
                                        <span>Fr</span>
                                        <span>Sa</span>
                                    </div>

                                    {/* Calendar Days Matrix */}
                                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                                        {/* Days from previous month */}
                                        {Array.from({ length: firstDayIndex }).map((_, i) => {
                                            const day = prevMonthDays - firstDayIndex + i + 1;
                                            return (
                                                <div key={`prev-${i}`} className="py-2 text-slate-300 opacity-60 font-normal">
                                                    {day}
                                                </div>
                                            );
                                        })}

                                        {/* Current month days */}
                                        {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                                            const day = i + 1;
                                            const hasSession = !!sessionDatesMap[day];
                                            const isSelected = selectedCalDay === day;

                                            // Real today date check
                                            const realTodayObj = new Date();
                                            const isRealToday = realTodayObj.getFullYear() === year && realTodayObj.getMonth() === month && realTodayObj.getDate() === day;

                                            // Current active schedule date check
                                            const isCurrentSessionDay = currentScheduleDay === day;

                                            // Determine cell highlight styling (Red Theme for Session, Green for Today)
                                            let cellBgClass = 'text-slate-700 hover:bg-slate-100';
                                            let badgeTitle = '';

                                            if (isRealToday && isCurrentSessionDay) {
                                                cellBgClass = 'bg-emerald-600 text-white font-black shadow-md ring-2 ring-emerald-400 scale-105';
                                                badgeTitle = 'Hôm nay & Ca điểm danh này (Đỏ)';
                                            } else if (isRealToday) {
                                                cellBgClass = 'bg-emerald-500 text-white font-black shadow-md shadow-emerald-200 ring-2 ring-emerald-400 scale-105';
                                                badgeTitle = 'Hôm nay (Xanh lá)';
                                            } else if (isCurrentSessionDay) {
                                                cellBgClass = 'bg-rose-600 text-white font-black shadow-md shadow-rose-200 ring-2 ring-rose-400 scale-105';
                                                badgeTitle = 'Ca điểm danh đang chọn (Màu Đỏ)';
                                            } else if (hasSession) {
                                                cellBgClass = isSelected
                                                    ? 'bg-rose-100 text-rose-800 border-2 border-rose-500 font-extrabold'
                                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200/80';
                                            } else if (isSelected) {
                                                cellBgClass = 'bg-slate-800 text-white border border-slate-700';
                                            }

                                            return (
                                                <button
                                                    key={`cur-${day}`}
                                                    onClick={() => setSelectedCalDay(day)}
                                                    title={badgeTitle || `Ngày ${day}`}
                                                    className={`py-2 rounded-xl text-center relative transition-all flex flex-col items-center justify-center ${cellBgClass}`}
                                                >
                                                    <span className="text-xs">{day}</span>
                                                    {hasSession && !isRealToday && !isCurrentSessionDay && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5 shadow-xs"></span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Calendar Footer Guide */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-md bg-emerald-500 ring-1 ring-emerald-300"></span>
                                        <span className="font-bold text-emerald-700">Ngày hiện tại</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-md bg-rose-600 ring-1 ring-rose-300"></span>
                                        <span className="font-bold text-rose-600">Ca điểm danh (Màu Đỏ)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                        <span className="text-rose-700 font-medium">Có ca học/thi</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Sessions Timeline / Progress */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                        <Sparkles size={16} className="text-indigo-600" />
                                        Tiến Trình Toàn Bộ Các Buổi Điểm Danh Trong Học Kỳ
                                    </h4>
                                    <span className="text-xs text-slate-500 font-semibold">
                                        Tổng số: <strong>{courseSessions.length || 1} buổi</strong>
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {(courseSessions.length > 0 ? courseSessions : [session]).map((cs, idx) => {
                                        const isThisSchedule = cs.id === session.id;
                                        const rawDate = cs.start_time || cs.exam_time;
                                        const sDate = rawDate ? new Date(rawDate) : new Date();
                                        const isPast = sDate < new Date();
                                        const isToday = sDate.toDateString() === new Date().toDateString();

                                        const enrolled = cs.enrolled_count || totalCount || 39;
                                        const attended = cs.attended_count || (isThisSchedule ? attendedCount : 0);
                                        const rate = enrolled > 0 ? Math.round((attended / enrolled) * 100) : 0;

                                        return (
                                            <div
                                                key={cs.id || idx}
                                                className={`p-4 rounded-2xl border transition-all ${
                                                    isThisSchedule
                                                        ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                                                            isThisSchedule ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                                                <span>Buổi {idx + 1}: {cs.course_name || session.course_name}</span>
                                                                {isThisSchedule && (
                                                                    <span className="bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                                                        Đang chọn
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                                <span className="flex items-center gap-1">
                                                                    <CalendarIcon size={12} className="text-slate-400" />
                                                                    {formatDateOnly(cs.start_time || cs.exam_time)}
                                                                </span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                                                                    <Clock size={12} className="text-slate-400" />
                                                                    {formatTimeOnly(cs.start_time || cs.exam_time)} - {formatTimeOnly(cs.end_time || cs.exam_end_time)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                                                        isToday ? 'bg-emerald-100 text-emerald-800' :
                                                        isPast ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {isToday ? 'Hôm Nay' : isPast ? 'Đã Kết Thúc' : 'Sắp Tới'}
                                                    </span>
                                                </div>

                                                {/* Attendance Progress mini bar */}
                                                <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                                    <span className="flex items-center gap-1 text-slate-500">
                                                        <MapPin size={12} className="text-slate-400" />
                                                        {cs.room_name || cs.exam_room || session.room_name || 'Phòng học'}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        <span>Chuyên cần: <strong className="text-indigo-700">{attended}/{enrolled} SV</strong> ({rate}%)</span>
                                                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${rate}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Action Bar */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500 font-medium">
                        Tổng cộng <strong>{displayedStudents.length}</strong> sinh viên trong danh sách
                    </span>

                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs"
                    >
                        Đóng
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SessionAttendanceModal;
