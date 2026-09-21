import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../../services/api';

const CreateExamSchedule = ({ isOpen, onClose, onCreated }) => {
    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [formData, setFormData] = useState({ course_id: '', exam_room: '', exam_time: '', seating_rows: 5, seating_cols: 6 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            Promise.all([
                api.get('/courses'),
                api.get('/structure/rooms')
            ]).then(([resCourse, resRoom]) => {
                if (resCourse.data.success) setCourses(resCourse.data.data);
                if (resRoom.data.success) setRooms(resRoom.data.data);
            }).catch(console.error);
        }
    }, [isOpen]);

    const handleRoomSelect = (roomName) => {
        const selectedRoom = rooms.find(r => r.room_name === roomName);
        setFormData(prev => ({
            ...prev,
            exam_room: roomName,
            seating_rows: selectedRoom ? selectedRoom.seating_rows : prev.seating_rows,
            seating_cols: selectedRoom ? selectedRoom.seating_cols : prev.seating_cols
        }));
    };

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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Thêm Lịch Thi</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Môn Học *</label>
                        <select required className="w-full p-2 border rounded-xl bg-white text-sm" value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})}>
                            <option value="">-- Chọn môn thi --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phòng Thi *</label>
                        <select 
                            required 
                            className="w-full p-2 border rounded-xl bg-white text-sm" 
                            value={formData.exam_room} 
                            onChange={e => handleRoomSelect(e.target.value)}
                        >
                            <option value="">-- Chọn phòng thi --</option>
                            {rooms.map(r => (
                                <option key={r.id} value={r.room_name}>
                                    {r.room_code} - {r.room_name} ({r.building || 'Nhà B'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Giờ Thi *</label>
                        <input type="datetime-local" required className="w-full p-2 border rounded-xl text-sm" value={formData.exam_time} onChange={e => setFormData({...formData, exam_time: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Số Hàng *</label>
                            <input type="number" min="1" max="20" required className="w-full p-2 border rounded-xl text-sm" value={formData.seating_rows} onChange={e => setFormData({...formData, seating_rows: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Số Cột *</label>
                            <input type="number" min="1" max="20" required className="w-full p-2 border rounded-xl text-sm" value={formData.seating_cols} onChange={e => setFormData({...formData, seating_cols: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-gray-100 rounded-xl text-sm">Hủy</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium">{isSubmitting ? 'Đang lưu...' : 'Thêm'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateExamSchedule;

