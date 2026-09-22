import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Layers, Users, Building, Filter, GraduationCap } from 'lucide-react';
import api from '../../../services/api';
import CreateClass from './CreateClass';
import EditClass from './EditClass';
import DeleteClass from './DeleteClass';
import ClassStudentsModal from './ClassStudentsModal';

const ClassManagement = () => {
    const [classes, setClasses] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [facultyFilter, setFacultyFilter] = useState('');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);

    const [isStudentsOpen, setIsStudentsOpen] = useState(false);
    const [previewClass, setPreviewClass] = useState(null);

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/faculties?limit=100');
            if (res.data.success) {
                setFaculties(res.data.data || []);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách khoa:', err);
        }
    };

    const fetchClasses = useCallback(async (page = pagination.page, searchTerm = search, facultyId = facultyFilter) => {
        setLoading(true);
        try {
            let url = `/academic-classes?page=${page}&limit=${pagination.limit}&search=${searchTerm}`;
            if (facultyId) {
                url += `&faculty_id=${facultyId}`;
            }
            const res = await api.get(url);
            if (res.data.success) {
                setClasses(res.data.data || []);
                setPagination(res.data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách lớp:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, facultyFilter]);

    useEffect(() => {
        fetchFaculties();
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchClasses(1, search, facultyFilter);
    };

    const handleFacultyFilterChange = (e) => {
        const val = e.target.value;
        setFacultyFilter(val);
        fetchClasses(1, search, val);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">Đang học</span>;
            case 'graduated':
                return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">Đã tốt nghiệp</span>;
            case 'archived':
                return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold">Lưu trữ</span>;
            default:
                return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shadow-sm">
                            <Layers size={24} />
                        </div>
                        Quản Lý Lớp Sinh Viên Chính Quy
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">
                        Quản lý các lớp hành chính/niên chế, nạp tự động sinh viên theo lớp vào các lịch học và lịch thi
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Thêm Lớp Mới</span>
                </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-grow">
                    <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo mã lớp, tên lớp..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                        />
                    </form>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={facultyFilter}
                            onChange={handleFacultyFilterChange}
                            className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm w-full sm:w-auto"
                        >
                            <option value="">-- Tất cả Khoa/Viện --</option>
                            {faculties.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.faculty_name} ({f.faculty_code})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="text-sm font-semibold text-gray-500 whitespace-nowrap">
                    Tổng số: <span className="text-indigo-600 font-bold">{pagination.total}</span> lớp
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase font-bold tracking-wider">
                                <th className="py-4 px-6">Mã Lớp</th>
                                <th className="py-4 px-6">Tên Lớp Sinh Viên</th>
                                <th className="py-4 px-6">Khoa / Viện</th>
                                <th className="py-4 px-6">Niên Khóa</th>
                                <th className="py-4 px-6 text-center">Sinh Viên</th>
                                <th className="py-4 px-6 text-center">Trạng Thái</th>
                                <th className="py-4 px-6 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                                        <p className="mt-2 text-sm font-medium">Đang nạp dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : classes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400">
                                        <Layers className="mx-auto mb-2 opacity-40" size={40} />
                                        <p className="text-base font-semibold text-gray-500">Chưa có lớp sinh viên nào</p>
                                        <p className="text-xs text-gray-400 mt-1">Bấm "Thêm Lớp Mới" để bắt đầu quản lý lớp</p>
                                    </td>
                                </tr>
                            ) : (
                                classes.map((c) => (
                                    <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="py-4 px-6 font-bold text-indigo-700">
                                            <span className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                                                {c.class_code}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-gray-900">
                                            {c.class_name}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
                                                <Building size={13} />
                                                {c.faculty_name} ({c.faculty_code})
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 font-semibold">
                                            {c.academic_year || '—'}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => {
                                                    setPreviewClass(c);
                                                    setIsStudentsOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold transition-all shadow-sm"
                                                title="Xem danh sách sinh viên"
                                            >
                                                <Users size={13} />
                                                {c.student_count ?? c.total_students ?? 0} SV
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {getStatusBadge(c.status)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedClass(c);
                                                        setIsEditOpen(true);
                                                    }}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedClass(c);
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
                                onClick={() => fetchClasses(pagination.page - 1)}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                Trước
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchClasses(pagination.page + 1)}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateClass
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => fetchClasses(1)}
            />

            <EditClass
                isOpen={isEditOpen}
                onClose={() => {
                    setIsEditOpen(false);
                    setSelectedClass(null);
                }}
                onSuccess={() => fetchClasses(pagination.page)}
                academicClass={selectedClass}
            />

            <DeleteClass
                isOpen={isDeleteOpen}
                onClose={() => {
                    setIsDeleteOpen(false);
                    setSelectedClass(null);
                }}
                onSuccess={() => fetchClasses(1)}
                academicClass={selectedClass}
            />

            <ClassStudentsModal
                isOpen={isStudentsOpen}
                onClose={() => {
                    setIsStudentsOpen(false);
                    setPreviewClass(null);
                }}
                academicClass={previewClass}
            />
        </div>
    );
};

export default ClassManagement;
