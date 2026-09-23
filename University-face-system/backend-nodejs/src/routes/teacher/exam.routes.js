const express = require('express');
const router = express.Router();
const examController = require('../../controllers/teacher/exam.controller');

router.get('/exams', examController.getExamSchedules);

module.exports = router;
