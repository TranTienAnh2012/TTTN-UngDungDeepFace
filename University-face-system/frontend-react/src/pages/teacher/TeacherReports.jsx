import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Filter, Calendar, BarChart3, PieChart, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import api from '../../services/api';

const TeacherReports = () => {
    const [selectedMonth, setSelectedMonth] = useState('10/2024');
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/teacher-summary');
            if (res.data.success) {
                setSummaryData(res.data.data);
            }
        } catch (err) {
            console.error('Lỗi khi tải báo cáo điểm danh:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        window.open('http://localhost:5000/api/reports/export', '_blank');
    };

    const reportCards = summaryData ? [
        { title: 'Tổng lượt điểm danh', count: summaryData.total_attendance, percent: 'Real-time', color: 'text-indigo-600 bg-indigo-50' },
        { title: 'Đúng giờ (Đủ đầu/cuối)', count: summaryData.complete_attendance, percent: '100%', color: 'text-emerald-600 bg-emerald-50' },
        { title: 'Chỉ check-in đầu giờ', count: summaryData.partial_attendance, percent: 'Cần check-out', color: 'text-amber-600 bg-amber-50' },
        { title: 'Vắng mặt không lý do', count: summaryData.absent_attendance, percent: 'Cần lưu ý', color: 'text-rose-600 bg-rose-50' }
    ] : [
        { title: 'Tổng lượt điểm danh', count: '1,420', percent: '+8.4%', color: 'text-indigo-600 bg-indigo-50' },
        { title: 'Đúng giờ (Đủ đầu/cuối giờ)', count: '1,328', percent: '93.5%', color: 'text-emerald-600 bg-emerald-50' },
        { title: 'Đi muộn / Về sớm', count: '62', percent: '4.3%', color: 'text-amber-600 bg-amber-50' },
        { title: 'Vắng mặt không lý do', count: '30', percent: '2.2%', color: 'text-rose-600 bg-rose-50' }
    ];

    const courseSummaryList = summaryData?.courseSummary || [
        { course: 'CS101 - Nhập môn Khoa học máy tính', students: '45 SV', sessions: '12 buổi', rate: '95.8%', absent_avg: '1.8 SV/buổi', rating: 'Rất tốt' },
        { course: 'CS204 - Cấu trúc dữ liệu & Giải thuật', students: '40 SV', sessions: '10 buổi', rate: '93.2%', absent_avg: '2.7 SV/buổi', rating: 'Tốt' },
        { course: 'SE220 - Phát triển ứng dụng Web', students: '43 SV', sessions: '8 buổi', rate: '92.0%', absent_avg: '3.4 SV/buổi', rating: 'Đạt yêu cầu' }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                        <FileSpreadsheet size={24} className="text-indigo-600" />
                        Báo Cáo & Thống Kê Điểm Danh
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Tổng hợp tỷ lệ chuyên cần, lịch sử vắng học và xuất báo cáo điểm danh giảng dạy
                    </p>
                </div>

                <button
                    onClick={handleExport}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                >
                    <Download size={18} />
                    <span>Xuất Báo Cáo Excel (.CSV)</span>
                </button>
            </div>

            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportCards.map((item, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-slate-900">{item.count}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.color}`}>
                                {item.percent}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Report Content Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4 border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">Tổng hợp chuyên cần theo môn học</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Tháng:</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
                        >
                            <option value="10/2024">Tháng 10 / 2024</option>
                            <option value="09/2024">Tháng 09 / 2024</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                                <th className="py-3 px-4">Môn học</th>
                                <th className="py-3 px-4">Sĩ số</th>
                                <th className="py-3 px-4">Số buổi đã học</th>
                                <th className="py-3 px-4">Tỷ lệ có mặt</th>
                                <th className="py-3 px-4">Vắng trung bình</th>
                                <th className="py-3 px-4 text-right">Đánh giá</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {courseSummaryList.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.course}</td>
                                    <td className="py-3.5 px-4 font-mono">{item.students}</td>
                                    <td className="py-3.5 px-4 font-mono">{item.sessions}</td>
                                    <td className="py-3.5 px-4 font-bold text-emerald-600">{item.rate}</td>
                                    <td className="py-3.5 px-4 font-mono text-slate-600">{item.absent_avg}</td>
                                    <td className="py-3.5 px-4 text-right">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            item.rating === 'Rất tốt' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                            {item.rating}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherReports;
