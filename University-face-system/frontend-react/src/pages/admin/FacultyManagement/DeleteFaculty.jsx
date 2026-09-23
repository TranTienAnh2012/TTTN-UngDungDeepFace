import React, { useState } from 'react';
import { AlertTriangle, X, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

const DeleteFaculty = ({ isOpen, onClose, onSuccess, faculty }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !faculty) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.delete(`/faculties/${faculty.id}`);
            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa khoa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <AlertTriangle size={20} />
                        </div>
                        <h2 className="text-lg font-bold">Xác Nhận Xóa Khoa</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <p className="text-gray-700 text-sm leading-relaxed">
                        Bạn có chắc chắn muốn xóa khoa/viện{' '}
                        <strong className="text-gray-900 font-bold">{faculty.faculty_name} ({faculty.faculty_code})</strong>?
                    </p>

                    {(faculty.class_count > 0 || faculty.student_count > 0) && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 text-amber-600 shrink-0" />
                            <span>Khoa này hiện đang có <b>{faculty.class_count || 0} lớp</b> và <b>{faculty.student_count || 0} sinh viên</b>. Bạn chỉ có thể xóa khi đã chuyển hết các lớp và sinh viên sang khoa khác.</span>
                        </div>
                    )}

                    <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading || faculty.class_count > 0 || faculty.student_count > 0}
                            className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-200 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Đang xóa...' : 'Xóa Khoa'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteFaculty;
