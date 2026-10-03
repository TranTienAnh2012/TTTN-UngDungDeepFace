import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Sparkles, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TeacherHeader = () => {
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Format current Vietnamese Date
    const todayStr = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    // Capitalize first letter of weekday
    const formattedDate = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

    const displayName = user?.full_name || 'Cô Linh';
    const userRoleText = user?.role === 'admin' ? 'Quản trị viên / Giảng viên' : 'Giảng viên';

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20 transition-all">
            {/* Left: Date & Greeting */}
            <div>
                <p className="text-xs font-semibold text-slate-400 capitalize">{formattedDate}</p>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                    Chào buổi sáng, {displayName}
                </h2>
            </div>

            {/* Right: Actions (Search, Notifications, Profile Dropdown) */}
            <div className="flex items-center gap-4">
                {/* Quick Search Button */}
                <button
                    onClick={() => alert("Tính năng tìm kiếm nhanh đang được kích hoạt")}
                    title="Tìm kiếm nhanh..."
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center shadow-2xs"
                >
                    <Search size={18} />
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center relative shadow-2xs"
                    >
                        <Bell size={18} />
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h4 className="font-bold text-slate-800 text-sm">Thông báo gần đây</h4>
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">2 mới</span>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="p-2.5 bg-indigo-50/60 rounded-xl space-y-1">
                                    <p className="font-bold text-slate-800">Ca học sắp bắt đầu</p>
                                    <p className="text-slate-600">Môn Nhập môn Khoa học máy tính lúc 08:00 (Phòng A-302).</p>
                                    <span className="text-[10px] text-slate-400">10 phút trước</span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                                    <p className="font-bold text-slate-800">Báo cáo tuần đã sẵn sàng</p>
                                    <p className="text-slate-600">Tỷ lệ chuyên cần tuần này đạt 94.2%.</p>
                                    <span className="text-[10px] text-slate-400">1 giờ trước</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-slate-200"></div>

                {/* Profile Menu Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200/60"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-[#175b9f] text-white border-2 border-white shadow-sm flex items-center justify-center font-extrabold text-sm shrink-0">
                            {displayName.charAt(0) || 'T'}
                        </div>
                        <div className="text-left hidden sm:block">
                            <h3 className="text-xs font-bold text-slate-900 leading-snug">{displayName}</h3>
                            <p className="text-[10px] font-semibold text-slate-400">{userRoleText}</p>
                        </div>
                        <ChevronDown size={14} className="text-slate-400" />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 space-y-1">
                            <div className="p-3 border-b border-slate-100">
                                <p className="font-bold text-slate-800 text-sm">{displayName}</p>
                                <p className="text-xs text-slate-400 font-mono truncate">{user?.email || 'teacher@university.edu'}</p>
                            </div>

                            <a
                                href="/teacher/settings"
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <User size={15} className="text-slate-400" />
                                Hồ sơ giảng viên
                            </a>

                            <a
                                href="/admin/dashboard"
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                                <Shield size={15} className="text-indigo-500" />
                                Chuyển sang Portal Admin
                            </a>

                            <div className="pt-1 border-t border-slate-100">
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <LogOut size={15} />
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TeacherHeader;
