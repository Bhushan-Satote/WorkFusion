const express = require("express");
const User = require("../models/User");
const Project = require("../models/Project");
const LeaveRequest = require("../models/Leave");

const router = express.Router();

// Fetch KPI Summary Data
router.get("/kpi-summary", async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments();
    const activeProjects = await Project.countDocuments({ status: "Active" });
    const leaveRequests = await LeaveRequest.countDocuments({ status: "Pending" });

    res.json({
      totalEmployees,
      activeProjects,
      leaveRequests,
      trends: {
        totalEmployees: "+5%", // Fetch this dynamically if needed
        activeProjects: "+2",
        leaveRequests: "+1"
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching KPI data", error });
  }
});

module.exports = router;
