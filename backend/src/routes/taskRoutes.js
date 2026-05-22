const express = require('express');
const {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { authenticateToken, isProjectParticipant } = require('../middleware/auth');

const router = express.Router();

// Apply auth check to all task routes
router.use(authenticateToken);

// Single task modifications
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Project-specific task operations
router.get('/project/:projectId', isProjectParticipant, getTasksByProject);
router.post('/project/:projectId', isProjectParticipant, createTask);

module.exports = router;
