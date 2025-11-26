const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema(
  {
    client_name: { type: String, required: true },
    client_contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    additional_fields: { type: Map, of: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", ClientSchema);
