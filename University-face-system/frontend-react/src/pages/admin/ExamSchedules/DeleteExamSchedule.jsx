import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../../services/api';

const DeleteExamSchedule = ({ isOpen, onClose, onDeleted, schedule }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen || !schedule) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/exams/schedules/${schedule.id}`);
            onDeleted();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi xóa');
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
                <h3 className="text-lg font-bold text-red-600 mb-3">Xóa Lịch Thi</h3>
                <p>Bạn có chắc chắn muốn xóa lịch thi môn {schedule.course_code} - phòng {schedule.exam_room}?</p>
                <div className="mt-5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">Hủy</button>
                    <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-xl">{isDeleting ? 'Đang xóa...' : 'Xóa'}</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteExamSchedule;
