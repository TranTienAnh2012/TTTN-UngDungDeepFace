const express = require('express');
const router = express.Router();
const scheduleController = require('../../controllers/teacher/schedule.controller');

router.get('/today', scheduleController.getTodaySchedules);
router.get('/active', scheduleController.getActiveSchedules);
router.get('/all', scheduleController.getAllSchedules);
router.post('/create', scheduleController.createSchedule);

module.exports = router;
