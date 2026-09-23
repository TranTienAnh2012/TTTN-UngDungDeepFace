import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, BookOpen, Users, Plus, CheckCircle, Play, ChevronLeft, ChevronRight, Search, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ScheduleDetailModal from '../../components/teacher/ScheduleDetailModal';

const TeacherSchedule = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCourse, setFilterCourse] = useState('all');
    const [selectedSchedule, setSelectedSchedule] = useState(null);

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

                <button
                    onClick={() => navigate('/teacher/face-recognition')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                >
                    <Play size={16} />
                    <span>Mở Camera Điểm Danh Ngay</span>
                </button>
            </div>

            {/* Weekly Schedule Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4 border-slate-100">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">Danh sách ca giảng dạy tuần này</h3>
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/teacher/face-recognition?schedule_id=${s.id}`);
                                            }}
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
