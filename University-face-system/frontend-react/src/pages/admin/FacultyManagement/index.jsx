import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Building, Users, BookOpen, Layers } from 'lucide-react';
import api from '../../../services/api';
import CreateFaculty from './CreateFaculty';
import EditFaculty from './EditFaculty';
import DeleteFaculty from './DeleteFaculty';

const FacultyManagement = () => {
    const [faculties, setFaculties] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    const fetchFaculties = useCallback(async (page = pagination.page, searchTerm = search) => {
        setLoading(true);
        try {
            const res = await api.get(`/faculties?page=${page}&limit=${pagination.limit}&search=${searchTerm}`);
            if (res.data.success) {
                setFaculties(res.data.data || []);
                setPagination(res.data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách khoa:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit]);

    useEffect(() => {
        fetchFaculties();
    }, [fetchFaculties]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchFaculties(1, search);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shadow-sm">
                            <Building size={24} />
                        </div>
                        Quản Lý Khoa & Viện Đào Tạo
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">
                        Quản lý danh sách các Khoa/Viện chuyên môn, phân loại lớp sinh viên và phân quyền
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-200 flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Thêm Khoa Mới</span>
                </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="relative w-full sm:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã khoa, tên khoa..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                    />
                </form>
                <div className="text-sm font-semibold text-gray-500">
                    Tổng số: <span className="text-blue-600 font-bold">{pagination.total}</span> khoa / viện
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase font-bold tracking-wider">
                                <th className="py-4 px-6">Mã Khoa</th>
                                <th className="py-4 px-6">Tên Khoa / Viện</th>
                                <th className="py-4 px-6">Mô tả</th>
                                <th className="py-4 px-6 text-center">Số Lớp</th>
                                <th className="py-4 px-6 text-center">Số Sinh Viên</th>
                                <th className="py-4 px-6 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                        <p className="mt-2 text-sm font-medium">Đang nạp dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : faculties.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400">
                                        <Building className="mx-auto mb-2 opacity-40" size={40} />
                                        <p className="text-base font-semibold text-gray-500">Chưa có khoa/viện nào</p>
                                        <p className="text-xs text-gray-400 mt-1">Bấm "Thêm Khoa Mới" để tạo khoa đầu tiên</p>
                                    </td>
                                </tr>
                            ) : (
                                faculties.map((faculty) => (
                                    <tr key={faculty.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-4 px-6 font-bold text-blue-700">
                                            <span className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                                                {faculty.faculty_code}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-gray-900">
                                            {faculty.faculty_name}
                                        </td>
                                        <td className="py-4 px-6 text-gray-500 max-w-xs truncate">
                                            {faculty.description || <span className="text-gray-300 italic">Không có mô tả</span>}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold">
                                                <Layers size={13} />
                                                {faculty.class_count ?? faculty.total_classes ?? 0} lớp
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
                                                <Users size={13} />
                                                {faculty.student_count ?? faculty.total_students ?? 0} SV
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedFaculty(faculty);
                                                        setIsEditOpen(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedFaculty(faculty);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-semibold">
                            Trang {pagination.page} / {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchFaculties(pagination.page - 1)}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                Trước
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchFaculties(pagination.page + 1)}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateFaculty
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => fetchFaculties(1)}
            />

            <EditFaculty
                isOpen={isEditOpen}
                onClose={() => {
                    setIsEditOpen(false);
                    setSelectedFaculty(null);
                }}
                onSuccess={() => fetchFaculties(pagination.page)}
                faculty={selectedFaculty}
            />

            <DeleteFaculty
                isOpen={isDeleteOpen}
                onClose={() => {
                    setIsDeleteOpen(false);
                    setSelectedFaculty(null);
                }}
                onSuccess={() => fetchFaculties(1)}
                faculty={selectedFaculty}
            />
        </div>
    );
};

export default FacultyManagement;
