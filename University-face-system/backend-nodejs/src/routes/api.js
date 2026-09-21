const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');

// ── Face verification (1:1)
router.post('/attendance/verify', attendanceController.verifyAttendance);

// ── Auto identify & check-in/check-out (1:N)
router.post('/attendance/auto-verify', attendanceController.autoIdentifyAndCheckIn);

// ── Schedules
router.get('/schedules/today', attendanceController.getTodaySchedules);
router.get('/schedules/active', attendanceController.getActiveSchedules);

// ── Session status & attendance list
router.get('/attendance/session/:schedule_id', attendanceController.getSessionStatus);
router.get('/attendance/list/:schedule_id',    attendanceController.getAttendanceBySchedule);

// ── Attendance report
router.get('/attendance/report', attendanceController.getAttendanceReport);

// ── Face registration
router.post('/student/register-face',  attendanceController.registerFace);
router.post('/face/detect-pose',       attendanceController.detectPose);
router.post('/face/register-3step',    attendanceController.registerFace3Step);

// ── Student helpers
router.get('/student-list',             attendanceController.getStudents);
router.post('/student/quick-create',    attendanceController.quickCreateStudent);

module.exports = router;



