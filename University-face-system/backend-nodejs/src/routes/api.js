const express = require('express');
const router = express.Router();

const teacherScheduleRoutes = require('./teacher/schedule.routes');
const teacherAttendanceRoutes = require('./teacher/attendance.routes');
const teacherExamRoutes = require('./teacher/exam.routes');
const teacherDashboardRoutes = require('./teacher/dashboard.routes');

// ── Teacher Schedules
router.use('/schedules', teacherScheduleRoutes);

// ── Teacher Attendance & Face Recognition
router.use('/attendance', teacherAttendanceRoutes);
router.use('/', teacherAttendanceRoutes);

// ── Teacher Exams
router.use('/', teacherExamRoutes);

// ── Teacher Dashboard & Reports
router.use('/', teacherDashboardRoutes);

module.exports = router;
