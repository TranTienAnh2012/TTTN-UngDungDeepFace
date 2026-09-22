const express = require('express');
const router = express.Router();
const classController = require('../controllers/academic_class.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'manager', 'teacher'));

router.get('/', classController.getAllClasses);
router.get('/:id', classController.getClassById);
router.get('/:id/students', classController.getClassStudents);
router.post('/', roleMiddleware('admin', 'manager'), classController.createClass);
router.put('/:id', roleMiddleware('admin', 'manager'), classController.updateClass);
router.delete('/:id', roleMiddleware('admin', 'manager'), classController.deleteClass);

module.exports = router;
