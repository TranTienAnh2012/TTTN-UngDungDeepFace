import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, GraduationCap, CheckCircle, XCircle, Building, Layers, Filter } from 'lucide-react';
import api from '../../../services/api';
import CreateStudent from './CreateStudent';
import EditStudent from './EditStudent';
import DeleteStudent from './DeleteStudent';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [academicClasses, setAcademicClasses] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [facultyFilter, setFacultyFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    
    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const fetchFilters = async () => {
        try {
            const [facRes, clsRes] = await Promise.all([
                api.get('/faculties?limit=100'),
                api.get('/academic-classes?limit=100')
            ]);
            if (facRes.data.success) setFaculties(facRes.data.data || []);
            if (clsRes.data.success) setAcademicClasses(clsRes.data.data || []);
        } catch (err) {
            console.error('Lỗi khi tải bộ lọc:', err);
        }
    };

    const fetchStudents = useCallback(async (page = pagination.page, searchTerm = search, facId = facultyFilter, clsId = classFilter) => {
        setLoading(true);
        try {
            let url = `/students?page=${page}&limit=${pagination.limit}&search=${searchTerm}`;
            if (facId) url += `&faculty_id=${facId}`;
            if (clsId) url += `&class_id=${clsId}`;
            
            const res = await api.get(url);
            if (res.data.success) {
                setStudents(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách sinh viên", error);
        }
        setLoading(false);
    }, [pagination.limit, facultyFilter, classFilter]);

    useEffect(() => {
        fetchFilters();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchStudents(1, search, facultyFilter, classFilter);
    };

    const handleFacultyChange = (e) => {
        const val = e.target.value;
        setFacultyFilter(val);
        fetchStudents(1, search, val, classFilter);
    };

    const handleClassChange = (e) => {
        const val = e.target.value;
        setClassFilter(val);
        fetchStudents(1, search, facultyFilter, val);
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
                        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                            <GraduationCap size={24} />
                        </div>
                        Quản Lý Hồ Sơ Sinh Viên
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">
                        Quản lý danh sách sinh viên theo Khoa, Lớp chính quy và trạng thái nhận diện khuôn mặt DeepFace
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-primary-200 flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Thêm Sinh Viên</span>
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Search and Filters Bar */}
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-grow">
                        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Tìm theo mã SV, họ tên..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 shadow-sm"
                            />
                        </form>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={facultyFilter}
                                onChange={handleFacultyChange}
                                className="px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-primary-500 shadow-sm w-full sm:w-auto"
                            >
                                <option value="">-- Tất cả Khoa --</option>
                                {faculties.map(f => (
                                    <option key={f.id} value={f.id}>{f.faculty_name} ({f.faculty_code})</option>
                                ))}
                            </select>

                            <select
                                value={classFilter}
                                onChange={handleClassChange}
                                className="px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-primary-500 shadow-sm w-full sm:w-auto"
                            >
                                <option value="">-- Tất cả Lớp --</option>
                                {academicClasses.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_code} - {c.class_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="text-xs font-bold text-gray-500 whitespace-nowrap">
                        Tổng số: <span className="text-primary-700 font-extrabold">{pagination.total}</span> sinh viên
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase font-bold tracking-wider">
                                <th className="p-4">Sinh Viên</th>
                                <th className="p-4">Lớp Chính Quy</th>
                                <th className="p-4">Khoa / Viện</th>
                                <th className="p-4">Ngày Sinh</th>
                                <th className="p-4 text-center">Trạng Thái Face</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
                                        <p className="mt-2 text-sm font-medium">Đang nạp dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400 font-medium">
                                        <GraduationCap className="mx-auto mb-2 opacity-30" size={40} />
                                        <p className="text-base font-semibold text-gray-500">Không tìm thấy sinh viên nào</p>
                                    </td>
                                </tr>
                            ) : (
                                students.map(student => (
                                    <tr key={student.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 shadow-sm">
                                                    {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{student.full_name}</div>
                                                    <div className="text-xs font-mono font-bold text-blue-700">{student.student_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {(student.class_code || student.academic_class_code || student.class_name) ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold">
                                                    <Layers size={13} />
                                                    {student.class_code || student.academic_class_code || student.class_name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs font-medium">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600 text-xs font-semibold">
                                            {student.faculty_name ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-medium">
                                                    <Building size={12} />
                                                    {student.faculty_name}
                                                </span>
                                            ) : student.faculty_code ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-medium">
                                                    <Building size={12} />
                                                    {student.faculty_code}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs font-medium">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600 text-xs font-medium">
                                            {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('vi-VN') : '—'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {student.face_embedding ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                                    <CheckCircle size={13} /> Đã Đăng Ký
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                                                    <XCircle size={13} /> Chưa Đăng Ký
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openEditModal(student)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(student)}
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
                        <span className="text-xs text-gray-500 font-semibold">
                            Trang {pagination.page} / {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchStudents(pagination.page - 1)}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                Trước
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchStudents(pagination.page + 1)}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateStudent 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onStudentCreated={() => fetchStudents(1)} 
            />
            <EditStudent 
                isOpen={isEditOpen} 
                onClose={() => {
                    setIsEditOpen(false);
                    setSelectedStudent(null);
                }} 
                onStudentUpdated={() => fetchStudents(pagination.page)} 
                student={selectedStudent} 
            />
            <DeleteStudent 
                isOpen={isDeleteOpen} 
                onClose={() => {
                    setIsDeleteOpen(false);
                    setSelectedStudent(null);
                }} 
                onStudentDeleted={() => fetchStudents(1)} 
                student={selectedStudent} 
            />
        </div>
    );
};

export default StudentManagement;
