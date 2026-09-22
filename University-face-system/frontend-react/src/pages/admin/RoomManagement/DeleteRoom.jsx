import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../../../services/api';

const DeleteRoom = ({ isOpen, onClose, onDeleted, room }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !room) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        setError('');
        try {
            const res = await api.delete(`/rooms/${room.id}`);
            if (res.data.success) {
                onDeleted();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa phòng');
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={20} />
                        Xóa Phòng Học / Phòng Thi
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-5">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-200">
                            {error}
                        </div>
                    )}
                    <p className="text-gray-600">
                        Bạn có chắc chắn muốn xóa phòng <span className="font-bold text-gray-900">{room.room_code} - {room.room_name}</span>?
                    </p>
                    <p className="text-sm text-red-500 mt-2 font-medium">
                        Lưu ý: Chỉ có thể xóa phòng nếu phòng này chưa từng được xếp trong bất kỳ lịch học hoặc lịch thi nào.
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
                            {isDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteRoom;
