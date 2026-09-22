const express = require('express');
const router = express.Router();
const structureController = require('../controllers/structure.controller');

// Khoa (Faculties)
router.get('/faculties', structureController.getFaculties);
router.post('/faculties', structureController.createFaculty);

// Khóa học (Batches)
router.get('/batches', structureController.getBatches);
router.post('/batches', structureController.createBatch);

// Lớp sinh hoạt (Student Classes)
router.get('/classes', structureController.getStudentClasses);
router.post('/classes', structureController.createStudentClass);

// Phòng học (Rooms)
router.get('/rooms', structureController.getRooms);
router.post('/rooms', structureController.createRoom);

module.exports = router;
