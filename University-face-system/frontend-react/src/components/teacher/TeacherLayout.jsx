import React from 'react';
import { Outlet } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';
import TeacherHeader from './TeacherHeader';

const TeacherLayout = () => {
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
