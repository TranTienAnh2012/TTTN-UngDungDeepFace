import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import WebcamCapture from './components/WebcamCapture';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './components/admin/AdminLayout';
import Login from './pages/admin/Login';
import Register from './pages/admin/Register';
import VerifyEmail from './pages/admin/VerifyEmail';
import UserManagement from './pages/admin/UserManagement';
import Dashboard from './pages/admin/Dashboard';
import FaceRegistration from './components/admin/FaceRegistration';
import FaceRecognition from './components/admin/FaceRecognition';

import CourseManagement from './pages/admin/CourseManagement';
import StudentManagement from './pages/admin/StudentManagement';
import ClassSchedules from './pages/admin/ClassSchedules';
import ClassAttendance from './pages/admin/ClassAttendance';
import ExamSchedules from './pages/admin/ExamSchedules';
import ExamAttendance from './pages/admin/ExamAttendance';
import AttendanceReport from './pages/admin/AttendanceReport';

// Public Face Verification UI
const FaceVerification = () => (
  <div className="app-container">
    <header className="header">
      <h1>Face Verification</h1>
      <p>Hệ thống chống gian lận & điểm danh trực tuyến độ chính xác cao</p>
      <Link to="/login" className="inline-block mt-4 text-primary-500 hover:text-primary-600 font-medium bg-white/10 px-4 py-2 rounded-lg">
        👉 Tới trang Quản trị (Admin)
      </Link>
    </header>
    <main>
      <WebcamCapture />
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<FaceVerification />} />

          {/* Admin Auth Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Admin Protected Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              
              <Route path="courses" element={<CourseManagement />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="class-schedules" element={<ClassSchedules />} />
              <Route path="class-attendance" element={<ClassAttendance />} />
              <Route path="exam-schedules" element={<ExamSchedules />} />
              <Route path="exam-attendance" element={<ExamAttendance />} />

              <Route path="face-registration-demo" element={<FaceRegistration />} />
              <Route path="face-recognition" element={<FaceRecognition />} />
              <Route path="attendance-report" element={<AttendanceReport />} />
              <Route path="settings" element={<div className="p-8 text-center text-gray-500">Trang Cài đặt (Đang phát triển)</div>} />
            </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
