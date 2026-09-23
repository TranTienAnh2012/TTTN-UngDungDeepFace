import React, { useState, useEffect } from 'react';
import { X, CalendarClock, Clock, Building2, Armchair, Eye } from 'lucide-react';
import api from '../../../services/api';
import SeatMatrixEditor from '../RoomManagement/SeatMatrixEditor';

const EditExamSchedule = ({ isOpen, onClose, onUpdated, schedule }) => {
    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [academicClasses, setAcademicClasses] = useState([]);
    const [selectedRoomObj, setSelectedRoomObj] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const [formData, setFormData] = useState({
        course_id: '',
        room_id: '',
        class_id: '',
        exam_room: '',
        exam_time: '',
        duration_minutes: 90,
        seating_rows: 6,
        seating_cols: 8,
        disabled_seats: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && schedule) {
            api.get('/courses?limit=1000').then(res => setCourses(res.data.data || [])).catch(console.error);
            api.get('/academic-classes?limit=1000').then(res => setAcademicClasses(res.data.data || [])).catch(console.error);
            api.get('/rooms?limit=1000').then(res => {
                const roomList = res.data.data || [];
                setRooms(roomList);
                if (schedule.room_id) {
                    const found = roomList.find(r => r.id === schedule.room_id);
                    if (found) setSelectedRoomObj(found);
                }
            }).catch(console.error);

            const formatDT = (d) => {
                if (!d) return '';
                const date = new Date(d);
                const offset = date.getTimezoneOffset() * 60000;
                return new Date(date.getTime() - offset).toISOString().slice(0, 16);
            };

            let disabled = [];
            try {
                if (typeof schedule.disabled_seats === 'string') {
                    disabled = JSON.parse(schedule.disabled_seats);
                } else if (Array.isArray(schedule.disabled_seats)) {
                    disabled = schedule.disabled_seats;
                }
            } catch {
                disabled = [];
            }

            setFormData({ 
                course_id: schedule.course_id, 
                room_id: schedule.room_id || '',
                class_id: schedule.class_id || '',
                exam_room: schedule.exam_room || '', 
                exam_time: formatDT(schedule.exam_time), 
                duration_minutes: schedule.duration_minutes || 90,
                seating_rows: schedule.seating_rows || 6,
                seating_cols: schedule.seating_cols || 8,
                disabled_seats: disabled
            });
        }
    }, [isOpen, schedule]);

    if (!isOpen || !schedule) return null;

    // Handle room change
    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        if (!roomId) {
            setSelectedRoomObj(null);
            setFormData(prev => ({ ...prev, room_id: '' }));
            return;
        }

        const room = rooms.find(r => r.id === parseInt(roomId));
        if (room) {
            setSelectedRoomObj(room);
            setFormData(prev => ({
                ...prev,
                room_id: room.id,
                exam_room: `${room.room_code} - ${room.room_name}`,
                seating_rows: room.seating_rows,
                seating_cols: room.seating_cols,
                disabled_seats: room.disabled_seats || []
            }));
        }
    };

    // Calculate end time
    const getEstimatedEndTime = () => {
        if (!formData.exam_time) return null;
        try {
            const start = new Date(formData.exam_time);
            const end = new Date(start.getTime() + (formData.duration_minutes || 90) * 60000);
            return end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' (' + end.toLocaleDateString('vi-VN') + ')';
        } catch {
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/exams/schedules/${schedule.id}`, formData);
            onUpdated();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi cập nhật lịch thi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const endTimeDisplay = getEstimatedEndTime();

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <CalendarClock size={20} className="text-primary-600" />
                            Sửa Lịch Thi
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Cập nhật môn thi, phòng thi và thời lượng ca thi</p>
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
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm" 
                            value={formData.course_id} 
                            onChange={e => setFormData({...formData, course_id: e.target.value})}
                        >
                            <option value="" className="text-gray-500">-- Chọn môn thi --</option>
                            {courses.map(c => <option key={c.id} value={c.id} className="text-gray-900">{c.course_code} - {c.course_name}</option>)}
                        </select>
                    </div>

                    {/* Academic Class Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                            Lớp Dự Thi Chính Quy (Tùy chọn)
                        </label>
                        <select
                            value={formData.class_id}
                            onChange={e => setFormData({...formData, class_id: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm"
                        >
                            <option value="" className="text-gray-500">-- Chưa gắn lớp (Tự nạp danh sách dự thi sau) --</option>
                            {academicClasses.map(c => (
                                <option key={c.id} value={c.id} className="text-gray-900">
                                    {c.class_code} - {c.class_name} ({c.faculty_name} • {c.student_count || 0} SV)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Room Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Chọn Phòng Thi (Từ danh mục)
                            </label>
                            {selectedRoomObj && (
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                    <Eye size={13} /> {showPreview ? 'Ẩn sơ đồ' : 'Xem sơ đồ ghế'}
                                </button>
                            )}
                        </div>
                        <select
                            value={formData.room_id}
                            onChange={handleRoomChange}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        >
                            <option value="" className="text-gray-500">-- Chọn phòng thi có sẵn --</option>
                            {rooms.map(r => (
                                <option key={r.id} value={r.id} className="text-gray-900">
                                    [{r.room_code}] {r.room_name} ({r.building || 'Khu học'} - {r.seating_rows}x{r.seating_cols} = {r.capacity} chỗ)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Room Preview */}
                    {selectedRoomObj && showPreview && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                                <span>Sơ đồ phòng: {selectedRoomObj.room_code}</span>
                                <span className="text-indigo-600">{selectedRoomObj.capacity} chỗ khả dụng</span>
                            </div>
                            <SeatMatrixEditor
                                rows={selectedRoomObj.seating_rows}
                                cols={selectedRoomObj.seating_cols}
                                disabledSeats={selectedRoomObj.disabled_seats}
                                readOnly={true}
                            />
                        </div>
                    )}

                    {/* Fallback Custom Room Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tên Phòng Thi Hiển Thị *</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Ví dụ: Phòng 401 - Tòa A" 
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm" 
                            value={formData.exam_room} 
                            onChange={e => setFormData({...formData, exam_room: e.target.value})} 
                        />
                    </div>

                    {/* Time & Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Giờ Bắt Đầu Thi *</label>
                            <input 
                                type="datetime-local" 
                                required 
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-primary-500 shadow-sm" 
                                value={formData.exam_time} 
                                onChange={e => setFormData({...formData, exam_time: e.target.value})} 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Thời Lượng (Phút)</label>
                            <div className="space-y-1.5">
                                <input 
                                    type="number"
                                    min="15"
                                    max="300"
                                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-bold focus:ring-2 focus:ring-primary-500 shadow-sm" 
                                    value={formData.duration_minutes} 
                                    onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 60})} 
                                />
                                <div className="flex gap-1.5">
                                    {[45, 60, 90, 120].map(mins => (
                                        <button
                                            key={mins}
                                            type="button"
                                            onClick={() => setFormData({...formData, duration_minutes: mins})}
                                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                                                formData.duration_minutes === mins 
                                                    ? 'bg-primary-600 text-white border-primary-600' 
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                                            }`}
                                        >
                                            {mins}p
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calculated End Time Badge */}
                    {endTimeDisplay && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-medium flex items-center gap-1.5">
                                <Clock size={15} className="text-indigo-600" /> Dự kiến kết thúc:
                            </span>
                            <span className="text-indigo-700 font-bold">{endTimeDisplay}</span>
                        </div>
                    )}

                    {/* Matrix Row/Col Dimensions */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Số Hàng *</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="20" 
                                required 
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-bold focus:ring-2 focus:ring-primary-500 shadow-sm" 
                                value={formData.seating_rows} 
                                onChange={e => setFormData({...formData, seating_rows: parseInt(e.target.value) || 1})} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Số Cột *</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="20" 
                                required 
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-bold focus:ring-2 focus:ring-primary-500 shadow-sm" 
                                value={formData.seating_cols} 
                                onChange={e => setFormData({...formData, seating_cols: parseInt(e.target.value) || 1})} 
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

export default EditExamSchedule;
