const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const CredentialsSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin","Employee", "Project Manager", "Project Lead"], default: "Employee",
      required: true,
    },
    is_online: { type: Boolean, default: false },
    status: {
      is_active: { type: Boolean, default: true },
      suspended: { type: Boolean, default: false },
      reason: { type: String, default: "" },
      suspended_since: { type: Date },
    },
  },
  { timestamps: true }
);

// Hash password before saving
// CredentialsSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();
//     this.password = await bcrypt.hash(this.password, 10);
//     next();
// });

module.exports = mongoose.model("Credentials", CredentialsSchema);
