const express = require('express');
const router = express.Router();
const projectLeadController = require('../controllers/projectLeadController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// ✅ Project Lead Dashboard Routes
router.get('/dashboard/stats', projectLeadController.getDashboardStats);
router.get('/epics', projectLeadController.getMyEpics);
router.get('/team-members', projectLeadController.getMyTeamMembers);

// ✅ Epic Task Management Routes
router.get('/epics/:epicId/tasks', projectLeadController.getEpicTasks);
router.post('/epics/:epicId/tasks', projectLeadController.createTaskInEpic);
router.put('/tasks/:taskId', projectLeadController.updateTask);
router.delete('/tasks/:taskId', projectLeadController.deleteTask);

module.exports = router;