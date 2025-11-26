const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  loginUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  getMe,
  registerFaceData,
} = require("../controllers/userController");
const{ verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
// router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/", verifyToken, getAllUsers);
router.get("/:id", verifyToken, getUserById);
router.post("/create", verifyToken, isAdmin, createUser);
router.patch("/:id", verifyToken, updateUser);
// Face recognition endpoints (from Project1)
router.get("/me/profile", verifyToken, getMe);
router.post("/me/face-register", verifyToken, registerFaceData);

// Replace delete with deactivate/reactivate
router.patch("/:id/deactivate", verifyToken, isAdmin, deactivateUser);
router.patch("/:id/reactivate", verifyToken, isAdmin, reactivateUser);

module.exports = router;