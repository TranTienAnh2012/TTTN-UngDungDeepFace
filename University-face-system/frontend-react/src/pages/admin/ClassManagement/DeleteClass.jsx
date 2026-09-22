import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../../../services/api';

const DeleteClass = ({ isOpen, onClose, onSuccess, academicClass }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !academicClass) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.delete(`/academic-classes/${academicClass.id}`);
            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa lớp');
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
                        <h2 className="text-lg font-bold">Xác Nhận Xóa Lớp Sinh Viên</h2>
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
                        Bạn có chắc chắn muốn xóa lớp sinh viên{' '}
                        <strong className="text-gray-900 font-bold">{academicClass.class_name} ({academicClass.class_code})</strong>?
                    </p>

                    {(academicClass.student_count ?? academicClass.total_students ?? 0) > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                            ⚠️ Lớp này hiện đang có <b>{academicClass.student_count ?? academicClass.total_students ?? 0} sinh viên</b>. Bạn chỉ có thể xóa khi đã chuyển các sinh viên sang lớp khác hoặc xóa sinh viên.
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
                            disabled={loading || (academicClass.student_count ?? academicClass.total_students ?? 0) > 0}
                            className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-200 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Đang xóa...' : 'Xóa Lớp'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteClass;
