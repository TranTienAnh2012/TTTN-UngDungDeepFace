import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, ClipboardList, ChevronLeft, ChevronRight, UserPlus, Users, Armchair } from 'lucide-react';
import api from '../../../services/api';
import CreateExamSchedule from './CreateExamSchedule';
import EditExamSchedule from './EditExamSchedule';
import DeleteExamSchedule from './DeleteExamSchedule';
import EligibilityModal from './EligibilityModal';

const ExamSchedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEligibilityOpen, setIsEligibilityOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const fetchSchedules = useCallback(async (page = pagination.page, searchTerm = search) => {
        setLoading(true);
        try {
            const res = await api.get(`/exams/schedules?page=${page}&limit=${pagination.limit}&search=${searchTerm}`);
            if (res.data.success) {
                setSchedules(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error("Lỗi khi tải lịch thi", error);
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

    const formatTimeSafe = (d) => {
        if (!d) return '';
        try {
            const date = new Date(d);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const formatDateSafe = (d) => {
        if (!d) return 'Chưa xếp ngày';
        try {
            const date = new Date(d);
            if (isNaN(date.getTime())) return 'Chưa xếp ngày';
            return date.toLocaleDateString('vi-VN');
        } catch {
            return 'Chưa xếp ngày';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                            <ClipboardList size={24} />
                        </div>
                        Lịch Thi
                    </h1>
                    <p className="text-gray-500 mt-1">Quản lý lịch thi, sơ đồ phòng và điều kiện dự thi</p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Thêm Lịch Thi</span>
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <form onSubmit={handleSearch} className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm môn, phòng..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                        />
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase font-bold tracking-wider">
                                <th className="p-4">Môn Thi</th>
                                <th className="p-4">Lớp Dự Thi</th>
                                <th className="p-4">Phòng Thi</th>
                                <th className="p-4">Thời Gian</th>
                                <th className="p-4 text-center">Sơ Đồ Ghế</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                                        <p className="mt-2 text-sm font-medium">Đang tải...</p>
                                    </td>
                                </tr>
                            ) : !Array.isArray(schedules) || schedules.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400 font-medium">Không có dữ liệu lịch thi</td>
                                </tr>
                            ) : (
                                schedules.map(item => {
                                    const startTimeStr = formatTimeSafe(item.exam_time);
                                    const endTimeStr = formatTimeSafe(item.exam_end_time || item.end_time);
                                    const dateStr = formatDateSafe(item.exam_time);

                                    return (
                                        <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{item.course_name || 'Chưa chọn môn'}</div>
                                                <div className="text-xs font-mono font-bold text-indigo-700">{item.course_code || '---'}</div>
                                            </td>
                                            <td className="p-4">
                                                {item.academic_class_code ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                                                        {item.academic_class_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Thi ghép / Tự do</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-800 font-semibold">
                                                <div className="flex items-center gap-1.5">
                                                    {item.room_code && (
                                                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-mono font-bold border border-purple-200">
                                                            {item.room_code}
                                                        </span>
                                                    )}
                                                    <span>{item.room_full_name || item.exam_room || 'Chưa xếp phòng'}</span>
                                                </div>
                                                {item.building && <div className="text-xs text-gray-500 font-normal">{item.building}</div>}
                                            </td>
                                            <td className="p-4 text-gray-700 text-sm">
                                                <div className="font-bold text-gray-900">
                                                    {startTimeStr || 'Chưa xếp giờ'}
                                                    {endTimeStr && ` - ${endTimeStr}`}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {dateStr}
                                                    {item.duration_minutes && <span className="ml-1.5 font-bold text-indigo-600">({item.duration_minutes} phút)</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => { setSelectedSchedule(item); setIsEditOpen(true); }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold font-mono transition-all hover:scale-105"
                                                    title="Bấm để chỉnh sửa sơ đồ chỗ ngồi & khóa ghế"
                                                >
                                                    <span>{item.seating_rows} hàng × {item.seating_cols} cột</span>
                                                </button>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => { setSelectedSchedule(item); setIsEligibilityOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Danh sách dự thi">
                                                        <Users size={16} />
                                                    </button>
                                                    <button onClick={() => { setSelectedSchedule(item); setIsEditOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => { setSelectedSchedule(item); setIsDeleteOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <span className="text-sm text-gray-500">Trang {pagination.page} / {pagination.totalPages}</span>
                </div>
            </div>

            <CreateExamSchedule isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={() => fetchSchedules(1)} />
            <EditExamSchedule isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onUpdated={() => fetchSchedules()} schedule={selectedSchedule} />
            <DeleteExamSchedule isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onDeleted={() => fetchSchedules(1)} schedule={selectedSchedule} />
            <EligibilityModal isOpen={isEligibilityOpen} onClose={() => setIsEligibilityOpen(false)} schedule={selectedSchedule} />
        </div>
    );
};

export default ExamSchedules;
