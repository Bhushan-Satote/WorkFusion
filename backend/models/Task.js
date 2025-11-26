const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    epic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project.kanban.epics",
    },
    title: { type: String, required: true },
    description: { type: String },
    assigned_to: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    start_date: { type: Date },
    due_date: { type: Date },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["To-do", "In Progress", "Done"],
      default: "To-do",
    },
    // Track when status last changed and full status change history
    status_last_changed_at: { type: Date, default: Date.now },
    status_history: [
      {
        status: { type: String, enum: ["To-do", "In Progress", "Done"], required: true },
        changed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changed_at: { type: Date, default: Date.now },
      },
    ],
    progress: { type: Number, default: 0 },
    attachments: [
      {
        file_name: { type: String },
        file_url: { type: String },
        uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        upload_date: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        created_at: { type: Date, default: Date.now },
      },
    ],
    additional_fields: { type: Map, of: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
