import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, BookOpen, Users, Plus, CheckCircle, Play, ChevronLeft, ChevronRight, Search, Info, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ScheduleDetailModal from '../../components/teacher/ScheduleDetailModal';
import WeeklyTimetableGrid from '../../components/teacher/WeeklyTimetableGrid';

const TeacherSchedule = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCourse, setFilterCourse] = useState('all');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [viewMode, setViewMode] = useState('both'); // 'both', 'grid', 'cards'

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const res = await api.get('/schedules/all');
            if (res.data.success) {
                setSchedules(res.data.data || []);
            } else {
                setSchedules([]);
            }
        } catch (err) {
            console.error('Lỗi khi tải lịch giảng dạy:', err);
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    const uniqueCourses = Array.from(new Set(
        schedules.map(s => {
            if (s.course_code && s.course_name) return `${s.course_code} - ${s.course_name}`;
            return s.course;
        }).filter(Boolean)
    ));

    const displaySchedules = schedules.filter(s => {
        if (filterCourse === 'all') return true;
        const fullCourse = s.course || `${s.course_code || ''} ${s.course_name || ''}`;
        return fullCourse.toLowerCase().includes(filterCourse.toLowerCase());
    });

    const handleStartAttendance = (s, e) => {
        if (e) e.stopPropagation();
        
        const now = new Date();
        const start = s.start_time ? new Date(s.start_time) : null;
        const end = s.end_time ? new Date(s.end_time) : null;

        if (start) {
            const windowStart = new Date(start.getTime() - 60 * 60 * 1000);
            const windowEnd = new Date(end ? end.getTime() + 60 * 60 * 1000 : start.getTime() + 3 * 60 * 60 * 1000);

            if (now < windowStart) {
                const timeStr = windowStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                alert(`Chưa tới thời gian điểm danh!\nHệ thống chỉ mở điểm danh trước ca học 1 tiếng (bắt đầu mở từ ${timeStr}).`);
                return;
            }

            if (now > windowEnd) {
                alert(`Đã quá thời hạn điểm danh cho ca học này (hệ thống đóng điểm danh sau ca học 1 tiếng).`);
                return;
            }
        }

        navigate(`/teacher/face-recognition?schedule_id=${s.id}`);
    };

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Calendar size={24} className="text-indigo-600" />
                        Lịch Giảng Dạy Giảng Viên
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Quản lý toàn bộ danh sách các ca học, lịch giảng dạy và kích hoạt ca điểm danh AI
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Switcher Tabs */}
                    <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
                        <button
                            onClick={() => setViewMode('both')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                viewMode === 'both' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <LayoutGrid size={14} /> Lưới Giờ
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <List size={14} /> Thẻ Danh Sách
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/teacher/face-recognition')}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                    >
                        <Play size={16} />
                        <span>Mở Camera Điểm Danh Ngay</span>
                    </button>
                </div>
            </div>

            {/* SECTION 1: Timetable Grid View (Lịch Thời Khóa Biểu Tuần - Dạng Lưới Giờ Hình 1) */}
            {(viewMode === 'both' || viewMode === 'grid') && (
                <WeeklyTimetableGrid
                    schedules={displaySchedules}
                    onSelectSchedule={(s) => setSelectedSchedule(s)}
                    onStartAttendance={(s, e) => handleStartAttendance(s, e)}
                />
            )}

            {/* SECTION 2: Schedule Cards List View (Danh Sách Ca Học - Dạng Thẻ Hình 2) */}
            {(viewMode === 'both' || viewMode === 'cards') && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4 border-slate-100">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">Danh sách ca giảng dạy tuần này</h3>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {displaySchedules.length} ca học
                            </span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none cursor-pointer"
                            >
                                <option value="all">Tất cả môn học</option>
                                {uniqueCourses.map((cStr, idx) => (
                                    <option key={idx} value={cStr}>{cStr}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400 font-medium">Đang tải lịch giảng dạy...</div>
                    ) : displaySchedules.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-medium">Không tìm thấy ca giảng dạy nào phù hợp.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {displaySchedules.map((s) => (
                                <div 
                                    key={s.id} 
                                    onClick={() => setSelectedSchedule(s)}
                                    className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5 transition-all space-y-3 flex flex-col justify-between cursor-pointer group"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-mono">
                                                {s.day} · {s.time}
                                            </span>
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : s.status === 'Ended' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                                                {s.status === 'Active' ? '● Đang diễn ra' : s.status === 'Ended' ? 'Đã kết thúc' : 'Sắp tới'}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                                            <span>{s.course}</span>
                                            <Info size={14} className="text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                                        </h4>
                                        <div className="text-xs text-slate-500 space-y-1">
                                            <p className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {s.room}</p>
                                            <p className="flex items-center gap-1.5"><Users size={13} className="text-slate-400" /> {s.group} ({s.count} Sinh viên)</p>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSchedule(s);
                                            }}
                                            className={`py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all ${s.status === 'Ended' ? 'w-full' : ''}`}
                                            title="Xem chi tiết lớp học & sinh viên"
                                        >
                                            Chi tiết
                                        </button>
                                        {s.status !== 'Ended' && (
                                            <button
                                                onClick={(e) => handleStartAttendance(s, e)}
                                                className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <Play size={14} /> Điểm danh ca này
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Schedule Detail Modal */}
            <ScheduleDetailModal
                isOpen={!!selectedSchedule}
                onClose={() => setSelectedSchedule(null)}
                schedule={selectedSchedule}
            />
        </div>
    );
};

export default TeacherSchedule;
