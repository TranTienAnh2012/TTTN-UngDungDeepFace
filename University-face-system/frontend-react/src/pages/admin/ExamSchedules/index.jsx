import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, ClipboardList, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
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
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Môn Thi</th>
                                <th className="p-4 font-semibold">Phòng Thi</th>
                                <th className="p-4 font-semibold">Thời Gian</th>
                                <th className="p-4 font-semibold">Sơ Đồ Lớp</th>
                                <th className="p-4 font-semibold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">Đang tải...</td>
                                </tr>
                            ) : schedules.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">Không có dữ liệu</td>
                                </tr>
                            ) : (
                                schedules.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/85 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-900">{item.course_name}</div>
                                            <div className="text-sm font-mono text-gray-500">{item.course_code}</div>
                                        </td>
                                        <td className="p-4 text-gray-600 font-medium">{item.exam_room}</td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            <div>{new Date(item.exam_time).toLocaleDateString('vi-VN')}</div>
                                            <div className="text-xs font-mono text-gray-400">
                                                {new Date(item.exam_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                {' – '}
                                                {item.end_time ? new Date(item.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            {item.seating_rows} hàng x {item.seating_cols} cột
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setSelectedSchedule(item); setIsEligibilityOpen(true); }} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Xếp thí sinh">
                                                    <UserPlus size={16} />
                                                </button>
                                                <button onClick={() => { setSelectedSchedule(item); setIsEditOpen(true); }} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => { setSelectedSchedule(item); setIsDeleteOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
