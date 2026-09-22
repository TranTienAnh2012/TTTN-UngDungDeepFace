import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../../services/api';

const CreateExamSchedule = ({ isOpen, onClose, onCreated }) => {
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({ course_id: '', exam_room: '', exam_time: '', end_time: '', seating_rows: 5, seating_cols: 6 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            api.get('/courses').then(res => setCourses(res.data.data)).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/exams/schedules', formData);
            onCreated();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Thêm Lịch Thi</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Môn Học *</label>
                        <select required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm shadow-sm" value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})}>
                            <option value="">-- Chọn môn --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phòng Thi *</label>
                        <input type="text" required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm shadow-sm" value={formData.exam_room} onChange={e => setFormData({...formData, exam_room: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Giờ Bắt Đầu *</label>
                            <input type="datetime-local" required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm shadow-sm" value={formData.exam_time} onChange={e => setFormData({...formData, exam_time: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Giờ Kết Thúc</label>
                            <input type="datetime-local" className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm shadow-sm" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Số Hàng *</label>
                            <input type="number" min="1" max="20" required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm shadow-sm" value={formData.seating_rows} onChange={e => setFormData({...formData, seating_rows: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Số Cột *</label>
                            <input type="number" min="1" max="20" required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm shadow-sm" value={formData.seating_cols} onChange={e => setFormData({...formData, seating_cols: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-gray-100 rounded-xl text-gray-700 font-semibold text-sm transition-colors">Hủy</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors">{isSubmitting ? 'Đang lưu...' : 'Thêm'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateExamSchedule;
