import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, LogIn, LogOut, XCircle } from 'lucide-react';
import api from '../../../services/api';

const ClassAttendance = () => {
    const [attendanceList, setAttendanceList] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    
    const fetchAttendance = useCallback(async (page = pagination.page) => {
        setLoading(true);
        try {
            const res = await api.get(`/classes/attendance?page=${page}&limit=${pagination.limit}`);
            if (res.data.success) {
                setAttendanceList(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error("Lỗi khi tải lịch sử điểm danh", error);
        }
        setLoading(false);
    }, [pagination.limit]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
        try {
            await api.delete(`/classes/attendance/${id}`);
            fetchAttendance(pagination.page);
        } catch (error) {
            alert('Lỗi khi xóa');
        }
    };

    const renderAttendanceStatus = (item) => {
        const now = new Date();
        const startTime = item.start_time ? new Date(item.start_time) : null;
        const endTime = item.end_time ? new Date(item.end_time) : null;
        const checkInTime = item.check_in_time ? new Date(item.check_in_time) : null;
        const checkOutTime = item.check_out_time ? new Date(item.check_out_time) : null;

        // Check if check-in was late (> 15 mins after class start time)
        let isLate = item.check_in_status === 'Late' || item.status === 'Late';
        if (!isLate && checkInTime && startTime) {
            const diffMins = (checkInTime.getTime() - startTime.getTime()) / (1000 * 60);
            if (diffMins > 15) {
                isLate = true;
            }
        }

        // 1. Both Check-in & Check-out present, or Completed
        if ((checkInTime && checkOutTime) || item.status === 'Completed') {
            if (isLate) {
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                        <Clock size={13} className="text-amber-600" /> Đi muộn (&gt;15p) · Đủ đầu & cuối giờ
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Đầy đủ (Đầu & Cuối giờ)
                </span>
            );
        }

        // 2. Check-in only (no checkout)
        if (checkInTime && !checkOutTime) {
            const isSessionEnded = (endTime && now > endTime) || (startTime && (now.getTime() - startTime.getTime() > 4 * 60 * 60 * 1000));

            if (isLate) {
                if (isSessionEnded) {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs">
                            <AlertCircle size={13} className="text-orange-600" /> Đi muộn (&gt;15p) & Thiếu check-out
                        </span>
                    );
                }
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                        <Clock size={13} className="text-amber-600" /> Đi muộn (&gt;15p)
                    </span>
                );
            }

            if (isSessionEnded) {
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs">
                        <AlertCircle size={13} className="text-orange-600" /> Chưa điểm danh cuối giờ (Thiếu Check-out)
                    </span>
                );
            }

            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                    <LogIn size={13} className="text-blue-600" /> Đã vào lớp (Đầu giờ)
                </span>
            );
        }

        // 3. Checkout only without check-in
        if (!checkInTime && checkOutTime) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                    <LogOut size={13} className="text-indigo-600" /> Chỉ check-out cuối giờ
                </span>
            );
        }

        // 4. Absent / Unattended
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                <XCircle size={13} className="text-rose-600" /> Vắng mặt
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <UserCheck size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Điểm Danh Lớp</h1>
                    <p className="text-gray-500 mt-1">Lịch sử điểm danh sinh viên trong các tiết học</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Sinh Viên</th>
                                <th className="p-4 font-semibold">Môn / Phòng</th>
                                <th className="p-4 font-semibold">Thời Gian Check-in</th>
                                <th className="p-4 font-semibold">Trạng Thái Điểm Danh</th>
                                <th className="p-4 font-semibold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">Đang tải...</td>
                                </tr>
                            ) : attendanceList.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">Không có dữ liệu</td>
                                </tr>
                            ) : (
                                attendanceList.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-900">{item.full_name}</div>
                                            <div className="text-sm font-mono text-gray-500">{item.student_code} - Lớp {item.class_name}</div>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            <div className="font-semibold text-gray-800">{item.course_code}</div>
                                            <div className="text-sm">{item.room_name}</div>
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm font-medium">
                                            {item.check_in_time ? new Date(item.check_in_time).toLocaleString('vi-VN') : 'Chưa check-in'}
                                        </td>
                                        <td className="p-4 text-sm">
                                            {renderAttendanceStatus(item)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <span className="text-sm text-gray-500">Trang {pagination.page} / {pagination.totalPages}</span>
                    <div className="flex gap-2">
                        <button disabled={pagination.page === 1} onClick={() => fetchAttendance(pagination.page - 1)} className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                            <ChevronLeft size={18} />
                        </button>
                        <button disabled={pagination.page === pagination.totalPages} onClick={() => fetchAttendance(pagination.page + 1)} className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassAttendance;
