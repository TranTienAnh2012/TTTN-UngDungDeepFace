import React, { useState, useEffect } from 'react';
import { X, Layers, Building, Calendar, Code, CheckCircle } from 'lucide-react';
import api from '../../../services/api';

const CreateClass = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        class_code: '',
        class_name: '',
        faculty_id: '',
        academic_year: '2022-2026',
        status: 'active'
    });
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchFaculties();
        }
    }, [isOpen]);

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/faculties?limit=100');
            if (res.data.success) {
                setFaculties(res.data.data || []);
                if (res.data.data.length > 0 && !formData.faculty_id) {
                    setFormData(prev => ({ ...prev, faculty_id: res.data.data[0].id }));
                }
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách khoa:', err);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.class_code.trim() || !formData.class_name.trim() || !formData.faculty_id) {
            setError('Vui lòng điền đầy đủ các thông tin bắt buộc');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/academic-classes', formData);
            if (res.data.success) {
                onSuccess();
                onClose();
                setFormData({
                    class_code: '',
                    class_name: '',
                    faculty_id: faculties.length > 0 ? faculties[0].id : '',
                    academic_year: '2022-2026',
                    status: 'active'
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo lớp');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Layers size={20} />
                        </div>
                        <h2 className="text-lg font-bold">Thêm Lớp Sinh Viên Mới</h2>
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
                            <Building size={14} className="text-gray-400" />
                            Thuộc Khoa / Viện <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.faculty_id}
                            onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                            required
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                        >
                            <option value="">-- Chọn Khoa / Viện --</option>
                            {faculties.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.faculty_name} ({f.faculty_code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Code size={14} className="text-gray-400" />
                            Mã Lớp <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="VD: CNTT1-K15, DTVT2-K14..."
                            value={formData.class_code}
                            onChange={(e) => setFormData({ ...formData, class_code: e.target.value.toUpperCase() })}
                            required
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 uppercase shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Layers size={14} className="text-gray-400" />
                            Tên Lớp Đầy Đủ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="VD: Công Nghệ Thông Tin 1 - Khóa 15"
                            value={formData.class_name}
                            onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                            required
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Calendar size={14} className="text-gray-400" />
                                Niên Khóa
                            </label>
                            <input
                                type="text"
                                placeholder="VD: 2022-2026"
                                value={formData.academic_year}
                                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <CheckCircle size={14} className="text-gray-400" />
                                Trạng thái
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                            >
                                <option value="active">Đang học (Active)</option>
                                <option value="graduated">Đã tốt nghiệp</option>
                                <option value="archived">Lưu trữ</option>
                            </select>
                        </div>
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
                            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Đang tạo...' : 'Tạo Lớp'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClass;
