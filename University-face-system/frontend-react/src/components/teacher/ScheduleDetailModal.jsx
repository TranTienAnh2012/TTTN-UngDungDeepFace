import React, { useState, useEffect } from 'react';
import {
    X, Calendar as CalendarIcon, Clock, MapPin, BookOpen, Users, User,
    GraduationCap, Building2, Search, CheckCircle, AlertCircle,
    Play, Camera, ShieldCheck, CheckCircle2, UserCheck, RefreshCw,
    ExternalLink, ChevronLeft, ChevronRight, Layers, Award, Sparkles, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ScheduleDetailModal = ({ isOpen, onClose, schedule }) => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [courseSessions, setCourseSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    // Modal tab: 'students' | 'calendar'
    const [modalTab, setModalTab] = useState('students');

    // Calendar month navigation state
    const [calDate, setCalDate] = useState(new Date());
    const [selectedCalDay, setSelectedCalDay] = useState(null);

    useEffect(() => {
        if (isOpen && schedule?.id) {
            fetchScheduleStudents(schedule.id);
            if (schedule.start_time) {
                const sDate = new Date(schedule.start_time);
                setCalDate(new Date(sDate.getFullYear(), sDate.getMonth(), 1));
                setSelectedCalDay(sDate.getDate());
            }
        }
    }, [isOpen, schedule]);

    const fetchScheduleStudents = async (scheduleId) => {
        setLoading(true);
        setError('');
        try {
            let res;
            try {
                res = await api.get(`/schedules/${scheduleId}/students`);
            } catch (firstErr) {
                try {
                    res = await api.get(`/classes/schedules/${scheduleId}/students`);
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
                setError(res.data?.message || 'Không thể tải danh sách sinh viên');
            }
        } catch (err) {
            console.error('Lỗi tải danh sách sinh viên ca học:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách sinh viên của ca học');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !schedule) return null;

    const formatTimeOnly = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const filteredStudents = students.filter(s =>
        (s.student_code || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.student_official_class || s.class_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const attendedCount = students.filter(s => s.check_in_time || s.check_out_time || s.attendance_status === 'Completed' || s.attendance_status === 'Checked-in' || s.attendance_id).length;
    const faceRegisteredCount = students.filter(s => s.face_registered).length;

    const renderEnrollmentType = (type) => {
        switch (type) {
            case 'retake':
                return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Học lại</span>;
            case 'supplementary':
                return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">Học ghép</span>;
            default:
                return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Chính quy</span>;
        }
    };

    const renderAttendanceBadge = (s) => {
        const isComplete = s.check_in_time && s.check_out_time;
        const isCheckinOnly = s.check_in_time && !s.check_out_time;
        const isCheckoutOnly = !s.check_in_time && s.check_out_time;

        if (isComplete || s.attendance_status === 'Completed') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Đầy đủ ({s.check_in_time ? formatTimeOnly(s.check_in_time) : '07:15'} - {s.check_out_time ? formatTimeOnly(s.check_out_time) : '09:10'})
                </span>
            );
        }
        if (isCheckinOnly || s.attendance_status === 'Checked-in') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock size={12} className="text-blue-600" />
                    Đã vào ({formatTimeOnly(s.check_in_time)})
                </span>
            );
        }
        if (isCheckoutOnly) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock size={12} className="text-amber-600" />
                    Chỉ ra ({formatTimeOnly(s.check_out_time)})
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-500 border border-rose-200">
                Chưa điểm danh
            </span>
        );
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

    // Map sessions to dates
    const sessionDatesMap = {};
    (courseSessions.length > 0 ? courseSessions : [schedule]).forEach(cs => {
        if (!cs.start_time) return;
        const d = new Date(cs.start_time);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const dayNum = d.getDate();
            if (!sessionDatesMap[dayNum]) sessionDatesMap[dayNum] = [];
            sessionDatesMap[dayNum].push(cs);
        }
    });

    const currentScheduleDate = schedule.start_time ? new Date(schedule.start_time) : new Date();
    const isCurrentScheduleMonth = currentScheduleDate.getFullYear() === year && currentScheduleDate.getMonth() === month;
    const currentScheduleDay = isCurrentScheduleMonth ? currentScheduleDate.getDate() : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">

                {/* Header Section */}
                <div className="px-6 py-4 bg-[#175b9f] text-white flex items-start justify-between flex-shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-lg bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                                {schedule.course_code || schedule.course?.split(' - ')[0] || 'MÔN HỌC'}
                            </span>
                            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${schedule.status === 'Active' ? 'bg-emerald-400 text-emerald-950 animate-pulse' :
                                schedule.status === 'Ended' ? 'bg-slate-200 text-slate-800' : 'bg-amber-300 text-amber-950'
                                }`}>
                                {schedule.status === 'Active' ? '● Đang diễn ra' : schedule.status === 'Ended' ? 'Đã kết thúc' : 'Sắp tới'}
                            </span>
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-white pt-0.5">
                            {schedule.course_name || schedule.course?.split(' - ')[1] || schedule.course}
                        </h2>
                        <p className="text-xs text-indigo-100 flex items-center gap-3 pt-0.5">
                            <span>📅 {formatDateOnly(schedule.start_time)}</span>
                            <span>•</span>
                            <span>⏰ {schedule.time || `${formatTimeOnly(schedule.start_time)} – ${formatTimeOnly(schedule.end_time)}`}</span>
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Đóng"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Info Cards Grid */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
                    {/* Room */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phòng Học</p>
                            <p className="text-xs font-bold text-slate-800 truncate" title={schedule.room_name || schedule.room}>
                                {schedule.room_name || schedule.room || 'Chưa xếp phòng'}
                            </p>
                        </div>
                    </div>

                    {/* Official Class */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <GraduationCap size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lớp Sinh Viên</p>
                            <p className="text-xs font-bold text-slate-800 truncate" title={schedule.official_class_name || schedule.official_class_code || 'Chưa gắn lớp'}>
                                {schedule.official_class_code || schedule.group || 'Chưa gắn lớp'}
                            </p>
                        </div>
                    </div>

                    {/* Faculty */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khoa / Viện</p>
                            <p className="text-xs font-bold text-slate-800 truncate" title={schedule.faculty_name || 'Khoa Đào Tạo'}>
                                {schedule.faculty_name || 'Khoa Đào Tạo'}
                            </p>
                        </div>
                    </div>

                    {/* Attendance / Roster Status */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Users size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sĩ Số / Có Mặt</p>
                            <p className="text-xs font-bold text-slate-800 truncate">
                                <span className="text-emerald-700 font-black">{attendedCount}</span> / {students.length || schedule.count || 0} SV
                            </p>
                        </div>
                    </div>
                </div>

                {/* Primary Mode Switcher Tabs */}
                <div className="px-6 pt-3 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setModalTab('students')}
                            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${modalTab === 'students'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            <Users size={15} />
                            <span>Danh Sách Sinh Viên &amp; Điểm Danh ({students.length})</span>
                        </button>

                        <button
                            onClick={() => setModalTab('calendar')}
                            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${modalTab === 'calendar'
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

                    {modalTab === 'students' && (
                        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 pb-2">
                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 text-[11px]">
                                <Camera size={12} />
                                Face ID: <strong>{faceRegisteredCount}/{students.length}</strong>
                            </span>
                            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 text-[11px]">
                                <CheckCircle2 size={12} />
                                Có mặt: <strong>{attendedCount}/{students.length}</strong>
                            </span>
                        </div>
                    )}
                </div>

                {/* TAB 1: STUDENTS LIST & ATTENDANCE */}
                {modalTab === 'students' && (
                    <div className="flex flex-col flex-grow overflow-hidden">
                        {/* Search bar */}
                        <div className="px-6 py-3 bg-white border-b border-slate-100 flex-shrink-0">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input
                                    type="text"
                                    placeholder="Tìm sinh viên theo MSSV, Họ tên, Lớp..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 outline-none"
                                />
                            </div>
                        </div>

                        {/* Student Roster Table */}
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
                            ) : filteredStudents.length === 0 ? (
                                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                                    <Users size={32} className="text-slate-300" />
                                    <p className="text-xs font-semibold">Chưa có sinh viên nào trong danh sách lớp này</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                                            <th className="py-2.5 px-3">STT</th>
                                            <th className="py-2.5 px-3">Mã SV</th>
                                            <th className="py-2.5 px-3">Họ và Tên</th>
                                            <th className="py-2.5 px-3">Lớp Chính Quy</th>
                                            <th className="py-2.5 px-3 text-center">Phân Loại</th>
                                            <th className="py-2.5 px-3 text-center">Face ID</th>
                                            <th className="py-2.5 px-3 text-center">Trạng Thái Điểm Danh</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredStudents.map((st, idx) => (
                                            <tr key={st.student_id || idx} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                                                <td className="py-3 px-3 font-mono font-bold text-slate-800">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        {st.student_code}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-bold text-slate-900">
                                                    {st.full_name}
                                                </td>
                                                <td className="py-3 px-3 text-slate-600 font-medium">
                                                    {st.student_official_class || st.class_name || 'Chưa gán'}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {renderEnrollmentType(st.enrollment_type)}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {st.face_registered ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            <ShieldCheck size={12} className="text-emerald-600" />
                                                            Đã có Face
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                                            Chưa Face
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {renderAttendanceBadge(st)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: CALENDAR & TIMELINE VIEW */}
                {modalTab === 'calendar' && (
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
                                                badgeTitle = 'Hôm nay & Ca học này';
                                            } else if (isRealToday) {
                                                cellBgClass = 'bg-emerald-500 text-white font-black shadow-md shadow-emerald-200 ring-2 ring-emerald-400 scale-105';
                                                badgeTitle = 'Hôm nay (Xanh lá)';
                                            } else if (isCurrentSessionDay) {
                                                cellBgClass = 'bg-rose-600 text-white font-black shadow-md shadow-rose-200 ring-2 ring-rose-400 scale-105';
                                                badgeTitle = 'Ca học đang chọn (Màu Đỏ)';
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
                                        <span className="font-bold text-rose-600">Ca học này</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                        <span className="text-rose-700 font-medium">Có ca học</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Sessions Timeline / Progress */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                        <Sparkles size={16} className="text-indigo-600" />
                                        Tiến Trình Các Buổi Học Trong Học Kỳ
                                    </h4>
                                    <span className="text-xs text-slate-500 font-semibold">
                                        Tổng số: <strong>{courseSessions.length || 1} buổi</strong>
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {(courseSessions.length > 0 ? courseSessions : [schedule]).map((cs, idx) => {
                                        const isThisSchedule = cs.id === schedule.id;
                                        const sDate = cs.start_time ? new Date(cs.start_time) : new Date();
                                        const isPast = sDate < new Date();
                                        const isToday = sDate.toDateString() === new Date().toDateString();

                                        const enrolled = cs.enrolled_count || students.length || 39;
                                        const attended = cs.attended_count || (isThisSchedule ? attendedCount : 0);
                                        const rate = enrolled > 0 ? Math.round((attended / enrolled) * 100) : 0;

                                        return (
                                            <div
                                                key={cs.id || idx}
                                                className={`p-4 rounded-2xl border transition-all ${isThisSchedule
                                                    ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${isThisSchedule ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                                                <span>Buổi {idx + 1}: {cs.course_name || schedule.course_name}</span>
                                                                {isThisSchedule && (
                                                                    <span className="bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                                                        Đang chọn
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                                <span className="flex items-center gap-1">
                                                                    <CalendarIcon size={12} className="text-slate-400" />
                                                                    {formatDateOnly(cs.start_time)}
                                                                </span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                                                                    <Clock size={12} className="text-slate-400" />
                                                                    {formatTimeOnly(cs.start_time)} - {formatTimeOnly(cs.end_time)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${isToday ? 'bg-emerald-100 text-emerald-800' :
                                                        isPast ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {isToday ? 'Hôm Nay' : isPast ? 'Đã Kết Thúc' : 'Sắp Tới'}
                                                    </span>
                                                </div>

                                                {/* Attendance Progress mini bar */}
                                                <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                                    <span className="flex items-center gap-1 text-slate-500">
                                                        <MapPin size={12} className="text-slate-400" />
                                                        {cs.room_name || schedule.room_name || 'Phòng học'}
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
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs"
                    >
                        Đóng
                    </button>

                    <button
                        onClick={() => {
                            onClose();
                            navigate(`/teacher/face-recognition?schedule_id=${schedule.id}`);
                        }}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Play size={15} />
                        <span>Mở Camera Điểm Danh Ca Này</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ScheduleDetailModal;
