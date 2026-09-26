import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Cpu, Mail, Key, Save, CheckCircle, 
    Sliders, Clock, Lock, Server, RefreshCw, Sparkles, Database, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSettings = () => {
    const { user } = useAuth();
    const [savedNotice, setSavedNotice] = useState('');
    const [activeTab, setActiveTab] = useState('general');

    // System Settings state
    const [settings, setSettings] = useState({
        // AI Config
        faceMatchThreshold: 60,
        antiSpoofingEnabled: true,
        autoAttendanceCamera: true,
        scanIntervalSeconds: 3,

        // Email & Admin Notifications
        adminEmail: user?.email || 'admin@university.edu.vn',
        notifyNewTeacherRegister: true,
        notifyAbsenceWarning: true,
        emailSMTPHost: 'smtp.gmail.com',

        // Class & Exam Defaults
        defaultClassDuration: 90,
        defaultExamRows: 6,
        defaultExamCols: 8,
        timeZone: 'Asia/Ho_Chi_Minh (GMT+7)',

        // Profile & Security
        adminName: user?.full_name || 'Quản Trị Viên Hệ Thống',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem('app_admin_settings');
        if (saved) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
            } catch (e) {
                console.error('Lỗi đọc settings:', e);
            }
        }
    }, []);

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (settings.newPassword && settings.newPassword !== settings.confirmPassword) {
            setSavedNotice('⚠️ Mật khẩu mới và xác nhận mật khẩu không khớp!');
            return;
        }

        localStorage.setItem('app_admin_settings', JSON.stringify(settings));
        setSavedNotice('✅ Đã lưu cấu hình cài đặt hệ thống thành công!');
        setTimeout(() => setSavedNotice(''), 4000);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#175b9f] flex items-center justify-center text-white shadow-md">
                            <Settings size={22} />
                        </div>
                        Cài Đặt Hệ Thống & Cấu Hình AI
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">
                        Quản lý các thông số nhận diện khuôn mặt AI, gửi email tự động và bảo mật tài khoản Admin
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175b9f] hover:bg-[#12487f] text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                    <Save size={16} />
                    <span>Lưu Cấu Hình</span>
                </button>
            </div>

            {/* Notification Banner */}
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
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'general' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Cpu size={15} />
                    <span>Cấu Hình AI & Camera</span>
                </button>
                <button
                    onClick={() => setActiveTab('email')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'email' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Mail size={15} />
                    <span>Email & Thông Báo Admin</span>
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'schedule' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Sliders size={15} />
                    <span>Mặc Định Ca Học & Ca Thi</span>
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'security' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Shield size={15} />
                    <span>Tài Khoản & Mật Khẩu</span>
                </button>
            </div>

            {/* Tab Contents */}
            <form onSubmit={handleSave} className="space-y-6">
                {/* TAB 1: AI & CAMERA CONFIG */}
                {activeTab === 'general' && (
                    <div className="space-y-5">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b pb-3 border-slate-100">
                                <Cpu size={18} className="text-indigo-600" />
                                Tham số nhận diện khuôn mặt DeepFace &amp; ResNet
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Ngưỡng độ tin cậy tối thiểu (Similarity Threshold): <strong className="text-indigo-600 font-mono text-sm">{settings.faceMatchThreshold}%</strong>
                                    </label>
                                    <input
                                        type="range"
                                        min="40"
                                        max="90"
                                        step="1"
                                        value={settings.faceMatchThreshold}
                                        onChange={(e) => handleChange('faceMatchThreshold', Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Ngưỡng càng cao yêu cầu khuôn mặt phải khớp chính xác hơn. Khuyến nghị: 60% - 70%.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Tần số quét Frame từ Camera (Khoảng cách giữa 2 lần nhận diện)
                                    </label>
                                    <select
                                        value={settings.scanIntervalSeconds}
                                        onChange={(e) => handleChange('scanIntervalSeconds', Number(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 outline-none"
                                    >
                                        <option value={1}>1 giây / lượt (Quét liên tục)</option>
                                        <option value={3}>3 giây / lượt (Khuyến nghị mượt mà)</option>
                                        <option value={5}>5 giây / lượt (Tiết kiệm CPU)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 divide-y divide-slate-100 space-y-3">
                                <label className="flex items-center justify-between pt-3 cursor-pointer">
                                    <div>
                                        <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <Shield size={14} className="text-emerald-600" />
                                            Bật thuật toán Chống Giả Mạo 3D Anti-Spoofing
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Tự động phát hiện và chặn hình ảnh chụp qua điện thoại hoặc màn hình máy tính.
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.antiSpoofingEnabled}
                                        onChange={(e) => handleChange('antiSpoofingEnabled', e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                                    />
                                </label>

                                <label className="flex items-center justify-between pt-3 cursor-pointer">
                                    <div>
                                        <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <Eye size={14} className="text-indigo-600" />
                                            Tự động ghi nhận Check-in khi phát hiện sinh viên
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Lưu điểm danh vào cơ sở dữ liệu ngay khi hệ thống nhận diện đúng khuôn mặt.
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoAttendanceCamera}
                                        onChange={(e) => handleChange('autoAttendanceCamera', e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: EMAIL & NOTIFICATIONS */}
                {activeTab === 'email' && (
                    <div className="space-y-5">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b pb-3 border-slate-100">
                                <Mail size={18} className="text-indigo-600" />
                                Cấu hình nhận Email phê duyệt giảng viên &amp; thông báo hệ thống
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Email Quản Trị Viên Nhận Duyệt Đăng Ký (ADMIN_EMAIL)
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.adminEmail}
                                        onChange={(e) => handleChange('adminEmail', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="admin@university.edu.vn"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Khi giảng viên đăng ký tài khoản mới, email xác nhận kích hoạt tài khoản sẽ gửi về địa chỉ này.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Máy chủ SMTP gửi Email (GMAIL NodeMailer)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.emailSMTPHost}
                                        onChange={(e) => handleChange('emailSMTPHost', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 outline-none"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="pt-3 divide-y divide-slate-100 space-y-3">
                                <label className="flex items-center justify-between pt-3 cursor-pointer">
                                    <div>
                                        <p className="font-bold text-slate-900 text-xs">Gửi email thông báo tức thì khi giảng viên tạo tài khoản</p>
                                        <p className="text-[11px] text-slate-400">Đăng ký mới sẽ chờ nút Phê Duyệt từ email Admin</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyNewTeacherRegister}
                                        onChange={(e) => handleChange('notifyNewTeacherRegister', e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                                    />
                                </label>

                                <label className="flex items-center justify-between pt-3 cursor-pointer">
                                    <div>
                                        <p className="font-bold text-slate-900 text-xs">Gửi thông báo tổng hợp vắng học cuối tuần</p>
                                        <p className="text-[11px] text-slate-400">Tự động tổng hợp báo cáo điểm danh gửi cho Trưởng Khoa</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyAbsenceWarning}
                                        onChange={(e) => handleChange('notifyAbsenceWarning', e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: DEFAULT SCHEDULE & EXAM CONFIG */}
                {activeTab === 'schedule' && (
                    <div className="space-y-5">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b pb-3 border-slate-100">
                                <Sliders size={18} className="text-indigo-600" />
                                Cấu hình thông số mặc định cho ca học &amp; sơ đồ ca thi
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Thời lượng ca học (Phút)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.defaultClassDuration}
                                        onChange={(e) => handleChange('defaultClassDuration', Number(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Số hàng sơ đồ thi mặc định
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.defaultExamRows}
                                        onChange={(e) => handleChange('defaultExamRows', Number(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Số cột sơ đồ thi mặc định
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.defaultExamCols}
                                        onChange={(e) => handleChange('defaultExamCols', Number(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Múi giờ hệ thống (Timezone Sync)
                                </label>
                                <input
                                    type="text"
                                    value={settings.timeZone}
                                    disabled
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-100 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: PROFILE & SECURITY */}
                {activeTab === 'security' && (
                    <div className="space-y-5">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b pb-3 border-slate-100">
                                <Shield size={18} className="text-indigo-600" />
                                Thông tin tài khoản Quản trị viên &amp; Đổi mật khẩu
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tên Quản Trị Viên</label>
                                    <input
                                        type="text"
                                        value={settings.adminName}
                                        onChange={(e) => handleChange('adminName', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email đăng nhập</label>
                                    <input
                                        type="email"
                                        value={user?.email || settings.adminEmail}
                                        disabled
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 bg-slate-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <Key size={14} className="text-indigo-600" /> Đổi mật khẩu tài khoản Admin
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu hiện tại</label>
                                        <input
                                            type="password"
                                            value={settings.currentPassword}
                                            onChange={(e) => handleChange('currentPassword', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            value={settings.newPassword}
                                            onChange={(e) => handleChange('newPassword', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                                        <input
                                            type="password"
                                            value={settings.confirmPassword}
                                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Action */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        className="px-6 py-3 bg-[#175b9f] hover:bg-[#12487f] text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs"
                    >
                        <Save size={16} />
                        <span>Lưu Cấu Hình Cài Đặt</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSettings;
