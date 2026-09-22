const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'manager', 'teacher'));

// --- Class Schedules ---
router.get('/schedules', classController.getAllClassSchedules);
router.get('/schedules/:id', classController.getClassScheduleById);
router.post('/schedules', roleMiddleware('admin', 'manager'), classController.createClassSchedule);
router.put('/schedules/:id', roleMiddleware('admin', 'manager'), classController.updateClassSchedule);
router.delete('/schedules/:id', roleMiddleware('admin', 'manager'), classController.deleteClassSchedule);

// --- Schedule Enrollments (Học chính khóa & Học lại) ---
router.get('/schedules/:id/students', classController.getScheduleStudents);
router.post('/schedules/:id/enroll', classController.enrollStudent);
router.delete('/schedules/:id/enroll/:student_id', roleMiddleware('admin', 'manager'), classController.unenrollStudent);
router.post('/schedules/:id/bulk-class', roleMiddleware('admin', 'manager'), classController.bulkEnrollClass);

// --- Class Attendance ---
router.get('/attendance', classController.getAllClassAttendance);
router.delete('/attendance/:id', roleMiddleware('admin', 'manager'), classController.deleteClassAttendance);

module.exports = router;
