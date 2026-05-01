const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.use(auth);

// POST /api/tasks
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 2, max: 200 }),
    body('project').notEmpty().withMessage('Project ID is required'),
    body('status').optional().isIn(['To Do', 'In Progress', 'Done']),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('description').optional().trim().isLength({ max: 2000 }),
  ],
  taskController.createTask
);

// GET /api/tasks?project=:projectId
router.get('/', taskController.getTasks);

// GET /api/tasks/:id
router.get('/:id', taskController.getTask);

// PUT /api/tasks/:id
router.put('/:id', taskController.updateTask);

// DELETE /api/tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;
