const express = require('express');
const router = express.Router();
const classController = require('../../controllers/admin/class.controller');
const teacherScheduleController = require('../../controllers/teacher/schedule.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);

// --- Read-only endpoints accessible by teachers & admins ---
router.get('/schedules/:id/students', teacherScheduleController.getScheduleStudents);
router.get('/schedules', classController.getAllClassSchedules);
router.get('/schedules/:id', classController.getClassScheduleById);

router.use(roleMiddleware('admin', 'manager'));

// --- Admin Write Class Schedules ---
router.post('/schedules', classController.createClassSchedule);
router.put('/schedules/:id', classController.updateClassSchedule);
router.delete('/schedules/:id', classController.deleteClassSchedule);

// --- Class Attendance ---
router.get('/attendance', classController.getAllClassAttendance);
router.delete('/attendance/:id', classController.deleteClassAttendance);

module.exports = router;
