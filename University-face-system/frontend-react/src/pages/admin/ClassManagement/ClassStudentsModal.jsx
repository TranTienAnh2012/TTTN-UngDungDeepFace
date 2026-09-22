import React, { useState, useEffect } from 'react';
import { X, Users, Search, GraduationCap, Building, Mail } from 'lucide-react';
import api from '../../../services/api';

const ClassStudentsModal = ({ isOpen, onClose, academicClass }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen && academicClass) {
            fetchStudents();
        }
    }, [isOpen, academicClass]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/academic-classes/${academicClass.id}/students`);
            if (res.data.success) {
                setStudents(res.data.data || []);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách sinh viên của lớp:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !academicClass) return null;

    const filteredStudents = students.filter(s =>
        s.student_code?.toLowerCase().includes(search.toLowerCase()) ||
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Danh Sách Sinh Viên Lớp: {academicClass.class_code}</h2>
                            <p className="text-xs text-indigo-100">{academicClass.class_name} • {academicClass.faculty_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Search & Stats */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm theo MSSV, tên, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                        />
                    </div>
                    <div className="text-xs font-bold text-gray-600">
                        Tổng số: <span className="text-indigo-600 font-extrabold">{filteredStudents.length}</span> / {students.length} sinh viên
                    </div>
                </div>

                {/* Student List */}
                <div className="overflow-y-auto flex-grow p-4">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                            <p className="mt-2 text-sm font-medium">Đang nạp danh sách...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <GraduationCap className="mx-auto mb-2 opacity-30" size={40} />
                            <p className="text-sm font-semibold text-gray-500">Không có sinh viên nào</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredStudents.map((st, idx) => (
                                <div key={st.id} className="p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-extrabold text-indigo-700">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 text-sm">{st.full_name}</span>
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold font-mono">
                                                    {st.student_code}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                                                {st.email && <span className="flex items-center gap-1"><Mail size={12} /> {st.email}</span>}
                                                {st.gender && <span>Giới tính: {st.gender === 'male' ? 'Nam' : 'Nữ'}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            st.face_registered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                            {st.face_registered ? '✓ Đã đăng ký' : 'Chưa đăng ký'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassStudentsModal;
