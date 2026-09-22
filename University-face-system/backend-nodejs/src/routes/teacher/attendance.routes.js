const express = require('express');
const router = express.Router();
const attendanceController = require('../../controllers/teacher/attendance.controller');

// Face Verification
router.post('/verify', attendanceController.verifyAttendance);
router.post('/auto-verify', attendanceController.autoIdentifyAndCheckIn);

// Sessions & Attendance Reports
router.get('/session/:schedule_id', attendanceController.getSessionStatus);
router.get('/list/:schedule_id', attendanceController.getAttendanceBySchedule);
router.get('/report', attendanceController.getAttendanceReport);

// Face Registration
router.post('/student/register-face', attendanceController.registerFace);
router.post('/face/detect-pose', attendanceController.detectPose);
router.post('/face/register-3step', attendanceController.registerFace3Step);

// Student helpers
router.get('/student-list', attendanceController.getStudents);
router.post('/student/quick-create', attendanceController.quickCreateStudent);

module.exports = router;
