import React, { useState } from 'react';
import { X, Building, AlignLeft, Code } from 'lucide-react';
import api from '../../../services/api';

const CreateFaculty = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        faculty_code: '',
        faculty_name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.faculty_code.trim() || !formData.faculty_name.trim()) {
            setError('Vui lòng nhập đầy đủ mã khoa và tên khoa');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/faculties', formData);
            if (res.data.success) {
                onSuccess();
                onClose();
                setFormData({ faculty_code: '', faculty_name: '', description: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo khoa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 bg-[#175b9f] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Building size={20} />
                        </div>
                        <h2 className="text-lg font-bold">Thêm Khoa / Viện Mới</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Code size={14} className="text-gray-400" />
                            Mã Khoa <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="VD: CNTT, DTVT, KT..."
                            value={formData.faculty_code}
                            onChange={(e) => setFormData({ ...formData, faculty_code: e.target.value.toUpperCase() })}
                            required
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Building size={14} className="text-gray-400" />
                            Tên Khoa / Viện <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="VD: Khoa Công Nghệ Thông Tin"
                            value={formData.faculty_name}
                            onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
                            required
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <AlignLeft size={14} className="text-gray-400" />
                            Mô tả
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Thông tin giới thiệu, văn phòng khoa..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Đang lưu...' : 'Thêm Khoa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFaculty;
