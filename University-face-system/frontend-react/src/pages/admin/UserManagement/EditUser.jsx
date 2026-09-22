import React, { useState, useEffect } from 'react';
import { X, UserCog } from 'lucide-react';
import { userService } from '../../../services/user.service';

const EditUser = ({ isOpen, onClose, onUserUpdated, user }) => {
    const [formData, setFormData] = useState({
        email: '', password: '', full_name: '', username: '', role: 'teacher'
    });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                full_name: user.full_name || '',
                username: user.username || '',
                role: user.role || 'teacher',
                password: '' // Don't prefill password
            });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        try {
            // Only send password if user entered a new one
            const payload = { ...formData };
            if (!payload.password) {
                delete payload.password;
            }

            await userService.updateUser(user.id, payload);
            onUserUpdated(); // Refresh list
            onClose(); // Close modal
        } catch (error) {
            setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UserCog size={20} className="text-primary-600" />
                        Chỉnh Sửa Người Dùng
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
                                value={formData.full_name} 
                                onChange={e => setFormData({...formData, full_name: e.target.value})}
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Username</label>
                            <input 
                                type="text"
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
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mật khẩu mới (Bỏ trống nếu giữ nguyên)</label>
                        <input 
                            type="password"
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
                            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUser;
