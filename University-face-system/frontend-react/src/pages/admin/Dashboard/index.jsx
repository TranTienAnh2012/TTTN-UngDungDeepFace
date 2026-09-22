import React, { useState, useEffect } from 'react';
import { 
    Users, BookOpen, Calendar, Clock, CheckCircle, AlertCircle, 
    CalendarRange, LogIn, LogOut, CheckCircle2, Building2, 
    GraduationCap, RefreshCw, ExternalLink, Activity, ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'classes' | 'exams'

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async (isManual = false) => {
        try {
            if (isManual) setRefreshing(true);
            else setLoading(true);
            
            const response = await api.get('/dashboard/stats');
            if (response.data.success) {
                setStats(response.data.data);
                setError('');
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Không thể tải dữ liệu thống kê');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-80 gap-3">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 font-medium">Đang tải số liệu tổng quan...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <AlertCircle size={22} className="text-red-500" />
                    <span className="font-medium">{error}</span>
                </div>
                <button 
                    onClick={() => fetchStats(true)} 
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    const statCards = [
        { 
            title: 'Tổng Sinh Viên', 
            value: stats?.counts.students || 0, 
            icon: Users, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50/80 border-blue-100',
            link: '/admin/students'
        },
        { 
            title: 'Khoa / Viện', 
            value: stats?.counts.faculties || 0, 
            icon: Building2, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50/80 border-indigo-100',
            link: '/admin/faculties'
        },
        { 
            title: 'Lớp Chính Quy', 
            value: stats?.counts.academic_classes || 0, 
            icon: GraduationCap, 
            color: 'text-teal-600', 
            bg: 'bg-teal-50/80 border-teal-100',
            link: '/admin/classes'
        },
        { 
            title: 'Tổng Môn Học', 
            value: stats?.counts.courses || 0, 
            icon: BookOpen, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50/80 border-purple-100',
            link: '/admin/courses'
        },
        { 
            title: 'Lịch Học Phần', 
            value: stats?.counts.classes || 0, 
            icon: Calendar, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50/80 border-emerald-100',
            link: '/admin/class-schedules'
        },
        { 
            title: 'Lịch Thi', 
            value: stats?.counts.exams || 0, 
            icon: CalendarRange, 
            color: 'text-orange-600', 
            bg: 'bg-orange-50/80 border-orange-100',
            link: '/admin/exam-schedules'
        }
    ];

    const formatTimeOnly = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleString('vi-VN', { 
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    };

    const renderClassStatusBadge = (log) => {
        const isComplete = (log.check_in_time && log.check_out_time) || log.status === 'Completed';
        const isOnlyCheckout = !log.check_in_time && log.check_out_time;
        const isOnlyCheckin = log.check_in_time && !log.check_out_time;

        if (isComplete) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm whitespace-nowrap">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Đủ 2 buổi (Hoàn tất)
                </span>
            );
        }
        if (isOnlyCheckout) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm whitespace-nowrap">
                    <AlertCircle size={13} className="text-amber-600" />
                    Chỉ Cuối Giờ
                </span>
            );
        }
        if (isOnlyCheckin) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm whitespace-nowrap">
                    <Clock size={13} className="text-blue-600" />
                    Đã Check-in (Chờ ra)
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 whitespace-nowrap">
                {log.status || 'Có mặt'}
            </span>
        );
    };

    const classLogsCount = stats?.recentActivity?.classes?.length || 0;
    const examLogsCount = stats?.recentActivity?.exams?.length || 0;

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tổng Quan Hệ Thống</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Bảng điều khiển theo dõi dữ liệu đào tạo và nhật ký điểm danh khuôn mặt
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium border border-gray-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title="Làm mới số liệu"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin text-emerald-600' : 'text-gray-500'} />
                        <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
                    </button>
                    <Link
                        to="/admin/attendance/class"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all active:scale-95"
                    >
                        <Activity size={16} />
                        <span>Camera Điểm Danh</span>
                    </Link>
                </div>
            </div>

            {/* Stat Cards (6 cards in flexible responsive grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={idx}
                            to={card.link}
                            className={`p-5 rounded-2xl bg-white border ${card.bg} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col justify-between`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white shadow-xs border border-gray-100`}>
                                    <Icon size={22} className={card.color} />
                                </div>
                                <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.title}</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">{card.value}</h3>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Main Content: Activity Logs Section with Tabs / Filter */}
            <div className="space-y-6">
                {/* Navigation View Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Activity size={20} className="text-emerald-600" />
                        <h2 className="text-lg font-bold text-gray-800">Nhật Ký Điểm Danh Mới Nhất</h2>
                    </div>

                    <div className="inline-flex p-1 bg-gray-100/90 rounded-xl border border-gray-200/80 text-sm font-medium">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all text-xs font-semibold ${
                                activeTab === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Tất cả ({classLogsCount + examLogsCount})
                        </button>
                        <button
                            onClick={() => setActiveTab('classes')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 ${
                                activeTab === 'classes'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-emerald-700'
                            }`}
                        >
                            <span>Lớp Học Phần</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'classes' ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                {classLogsCount}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('exams')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 ${
                                activeTab === 'exams'
                                    ? 'bg-orange-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-orange-700'
                            }`}
                        >
                            <span>Phòng Thi</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'exams' ? 'bg-orange-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                {examLogsCount}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Table 1: Điểm danh Lớp học (Full Width) */}
                {(activeTab === 'all' || activeTab === 'classes') && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4.5 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gradient-to-r from-emerald-50/50 via-teal-50/20 to-transparent gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Điểm danh Lớp học (Đầu giờ & Cuối giờ)</h3>
                                    <p className="text-xs text-gray-500">Ghi nhận vào lớp, ra về và tỷ lệ tham dự</p>
                                </div>
                            </div>
                            <Link
                                to="/admin/attendance/class"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-100/60 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <span>Xem trang điểm danh lớp</span>
                                <ExternalLink size={13} />
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[760px]">
                                <thead>
                                    <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 font-bold">
                                        <th className="px-6 py-3.5">Sinh viên</th>
                                        <th className="px-6 py-3.5">Môn học & Phòng</th>
                                        <th className="px-6 py-3.5 text-center">Giờ vào (Check-in)</th>
                                        <th className="px-6 py-3.5 text-center">Giờ ra (Check-out)</th>
                                        <th className="px-6 py-3.5 text-center">Độ khớp AI</th>
                                        <th className="px-6 py-3.5 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {stats?.recentActivity?.classes?.length > 0 ? (
                                        stats.recentActivity.classes.map((log) => {
                                            const checkInTime = formatTimeOnly(log.check_in_time);
                                            const checkOutTime = formatTimeOnly(log.check_out_time);
                                            const primaryDate = formatDateOnly(log.check_out_time || log.check_in_time);

                                            return (
                                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-900">{log.full_name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                                {log.student_code}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{primaryDate}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-gray-800">{log.course_name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Phòng: <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{log.room_name || 'Chưa xếp'}</span>
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {checkInTime ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <LogIn size={13} className="text-emerald-600" />
                                                                {checkInTime}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">-- : --</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {checkOutTime ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                                                <LogOut size={13} className="text-blue-600" />
                                                                {checkOutTime}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">-- : --</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {log.confidence_score ? (
                                                            <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                                                {Math.round(log.confidence_score * 100)}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">--</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {renderClassStatusBadge(log)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Clock size={32} className="text-gray-300" />
                                                    <p className="text-sm font-medium">Chưa có dữ liệu điểm danh lớp học nào</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Table 2: Điểm danh Thi (Full Width) */}
                {(activeTab === 'all' || activeTab === 'exams') && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4.5 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gradient-to-r from-orange-50/50 via-amber-50/20 to-transparent gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
                                    <CalendarRange size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Điểm danh Phòng Thi Gần Đây</h3>
                                    <p className="text-xs text-gray-500">Xác thực khuôn mặt thí sinh và kiểm tra tính hợp lệ phòng thi</p>
                                </div>
                            </div>
                            <Link
                                to="/admin/attendance/exam"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800 bg-orange-100/60 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <span>Xem trang điểm danh thi</span>
                                <ExternalLink size={13} />
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[760px]">
                                <thead>
                                    <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 font-bold">
                                        <th className="px-6 py-3.5">Thời gian xác thực</th>
                                        <th className="px-6 py-3.5">Thí sinh</th>
                                        <th className="px-6 py-3.5">Môn thi & Phòng</th>
                                        <th className="px-6 py-3.5 text-center">Trạng thái xác thực</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {stats?.recentActivity?.exams?.length > 0 ? (
                                        stats.recentActivity.exams.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                                                    <span className="font-semibold text-gray-800">{formatDate(log.check_in_time)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{log.full_name}</p>
                                                    <span className="text-xs font-mono font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 mt-1 inline-block">
                                                        {log.student_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-800">{log.course_name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Phòng thi: <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{log.exam_room || 'Chưa xếp'}</span>
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {log.is_verified ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm whitespace-nowrap">
                                                            <CheckCircle size={14} className="text-emerald-600" />
                                                            Hợp lệ
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-sm whitespace-nowrap">
                                                            <AlertCircle size={14} className="text-red-600" /> 
                                                            Cảnh báo / Không khớp
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <CalendarRange size={32} className="text-gray-300" />
                                                    <p className="text-sm font-medium">Chưa có dữ liệu điểm danh thi nào</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
