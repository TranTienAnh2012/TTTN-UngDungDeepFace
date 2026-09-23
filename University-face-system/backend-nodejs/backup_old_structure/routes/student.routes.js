const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'manager', 'teacher'));

router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.post('/', roleMiddleware('admin', 'manager'), studentController.createStudent);
router.put('/:id', roleMiddleware('admin', 'manager'), studentController.updateStudent);
router.delete('/:id', roleMiddleware('admin', 'manager'), studentController.deleteStudent);

module.exports = router;
