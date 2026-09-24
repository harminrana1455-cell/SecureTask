const express = require('express');
const { body, param } = require('express-validator');
const { getTasks, getTask, createTask, updateTask, deleteTask, completeTask } = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title must not exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Completed']).withMessage('Status must be Todo, In Progress, or Completed'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Due date must be a valid date'),
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid task ID'),
];

router.get('/', getTasks);
router.post('/', taskValidation, validate, createTask);
router.get('/:id', idValidation, validate, getTask);
router.put('/:id', [...idValidation, ...taskValidation], validate, updateTask);
router.delete('/:id', idValidation, validate, deleteTask);
router.patch('/:id/complete', idValidation, validate, completeTask);

module.exports = router;
