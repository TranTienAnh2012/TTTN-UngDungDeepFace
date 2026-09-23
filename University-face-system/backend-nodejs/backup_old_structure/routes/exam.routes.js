const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'manager', 'teacher'));

// --- Exam Schedules ---
router.get('/schedules', examController.getAllExamSchedules);
router.get('/schedules/:id', examController.getExamScheduleById);
router.post('/schedules', roleMiddleware('admin', 'manager'), examController.createExamSchedule);
router.put('/schedules/:id', roleMiddleware('admin', 'manager'), examController.updateExamSchedule);
router.delete('/schedules/:id', roleMiddleware('admin', 'manager'), examController.deleteExamSchedule);
router.post('/schedules/:id/bulk-class', roleMiddleware('admin', 'manager'), examController.bulkEnrollClassForExam);

// --- Exam Eligibility (Danh sách dự thi) ---
router.get('/eligibility', examController.getExamEligibility);
router.post('/eligibility', roleMiddleware('admin', 'manager'), examController.addExamEligibility);
router.delete('/eligibility/:id', roleMiddleware('admin', 'manager'), examController.removeExamEligibility);

// --- Exam Attendance (Điểm danh thi) ---
router.get('/attendance', examController.getExamAttendance);
router.delete('/attendance/:id', roleMiddleware('admin', 'manager'), examController.deleteExamAttendance);

module.exports = router;
