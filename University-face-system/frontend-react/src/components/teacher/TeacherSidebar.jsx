import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, Calendar, Users, Building2, Camera,
    FileSpreadsheet, Settings, ShieldCheck, Sparkles, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TeacherSidebar = () => {
    const { logout } = useAuth();

    const workspaceNav = [
        { path: '/teacher/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { path: '/teacher/schedule', label: 'Lịch giảng dạy', icon: Calendar },
        { path: '/teacher/students', label: 'Sinh viên', icon: Users },
        { path: '/teacher/face-registration', label: 'Đăng ký khuôn mặt', icon: Camera },
        { path: '/teacher/exams', label: 'Phòng thi', icon: Building2 },
    ];

    const personalNav = [
        { path: '/teacher/reports', label: 'Báo cáo', icon: FileSpreadsheet },
        { path: '/teacher/settings', label: 'Cài đặt', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 z-30 shadow-sm shrink-0">
            {/* Brand Logo Header */}
            <div className="p-6 pb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#175b9f] flex items-center justify-center text-white shadow-md">
                    <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                    <h1 className="font-extrabold text-xl tracking-tight text-slate-900">
                        Classroomly
                    </h1>
                    <p className="text-[10px] font-bold tracking-widest text-[#175b9f] uppercase">Giao diện Giảng viên</p>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto px-4 space-y-6 py-2 scrollbar-thin">
                {/* Section 1: KHÔNG GIAN LÀM VIỆC */}
                <div>
                    <h2 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Không gian làm việc
                    </h2>
                    <nav className="space-y-1">
                        {workspaceNav.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                                            isActive
                                                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200/60'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                            <span>{item.label}</span>
                                            {isActive && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-auto"></span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Section 2: CÁ NHÂN */}
                <div>
                    <h2 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Cá nhân
                    </h2>
                    <nav className="space-y-1">
                        {personalNav.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                                            isActive
                                                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200/60'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                            <span>{item.label}</span>
                                            {isActive && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-auto"></span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Bottom Promo Widget: Trợ lý giảng viên */}
            <div className="p-4 m-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100">
                    <ShieldCheck size={18} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-900">Trợ lý giảng viên</h4>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Tự động hóa công việc hằng ngày của bạn.
                    </p>
                </div>
                <button 
                    onClick={() => alert("Tính năng Trợ lý AI đang được tích hợp!")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pt-1 group"
                >
                    <span>Khám phá thêm</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* Logout Footer */}
            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-rose-600 hover:bg-rose-50 transition-all"
                >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
};

export default TeacherSidebar;
