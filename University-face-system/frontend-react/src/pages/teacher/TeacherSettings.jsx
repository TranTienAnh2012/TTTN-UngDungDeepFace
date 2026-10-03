import React, { useState, useEffect } from 'react';
import { 
    Settings, User, Key, Bell, Shield, Save, CheckCircle, 
    Camera, Volume2, Clock, Sparkles, Check, Lock, Mail, Phone, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TeacherSettings = () => {
    const { user } = useAuth();
    const [savedNotice, setSavedNotice] = useState('');
    const [activeTab, setActiveTab] = useState('profile');

    const [form, setForm] = useState({
        full_name: user?.full_name || 'Nguyễn Thành Nhân',
        email: user?.email || 'nhan.nt@university.edu.vn',
        phone: '0988 123 456',
        department: 'Khoa Công nghệ thông tin',
        title: 'Giảng viên chính',
        
        // Attendance Camera Settings
        defaultMode: 'check_in',
        soundNotification: true,
        autoNextStudent: true,

        // Notifications
        notify_class_start: true,
        notify_absence_warning: true,

        // Security
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem('app_teacher_settings');
        if (saved) {
            try {
                setForm(prev => ({ ...prev, ...JSON.parse(saved) }));
            } catch (e) {
                console.error('Lỗi đọc teacher settings:', e);
            }
        } else if (user) {
            setForm(prev => ({
                ...prev,
                full_name: user.full_name || prev.full_name,
                email: user.email || prev.email
            }));
        }
    }, [user]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (form.newPassword && form.newPassword !== form.confirmPassword) {
            setSavedNotice('⚠️ Mật khẩu mới và xác nhận mật khẩu không khớp!');
            return;
        }

        localStorage.setItem('app_teacher_settings', JSON.stringify(form));
        setSavedNotice('✅ Đã lưu cài đặt giảng viên thành công!');
        setTimeout(() => setSavedNotice(''), 4000);
    };

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-300 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Settings size={24} className="text-[#175b9f]" />
                        Cài Đặt Tài Khoản Giảng Viên
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Quản lý thông tin cá nhân, cài đặt AI Camera điểm danh và mật khẩu đăng nhập
                    </p>
                </div>

                <button
                    onClick={handleSubmit}
                    className="px-5 py-2.5 bg-[#175b9f] hover:bg-[#12487f] text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs"
                >
                    <Save size={16} />
                    <span>Lưu Cài Đặt</span>
                </button>
            </div>

            {savedNotice && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in zoom-in-95 ${
                    savedNotice.includes('⚠️') ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                    <CheckCircle size={18} className={savedNotice.includes('⚠️') ? 'text-amber-600' : 'text-emerald-600'} />
                    {savedNotice}
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 w-full sm:w-fit overflow-x-auto">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'profile' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <User size={15} />
                    <span>Thông Tin Cá Nhân</span>
                </button>
                <button
                    onClick={() => setActiveTab('camera')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'camera' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Camera size={15} />
                    <span>Điểm Danh &amp; AI Camera</span>
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'notifications' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Bell size={15} />
                    <span>Thông Báo</span>
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'security' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Key size={15} />
                    <span>Mật Khẩu &amp; Bảo Mật</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* TAB 1: Profile Info */}
                {activeTab === 'profile' && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
                            <User size={18} className="text-[#175b9f]" />
                            Thông tin cá nhân giảng viên
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ và tên giảng viên</label>
                                <input
                                    type="text"
                                    value={form.full_name}
                                    onChange={(e) => handleChange('full_name', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email trường</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số điện thoại</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khoa / Đơn vị công tác</label>
                                <input
                                    type="text"
                                    value={form.department}
                                    onChange={(e) => handleChange('department', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: Camera & Attendance Settings */}
                {activeTab === 'camera' && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
                            <Camera size={18} className="text-[#175b9f]" />
                            Cấu hình Camera &amp; Nhận diện điểm danh AI
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Chế độ điểm danh mặc định khi mở camera</label>
                                <select
                                    value={form.defaultMode}
                                    onChange={(e) => handleChange('defaultMode', e.target.value)}
                                    className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 outline-none"
                                >
                                    <option value="check_in">🟢 Point Check-in Đầu giờ</option>
                                    <option value="check_out">🔵 Point Check-out Cuối giờ</option>
                                </select>
                            </div>

                            <div className="pt-2 divide-y divide-slate-100 space-y-3">
                                <label className="flex items-center justify-between pt-3 cursor-pointer">
                                    <div>
                                        <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <Volume2 size={14} className="text-indigo-600" /> Phát âm thanh hiệu ứng khi khớp khuôn mặt
                                        </p>
                                        <p className="text-[11px] text-slate-400">Âm báo Beep nhẹ thông báo nhận diện thành công sinh viên</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={form.soundNotification}
                                        onChange={(e) => handleChange('soundNotification', e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                                    />
                                </label>

                                <label className="flex items-center justify-between pt-3 cursor-pointer">
                                    <div>
                                        <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-emerald-600" /> Tự động chuyển qua quét sinh viên tiếp theo
                                        </p>
                                        <p className="text-[11px] text-slate-400">Giúp quá trình điểm danh cả lớp diễn ra liên tục không cần chạm</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={form.autoNextStudent}
                                        onChange={(e) => handleChange('autoNextStudent', e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: Notification Preferences */}
                {activeTab === 'notifications' && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
                            <Bell size={18} className="text-[#175b9f]" />
                            Tùy chọn thông báo tự động
                        </h3>

                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                                <div>
                                    <p className="font-bold text-slate-900 text-xs">Nhắc nhở ca giảng dạy sắp bắt đầu</p>
                                    <p className="text-[11px] text-slate-400">Gửi thông báo ứng dụng trước 30 phút khi ca học diễn ra</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.notify_class_start}
                                    onChange={(e) => handleChange('notify_class_start', e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                                <div>
                                    <p className="font-bold text-slate-900 text-xs">Cảnh báo sinh viên vắng mặt nhiều</p>
                                    <p className="text-[11px] text-slate-400">Thông báo khi có sinh viên nghỉ quá 20% tổng số buổi môn học</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.notify_absence_warning}
                                    onChange={(e) => handleChange('notify_absence_warning', e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                                />
                            </label>
                        </div>
                    </div>
                )}

                {/* TAB 4: Security */}
                {activeTab === 'security' && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
                            <Key size={18} className="text-[#175b9f]" />
                            Bảo mật &amp; Đổi mật khẩu
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu hiện tại</label>
                                <input
                                    type="password"
                                    value={form.currentPassword}
                                    onChange={(e) => handleChange('currentPassword', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={form.newPassword}
                                    onChange={(e) => handleChange('newPassword', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        className="px-6 py-3 bg-[#175b9f] hover:bg-[#12487f] text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs"
                    >
                        <Save size={16} />
                        <span>Lưu Cài Đặt Giảng Viên</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TeacherSettings;
