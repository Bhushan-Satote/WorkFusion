const mongoose = require("mongoose");

// Project1 schema only (face-recognition sessions)
const AttendanceSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    checkInTime: { 
      type: Date, 
      required: true 
    },
    checkOutTime: { 
      type: Date
    },
    status: { 
      type: String,
      required: true,
      default: "checked-in"
    },
    time_entries: {
      type: Array,
      default: []
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
