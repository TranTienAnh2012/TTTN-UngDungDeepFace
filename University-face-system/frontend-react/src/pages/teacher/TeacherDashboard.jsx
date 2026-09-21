import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Bell, X, Calendar, Users, CheckCircle2, 
    ArrowRight, BookOpen, MapPin, Clock, Download, 
    UserCheck, ChevronRight, Building2, Sparkles, AlertCircle
} from 'lucide-react';
import TeacherFaceRecognitionModal from '../../components/teacher/TeacherFaceRecognitionModal';

const TeacherDashboard = () => {
    const navigate = useNavigate();

    // UI States
    const [showAlertBanner, setShowAlertBanner] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // AI Face recognition modal state
    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

    // Dynamic data states
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [recentCheckIns, setRecentCheckIns] = useState([]);
    const [activeSchedule, setActiveSchedule] = useState(null);
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
            const resSched = await api.get('/schedules/today');
            if (resSched.data.success) {
                setTodaySchedules(resSched.data.data);

                // Auto-detect active schedule
                const now = Date.now();
                const active = resSched.data.data.find(s => 
                    new Date(s.start_time) <= now && new Date(s.end_time) >= now
                );
                setActiveSchedule(active || resSched.data.data[0] || null);
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu Dashboard giảng viên:', err);
        } finally {
            setLoading(false);
        }
    };

    // Default mock data to match exact design when API is empty
    const mockSchedules = [
        {
            id: 101,
            time: '08:00 – 10:00',
            course_name: 'Nhập môn Khoa học máy tính',
            code_group: 'CS101 · Nhóm 02 · Phòng A-302',
            students: '42/45 SV',
            status: 'active',
            status_text: 'Đang diễn ra'
        },
        {
            id: 102,
            time: '10:30 – 12:00',
            course_name: 'Cấu trúc dữ liệu & Giải thuật',
            code_group: 'CS204 · Nhóm 01 · Phòng Lab B-101',
            students: '— SV',
            status: 'upcoming',
            status_text: 'Sắp tới'
        },
        {
            id: 103,
            time: '13:30 – 15:00',
            course_name: 'Phát triển ứng dụng Web',
            code_group: 'SE220 · Nhóm 03 · Phòng C-204',
            students: '— SV',
            status: 'upcoming',
            status_text: 'Sắp tới'
        }
    ];

    const mockStudentsLog = [
        { name: 'Nguyễn Minh Anh', code: 'SV210104', status: 'Có mặt', time: '08:02', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { name: 'Trần Hoàng Nam', code: 'SV210218', status: 'Có mặt', time: '08:03', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { name: 'Lê Thảo Vy', code: 'SV210331', status: 'Muộn', time: '08:17', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
        { name: 'Phạm Gia Huy', code: 'SV210402', status: 'Vắng', time: '—', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' }
    ];

    const mockExams = [
        { title: 'Giữa kỳ · CS204', date: 'Thứ Tư, 16/10 - 09:00', room: 'Phòng A-201', color: 'bg-purple-100 text-purple-700' },
        { title: 'Cuối kỳ · SE220', date: 'Thứ Sáu, 25/10 - 13:30', room: 'Phòng Lab B-101', color: 'bg-amber-100 text-amber-700' }
    ];

    const handleCreateSessionSubmit = (e) => {
        e.preventDefault();
        alert(`Đã tạo buổi học mới: ${newSessionForm.course_name} tại ${newSessionForm.room_name}`);
        setShowCreateModal(false);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
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

                {/* Primary Action: + Tạo buổi học */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 self-start md:self-auto group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
                    <span>Tạo buổi học</span>
                </button>
            </div>

            {/* Reminder Alert Banner */}
            {showAlertBanner && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-100/90 rounded-2xl flex items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Bell size={18} />
                        </div>
                        <p className="text-sm font-semibold text-indigo-950">
                            <strong>Nhắc nhở:</strong> Bạn có một ca học sắp bắt đầu trong 30 phút nữa.
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
                {/* Stat 1: Buổi học hôm nay */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buổi học hôm nay</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">03</span>
                            <span className="text-xs font-semibold text-slate-500">2 sắp tới</span>
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
                            <span className="text-3xl font-extrabold text-slate-900">128</span>
                            <span className="text-xs font-semibold text-slate-500">Trong 3 lớp học</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                </div>

                {/* Stat 3: Tỷ lệ điểm danh */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tỷ lệ điểm danh</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">94.2%</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                ↑ 2.4% so với tuần trước
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
                                <h3 className="text-base font-bold text-slate-900">Lịch giảng dạy hôm nay</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Thứ Hai, 14 tháng 10</p>
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
                            {mockSchedules.map((item) => (
                                <div 
                                    key={item.id}
                                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                        item.status === 'active' 
                                            ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs' 
                                            : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-28 font-mono font-bold text-xs text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center shrink-0">
                                            {item.time}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{item.course_name}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{item.code_group}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                        <span className="text-xs font-bold text-slate-600 font-mono">{item.students}</span>
                                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                                            item.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                                                : 'bg-slate-200/70 text-slate-600'
                                        }`}>
                                            {item.status_text}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Danh sách sinh viên gần đây */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Danh sách sinh viên gần đây</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Cập nhật từ ca học hiện tại</p>
                            </div>
                            <button 
                                onClick={() => alert("Đang xuất danh sách sinh viên ra CSV...")}
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
                                        <th className="pb-3 text-right pr-2">Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {mockStudentsLog.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 pl-2 font-bold text-slate-900">{row.name}</td>
                                            <td className="py-3 font-mono text-slate-600">{row.code}</td>
                                            <td className="py-3">
                                                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${row.badgeClass}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right pr-2 font-mono text-slate-500">{row.time}</td>
                                        </tr>
                                    ))}
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
                                <h4 className="font-extrabold text-slate-900 text-sm">Nhập môn Khoa học máy tính</h4>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                    <Clock size={13} className="text-slate-400" />
                                    08:00 – 10:00 · Phòng A-302
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-900"><strong className="text-lg">42</strong> / 45 có mặt</span>
                                    <span className="text-indigo-600 font-mono">Tiến độ 93%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: '93%' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Primary Button: Open Live Scan */}
                        <button
                            onClick={() => setIsFaceModalOpen(true)}
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
                                <p className="text-xs text-slate-400 mt-0.5">Quản lý ca thi sắp tới</p>
                            </div>
                            <button 
                                onClick={() => navigate('/teacher/exams')}
                                title="Thêm ca phòng thi"
                                className="w-7 h-7 rounded-lg bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-all"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Exam Items */}
                        <div className="space-y-3">
                            {mockExams.map((exam, idx) => (
                                <div key={idx} className="p-3.5 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${exam.color}`}>
                                            <Building2 size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{exam.title}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{exam.date}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-600 font-mono bg-white px-2 py-1 rounded border border-slate-200">
                                        {exam.room}
                                    </span>
                                </div>
                            ))}
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
        </div>
    );
};

export default TeacherDashboard;
