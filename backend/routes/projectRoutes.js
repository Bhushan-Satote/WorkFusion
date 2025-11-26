const express = require("express");
const router = express.Router();
const {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  assignProjectManager,
  getMyProjects,
} = require("../controllers/projectController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Middleware for validation (optional, can be moved to a separate file)
const validateProjectId = (req, res, next) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Project ID" });
  }
  next();
};

// ✅ Get all projects (with authentication)
router.get("/", verifyToken, getAllProjects);

// ✅ Get projects assigned to current Project Manager
router.get("/my-projects", verifyToken, getMyProjects);

// ✅ Create a new project (Admin only)
router.post("/", verifyToken, isAdmin, createProject);

// ✅ Assign Project Manager to a project (Admin only)
router.post("/assign-manager", verifyToken, isAdmin, assignProjectManager);

// ✅ Update a project (with validation and authentication)
router.patch("/:id", verifyToken, validateProjectId, updateProject);

// ✅ Delete a project (with validation and Admin only)
router.delete("/:id", verifyToken, isAdmin, validateProjectId, deleteProject);

module.exports = router;
