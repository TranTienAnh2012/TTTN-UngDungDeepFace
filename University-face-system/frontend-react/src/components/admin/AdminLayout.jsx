import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const AdminLayout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === 'teacher') {
        return <Navigate to="/teacher/dashboard" replace />;
    }

    return (
        <div className="flex h-screen bg-slate-50/60 overflow-hidden font-sans antialiased text-slate-800">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8">
                    <div className="w-full max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
