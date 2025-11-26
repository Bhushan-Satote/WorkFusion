const express = require("express");
const router = express.Router();
const {
  addEpic,
  getEpics,
  updateEpic,
  deleteEpic,
  createEpicTask,
  getEpicTasks,
  updateEpicTask,
  deleteEpicTask
} = require("../controllers/kanbanController");

const { verifyToken } = require("../middleware/authMiddleware");

// 🔄 Epic Routes
router.post("/:projectId/epics", verifyToken, addEpic);
router.get("/:projectId/epics", verifyToken, getEpics);
router.patch("/:projectId/epics/:epicId", verifyToken, updateEpic);
router.delete("/:projectId/epics/:epicId", verifyToken, deleteEpic);

// 🔄 Epic Task Routes
router.post("/:projectId/epics/:epicId/tasks", verifyToken, createEpicTask);
router.get("/:projectId/epics/:epicId/tasks", verifyToken, getEpicTasks);
router.patch("/:projectId/epics/:epicId/tasks/:taskId", verifyToken, updateEpicTask);
router.delete("/:projectId/epics/:epicId/tasks/:taskId", verifyToken, deleteEpicTask);

module.exports = router;
