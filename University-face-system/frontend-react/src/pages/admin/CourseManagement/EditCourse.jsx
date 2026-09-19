import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../../services/api';

const EditCourse = ({ isOpen, onClose, onCourseUpdated, course }) => {
    const [formData, setFormData] = useState({ course_code: '', course_name: '' });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (course) {
            setFormData({
                course_code: course.course_code,
                course_name: course.course_name
            });
            setFormError('');
        }
    }, [course, isOpen]);

    if (!isOpen || !course) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        try {
            await api.put(`/courses/${course.id}`, formData);
            onCourseUpdated();
            onClose();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Sửa Môn Học</h3>
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

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã Môn Học *</label>
                        <input 
                            type="text" required
                            value={formData.course_code} onChange={e => setFormData({...formData, course_code: e.target.value.toUpperCase()})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên Môn Học *</label>
                        <input 
                            type="text" required
                            value={formData.course_name} onChange={e => setFormData({...formData, course_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white font-medium hover:bg-primary-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCourse;
