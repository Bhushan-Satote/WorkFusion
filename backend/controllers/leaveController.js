const Leave = require("../models/Leave");
const User = require("../models/User");

// ✅ Get all leave requests
exports.getAllLeaves = async (req, res) => {
  try {
    // Fetch all leaves sorted by latest status update, then by creation date
    const leaves = await Leave.find().sort({ status_updated_at: -1, createdAt: -1 }).lean();
    
    // Try to fetch users with their credential IDs
    const users = await User.find().lean();
    
    // Create maps for both user IDs and credential IDs
    const userIdMap = {};
    const credentialIdMap = {};
    
    users.forEach(user => {
      userIdMap[user._id.toString()] = user;
      if (user.credentialId) {
        credentialIdMap[user.credentialId.toString()] = user;
      }
    });
    
    // Format leaves with user information
    const formattedLeaves = leaves.map(leave => {
      const userId = leave.user_id ? leave.user_id.toString() : null;
      
      // Try to find user by direct ID first, then by credential ID
      let user = userId && userIdMap[userId] ? userIdMap[userId] : null;
      
      // If not found, check if it matches a credential ID
      if (!user && userId && credentialIdMap[userId]) {
        user = credentialIdMap[userId];
      }
      
      // Get user name or use a default value with the user ID
      let userName = 'Unknown';
      if (user) {
        userName = user.name;
      } else if (userId) {
        // If user not found but we have an ID, show a formatted version
        userName = `Employee (ID: ${userId.substring(userId.length - 6)})`;
      }
      
      return {
        ...leave,
        user_id: userId,
        user_name: userName,
        admin_remarks: leave.admin_remarks || null
      };
    });

    res.status(200).json({
      success: true,
      data: formattedLeaves
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaves"
    });
  }
};

// ✅ Create a new leave request
exports.createLeave = async (req, res) => {
  try {
    const payload = { ...req.body };

    // Enforce user_id from authenticated user if available
    if (req.user && req.user._id) {
      payload.user_id = req.user._id;
    }

    // Server-side defaults
    if (!payload.status) payload.status = 'pending';
    if (!payload.date_of_request) payload.date_of_request = new Date();

    const leave = new Leave(payload);
    await leave.save();
    res.status(201).json({ success: true, message: "Leave request submitted", data: leave });
  } catch (error) {
    console.error("Error submitting leave request:", error);
    res.status(400).json({ success: false, message: "Failed to submit leave request" });
  }
};


// ✅ Update a leave request (Partial Update using PATCH)
exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    res.status(200).json({ success: true, message: "Leave request updated", data: leave });
  } catch (error) {
    console.error("Error updating leave request:", error);
    res.status(400).json({ success: false, message: "Failed to update leave request" });
  }
};

// exports.updateLeave = async (req, res) => {
//   try {
//     const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

//     res.status(200).json({ success: true, message: "Leave request updated", data: leave });
//   } catch (error) {
//     console.error("Error updating leave request:", error);
//     res.status(400).json({ success: false, message: "Failed to update leave request" });
//   }
// };

// ✅ Delete a leave request

exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    res.status(200).json({ success: true, message: "Leave request deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    res.status(500).json({ success: false, message: "Failed to delete leave request" });
  }
};


// ✅ Accept a leave request
exports.acceptLeave = async (req, res) => {
  try {
    console.log("[acceptLeave] id:", req.params.id, "body:", req.body);
    // Optionally allow admin to include remarks on acceptance and always set status_updated_at
    const update = {
      status: "accepted",
      status_updated_at: new Date(),
    };

    // If admin provides remarks on acceptance, persist them
    if (req.body && typeof req.body.admin_remarks === 'string' && req.body.admin_remarks.trim()) {
      update.admin_remarks = req.body.admin_remarks.trim();
    }

    const leave = await Leave.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    res.status(200).json({ success: true, message: "Leave request accepted", data: leave });
  } catch (error) {
    console.error("Error accepting leave request:", error);
    res.status(500).json({ success: false, message: "Failed to accept leave request" });
  }
};

// ✅ Reject a leave request
exports.rejectLeave = async (req, res) => {
  try {
    console.log("[rejectLeave] id:", req.params.id, "body:", req.body);
    const update = {
      status: "rejected",
      status_updated_at: new Date(),
    };

    // Persist admin remarks when rejecting
    if (req.body && typeof req.body.admin_remarks === 'string' && req.body.admin_remarks.trim()) {
      update.admin_remarks = req.body.admin_remarks.trim();
    }

    const leave = await Leave.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    res.status(200).json({ success: true, message: "Leave request rejected", data: leave });
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    res.status(500).json({ success: false, message: "Failed to reject leave request" });
  }
};

// Allow updating just the admin remarks without changing status
exports.addRemark = async (req, res) => {
  try {
    const { admin_remarks } = req.body || {};
    if (!admin_remarks || !admin_remarks.toString().trim()) {
      return res.status(400).json({ success: false, message: "admin_remarks is required" });
    }
    const update = {
      admin_remarks: admin_remarks.toString().trim(),
      status_updated_at: new Date(),
    };
    const leave = await Leave.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });
    res.status(200).json({ success: true, message: "Remarks updated", data: leave });
  } catch (error) {
    console.error("Error updating remarks:", error);
    res.status(500).json({ success: false, message: "Failed to update remarks" });
  }
};

// In your leaveController.js
exports.getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
