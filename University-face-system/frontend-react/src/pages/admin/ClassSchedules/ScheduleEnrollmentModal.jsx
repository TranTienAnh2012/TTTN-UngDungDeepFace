import React, { useState, useEffect } from 'react';
import { X, Users, Search, Plus, Trash2, GraduationCap, AlertCircle, CheckCircle2, UserPlus, BookOpen } from 'lucide-react';
import api from '../../../services/api';

const ScheduleEnrollmentModal = ({ isOpen, onClose, schedule }) => {
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [academicClasses, setAcademicClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // State for Bulk Enroll Class
    const [selectedClassId, setSelectedClassId] = useState('');
    const [bulkEnrollType, setBulkEnrollType] = useState('regular');
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    // State for Add Single Student (e.g. Retake/Supplementary)
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [singleEnrollType, setSingleEnrollType] = useState('retake');
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [isSingleLoading, setIsSingleLoading] = useState(false);

    useEffect(() => {
        if (isOpen && schedule) {
            fetchEnrolled();
            fetchAllStudents();
            fetchClasses();
            if (schedule.class_id) {
                setSelectedClassId(schedule.class_id);
            }
        }
    }, [isOpen, schedule]);

    const fetchEnrolled = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/classes/schedules/${schedule.id}/students`);
            if (res.data.success) {
                setEnrolledStudents(res.data.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi tải danh sách sinh viên');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const res = await api.get('/students?limit=1000');
            if (res.data.success) {
                setAllStudents(res.data.data || []);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách sinh viên', err);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/academic-classes?limit=100');
            if (res.data.success) {
                setAcademicClasses(res.data.data || []);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách lớp', err);
        }
    };

    const handleBulkEnrollClass = async (e) => {
        e.preventDefault();
        if (!selectedClassId) {
            return setError('Vui lòng chọn Lớp để nạp');
        }

        setIsBulkLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.post(`/classes/schedules/${schedule.id}/bulk-class`, {
                class_id: selectedClassId,
                enrollment_type: bulkEnrollType
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message);
                fetchEnrolled();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi nạp lớp');
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleAddSingleStudent = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) {
            return setError('Vui lòng chọn sinh viên cần thêm');
        }

        setIsSingleLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.post(`/classes/schedules/${schedule.id}/enroll`, {
                student_id: selectedStudentId,
                enrollment_type: singleEnrollType
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message);
                setSelectedStudentId('');
                setStudentSearchTerm('');
                fetchEnrolled();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi thêm sinh viên');
        } finally {
            setIsSingleLoading(false);
        }
    };

    const handleRemoveStudent = async (studentId, studentName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa sinh viên ${studentName} khỏi lịch học này?`)) return;

        setError('');
        setSuccessMsg('');
        try {
            const res = await api.delete(`/classes/schedules/${schedule.id}/students/${studentId}`);
            if (res.data.success) {
                setSuccessMsg(`Đã xóa sinh viên khỏi lịch học`);
                fetchEnrolled();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa sinh viên');
        }
    };

    if (!isOpen || !schedule) return null;

    const filteredEnrolled = enrolledStudents.filter(s =>
        s.student_code?.toLowerCase().includes(search.toLowerCase()) ||
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.academic_class_code?.toLowerCase().includes(search.toLowerCase()) ||
        s.class_name?.toLowerCase().includes(search.toLowerCase())
    );

    // Filter available students for search dropdown
    const enrolledIds = new Set(enrolledStudents.map(s => s.student_id || s.id));
    const availableStudents = allStudents.filter(s =>
        !enrolledIds.has(s.id) &&
        (studentSearchTerm === '' ||
            s.student_code?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
            s.full_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
            s.academic_class_code?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
            s.class_code?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
            s.class_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()))
    );

    const getEnrollmentTypeBadge = (type) => {
        switch (type) {
            case 'retake':
                return <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-bold">Học lại</span>;
            case 'supplementary':
                return <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-xs font-bold">Học ghép / Bổ sung</span>;
            default:
                return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-bold">Chính quy</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 bg-[#175b9f] text-white flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Users size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Danh Sách Sinh Viên Tham Gia Học Phần</h2>
                            <p className="text-xs text-emerald-100">
                                {schedule.course_name} ({schedule.course_code}) • {schedule.room_code || schedule.room_name} • {schedule.academic_class_code ? `Lớp: ${schedule.academic_class_code}` : 'Chưa gắn lớp chính'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Alerts */}
                {(error || successMsg) && (
                    <div className="p-3 px-6 flex-shrink-0">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                {successMsg}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions Toolbar: Bulk enroll class & Add outside student */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 lg:grid-cols-2 gap-4 flex-shrink-0">
                    {/* Box 1: Bulk Enroll Class */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Users size={15} className="text-emerald-600" />
                            <span>Nạp Toàn Bộ Sinh Viên Theo Lớp</span>
                        </div>
                        <form onSubmit={handleBulkEnrollClass} className="space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="sm:col-span-2 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-emerald-500 truncate"
                                >
                                    <option value="">-- Chọn Lớp Sinh Viên --</option>
                                    {academicClasses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.class_code} - {c.class_name} ({c.student_count ?? c.total_students ?? 0} SV)
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={bulkEnrollType}
                                    onChange={(e) => setBulkEnrollType(e.target.value)}
                                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="regular">Chính quy</option>
                                    <option value="supplementary">Học ghép</option>
                                    <option value="retake">Học lại</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isBulkLoading || !selectedClassId}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                                {isBulkLoading ? 'Đang nạp sinh viên...' : 'Nạp Toàn Bộ Sinh Viên Của Lớp'}
                            </button>
                        </form>
                    </div>

                    {/* Box 2: Add Outside / Retake Student */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <UserPlus size={15} className="text-indigo-600" />
                            <span>Thêm Sinh Viên Học Lại / Học Ghép (Ngoài Lớp)</span>
                        </div>
                        <form onSubmit={handleAddSingleStudent} className="space-y-2">
                            <input
                                type="text"
                                placeholder="Gõ MSSV hoặc Tên để tìm..."
                                value={studentSearchTerm}
                                onChange={(e) => setStudentSearchTerm(e.target.value)}
                                className="w-full px-2.5 py-1 border border-indigo-200 rounded-lg text-xs text-gray-900 font-medium bg-indigo-50/40 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    className="sm:col-span-2 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-indigo-500 truncate"
                                >
                                    <option value="">-- Chọn Sinh Viên ({availableStudents.length} SV) --</option>
                                    {availableStudents.slice(0, 150).map(st => (
                                        <option key={st.id} value={st.id}>
                                            {st.student_code} - {st.full_name} ({st.academic_class_code || st.class_code || st.class_name || 'Không có lớp'})
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={singleEnrollType}
                                    onChange={(e) => setSingleEnrollType(e.target.value)}
                                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="retake">Học lại</option>
                                    <option value="supplementary">Học ghép</option>
                                    <option value="regular">Chính quy</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isSingleLoading || !selectedStudentId}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                                {isSingleLoading ? 'Đang thêm...' : '+ Thêm Sinh Viên Này Vào Lịch'}
                            </button>
                        </form>
                    </div>
                </div>


                {/* Filter & Search Enrolled */}
                <div className="p-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm trong danh sách (MSSV, tên, lớp)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
                        />
                    </div>
                    <div className="text-xs font-bold text-gray-600">
                        Tổng số sinh viên trong lịch học: <span className="text-emerald-700 font-extrabold text-sm">{filteredEnrolled.length}</span> SV
                    </div>
                </div>

                {/* Student List Table */}
                <div className="overflow-y-auto flex-grow">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase font-bold tracking-wider z-10">
                            <tr>
                                <th className="py-3 px-4">STT</th>
                                <th className="py-3 px-4">Mã SV</th>
                                <th className="py-3 px-4">Họ và Tên</th>
                                <th className="py-3 px-4">Lớp Chính Quy</th>
                                <th className="py-3 px-4">Khoa / Viện</th>
                                <th className="py-3 px-4 text-center">Phân Loại</th>
                                <th className="py-3 px-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
                                        <p className="mt-2 text-sm font-medium">Đang nạp danh sách...</p>
                                    </td>
                                </tr>
                            ) : filteredEnrolled.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400">
                                        <GraduationCap className="mx-auto mb-2 opacity-30" size={40} />
                                        <p className="text-sm font-semibold text-gray-500">Chưa có sinh viên nào trong lịch học này</p>
                                        <p className="text-xs text-gray-400 mt-1">Sử dụng thanh công cụ phía trên để nạp cả lớp hoặc thêm sinh viên học lại</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEnrolled.map((st, idx) => (
                                    <tr key={st.student_id} className="hover:bg-emerald-50/20 transition-colors">
                                        <td className="py-3 px-4 text-gray-400 font-bold">{idx + 1}</td>
                                        <td className="py-3 px-4 font-bold text-gray-900">
                                            <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-mono">
                                                {st.student_code}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-gray-900">{st.full_name}</td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {st.academic_class_code ? (
                                                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-semibold">
                                                    {st.academic_class_code}
                                                </span>
                                            ) : (
                                                st.class_name || '—'
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">{st.faculty_name || '—'}</td>
                                        <td className="py-3 px-4 text-center">
                                            {getEnrollmentTypeBadge(st.enrollment_type)}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleRemoveStudent(st.student_id, st.full_name)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa khỏi lịch học này"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleEnrollmentModal;
