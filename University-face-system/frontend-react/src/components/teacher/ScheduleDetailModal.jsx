import React, { useState, useEffect } from 'react';
import { 
    X, Calendar, Clock, MapPin, BookOpen, Users, User, 
    GraduationCap, Building2, Search, CheckCircle, AlertCircle, 
    Play, Camera, ShieldCheck, CheckCircle2, UserCheck, RefreshCw, ExternalLink, Download 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ScheduleDetailModal = ({ isOpen, onClose, schedule }) => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && schedule?.id) {
            fetchScheduleStudents(schedule.id);
        }
    }, [isOpen, schedule]);

    const fetchScheduleStudents = async (scheduleId) => {
        setLoading(true);
        setError('');
        try {
            // First try /schedules/:id/students
            let res;
            try {
                res = await api.get(`/schedules/${scheduleId}/students`);
            } catch (firstErr) {
                res = await api.get(`/classes/schedules/${scheduleId}/students`);
            }

            if (res.data?.success) {
                setStudents(res.data.data || []);
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

    const handleExportExcel = () => {
        if (!schedule?.id) return;
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        window.open(`${API_BASE}/api/attendance/export/${schedule.id}`, '_blank');
    };

    if (!isOpen || !schedule) return null;

    const formatTimeOnly = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

    const attendedCount = students.filter(s => s.check_in_time || s.check_out_time || s.attendance_status).length;
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

        if (isComplete) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Đủ đầu & cuối giờ ({formatTimeOnly(s.check_in_time)} – {formatTimeOnly(s.check_out_time)})
                </span>
            );
        }
        if (isCheckinOnly) {
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
                Chưa điểm danh
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
                
                {/* Header Section */}
                <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-teal-600 text-white flex items-start justify-between flex-shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-lg bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                                {schedule.course_code || schedule.course?.split(' - ')[0] || 'MÔN HỌC'}
                            </span>
                            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                schedule.status === 'Active' ? 'bg-emerald-400 text-emerald-950 animate-pulse' :
                                schedule.status === 'Ended' ? 'bg-slate-200 text-slate-800' : 'bg-amber-300 text-amber-950'
                            }`}>
                                {schedule.status === 'Active' ? '● Đang diễn ra' : schedule.status === 'Ended' ? 'Đã kết thúc' : 'Sắp tới'}
                            </span>
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-white pt-1">
                            {schedule.course_name || schedule.course?.split(' - ')[1] || schedule.course}
                        </h2>
                        <p className="text-xs text-indigo-100 flex items-center gap-3 pt-0.5">
                            <span>📅 {formatDateOnly(schedule.start_time)}</span>
                            <span>•</span>
                            <span>⏰ {schedule.time || `${formatTimeOnly(schedule.start_time)} – ${formatTimeOnly(schedule.end_time)}`}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                            title="Xuất Excel danh sách điểm danh"
                        >
                            <Download size={14} />
                            <span>Xuất Excel</span>
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

                {/* Info Cards Grid */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
                    {/* Room */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <MapPin size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phòng Học</p>
                            <p className="text-xs font-bold text-slate-800 truncate" title={schedule.room_name || schedule.room}>
                                {schedule.room_name || schedule.room || 'Chưa xếp phòng'}
                            </p>
                        </div>
                    </div>

                    {/* Official Class */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <GraduationCap size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lớp Sinh Viên</p>
                            <p className="text-xs font-bold text-slate-800 truncate" title={schedule.official_class_name || schedule.official_class_code || 'Chưa gắn lớp'}>
                                {schedule.official_class_code || schedule.group || 'Chưa gắn lớp'}
                            </p>
                        </div>
                    </div>

                    {/* Faculty */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Building2 size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khoa / Viện</p>
                            <p className="text-xs font-bold text-slate-800 truncate" title={schedule.faculty_name || 'Khoa Đào Tạo'}>
                                {schedule.faculty_name || 'Khoa Đào Tạo'}
                            </p>
                        </div>
                    </div>

                    {/* Attendance / Roster Status */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Users size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sĩ Số / Có Mặt</p>
                            <p className="text-xs font-bold text-slate-800 truncate">
                                <span className="text-emerald-700 font-black">{attendedCount}</span> / {students.length || schedule.count || 0} SV
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="px-6 py-3.5 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
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

                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                            <Camera size={13} />
                            Đã đăng ký Face ID: <strong>{faceRegisteredCount}/{students.length}</strong>
                        </span>
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <CheckCircle2 size={13} />
                            Đã có mặt: <strong>{attendedCount}/{students.length}</strong>
                        </span>
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
                                                    Đã đăng ký
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                                    Chưa đăng ký
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

                {/* Footer Action Bar */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs"
                    >
                        Đóng
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-100 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Download size={15} />
                            <span>Xuất File Excel</span>
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
        </div>
    );
};

export default ScheduleDetailModal;
