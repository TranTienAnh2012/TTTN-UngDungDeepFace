import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Settings, Home, LogOut, Camera, ScanFace, BookOpen, GraduationCap, Calendar, UserCheck, ClipboardList, Sparkles, BarChart2, Shield, Building2, Building, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();

    const menuGroups = [
        {
            title: 'Hệ Thống',
            items: [
                { path: '/admin/dashboard', icon: Home, label: 'Bảng Điều Khiển' },
                { path: '/admin/users', icon: Users, label: 'Quản Trị Viên' },
            ]
        },
        {
            title: 'Quản Lý Đào Tạo',
            items: [
                { path: '/admin/faculties', icon: Building, label: 'Khoa & Viện' },
                { path: '/admin/classes', icon: Layers, label: 'Lớp Sinh Viên' },
                { path: '/admin/courses', icon: BookOpen, label: 'Môn Học' },
                { path: '/admin/rooms', icon: Building2, label: 'Phòng & Sơ Đồ' },
                { path: '/admin/students', icon: GraduationCap, label: 'Sinh Viên' },
                { path: '/admin/faculties-classes', icon: Building2, label: 'Khoa & Lớp' },
                { path: '/admin/rooms', icon: Building, label: 'Phòng Học' },
            ]
        },
        {
            title: 'Lớp Học Phần',
            items: [
                { path: '/admin/class-schedules',    icon: Calendar,  label: 'Lịch Học' },
                { path: '/admin/class-attendance',   icon: UserCheck, label: 'Điểm Danh Lớp' },
                { path: '/admin/attendance-report',  icon: BarChart2, label: 'Báo Cáo Điểm Danh' },
            ]
        },
        {
            title: 'Tổ Chức Thi',
            items: [
                { path: '/admin/exam-schedules', icon: ClipboardList, label: 'Lịch Thi' },
                { path: '/admin/exam-attendance', icon: ScanFace, label: 'Điểm Danh Thi' },
            ]
        },
        {
            title: 'Tiện Ích AI',
            items: [
                { path: '/admin/face-registration-demo', icon: Camera, label: 'Đăng Ký Khuôn Mặt' },
                { path: '/admin/admin-face-registration', icon: Shield, label: 'KM Admin/Giảng Viên' },
                { path: '/admin/face-recognition', icon: Sparkles, label: 'Nhận Diện AI' },
                { path: '/admin/settings', icon: Settings, label: 'Cài Đặt' },
            ]
        }
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
                    F
                </div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">FaceSystem</h2>
            </div>
            
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
                {menuGroups.map((group, idx) => (
                    <div key={idx} className="space-y-1">
                        <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{group.title}</p>
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/admin'}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-medium ${
                                            isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon size={20} className={isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'} />
                                            <span>{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium group"
                >
                    <LogOut size={20} className="text-red-500 group-hover:text-red-600" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
