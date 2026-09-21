import React, { useState } from 'react';
import { Building2, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, Play, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import api from '../../services/api';

const TeacherExams = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const res = await api.get('/teacher/exams');
            if (res.data.success && res.data.data.length > 0) {
                setExams(res.data.data);
            } else {
                setExams(mockExamSupervisions);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách ca coi thi:', err);
            setExams(mockExamSupervisions);
        } finally {
            setLoading(false);
        }
    };

    const mockExamSupervisions = [
        {
            id: 201,
            title: 'Giữa kỳ · CS204 - Cấu trúc dữ liệu & Giải thuật',
            date: 'Thứ Tư, 16/10/2024',
            time: '09:00 – 10:30',
            room: 'Phòng A-201',
            candidates: 45,
            checkedIn: 42,
            type: 'Giữa kỳ',
            status: 'Upcoming'
        },
        {
            id: 202,
            title: 'Cuối kỳ · SE220 - Phát triển ứng dụng Web',
            date: 'Thứ Sáu, 25/10/2024',
            time: '13:30 – 15:30',
            room: 'Phòng Lab B-101',
            candidates: 42,
            checkedIn: 0,
            type: 'Cuối kỳ',
            status: 'Upcoming'
        }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Building2 size={24} className="text-purple-600" />
                        Quản Lý Phòng Thi & Coi Thi
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Quản lý các ca coi thi, xác thực số báo danh, sơ đồ chỗ ngồi và điểm danh thí sinh bằng AI
                    </p>
                </div>

                <button
                    onClick={() => navigate('/teacher/face-recognition')}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                >
                    <ShieldCheck size={18} />
                    <span>Mở Điểm Danh Phòng Thi AI</span>
                </button>
            </div>

            {/* Exam Cards Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-400 font-medium">Đang tải danh sách ca coi thi...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exams.map((exam) => (
                        <div key={exam.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4">
                            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                                    Ca coi thi · {exam.type}
                                </span>
                                <span className="text-xs font-bold text-slate-400 font-mono">
                                    {exam.checkedIn}/{exam.candidates} Thí sinh đã điểm danh
                                </span>
                            </div>

                            <div>
                                <h3 className="font-extrabold text-slate-900 text-base">{exam.title}</h3>
                                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                                    <p className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-500" /> {exam.date}</p>
                                    <p className="flex items-center gap-1.5"><Clock size={14} className="text-purple-500" /> {exam.time}</p>
                                    <p className="flex items-center gap-1.5"><MapPin size={14} className="text-purple-500" /> {exam.room}</p>
                                    <p className="flex items-center gap-1.5 font-bold text-emerald-600"><CheckCircle2 size={14} /> Chống gian lận AI: Bật</p>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => navigate(`/teacher/face-recognition?exam_schedule_id=${exam.id}`)}
                                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                                >
                                    <ShieldCheck size={16} /> Điểm danh phòng thi
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherExams;
