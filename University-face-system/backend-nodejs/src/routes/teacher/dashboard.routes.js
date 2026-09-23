const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/teacher/dashboard.controller');

router.get('/reports/teacher-summary', dashboardController.getTeacherReportSummary);
router.get('/reports/export', dashboardController.exportReportExcel);

module.exports = router;
