const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  getAttendance,
  getAttendanceSessions,
  adminListAttendance,
  markAttendance,
  checkIn,
  checkOut,
} = require("../controllers/attendanceController");

// Base endpoints from Project2
router.get("/:userId", verifyToken, getAttendance);
router.post("/", verifyToken, markAttendance);

// Added endpoints from Project1 (secured)
router.get("/sessions/:userId", verifyToken, getAttendanceSessions);
router.post("/check-in", verifyToken, checkIn);
router.post("/check-out", verifyToken, checkOut);
router.get("/admin/list", verifyToken, isAdmin, adminListAttendance);

module.exports = router;
