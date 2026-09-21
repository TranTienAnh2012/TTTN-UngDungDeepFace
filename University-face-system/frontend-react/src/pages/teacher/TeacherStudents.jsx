import React, { useState, useEffect } from 'react';
import { Users, Search, Camera, RotateCcw, UserPlus, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TeacherStudents = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFace, setFilterFace] = useState('all');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/student-list');
            if (res.data.success) {
                setStudents(res.data.data);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách sinh viên:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = students.filter(s => {
        const matchSearch = (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.student_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.class_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (filterFace === 'registered') return s.has_face;
        if (filterFace === 'not_registered') return !s.has_face;
        return true;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Users size={24} className="text-indigo-600" />
                        Danh Sách Sinh Viên Giảng Dạy
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Quản lý danh sách sinh viên, xem tình trạng dữ liệu khuôn mặt AI và đăng ký/đăng ký lại khuôn mặt
                    </p>
                </div>

                <button
                    onClick={() => navigate('/admin/face-registration-demo')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                >
                    <UserPlus size={18} />
                    <span>Đăng Ký Khuôn Mặt Mới</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo Tên, Mã SV, Lớp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-slate-400">Lọc mặt:</span>
                    <button
                        onClick={() => setFilterFace('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterFace === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Tất cả ({students.length})
                    </button>
                    <button
                        onClick={() => setFilterFace('registered')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterFace === 'registered' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Đã có khuôn mặt ({students.filter(s => s.has_face).length})
                    </button>
                    <button
                        onClick={() => setFilterFace('not_registered')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterFace === 'not_registered' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Chưa có ({students.filter(s => !s.has_face).length})
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4">Sinh viên</th>
                                <th className="py-3.5 px-4">Mã sinh viên</th>
                                <th className="py-3.5 px-4">Lớp học</th>
                                <th className="py-3.5 px-4">Dữ liệu khuôn mặt AI</th>
                                <th className="py-3.5 px-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-slate-400">Không tìm thấy sinh viên nào</td>
                                </tr>
                            ) : (
                                filtered.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                {s.full_name?.charAt(0) || 'S'}
                                            </div>
                                            <span>{s.full_name}</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{s.student_code}</td>
                                        <td className="py-3.5 px-4 text-slate-600">{s.class_name || 'CNTT-K65'}</td>
                                        <td className="py-3.5 px-4">
                                            {s.has_face ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 size={12} /> Đã có khuôn mặt
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    <AlertCircle size={12} /> Chưa có khuôn mặt
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-2">
                                            <button
                                                onClick={() => navigate(`/admin/face-registration-demo?student_id=${s.id}`)}
                                                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 transition-all ${
                                                    s.has_face
                                                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200'
                                                        : 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200'
                                                }`}
                                            >
                                                {s.has_face ? <RotateCcw size={12} /> : <Camera size={12} />}
                                                <span>{s.has_face ? 'Đăng ký lại' : 'Đăng ký mặt'}</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherStudents;
