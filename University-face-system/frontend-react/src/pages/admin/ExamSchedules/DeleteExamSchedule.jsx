import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../../../services/api';

const DeleteExamSchedule = ({ isOpen, onClose, onDeleted, schedule }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !schedule) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        setError('');
        try {
            await api.delete(`/exams/schedules/${schedule.id}`);
            onDeleted();
            onClose();
        } catch (error) {
            setError(error.response?.data?.message || 'Lỗi xóa');
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={20} />
                        Xóa Lịch Thi
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-5">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                            {error}
                        </div>
                    )}
                    <p className="text-gray-600">
                        Bạn có chắc chắn muốn xóa lịch thi môn <span className="font-bold text-gray-900">{schedule.course_name || schedule.course_code}</span> - phòng <span className="font-bold text-gray-900">{schedule.exam_room}</span>?
                    </p>
                    <p className="text-sm text-red-500 mt-2 font-medium">
                        Hành động này sẽ xóa toàn bộ danh sách dự thi liên quan và không thể hoàn tác.
                    </p>

                    <div className="mt-6 flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Hủy
                        </button>
                        <button 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? 'Đang xóa...' : 'Xóa Lịch Thi'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteExamSchedule;
