const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    project_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Admin assigns this after project creation
    },
    project_details: {
      name: { type: String, required: true },
      description: { type: String },
      start_date: { type: Date },
      end_date: { type: Date },
      status: { type: String },
      priority: { type: String },
      progress: { type: Number },
      additional_fields: { type: Map, of: String },
    },
    kanban: {
      epics: [
        {
          epic_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId(),
          }, // Unique ID for each epic
          name: { type: String },
          // In the kanban.epics array schema
          team_lead_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User",
            required: false  // Make it optional
          },
          team_members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
          technologies: [
            {
              name: { type: String },
              version: { type: String },
              type: { type: String },
            },
          ],
          start_date: { type: Date },
          end_date: { type: Date },
          tasks: [
            { task_id: { type: mongoose.Schema.Types.ObjectId, ref: "Task" } },
          ],
          status: { type: String },
        },
      ],
    },
    project_leads: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attachments: [
      {
        file_name: { type: String },
        file_url: { type: String },
        uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        upload_date: { type: Date },
      },
    ],
    additional_fields: { type: Map, of: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
