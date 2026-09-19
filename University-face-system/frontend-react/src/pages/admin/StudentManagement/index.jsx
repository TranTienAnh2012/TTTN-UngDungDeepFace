import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, GraduationCap, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../services/api';
import CreateStudent from './CreateStudent';
import EditStudent from './EditStudent';
import DeleteStudent from './DeleteStudent';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    
    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const fetchStudents = useCallback(async (page = pagination.page, searchTerm = search) => {
        setLoading(true);
        try {
            const res = await api.get(`/students?page=${page}&limit=${pagination.limit}&search=${searchTerm}`);
            if (res.data.success) {
                setStudents(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách sinh viên", error);
        }
        setLoading(false);
    }, [pagination.limit]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchStudents(1, search);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchStudents(newPage);
        }
    };

    const openEditModal = (student) => {
        setSelectedStudent(student);
        setIsEditOpen(true);
    };

    const openDeleteModal = (student) => {
        setSelectedStudent(student);
        setIsDeleteOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <GraduationCap size={24} />
                        </div>
                        Quản lý Sinh viên
                    </h1>
                    <p className="text-gray-500 mt-1">Quản lý hồ sơ và dữ liệu khuôn mặt sinh viên</p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Thêm Sinh viên</span>
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <form onSubmit={handleSearch} className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm theo mã SV, tên..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                        />
                    </form>
                    <div className="text-sm text-gray-500 font-medium">
                        Tổng số: {pagination.total}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Sinh Viên</th>
                                <th className="p-4 font-semibold">Lớp</th>
                                <th className="p-4 font-semibold">Ngày Sinh</th>
                                <th className="p-4 font-semibold">Trạng Thái AI</th>
                                <th className="p-4 font-semibold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                                            Đang tải...
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">
                                        Không tìm thấy sinh viên nào
                                    </td>
                                </tr>
                            ) : (
                                students.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{student.full_name}</div>
                                                    <div className="text-sm font-mono text-gray-500">{student.student_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 font-medium">{student.class_name || '-'}</td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('vi-VN') : '-'}
                                        </td>
                                        <td className="p-4">
                                            {student.face_embedding ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                                    <CheckCircle size={14} /> Đã Đăng Ký Face
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                                                    <XCircle size={14} /> Chưa Đăng Ký
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => openEditModal(student)}
                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(student)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <span className="text-sm text-gray-500">
                        Trang <span className="font-semibold text-gray-900">{pagination.page}</span> / {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button 
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <CreateStudent 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onStudentCreated={() => fetchStudents(1)} 
            />
            
            <EditStudent 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                onStudentUpdated={() => fetchStudents()} 
                student={selectedStudent} 
            />
            
            <DeleteStudent 
                isOpen={isDeleteOpen} 
                onClose={() => setIsDeleteOpen(false)} 
                onStudentDeleted={() => fetchStudents(1)} 
                student={selectedStudent} 
            />
        </div>
    );
};

export default StudentManagement;
