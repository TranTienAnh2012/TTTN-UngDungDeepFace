import React, { useState, useEffect } from 'react';
import { 
    X, Calendar, Clock, MapPin, BookOpen, Users, User, 
    GraduationCap, Building2, Search, CheckCircle2, XCircle, 
    AlertCircle, Download, ShieldCheck, RefreshCw, Layers, Check, AlertTriangle
} from 'lucide-react';
import api from '../../../services/api';

const SessionAttendanceModal = ({ isOpen, onClose, session, sessionType = 'class' }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    // Default tab: 'attended' or 'all' or 'absent'
    const [activeTab, setActiveTab] = useState('all'); 
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && session?.id) {
            fetchStudents();
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
                    res = await api.get(`/classes/schedules/${session.id}/students`);
                } catch {
                    res = await api.get(`/schedules/${session.id}/students`);
                }
                if (res.data?.success) {
                    setStudents(res.data.data || []);
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
            ? Boolean(s.check_in_time || s.attendance_id || (s.attendance_status && s.attendance_status !== 'Absent'))
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
                    s.check_in_time ? formatTimeOnly(s.check_in_time) : '—',
                    s.hasAttended ? 'Đã điểm danh' : 'Vắng thi',
                    s.confidence_score ? `${(s.confidence_score * 100).toFixed(1)}%` : ''
                ].join(','));
            } else {
                lines.push([
                    idx + 1,
                    s.student_code,
                    `"${s.full_name}"`,
                    `"${s.officialClass}"`,
                    `"${s.facultyName}"`,
                    s.enrollment_type === 'retake' ? 'Học lại' : (s.enrollment_type === 'supplementary' ? 'Học ghép' : 'Chính quy'),
                    s.check_in_time ? formatTimeOnly(s.check_in_time) : '—',
                    s.check_out_time ? formatTimeOnly(s.check_out_time) : '—',
                    s.hasAttended ? (s.check_in_time && s.check_out_time ? 'Đủ 2 buổi' : (s.check_in_time ? 'Đã vào' : 'Chỉ ra')) : 'Vắng mặt',
                    s.confidence_score ? `${(s.confidence_score * 100).toFixed(1)}%` : ''
                ].join(','));
            }
        });

        const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}_${session.course_code || 'Code'}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = () => {
        if (!session?.id) return;
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        window.open(`${API_BASE}/api/attendance/export/${session.id}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
                
                {/* Header Section */}
                <div className={`px-6 py-5 text-white flex items-start justify-between flex-shrink-0 ${
                    isExam 
                        ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-rose-600' 
                        : 'bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-600'
                }`}>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-lg bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                                {session.course_code || 'MÔN HỌC'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/25 text-white backdrop-blur-xs">
                                {isExam ? '📝 Ca Thi Học Kỳ' : '🎓 Ca Học Chính Khóa'}
                            </span>
                            {session.class_code && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white">
                                    Lớp: {session.class_code}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-white pt-1">
                            {session.course_name || session.course_code}
                        </h2>
                        <p className="text-xs text-indigo-100 flex flex-wrap items-center gap-3 pt-0.5 font-medium">
                            <span>📅 {formatDateOnly(session.start_time || session.exam_time)}</span>
                            <span>•</span>
                            <span>⏰ {isExam 
                                ? `${formatTimeOnly(session.exam_time)} (${session.duration_minutes || 90} phút)` 
                                : `${formatTimeOnly(session.start_time)} – ${formatTimeOnly(session.end_time)}`
                            }</span>
                            <span>•</span>
                            <span>📍 {session.room_name || session.room_code || session.exam_room || 'Phòng học'}</span>
                            {session.teacher_name && <span>• 👨‍🏫 GV: {session.teacher_name}</span>}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isExam && (
                            <button
                                onClick={handleExportExcel}
                                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                title="Xuất Excel danh sách điểm danh với thời gian Check-in / Check-out"
                            >
                                <Download size={14} />
                                <span>Xuất Excel (.xlsx)</span>
                            </button>
                        )}
                        <button
                            onClick={handleExportCSV}
                            className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                            title="Xuất CSV danh sách"
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

                {/* Big 3 Tabs: ĐÃ ĐIỂM DANH vs CHƯA ĐIỂM DANH vs TẤT CẢ */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
                    {/* Tab: ĐÃ ĐIỂM DANH */}
                    <button
                        onClick={() => setActiveTab('attended')}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center justify-between ${
                            activeTab === 'attended'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200 scale-[1.01]'
                                : 'bg-white text-slate-800 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                                activeTab === 'attended' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                <CheckCircle2 size={22} />
                            </div>
                            <div>
                                <p className={`text-xs uppercase font-extrabold tracking-wider ${
                                    activeTab === 'attended' ? 'text-emerald-100' : 'text-emerald-700'
                                }`}>
                                    Đã Điểm Danh
                                </p>
                                <p className="text-xl font-black">{attendedCount} <span className="text-xs font-normal opacity-80">sinh viên</span></p>
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
                                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200 scale-[1.01]'
                                : 'bg-white text-slate-800 border-rose-200 hover:border-rose-400 hover:bg-rose-50/30 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                                activeTab === 'absent' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                            }`}>
                                <XCircle size={22} />
                            </div>
                            <div>
                                <p className={`text-xs uppercase font-extrabold tracking-wider ${
                                    activeTab === 'absent' ? 'text-rose-100' : 'text-rose-700'
                                }`}>
                                    Chưa Điểm Danh (Vắng)
                                </p>
                                <p className="text-xl font-black">{absentCount} <span className="text-xs font-normal opacity-80">sinh viên</span></p>
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
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-300 scale-[1.01]'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                                <Users size={22} />
                            </div>
                            <div>
                                <p className={`text-xs uppercase font-extrabold tracking-wider ${
                                    activeTab === 'all' ? 'text-slate-300' : 'text-slate-500'
                                }`}>
                                    Tổng Sĩ Số Ca
                                </p>
                                <p className="text-xl font-black">{totalCount} <span className="text-xs font-normal opacity-80">sinh viên</span></p>
                            </div>
                        </div>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                            activeTab === 'all' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                            100%
                        </span>
                    </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Danh sách hiển thị:</span>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                            activeTab === 'attended' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : activeTab === 'absent' 
                                    ? 'bg-rose-100 text-rose-800' 
                                    : 'bg-slate-100 text-slate-800'
                        }`}>
                            {activeTab === 'attended' ? '🟢 Đã Điểm Danh' : activeTab === 'absent' ? '🔴 Chưa Điểm Danh (Vắng)' : '📋 Toàn Bộ Sĩ Số'}
                        </span>
                    </div>

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
                            <p className="text-xs font-semibold">
                                {activeTab === 'absent' 
                                    ? 'Tuyệt vời! Không có sinh viên nào vắng mặt trong ca này.' 
                                    : 'Không tìm thấy sinh viên nào theo bộ lọc.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                                    <th className="py-3 px-3">STT</th>
                                    <th className="py-3 px-3">Sinh Viên</th>
                                    <th className="py-3 px-3">Lớp Chính Quy</th>
                                    <th className="py-3 px-3">Khoa / Viện</th>
                                    {isExam ? (
                                        <>
                                            <th className="py-3 px-3 text-center">Vị Trí Ghế</th>
                                            <th className="py-3 px-3 text-center">Giờ Điểm Danh</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="py-3 px-3 text-center">Check-in Vào</th>
                                            <th className="py-3 px-3 text-center">Check-out Ra</th>
                                        </>
                                    )}
                                    <th className="py-3 px-3 text-center">Trạng Thái</th>
                                    <th className="py-3 px-3 text-center">Face ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {displayedStudents.map((st, idx) => (
                                    <tr 
                                        key={st.student_id || st.id || idx} 
                                        className={`transition-colors ${
                                            st.hasAttended ? 'hover:bg-emerald-50/40' : 'hover:bg-rose-50/40 bg-rose-50/15'
                                        }`}
                                    >
                                        <td className="py-3 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs ${
                                                    st.hasAttended 
                                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                                                        : 'bg-gradient-to-br from-rose-400 to-rose-600'
                                                }`}>
                                                    {st.full_name?.[0]?.toUpperCase() || 'S'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{st.full_name}</div>
                                                    <div className="text-[11px] font-mono font-bold text-indigo-700">{st.student_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3">
                                            {st.officialClass !== '—' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                                                    <Layers size={11} />
                                                    {st.officialClass}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-slate-600 font-medium">
                                            {st.facultyName !== '—' ? (
                                                <span className="inline-flex items-center gap-1 text-slate-700 text-xs font-medium">
                                                    <Building2 size={12} className="text-slate-400 shrink-0" />
                                                    {st.facultyName}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">—</span>
                                            )}
                                        </td>

                                        {isExam ? (
                                            <>
                                                <td className="py-3 px-3 text-center font-mono">
                                                    {st.seat_row !== null && st.seat_col !== null ? (
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold border border-slate-200">
                                                            H{st.seat_row + 1}-C{st.seat_col + 1}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">Tự do</span>
                                                    )}
                                                </td>
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
                                            </>
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
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title={st.confidence_score ? `Độ khớp: ${(st.confidence_score * 100).toFixed(1)}%` : 'Đã nạp khuôn mặt'}>
                                                    <ShieldCheck size={12} className="text-emerald-600" />
                                                    {st.confidence_score ? `${(st.confidence_score * 100).toFixed(1)}%` : 'Đã nạp'}
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

                {/* Footer Action Bar */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500 font-medium">
                        Hiển thị <strong>{displayedStudents.length}</strong> sinh viên
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
