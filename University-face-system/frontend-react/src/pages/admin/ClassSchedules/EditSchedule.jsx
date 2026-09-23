import React, { useState, useEffect } from 'react';
import { X, CalendarClock, Clock, Building2, Sparkles } from 'lucide-react';
import api from '../../../services/api';

const EditSchedule = ({ isOpen, onClose, onUpdated, schedule }) => {
    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [academicClasses, setAcademicClasses] = useState([]);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedShiftId, setSelectedShiftId] = useState('');

    const [formData, setFormData] = useState({ 
        course_id: '', 
        room_id: '',
        class_id: '',
        shift_id: '',
        room_name: '', 
        teacher_name: '',
        start_time: '', 
        end_time: '' 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && schedule) {
            api.get('/courses?limit=1000').then(res => setCourses(res.data.data || [])).catch(console.error);
            api.get('/rooms?limit=1000').then(res => setRooms(res.data.data || [])).catch(console.error);
            api.get('/shifts').then(res => setShifts(res.data.data || [])).catch(console.error);
            api.get('/academic-classes?limit=1000').then(res => setAcademicClasses(res.data.data || [])).catch(console.error);

            const formatDT = (d) => {
                if (!d) return '';
                const date = new Date(d);
                const offset = date.getTimezoneOffset() * 60000;
                return new Date(date.getTime() - offset).toISOString().slice(0, 16);
            };

            setFormData({ 
                course_id: schedule.course_id, 
                room_id: schedule.room_id || '',
                class_id: schedule.class_id || '',
                shift_id: schedule.shift_id || '',
                room_name: schedule.room_name || '', 
                teacher_name: schedule.teacher_name || '',
                start_time: formatDT(schedule.start_time), 
                end_time: formatDT(schedule.end_time) 
            });

            if (schedule.start_time) {
                setSelectedDate(new Date(schedule.start_time).toISOString().slice(0, 10));
            }
            if (schedule.shift_id) {
                setSelectedShiftId(schedule.shift_id);
            }
        }
    }, [isOpen, schedule]);

    if (!isOpen || !schedule) return null;

    // Handle shift selection
    const handleShiftChange = (shiftId, date = selectedDate) => {
        setSelectedShiftId(shiftId);
        if (!shiftId) {
            setFormData(prev => ({ ...prev, shift_id: '' }));
            return;
        }

        const shift = shifts.find(s => s.id === parseInt(shiftId));
        if (shift && date) {
            const startTimeStr = `${date}T${shift.start_time.slice(0, 5)}`;
            const endTimeStr = `${date}T${shift.end_time.slice(0, 5)}`;
            setFormData(prev => ({
                ...prev,
                shift_id: shift.id,
                start_time: startTimeStr,
                end_time: endTimeStr
            }));
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        if (selectedShiftId) {
            handleShiftChange(selectedShiftId, date);
        }
    };

    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        if (!roomId) {
            setFormData(prev => ({ ...prev, room_id: '' }));
            return;
        }
        const room = rooms.find(r => r.id === parseInt(roomId));
        if (room) {
            setFormData(prev => ({
                ...prev,
                room_id: room.id,
                room_name: `${room.room_code} - ${room.room_name}`
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.course_id || !formData.start_time || !formData.end_time) {
            return alert('Vui lòng chọn Môn học, Thời gian bắt đầu và kết thúc');
        }

        setIsSubmitting(true);
        try {
            await api.put(`/classes/schedules/${schedule.id}`, formData);
            onUpdated();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi cập nhật lịch học');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <CalendarClock size={20} className="text-primary-600" />
                            Sửa Lịch Học
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Cập nhật môn học, phòng học hoặc ca học</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white overflow-y-auto flex-1">
                    {/* Course Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Môn Học *</label>
                        <select 
                            required 
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm" 
                            value={formData.course_id} 
                            onChange={e => setFormData({...formData, course_id: e.target.value})}
                        >
                            <option value="" className="text-gray-500">-- Chọn môn --</option>
                            {courses.map(c => <option key={c.id} value={c.id} className="text-gray-900">{c.course_code} - {c.course_name}</option>)}
                        </select>
                    </div>

                    {/* Academic Class Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                            Lớp Sinh Viên Chính Quy (Tùy chọn)
                        </label>
                        <select
                            value={formData.class_id}
                            onChange={e => setFormData({...formData, class_id: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm"
                        >
                            <option value="" className="text-gray-500">-- Không gắn lớp cụ thể (Hoặc chọn lớp) --</option>
                            {academicClasses.map(c => (
                                <option key={c.id} value={c.id} className="text-gray-900">
                                    {c.class_code} - {c.class_name} ({c.faculty_name} • {c.student_count || 0} SV)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Room Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                            Phòng Học (Từ danh mục)
                        </label>
                        <select
                            value={formData.room_id}
                            onChange={handleRoomChange}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm"
                        >
                            <option value="" className="text-gray-500">-- Chọn phòng học có sẵn --</option>
                            {rooms.map(r => (
                                <option key={r.id} value={r.id} className="text-gray-900">
                                    [{r.room_code}] {r.room_name} ({r.building || 'Khu học'} - {r.capacity} chỗ)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tên Phòng Hiển Thị *</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Ví dụ: Phòng 302 - Tòa C" 
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm" 
                            value={formData.room_name} 
                            onChange={e => setFormData({...formData, room_name: e.target.value})} 
                        />
                    </div>

                    {/* Quick Shift Selection Section */}
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-indigo-600" /> Chọn nhanh theo Ca học:
                            </span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => handleDateChange(e.target.value)}
                                className="text-xs px-2 py-1 rounded-lg border border-indigo-200 bg-white text-gray-900 font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {shifts.map(s => {
                                const isSelected = selectedShiftId === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleShiftChange(s.id)}
                                        className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                                                : 'bg-white text-gray-800 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 font-medium'
                                        }`}
                                    >
                                        <div className="font-bold leading-tight">{s.shift_name}</div>
                                        <div className={`text-[11px] mt-1 ${isSelected ? 'text-indigo-100' : 'text-gray-500'}`}>
                                            {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Start Time & End Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Bắt đầu *</label>
                            <input 
                                type="datetime-local" 
                                required 
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-primary-500 shadow-sm" 
                                value={formData.start_time} 
                                onChange={e => {
                                    setFormData({...formData, start_time: e.target.value});
                                    setSelectedShiftId('');
                                }} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Kết thúc *</label>
                            <input 
                                type="datetime-local" 
                                required 
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-primary-500 shadow-sm" 
                                value={formData.end_time} 
                                onChange={e => {
                                    setFormData({...formData, end_time: e.target.value});
                                    setSelectedShiftId('');
                                }} 
                            />
                        </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-md shadow-primary-200 transition-all disabled:opacity-70"
                        >
                            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSchedule;
