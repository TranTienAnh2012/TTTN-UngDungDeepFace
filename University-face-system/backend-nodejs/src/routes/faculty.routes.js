const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'manager', 'teacher'));

router.get('/', facultyController.getAllFaculties);
router.get('/:id', facultyController.getFacultyById);
router.post('/', roleMiddleware('admin', 'manager'), facultyController.createFaculty);
router.put('/:id', roleMiddleware('admin', 'manager'), facultyController.updateFaculty);
router.delete('/:id', roleMiddleware('admin', 'manager'), facultyController.deleteFaculty);

module.exports = router;
