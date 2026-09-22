import React, { useState } from 'react';
import { X, BookPlus } from 'lucide-react';
import api from '../../../services/api';

const CreateCourse = ({ isOpen, onClose, onCourseCreated }) => {
    const [formData, setFormData] = useState({ course_code: '', course_name: '', credits: 3 });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        try {
            await api.post('/courses', formData);
            onCourseCreated();
            onClose();
            setFormData({ course_code: '', course_name: '', credits: 3 });
        } catch (error) {
            setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi thêm môn học');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BookPlus size={20} className="text-primary-600" />
                        Thêm Môn Học Mới
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white">
                    {formError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
                            {formError}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mã Môn Học *</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="VD: COMP101"
                            value={formData.course_code} 
                            onChange={e => setFormData({...formData, course_code: e.target.value.toUpperCase()})}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-bold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tên Môn Học *</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Nhập tên môn học..."
                            value={formData.course_name} 
                            onChange={e => setFormData({...formData, course_name: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Số Tín Chỉ</label>
                        <input 
                            type="number" 
                            min="1"
                            max="10"
                            value={formData.credits || 3} 
                            onChange={e => setFormData({...formData, credits: parseInt(e.target.value) || 3})}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-bold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        />
                    </div>

                    <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-md shadow-primary-200 transition-all disabled:opacity-70">
                            {isSubmitting ? 'Đang thêm...' : 'Thêm Mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCourse;
