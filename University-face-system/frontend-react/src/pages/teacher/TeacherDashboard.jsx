import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Bell, X, Calendar, Users, CheckCircle2, 
    ArrowRight, BookOpen, MapPin, Clock, Download, 
    UserCheck, ChevronRight, Building2, Sparkles, AlertCircle, Camera
} from 'lucide-react';
import TeacherFaceRecognitionModal from '../../components/teacher/TeacherFaceRecognitionModal';
import ScheduleDetailModal from '../../components/teacher/ScheduleDetailModal';
import api from '../../services/api';

const TeacherDashboard = () => {
    const navigate = useNavigate();

    // UI States
    const [showAlertBanner, setShowAlertBanner] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedScheduleForDetail, setSelectedScheduleForDetail] = useState(null);

    // AI Face recognition modal state
    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

    // Dynamic data states
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [recentCheckIns, setRecentCheckIns] = useState([]);
    const [activeSchedule, setActiveSchedule] = useState(null);
    const [totalStudentsCount, setTotalStudentsCount] = useState(0);
    const [examsList, setExamsList] = useState([]);
    const [summaryStats, setSummaryStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form for quick session creation modal
    const [newSessionForm, setNewSessionForm] = useState({
        course_name: '',
        room_name: '',
        start_time: '',
        end_time: ''
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch All / Today Schedules
            const resSched = await api.get('/schedules/all');
            if (resSched.data.success && resSched.data.data.length > 0) {
                const scheds = resSched.data.data;
                setTodaySchedules(scheds);

                const active = scheds.find(s => s.status === 'Active') || scheds[0];
                setActiveSchedule(active);
                if (active) {
                    fetchRecentCheckIns(active.id);
                }
            }

            // 2. Fetch Total Students Count
            const resStudents = await api.get('/student-list');
            if (resStudents.data.success) {
                setTotalStudentsCount(resStudents.data.data.length);
                if (recentCheckIns.length === 0) {
                    // Fallback initial list of students
                    setRecentCheckIns(resStudents.data.data.slice(0, 5).map(s => ({
                        full_name: s.full_name,
                        student_code: s.student_code,
                        check_in_time: s.has_face ? new Date().toISOString() : null,
                        status: s.has_face ? 'Đã đăng ký' : 'Chưa đăng ký'
                    })));
                }
            }

            // 3. Fetch Real Exam Schedules
            const resExams = await api.get('/teacher/exams');
            if (resExams.data.success) {
                setExamsList(resExams.data.data);
            }

            // 4. Fetch Summary Stats
            const resSummary = await api.get('/reports/teacher-summary');
            if (resSummary.data.success) {
                setSummaryStats(resSummary.data.data);
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu Dashboard giảng viên:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentCheckIns = async (scheduleId) => {
        try {
            const res = await api.get(`/attendance/list/${scheduleId}`);
            if (res.data.success && res.data.data.length > 0) {
                setRecentCheckIns(res.data.data);
            }
        } catch (err) {
            console.error('Lỗi khi tải check-in gần đây:', err);
        }
    };

    const handleCreateSessionSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/schedules/create', newSessionForm);
            if (res.data.success) {
                alert(`Đã tạo buổi học mới thành công: ${newSessionForm.course_name}`);
                setShowCreateModal(false);
                setNewSessionForm({ course_name: '', room_name: '', start_time: '', end_time: '' });
                fetchDashboardData();
            }
        } catch (err) {
            console.error('Lỗi tạo buổi học:', err);
            alert('Không thể tạo buổi học. Vui lòng kiểm tra lại thông tin!');
        }
    };

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span className="text-[11px] font-extrabold tracking-widest text-indigo-600 uppercase">
                        KHÔNG GIAN GIẢNG VIÊN
                    </span>
                    <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Tổng quan hôm nay</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Mọi thứ bạn cần để bắt đầu một ngày giảng dạy hiệu quả.
                    </p>
                </div>

                {/* Primary Actions: Đăng ký khuôn mặt & + Tạo buổi học */}
                <div className="flex items-center gap-3 self-start md:self-auto">
                    <button
                        onClick={() => navigate('/teacher/face-registration')}
                        className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl border border-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Camera size={18} />
                        <span>Đăng ký khuôn mặt</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
                        <span>Tạo buổi học</span>
                    </button>
                </div>
            </div>

            {/* Reminder Alert Banner */}
            {showAlertBanner && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-100/90 rounded-2xl flex items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Bell size={18} />
                        </div>
                        <p className="text-sm font-semibold text-indigo-950">
                            <strong>Nhắc nhở:</strong> Bạn có ca học sắp bắt đầu. Vui lòng bật camera để điểm danh tự động.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAlertBanner(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-indigo-100/50 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Top 3 Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Stat 1: Buổi học */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lịch giảng dạy</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">{todaySchedules.length}</span>
                            <span className="text-xs font-semibold text-slate-500">Ca học trong hệ thống</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Calendar size={24} />
                    </div>
                </div>

                {/* Stat 2: Tổng sinh viên */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng sinh viên</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">{totalStudentsCount}</span>
                            <span className="text-xs font-semibold text-slate-500">Sinh viên giảng dạy</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                </div>

                {/* Stat 3: Tỷ lệ điểm danh */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tỷ lệ có mặt AI</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">
                                {summaryStats ? `${((summaryStats.complete_attendance / Math.max(1, summaryStats.total_attendance)) * 100).toFixed(1)}%` : '95.0%'}
                            </span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                Hoàn thành
                            </span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            </div>

            {/* Main Content Grid (8 cols / 4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Main Column (8 Cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Section 1: Lịch giảng dạy hôm nay */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Lịch giảng dạy</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Danh sách các ca giảng dạy từ cơ sở dữ liệu</p>
                            </div>
                            <button 
                                onClick={() => navigate('/teacher/schedule')}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-all"
                            >
                                <span>Xem lịch đầy đủ</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>

                        {/* Schedule Items */}
                        <div className="space-y-3">
                            {todaySchedules.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-xs">Chưa có ca học nào trong danh sách</div>
                            ) : (
                                todaySchedules.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => setSelectedScheduleForDetail(item)}
                                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-md hover:border-indigo-300 ${
                                            item.status === 'Active' 
                                                ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs' 
                                                : 'bg-slate-50/60 border-slate-100 hover:bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-28 font-mono font-bold text-xs text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center shrink-0">
                                                {item.time || `${new Date(item.start_time).toTimeString().slice(0,5)} – ${new Date(item.end_time).toTimeString().slice(0,5)}`}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">{item.course_name || item.course}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.course_code || 'HP'} · Phòng {item.room_name || item.room}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-auto">
                                            <span className="text-xs font-bold text-slate-600 font-mono">{item.student_count || item.count || 40} SV</span>
                                            <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                                                item.status === 'Active'
                                                    ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                                                    : 'bg-slate-200/70 text-slate-600'
                                            }`}>
                                                {item.status === 'Active' ? '● Đang diễn ra' : item.status === 'Ended' ? 'Đã kết thúc' : 'Sắp tới'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Section 2: Danh sách sinh viên gần đây */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Danh sách sinh viên gần đây</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Cập nhật dữ liệu từ hệ thống</p>
                            </div>
                            <button 
                                onClick={() => window.open('http://localhost:5000/api/reports/export', '_blank')}
                                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all"
                            >
                                <Download size={14} />
                                <span>Xuất danh sách</span>
                            </button>
                        </div>

                        {/* Recent Check-in Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                        <th className="pb-3 pl-2">Sinh viên</th>
                                        <th className="pb-3">Mã sinh viên</th>
                                        <th className="pb-3">Trạng thái</th>
                                        <th className="pb-3 text-right pr-2">Thời gian / Ngày</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {recentCheckIns.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-6 text-slate-400">Chưa có lượt điểm danh nào</td>
                                        </tr>
                                    ) : (
                                        recentCheckIns.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 pl-2 font-bold text-slate-900">{row.full_name || row.name}</td>
                                                <td className="py-3 font-mono text-slate-600">{row.student_code || row.code}</td>
                                                <td className="py-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                                                        row.check_in_time ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {row.check_in_time ? 'Có mặt' : (row.status || 'Chưa điểm danh')}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right pr-2 font-mono text-slate-500">
                                                    {row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Secondary Column (4 Cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Card 1: Điểm danh nhanh (Live Active Session) */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">Điểm danh nhanh</h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                Live
                            </span>
                        </div>

                        {/* Active Course Details */}
                        <div className="p-4 bg-slate-50/80 rounded-xl space-y-3 border border-slate-100">
                            <div>
                                <h4 className="font-extrabold text-slate-900 text-sm">
                                    {activeSchedule ? (activeSchedule.course_name || activeSchedule.course) : 'Ca học trực tiếp'}
                                </h4>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                    <Clock size={13} className="text-slate-400" />
                                    {activeSchedule ? `${activeSchedule.time || 'Đang diễn ra'} · Phòng ${activeSchedule.room_name || activeSchedule.room}` : 'Đang chọn ca học'}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-900">
                                        <strong className="text-lg">{recentCheckIns.filter(c => c.check_in_time).length}</strong> / {totalStudentsCount || 40} có mặt
                                    </span>
                                    <span className="text-indigo-600 font-mono">
                                        {totalStudentsCount > 0 ? `${Math.round((recentCheckIns.filter(c => c.check_in_time).length / totalStudentsCount) * 100)}%` : '100%'}
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                                        style={{ width: `${totalStudentsCount > 0 ? Math.min(100, Math.round((recentCheckIns.filter(c => c.check_in_time).length / totalStudentsCount) * 100)) : 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Primary Button: Open Live Scan */}
                        <button
                            onClick={() => navigate(activeSchedule ? `/teacher/face-recognition?schedule_id=${activeSchedule.id}` : '/teacher/face-recognition')}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
                        >
                            <UserCheck size={18} />
                            <span>Mở danh sách điểm danh (AI Scan)</span>
                        </button>
                    </div>

                    {/* Card 2: Phòng thi của tôi */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Phòng thi của tôi</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Quản lý ca thi từ cơ sở dữ liệu</p>
                            </div>
                            <button 
                                onClick={() => navigate('/teacher/exams')}
                                title="Xem ca phòng thi"
                                className="w-7 h-7 rounded-lg bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-all"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Exam Items */}
                        <div className="space-y-3">
                            {examsList.length === 0 ? (
                                <div className="p-3 text-center text-slate-400 text-xs">Chưa có ca thi nào</div>
                            ) : (
                                examsList.map((exam, idx) => (
                                    <div key={idx} className="p-3.5 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-purple-100 text-purple-700">
                                                <Building2 size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 truncate max-w-[150px]">{exam.title}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{exam.date}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-slate-600 font-mono bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                                            {exam.room}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => navigate('/teacher/exams')}
                            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 transition-all text-center block"
                        >
                            Xem tất cả ca phòng thi
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Session Creation Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Plus size={18} className="text-indigo-600" />
                                Tạo buổi học mới
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSessionSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Môn học / Lớp</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Lập trình Python (CS102)"
                                    value={newSessionForm.course_name}
                                    onChange={(e) => setNewSessionForm({ ...newSessionForm, course_name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phòng học</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Phòng A-302"
                                    value={newSessionForm.room_name}
                                    onChange={(e) => setNewSessionForm({ ...newSessionForm, room_name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        required
                                        value={newSessionForm.start_time}
                                        onChange={(e) => setNewSessionForm({ ...newSessionForm, start_time: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        required
                                        value={newSessionForm.end_time}
                                        onChange={(e) => setNewSessionForm({ ...newSessionForm, end_time: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                                >
                                    Xác nhận tạo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Face Recognition Modal */}
            <TeacherFaceRecognitionModal 
                isOpen={isFaceModalOpen}
                onClose={() => setIsFaceModalOpen(false)}
                scheduleId={activeSchedule?.id}
                sessionTitle={activeSchedule ? `${activeSchedule.course_name}` : ''}
            />

            {/* Schedule Detail Modal */}
            <ScheduleDetailModal
                isOpen={!!selectedScheduleForDetail}
                onClose={() => setSelectedScheduleForDetail(null)}
                schedule={selectedScheduleForDetail}
            />
        </div>
    );
};

export default TeacherDashboard;
