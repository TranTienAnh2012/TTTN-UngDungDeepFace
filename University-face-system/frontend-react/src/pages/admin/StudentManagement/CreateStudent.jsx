import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../../services/api';

const CreateStudent = ({ isOpen, onClose, onStudentCreated }) => {
    const [formData, setFormData] = useState({ 
        student_code: '', full_name: '', class_name: '', date_of_birth: '' 
    });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        try {
            await api.post('/students', formData);
            onStudentCreated();
            onClose();
            setFormData({ student_code: '', full_name: '', class_name: '', date_of_birth: '' });
        } catch (error) {
            setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi thêm sinh viên');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Thêm Sinh Viên Mới</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {formError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã SV *</label>
                            <input 
                                type="text" required placeholder="VD: SV001"
                                value={formData.student_code} onChange={e => setFormData({...formData, student_code: e.target.value.toUpperCase()})}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lớp</label>
                            <input 
                                type="text" placeholder="VD: CNTT01"
                                value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và Tên *</label>
                        <input 
                            type="text" required placeholder="Nhập họ tên sinh viên..."
                            value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày sinh</label>
                        <input 
                            type="date"
                            value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white font-medium hover:bg-primary-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Đang thêm...' : 'Thêm Mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStudent;
