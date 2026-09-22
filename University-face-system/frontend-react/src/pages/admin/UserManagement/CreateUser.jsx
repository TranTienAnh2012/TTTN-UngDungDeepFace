import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { userService } from '../../../services/user.service';

const CreateUser = ({ isOpen, onClose, onUserCreated }) => {
    const [formData, setFormData] = useState({
        email: '', password: '', full_name: '', username: '', role: 'teacher'
    });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        
        if (!formData.password) {
            setFormError("Vui lòng nhập mật khẩu");
            return;
        }

        setIsSubmitting(true);
        try {
            await userService.createUser(formData);
            onUserCreated();
            onClose();
            setFormData({ email: '', password: '', full_name: '', username: '', role: 'teacher' });
        } catch (error) {
            setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo người dùng');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus size={20} className="text-primary-600" />
                        Thêm Người Dùng Mới
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
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Email *</label>
                        <input 
                            type="email" 
                            required
                            placeholder="user@university.edu.vn"
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Họ tên</label>
                            <input 
                                type="text"
                                placeholder="Nguyễn Văn A"
                                value={formData.full_name} 
                                onChange={e => setFormData({...formData, full_name: e.target.value})}
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Username</label>
                            <input 
                                type="text"
                                placeholder="nguyenvana"
                                value={formData.username} 
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Vai trò</label>
                        <select 
                            value={formData.role} 
                            onChange={e => setFormData({...formData, role: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        >
                            <option value="teacher">Giảng viên (Teacher)</option>
                            <option value="admin">Quản trị viên (Admin)</option>
                            <option value="user">Người dùng (User)</option>
                            <option value="manager">Quản lý (Manager)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mật khẩu *</label>
                        <input 
                            type="password" 
                            required
                            placeholder="••••••••"
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        />
                    </div>

                    <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-md shadow-primary-200 transition-all disabled:opacity-70">
                            {isSubmitting ? 'Đang tạo...' : 'Tạo mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUser;
