const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// POST /api/projects
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required').isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  projectController.createProject
);

// GET /api/projects
router.get('/', projectController.getProjects);

// GET /api/projects/:id
router.get('/:id', projectController.getProject);

// POST /api/projects/:id/members
router.post(
  '/:id/members',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['Admin', 'Member']).withMessage('Role must be Admin or Member'),
  ],
  projectController.addMember
);

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', projectController.removeMember);

// DELETE /api/projects/:id
router.delete('/:id', projectController.deleteProject);

module.exports = router;
