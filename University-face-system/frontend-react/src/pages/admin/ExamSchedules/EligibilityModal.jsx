import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import api from '../../../services/api';

const EligibilityModal = ({ isOpen, onClose, schedule }) => {
    const [eligibleStudents, setEligibleStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [row, setRow] = useState(1);
    const [col, setCol] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && schedule) {
            fetchEligibility();
            api.get('/students?limit=1000').then(res => setAllStudents(res.data.data)).catch(console.error);
        }
    }, [isOpen, schedule]);

    const fetchEligibility = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/exams/eligibility?schedule_id=${schedule.id}&limit=1000`);
            setEligibleStudents(res.data.data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    if (!isOpen || !schedule) return null;

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return alert("Chọn sinh viên");
        try {
            await api.post('/exams/eligibility', {
                schedule_id: schedule.id,
                student_id: selectedStudent,
                seat_row: row,
                seat_col: col
            });
            fetchEligibility();
            setSelectedStudent('');
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi thêm SV');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/exams/eligibility/${id}`);
            fetchEligibility();
        } catch (error) {
            alert('Lỗi xóa');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Danh Sách Dự Thi</h3>
                        <p className="text-sm text-gray-500">{schedule.course_name} - Phòng {schedule.exam_room}</p>
                    </div>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                    <form onSubmit={handleAdd} className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold mb-1">Sinh Viên</label>
                            <select className="w-full p-2 border rounded-lg text-sm" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                                <option value="">-- Chọn sinh viên --</option>
                                {allStudents.map(s => <option key={s.id} value={s.id}>{s.student_code} - {s.full_name}</option>)}
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-semibold mb-1">Hàng</label>
                            <input type="number" min="1" max={schedule.seating_rows} className="w-full p-2 border rounded-lg text-sm" value={row} onChange={e => setRow(e.target.value)} />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-semibold mb-1">Cột</label>
                            <input type="number" min="1" max={schedule.seating_cols} className="w-full p-2 border rounded-lg text-sm" value={col} onChange={e => setCol(e.target.value)} />
                        </div>
                        <button type="submit" className="bg-primary-600 text-white p-2 px-4 rounded-lg flex items-center gap-1 hover:bg-primary-700">
                            <Plus size={16} /> Thêm
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? <p className="text-center text-gray-500">Đang tải...</p> : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b text-gray-500 text-sm">
                                    <th className="pb-2">Mã SV</th>
                                    <th className="pb-2">Họ Tên</th>
                                    <th className="pb-2">Vị trí ghế</th>
                                    <th className="pb-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {eligibleStudents.map(s => (
                                    <tr key={s.id} className="border-b border-gray-100">
                                        <td className="py-3 font-mono text-sm">{s.student_code}</td>
                                        <td className="py-3 font-medium">{s.full_name}</td>
                                        <td className="py-3 text-sm">Hàng {s.seat_row}, Cột {s.seat_col}</td>
                                        <td className="py-3 text-right">
                                            <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EligibilityModal;
