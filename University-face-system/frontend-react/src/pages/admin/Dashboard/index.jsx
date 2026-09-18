import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, Clock, CheckCircle, AlertCircle, CalendarRange, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Không thể tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
            </div>
        );
    }

    const statCards = [
        { title: 'Tổng Sinh Viên', value: stats?.counts.students || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Tổng Môn Học', value: stats?.counts.courses || 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'Lịch Học', value: stats?.counts.classes || 0, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { title: 'Lịch Thi', value: stats?.counts.exams || 0, icon: CalendarRange, color: 'text-orange-600', bg: 'bg-orange-100' }
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Đủ 2 buổi (Hoàn tất)
                </span>
            );
        }
        if (isOnlyCheckout) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                    <AlertCircle size={13} className="text-amber-600" />
                    Chỉ Cuối Giờ
                </span>
            );
        }
        if (isOnlyCheckin) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                    <Clock size={13} className="text-blue-600" />
                    Đã Check-in (Chờ về)
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                {log.status || 'Có mặt'}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>
                <p className="text-gray-500 mt-1">Dữ liệu thống kê tổng quát về quản lý sinh viên, điểm danh đầu giờ và cuối giờ</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg}`}>
                                <Icon size={28} className={card.color} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                                <h3 className="text-3xl font-bold text-gray-800 mt-1">{card.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Lịch sử điểm danh Lớp */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50/40 to-teal-50/20">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-emerald-600" />
                            <h2 className="text-lg font-bold text-gray-800">Điểm danh Lớp học (Đầu giờ & Cuối giờ)</h2>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                            Mới nhất
                        </span>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                    <th className="p-4 font-semibold">Sinh viên</th>
                                    <th className="p-4 font-semibold">Môn / Phòng</th>
                                    <th className="p-4 font-semibold text-center">Giờ vào (Check-in)</th>
                                    <th className="p-4 font-semibold text-center">Giờ ra (Check-out)</th>
                                    <th className="p-4 font-semibold text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats?.recentActivity.classes.length > 0 ? (
                                    stats.recentActivity.classes.map((log) => {
                                        const checkInTime = formatTimeOnly(log.check_in_time);
                                        const checkOutTime = formatTimeOnly(log.check_out_time);
                                        const primaryDate = formatDateOnly(log.check_out_time || log.check_in_time);

                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-semibold text-gray-800 text-sm">{log.full_name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                            {log.student_code}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{primaryDate}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">
                                                    <p className="font-medium text-gray-800">{log.course_name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        Phòng: <span className="font-semibold text-gray-700">{log.room_name}</span>
                                                    </p>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {checkInTime ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <LogIn size={12} className="text-emerald-600" />
                                                            {checkInTime}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Chưa check-in</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {checkOutTime ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                                            <LogOut size={12} className="text-blue-600" />
                                                            {checkOutTime}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Chưa check-out</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {renderClassStatusBadge(log)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">
                                            Chưa có dữ liệu điểm danh lớp học
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Lịch sử điểm danh Thi */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50/50 to-amber-50/20">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-orange-600" />
                            <h2 className="text-lg font-bold text-gray-800">Điểm danh Thi gần đây</h2>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg">
                            Phòng thi
                        </span>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                    <th className="p-4 font-semibold">Thời gian</th>
                                    <th className="p-4 font-semibold">Sinh viên</th>
                                    <th className="p-4 font-semibold">Môn / Phòng</th>
                                    <th className="p-4 font-semibold text-center">Xác thực</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats?.recentActivity.exams.length > 0 ? (
                                    stats.recentActivity.exams.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="p-4 text-sm text-gray-600 font-mono text-xs">{formatDate(log.check_in_time)}</td>
                                            <td className="p-4">
                                                <p className="font-semibold text-gray-800 text-sm">{log.full_name}</p>
                                                <span className="text-xs font-mono font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                                    {log.student_code}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                <p className="font-medium text-gray-800">{log.course_name}</p>
                                                <p className="text-xs text-gray-500">Phòng: <span className="font-semibold text-gray-700">{log.exam_room}</span></p>
                                            </td>
                                            <td className="p-4 text-center">
                                                {log.is_verified ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                                        <CheckCircle size={13} className="text-emerald-600" />
                                                        Hợp lệ
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-sm">
                                                        <AlertCircle size={13} className="text-red-600" /> Cảnh báo
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            Chưa có dữ liệu điểm danh thi
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
