import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Users, Search, AlertCircle, CheckCircle2, UserPlus, Armchair, Layers } from 'lucide-react';
import api from '../../../services/api';

const EligibilityModal = ({ isOpen, onClose, schedule }) => {
    const [eligibleStudents, setEligibleStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [academicClasses, setAcademicClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Bulk class enrollment
    const [selectedClassId, setSelectedClassId] = useState('');
    const [bulkStudentType, setBulkStudentType] = useState('regular');
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    // Single student add
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentType, setStudentType] = useState('retake');
    const [seatRow, setSeatRow] = useState('');
    const [seatCol, setSeatCol] = useState('');
    const [notes, setNotes] = useState('');
    const [isSingleLoading, setIsSingleLoading] = useState(false);

    useEffect(() => {
        if (isOpen && schedule) {
            fetchEligibility();
            fetchAllStudents();
            fetchClasses();
            if (schedule.class_id) {
                setSelectedClassId(schedule.class_id);
            }
        }
    }, [isOpen, schedule]);

    const fetchEligibility = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/exams/eligibility?schedule_id=${schedule.id}`);
            if (res.data.success) {
                setEligibleStudents(res.data.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi tải danh sách dự thi');
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
            console.error('Lỗi tải danh sách SV:', err);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/academic-classes?limit=100');
            if (res.data.success) {
                setAcademicClasses(res.data.data || []);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách lớp:', err);
        }
    };

    if (!isOpen || !schedule) return null;

    const handleBulkEnrollClass = async (e) => {
        e.preventDefault();
        if (!selectedClassId) {
            return setError('Vui lòng chọn Lớp để nạp');
        }

        setIsBulkLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.post(`/exams/schedules/${schedule.id}/bulk-class`, {
                class_id: selectedClassId,
                student_type: bulkStudentType,
                notes: `Nạp theo lớp ${academicClasses.find(c => c.id === parseInt(selectedClassId))?.class_code || ''}`
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message);
                fetchEligibility();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi nạp lớp vào lịch thi');
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleAddSingle = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) {
            return setError('Vui lòng chọn sinh viên');
        }

        setIsSingleLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.post('/exams/eligibility', {
                exam_schedule_id: schedule.id,
                student_id: selectedStudentId,
                is_eligible: 1,
                seat_row: seatRow !== '' ? parseInt(seatRow) : null,
                seat_col: seatCol !== '' ? parseInt(seatCol) : null,
                student_type: studentType,
                notes: notes || (studentType === 'retake' ? 'Thi lại' : studentType === 'supplementary' ? 'Thi ghép' : 'Chính quy')
            });
            if (res.data.success) {
                setSuccessMsg('Đã thêm sinh viên vào danh sách dự thi');
                setSelectedStudentId('');
                setSeatRow('');
                setSeatCol('');
                setNotes('');
                fetchEligibility();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi thêm sinh viên');
        } finally {
            setIsSingleLoading(false);
        }
    };

    const handleDelete = async (id, studentName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa sinh viên ${studentName} khỏi danh sách dự thi?`)) return;
        setError('');
        setSuccessMsg('');
        try {
            await api.delete(`/exams/eligibility/${id}`);
            setSuccessMsg('Đã xóa sinh viên khỏi danh sách dự thi');
            fetchEligibility();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi xóa sinh viên');
        }
    };

    const eligibleIds = new Set(eligibleStudents.map(e => e.student_id));
    const availableStudents = allStudents.filter(s => !eligibleIds.has(s.id));

    const filteredStudents = eligibleStudents.filter(s =>
        s.student_code?.toLowerCase().includes(search.toLowerCase()) ||
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.academic_class_code?.toLowerCase().includes(search.toLowerCase()) ||
        s.class_name?.toLowerCase().includes(search.toLowerCase())
    );

    const getStudentTypeBadge = (type) => {
        switch (type) {
            case 'retake':
                return <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-bold">Thi lại</span>;
            case 'supplementary':
                return <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-xs font-bold">Thi ghép / Bổ sung</span>;
            default:
                return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-bold">Chính quy</span>;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-[#175b9f] text-white flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Users size={22} />
                            Danh Sách Sinh Viên Dự Thi
                        </h3>
                        <p className="text-xs text-indigo-100 mt-0.5">
                            {schedule.course_name} ({schedule.course_code}) • Phòng: <span className="font-bold text-white">{schedule.exam_room}</span> • Sơ đồ: {schedule.seating_rows}x{schedule.seating_cols} ghế
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
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

                {/* Actions Toolbar */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 lg:grid-cols-2 gap-4 flex-shrink-0">
                    {/* Box 1: Bulk Enroll Class */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Layers size={15} className="text-indigo-600" />
                            <span>Nạp Toàn Bộ Sinh Viên Theo Lớp & Xếp Ghế</span>
                        </div>
                        <form onSubmit={handleBulkEnrollClass} className="space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="sm:col-span-2 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-indigo-500 truncate"
                                >
                                    <option value="">-- Chọn Lớp Sinh Viên --</option>
                                    {academicClasses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.class_code} - {c.class_name} ({c.student_count ?? c.total_students ?? 0} SV)
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={bulkStudentType}
                                    onChange={(e) => setBulkStudentType(e.target.value)}
                                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="regular">Chính quy</option>
                                    <option value="supplementary">Thi ghép</option>
                                    <option value="retake">Thi lại</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isBulkLoading || !selectedClassId}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                                {isBulkLoading ? 'Đang nạp sinh viên...' : '⚡ Nạp Toàn Bộ Lớp & Xếp Ghế Tự Động'}
                            </button>
                        </form>
                    </div>

                    {/* Box 2: Add Single Student (Retake/Supplementary) */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <UserPlus size={15} className="text-purple-600" />
                            <span>Thêm Sinh Viên Dự Thi (Thi Lại / Thi Ghép)</span>
                        </div>
                        <form onSubmit={handleAddSingle} className="space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <select 
                                    className="sm:col-span-2 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 truncate" 
                                    value={selectedStudentId} 
                                    onChange={e => setSelectedStudentId(e.target.value)}
                                >
                                    <option value="" className="text-gray-500">-- Chọn sinh viên --</option>
                                    {availableStudents.slice(0, 150).map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.student_code} - {s.full_name} ({s.academic_class_code || s.class_name || 'Chưa có lớp'})
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={studentType}
                                    onChange={(e) => setStudentType(e.target.value)}
                                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="retake">Thi lại</option>
                                    <option value="supplementary">Thi ghép</option>
                                    <option value="regular">Chính quy</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <span className="text-[11px] text-gray-500 font-bold">Hàng:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={schedule.seating_rows ? schedule.seating_rows - 1 : 10}
                                        placeholder="0"
                                        value={seatRow}
                                        onChange={e => setSeatRow(e.target.value)}
                                        className="w-14 px-2 py-1 border border-gray-300 rounded-lg text-xs text-gray-900 font-bold"
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[11px] text-gray-500 font-bold">Cột:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={schedule.seating_cols ? schedule.seating_cols - 1 : 10}
                                        placeholder="0"
                                        value={seatCol}
                                        onChange={e => setSeatCol(e.target.value)}
                                        className="w-14 px-2 py-1 border border-gray-300 rounded-lg text-xs text-gray-900 font-bold"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Ghi chú (VD: Thi lại lần 2)"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="flex-grow px-2 py-1 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={isSingleLoading || !selectedStudentId}
                                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 whitespace-nowrap"
                                >
                                    {isSingleLoading ? '...' : '+ Thêm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm trong danh sách (MSSV, tên, lớp)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                        />
                    </div>
                    <div className="text-xs font-bold text-gray-600">
                        Tổng số sinh viên dự thi: <span className="text-indigo-700 font-extrabold text-sm">{filteredStudents.length}</span> / {eligibleStudents.length} SV
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-y-auto flex-grow">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase font-bold tracking-wider z-10">
                            <tr>
                                <th className="p-3 px-4">STT</th>
                                <th className="p-3 px-4">Sinh Viên</th>
                                <th className="p-3 px-4">Lớp Chính Quy</th>
                                <th className="p-3 px-4 text-center">Vị Trí Ghế</th>
                                <th className="p-3 px-4 text-center">Phân Loại</th>
                                <th className="p-3 px-4">Ghi Chú</th>
                                <th className="p-3 px-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                                        <p className="mt-2 text-sm font-medium">Đang tải...</p>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400 font-medium">
                                        <Users className="mx-auto mb-2 opacity-30" size={36} />
                                        <p className="text-sm font-semibold text-gray-500">Chưa có sinh viên nào trong danh sách thi</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s, idx) => (
                                    <tr key={s.id} className="hover:bg-indigo-50/20 transition-colors">
                                        <td className="p-3 px-4 font-bold text-gray-400">{idx + 1}</td>
                                        <td className="p-3 px-4">
                                            <div className="font-bold text-gray-900">{s.full_name}</div>
                                            <div className="text-xs font-mono font-bold text-indigo-700">{s.student_code}</div>
                                        </td>
                                        <td className="p-3 px-4">
                                            {s.academic_class_code ? (
                                                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-bold">
                                                    {s.academic_class_code}
                                                </span>
                                            ) : (
                                                s.class_name || '—'
                                            )}
                                        </td>
                                        <td className="p-3 px-4 text-center">
                                            {s.seat_row !== null && s.seat_col !== null ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-bold">
                                                    <Armchair size={12} />
                                                    H{s.seat_row + 1}-C{s.seat_col + 1}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Chưa xếp</span>
                                            )}
                                        </td>
                                        <td className="p-3 px-4 text-center">
                                            {getStudentTypeBadge(s.student_type)}
                                        </td>
                                        <td className="p-3 px-4 text-gray-500 max-w-[150px] truncate">
                                            {s.notes || <span className="text-gray-300 italic">—</span>}
                                        </td>
                                        <td className="p-3 px-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(s.id, s.full_name)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa khỏi danh sách thi"
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

export default EligibilityModal;
