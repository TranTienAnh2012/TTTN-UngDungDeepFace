import React, { useState } from 'react';
import { Settings, User, Key, Bell, Shield, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TeacherSettings = () => {
    const { user } = useAuth();
    const [savedNotice, setSavedNotice] = useState(false);

    const [form, setForm] = useState({
        full_name: user?.full_name || 'Trần Ngọc Linh',
        email: user?.email || 'linh.tn@university.edu.vn',
        phone: '0988 123 456',
        department: 'Khoa Công nghệ thông tin',
        notify_class_start: true,
        notify_absence_warning: true
    });

    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                full_name: user.full_name || prev.full_name,
                email: user.email || prev.email
            }));
        }
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
    };

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Settings size={24} className="text-indigo-600" />
                    Cài Đặt Tài Khoản Giảng Viên
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                    Quản lý thông tin cá nhân, mật khẩu và tùy chọn thông báo tự động
                </p>
            </div>

            {savedNotice && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in zoom-in-95">
                    <CheckCircle size={18} className="text-emerald-600" />
                    Đã lưu thay đổi cài đặt thành công!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Profile Info */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
                        <User size={18} className="text-indigo-600" />
                        Thông tin cá nhân
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ và tên giảng viên</label>
                            <input
                                type="text"
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email trường</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số điện thoại</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khoa / Đơn vị</label>
                            <input
                                type="text"
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Notification Preferences */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
                        <Bell size={18} className="text-indigo-600" />
                        Tùy chọn thông báo
                    </h3>

                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                            <div>
                                <p className="font-bold text-slate-900 text-xs">Nhắc nhở ca giảng dạy sắp bắt đầu</p>
                                <p className="text-[11px] text-slate-400">Gửi thông báo trước 30 phút khi ca học diễn ra</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.notify_class_start}
                                onChange={(e) => setForm({ ...form, notify_class_start: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                            <div>
                                <p className="font-bold text-slate-900 text-xs">Cảnh báo sinh viên vắng mặt nhiều</p>
                                <p className="text-[11px] text-slate-400">Thông báo khi có sinh viên nghỉ quá 20% tổng số buổi</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.notify_absence_warning}
                                onChange={(e) => setForm({ ...form, notify_absence_warning: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                            />
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        <span>Lưu Cài Đặt</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TeacherSettings;
