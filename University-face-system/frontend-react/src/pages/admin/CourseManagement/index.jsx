import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import api from '../../../services/api';
import CreateCourse from './CreateCourse';
import EditCourse from './EditCourse';
import DeleteCourse from './DeleteCourse';

const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    
    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/courses');
            if (res.data.success) {
                setCourses(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách môn học", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const filteredCourses = courses.filter(c => 
        c.course_code.toLowerCase().includes(search.toLowerCase()) || 
        c.course_name.toLowerCase().includes(search.toLowerCase())
    );

    const openEditModal = (course) => {
        setSelectedCourse(course);
        setIsEditOpen(true);
    };

    const openDeleteModal = (course) => {
        setSelectedCourse(course);
        setIsDeleteOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        Quản lý Môn học
                    </h1>
                    <p className="text-gray-500 mt-1">Danh mục các môn học trong hệ thống</p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Thêm Môn học</span>
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm môn học..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                        />
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                        Tổng số: {filteredCourses.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold w-1/4">Mã Môn</th>
                                <th className="p-4 font-semibold w-2/4">Tên Môn Học</th>
                                <th className="p-4 font-semibold w-1/4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-gray-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                                            Đang tải...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-gray-400 font-medium">
                                        Không tìm thấy môn học nào
                                    </td>
                                </tr>
                            ) : (
                                filteredCourses.map(course => (
                                    <tr key={course.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="p-4">
                                            <span className="font-mono font-semibold text-primary-700 bg-primary-50 px-2 py-1 rounded-md text-sm border border-primary-100">
                                                {course.course_code}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">
                                            {course.course_name}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => openEditModal(course)}
                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(course)}
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
            </div>

            <CreateCourse 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onCourseCreated={fetchCourses} 
            />
            
            <EditCourse 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                onCourseUpdated={fetchCourses} 
                course={selectedCourse} 
            />
            
            <DeleteCourse 
                isOpen={isDeleteOpen} 
                onClose={() => setIsDeleteOpen(false)} 
                onCourseDeleted={fetchCourses} 
                course={selectedCourse} 
            />
        </div>
    );
};

export default CourseManagement;
