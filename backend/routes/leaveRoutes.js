const { verifyToken } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const {
  getAllLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  acceptLeave, // Import acceptLeave
  rejectLeave,
  getLeaveById, // Import rejectLeave
  addRemark
} = require("../controllers/leaveController");

// ✅ Apply for leave
router.post("/", verifyToken, createLeave);

// ✅ Get all leave requests
router.get("/", getAllLeaves);

// ✅ Update leave request (by leave ID)
router.patch("/:id", updateLeave);

// ✅ Delete leave request (by leave ID)
router.delete("/:id", deleteLeave);

// ✅ Accept leave request (allow remarks in body)
router.patch("/:id/accept", acceptLeave);

// ✅ Reject leave request (allow remarks in body)
router.patch("/:id/reject", rejectLeave);

// ✅ Update only remarks (optional utility)
router.patch("/:id/remarks", addRemark);

// Get a single leave request by ID
router.get("/:id", getLeaveById);
module.exports = router;

