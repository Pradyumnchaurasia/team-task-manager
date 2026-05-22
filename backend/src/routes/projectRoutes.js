const express = require('express');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMemberToProject,
  removeMemberFromProject
} = require('../controllers/projectController');
const { authenticateToken, isAdmin, isProjectParticipant } = require('../middleware/auth');

const router = express.Router();

// Apply auth check to all project routes
router.use(authenticateToken);

router.get('/', getProjects);
router.post('/', isAdmin, createProject);
router.get('/:id', isProjectParticipant, getProjectById);
router.put('/:id', isAdmin, updateProject);
router.delete('/:id', isAdmin, deleteProject);

// Member management inside a project
router.post('/:id/members', isAdmin, addMemberToProject);
router.delete('/:id/members/:userId', isAdmin, removeMemberFromProject);

module.exports = router;
