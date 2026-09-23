import React, { useState, useEffect } from 'react';
import { X, UserPlus, Building, Layers, Mail, Calendar, User, Code } from 'lucide-react';
import api from '../../../services/api';

const CreateStudent = ({ isOpen, onClose, onStudentCreated }) => {
    const [formData, setFormData] = useState({ 
        student_code: '', 
        full_name: '', 
        faculty_id: '',
        class_id: '',
        class_name: '', 
        date_of_birth: '', 
        email: '',
        gender: 'male'
    });

    const [faculties, setFaculties] = useState([]);
    const [academicClasses, setAcademicClasses] = useState([]);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFaculties();
            fetchClasses();
        }
    }, [isOpen]);

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/faculties?limit=100');
            if (res.data.success) {
                setFaculties(res.data.data || []);
            }
        } catch (err) {
            console.error('Lỗi khi tải khoa:', err);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/academic-classes?limit=100');
            if (res.data.success) {
                setAcademicClasses(res.data.data || []);
            }
        } catch (err) {
            console.error('Lỗi khi tải lớp:', err);
        }
    };

    if (!isOpen) return null;

    const handleClassChange = (classId) => {
        if (!classId) {
            setFormData(prev => ({ ...prev, class_id: '', class_name: '' }));
            return;
        }
        const cls = academicClasses.find(c => c.id === parseInt(classId));
        if (cls) {
            setFormData(prev => ({
                ...prev,
                class_id: cls.id,
                class_name: cls.class_code,
                faculty_id: cls.faculty_id || prev.faculty_id
            }));
        }
    };

    const handleFacultyChange = (facultyId) => {
        if (!facultyId) {
            setFormData(prev => ({ ...prev, faculty_id: '' }));
            return;
        }
        const f = faculties.find(item => item.id === parseInt(facultyId));
        if (f) {
            setFormData(prev => ({
                ...prev,
                faculty_id: f.id
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.student_code.trim() || !formData.full_name.trim()) {
            return setFormError('Vui lòng nhập đầy đủ Mã sinh viên và Họ tên');
        }

        setIsSubmitting(true);
        try {
            await api.post('/students', formData);
            onStudentCreated();
            onClose();
            setFormData({ 
                student_code: '', 
                full_name: '', 
                faculty_id: '',
                class_id: '',
                class_name: '', 
                date_of_birth: '', 
                email: '',
                gender: 'male'
            });
        } catch (error) {
            setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi thêm sinh viên');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter classes based on selected faculty (if any)
    const availableClasses = formData.faculty_id
        ? academicClasses.filter(c => c.faculty_id === parseInt(formData.faculty_id))
        : academicClasses;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus size={20} className="text-primary-600" />
                        Thêm Sinh Viên Mới
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white overflow-y-auto flex-1">
                    {formError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                                Mã Sinh Viên *
                            </label>
                            <input 
                                type="text" 
                                required 
                                placeholder="VD: SV001, B20DCCN001..."
                                value={formData.student_code} 
                                onChange={e => setFormData({...formData, student_code: e.target.value.toUpperCase()})}
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-bold focus:ring-2 focus:ring-primary-500 shadow-sm uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                                Giới tính
                            </label>
                            <select
                                value={formData.gender}
                                onChange={e => setFormData({...formData, gender: e.target.value})}
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm"
                            >
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                            Họ và Tên Sinh Viên *
                        </label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Nhập họ tên sinh viên đầy đủ..."
                            value={formData.full_name} 
                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm"
                        />
                    </div>

                    {/* Faculty Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <Building size={14} className="text-gray-400" />
                            Khoa / Viện Đào Tạo
                        </label>
                        <select
                            value={formData.faculty_id}
                            onChange={e => handleFacultyChange(e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm"
                        >
                            <option value="">-- Chọn Khoa / Viện (Tùy chọn) --</option>
                            {faculties.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.faculty_code} - {f.faculty_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Academic Class Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={14} className="text-gray-400" />
                            Lớp Sinh Viên Chính Quy
                        </label>
                        <select
                            value={formData.class_id}
                            onChange={e => handleClassChange(e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm"
                        >
                            <option value="">-- Chọn Lớp Chính Quy (Tùy chọn) --</option>
                            {availableClasses.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.class_code} - {c.class_name} ({c.faculty_code || 'Khoa'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                                Ngày Sinh
                            </label>
                            <input 
                                type="date"
                                value={formData.date_of_birth} 
                                onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                                Email Sinh Viên
                            </label>
                            <input 
                                type="email" 
                                placeholder="sinhvien@university.edu.vn"
                                value={formData.email || ''} 
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-3 border-t border-gray-100 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-md shadow-primary-200 transition-all disabled:opacity-70">
                            {isSubmitting ? 'Đang thêm...' : 'Thêm Sinh Viên'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStudent;
