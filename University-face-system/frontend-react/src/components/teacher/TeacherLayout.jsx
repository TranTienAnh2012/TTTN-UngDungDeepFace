import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TeacherSidebar from './TeacherSidebar';
import TeacherHeader from './TeacherHeader';

const TeacherLayout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800">
            {/* Sidebar */}
            <TeacherSidebar />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <TeacherHeader />

                {/* Dynamic Page Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default TeacherLayout;
