const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    credentialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Credentials",
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contact_number: { type: String },
    address: { type: String },
    skills: [{ type: String }],
    profile_picture: {
      url: { type: String }, // ✅ Profile picture URL is now required
      upload_date: { type: Date, default: Date.now },
    },
    // New face data fields for storing image paths or embeddings
    faceData: {
      front: { type: String },
      left: { type: String },
      right: { type: String },
      frontDescriptor: { type: [Number] },
      leftDescriptor: { type: [Number] },
      rightDescriptor: { type: [Number] },
    },
    preferences: {
      languages: [{ type: String }],
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    additional_fields: { type: Map, of: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
