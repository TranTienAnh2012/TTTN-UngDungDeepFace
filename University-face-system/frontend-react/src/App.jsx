import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import WebcamCapture from './components/WebcamCapture';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './components/admin/AdminLayout';
import Login from './pages/admin/Login';
import Register from './pages/admin/Register';
import VerifyEmail from './pages/admin/VerifyEmail';
import ForgotPassword from './pages/admin/ForgotPassword';
import UserManagement from './pages/admin/UserManagement';
import Dashboard from './pages/admin/Dashboard';
import FaceRegistration from './components/admin/FaceRegistration';
import FaceRecognition from './components/admin/FaceRecognition';
import AdminFaceRegistration from './components/admin/AdminFaceRegistration';

import CourseManagement from './pages/admin/CourseManagement';
import RoomManagement from './pages/admin/RoomManagement/index';
import FacultyManagement from './pages/admin/FacultyManagement';
import ClassManagement from './pages/admin/ClassManagement';
import StudentManagement from './pages/admin/StudentManagement';
import ClassSchedules from './pages/admin/ClassSchedules';
import ClassAttendance from './pages/admin/ClassAttendance';
import ExamSchedules from './pages/admin/ExamSchedules';
import ExamAttendance from './pages/admin/ExamAttendance';
import AttendanceReport from './pages/admin/AttendanceReport';

// Teacher Components & Pages
import TeacherLayout from './components/teacher/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherExams from './pages/teacher/TeacherExams';
import TeacherReports from './pages/teacher/TeacherReports';
import TeacherSettings from './pages/teacher/TeacherSettings';
import TeacherFaceRecognition from './pages/teacher/TeacherFaceRecognition';
import TeacherFaceRegistration from './pages/teacher/TeacherFaceRegistration';
import ChatBox from './components/ChatBox';

// Public Face Verification UI
const FaceVerification = () => (
  <div className="app-container">
    <header className="header">
      <h1>Face Verification</h1>
      <p>Hệ thống chống gian lận & điểm danh trực tuyến độ chính xác cao</p>
      <div className="flex gap-4 justify-center mt-4">
        <Link to="/login" className="inline-block text-primary-500 hover:text-primary-600 font-medium bg-white/10 px-4 py-2 rounded-lg">
          👉 Tới trang Quản trị (Admin)
        </Link>
        <Link to="/teacher/dashboard" className="inline-block text-indigo-500 hover:text-indigo-600 font-medium bg-white/10 px-4 py-2 rounded-lg">
          👩‍🏫 Tới Cổng Giảng viên (Teacher)
        </Link>
      </div>
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
          <Route path="/admin/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            
            <Route path="faculties" element={<FacultyManagement />} />
            <Route path="classes" element={<ClassManagement />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="class-schedules" element={<ClassSchedules />} />
            <Route path="class-attendance" element={<ClassAttendance />} />
            <Route path="attendance/class" element={<ClassAttendance />} />
            <Route path="exam-schedules" element={<ExamSchedules />} />
            <Route path="exam-attendance" element={<ExamAttendance />} />
            <Route path="attendance/exam" element={<ExamAttendance />} />

            <Route path="face-registration-demo" element={<FaceRegistration />} />
            <Route path="face-recognition" element={<FaceRecognition />} />
            <Route path="admin-face-registration" element={<AdminFaceRegistration />} />
            <Route path="attendance-report" element={<AttendanceReport />} />
            <Route path="settings" element={<div className="p-8 text-center text-gray-500">Trang Cài đặt (Đang phát triển)</div>} />
          </Route>

          {/* Teacher Portal Routes */}
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="schedule" element={<TeacherSchedule />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="exams" element={<TeacherExams />} />
            <Route path="reports" element={<TeacherReports />} />
            <Route path="settings" element={<TeacherSettings />} />
            <Route path="face-recognition" element={<TeacherFaceRecognition />} />
            <Route path="face-registration" element={<TeacherFaceRegistration />} />
          </Route>
        </Routes>
        <ChatBox />
      </AuthProvider>
    </Router>
  );
}

export default App;
