import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Calendar, ChevronLeft, ChevronRight, Users, Layers, Building } from 'lucide-react';
import api from '../../../services/api';
import CreateSchedule from './CreateSchedule';
import EditSchedule from './EditSchedule';
import DeleteSchedule from './DeleteSchedule';
import ScheduleEnrollmentModal from './ScheduleEnrollmentModal';

const ClassSchedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    // Schedule Enrollment Modal
    const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
    const [enrollmentSchedule, setEnrollmentSchedule] = useState(null);

    const fetchSchedules = useCallback(async (page = pagination.page, searchTerm = search) => {
        setLoading(true);
        try {
            const res = await api.get(`/classes/schedules?page=${page}&limit=${pagination.limit}&search=${searchTerm}`);
            if (res.data.success) {
                setSchedules(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error("Lỗi khi tải lịch học", error);
        }
        setLoading(false);
    }, [pagination.limit]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSchedules(1, search);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                            <Calendar size={24} />
                        </div>
                        Lịch Học Phần & Danh Sách Lớp
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">
                        Quản lý lịch học, phòng học, ca học và sinh viên tham gia từng ca học (Chính quy & Học lại)
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-primary-200 flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Thêm Lịch Học Mới</span>
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <form onSubmit={handleSearch} className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm môn, phòng, lớp..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 shadow-sm"
                        />
                    </form>
                    <div className="text-xs font-bold text-gray-500">
                        Tổng số: <span className="text-emerald-700 font-extrabold">{pagination.total}</span> ca học
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase font-bold tracking-wider">
                                <th className="p-4">Môn Học</th>
                                <th className="p-4">Lớp Sinh Viên</th>
                                <th className="p-4">Phòng & Ca</th>
                                <th className="p-4">Bắt đầu</th>
                                <th className="p-4">Kết thúc</th>
                                <th className="p-4 text-center">Danh Sách SV</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400 font-medium">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
                                        <p className="mt-2 text-sm font-medium">Đang nạp dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : schedules.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400 font-medium">
                                        <Calendar className="mx-auto mb-2 opacity-30" size={40} />
                                        <p className="text-base font-semibold text-gray-500">Không có lịch học nào</p>
                                        <p className="text-xs text-gray-400 mt-1">Bấm "Thêm Lịch Học Mới" để tạo lịch</p>
                                    </td>
                                </tr>
                            ) : (
                                schedules.map(item => (
                                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{item.course_name}</div>
                                            <div className="text-xs font-mono text-gray-500">{item.course_code}</div>
                                        </td>
                                        <td className="p-4">
                                            {item.academic_class_code ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold">
                                                    <Layers size={13} />
                                                    <span>{item.academic_class_code}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Học phần mở (Tự do)</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-800 font-semibold">
                                            <div className="flex items-center gap-1.5">
                                                {item.room_code && (
                                                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-mono font-bold border border-indigo-200">
                                                        {item.room_code}
                                                    </span>
                                                )}
                                                <span>{item.room_full_name || item.room_name}</span>
                                            </div>
                                            {item.shift_name && (
                                                <div className="text-xs font-bold text-indigo-600 mt-0.5">{item.shift_name}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-700 text-sm">
                                            <div className="font-bold text-gray-900">
                                                {new Date(item.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(item.start_time).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-700 text-sm">
                                            <div className="font-bold text-gray-900">
                                                {new Date(item.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(item.end_time).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setEnrollmentSchedule(item);
                                                    setIsEnrollmentOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                                            >
                                                <Users size={14} />
                                                <span>Quản lý SV</span>
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => { setSelectedSchedule(item); setIsEditOpen(true); }} 
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedSchedule(item); setIsDeleteOpen(true); }} 
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <span className="text-xs text-gray-500 font-semibold">Trang {pagination.page} / {pagination.totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchSchedules(pagination.page - 1)}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                Trước
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchSchedules(pagination.page + 1)}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateSchedule isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={() => fetchSchedules(1)} />
            <EditSchedule isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onUpdated={() => fetchSchedules()} schedule={selectedSchedule} />
            <DeleteSchedule isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onDeleted={() => fetchSchedules(1)} schedule={selectedSchedule} />
            
            <ScheduleEnrollmentModal
                isOpen={isEnrollmentOpen}
                onClose={() => {
                    setIsEnrollmentOpen(false);
                    setEnrollmentSchedule(null);
                }}
                schedule={enrollmentSchedule}
            />
        </div>
    );
};

export default ClassSchedules;

