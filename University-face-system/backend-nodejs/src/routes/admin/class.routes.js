const express = require('express');
const router = express.Router();
const classController = require('../../controllers/admin/class.controller');
const teacherScheduleController = require('../../controllers/teacher/schedule.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'manager', 'teacher'));

// --- Read-only endpoints accessible by teachers & admins ---
router.get('/schedules/:id/students', teacherScheduleController.getScheduleStudents);
router.get('/schedules', classController.getAllClassSchedules);
router.get('/schedules/:id', classController.getClassScheduleById);
// --- Admin Write Class Schedules ---
router.post('/schedules', classController.createClassSchedule);
router.put('/schedules/:id', classController.updateClassSchedule);
router.delete('/schedules/:id', classController.deleteClassSchedule);

// --- Schedule Enrollment Routes ---
router.post('/schedules/:id/bulk-class', classController.bulkEnrollClassToSchedule);
router.post('/schedules/:id/enroll', classController.enrollSingleStudentToSchedule);
router.post('/schedules/:id/students', classController.enrollSingleStudentToSchedule);
router.delete('/schedules/:id/students/:studentId', classController.removeStudentFromSchedule);
router.delete('/schedules/:id/enroll/:studentId', classController.removeStudentFromSchedule);

// --- Class Attendance ---
router.get('/attendance', classController.getAllClassAttendance);
router.delete('/attendance/:id', classController.deleteClassAttendance);

module.exports = router;

