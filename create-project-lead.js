const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import models
const Credentials = require("./backend/models/Credentials");
const User = require("./backend/models/User");

const createProjectLead = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if Project Lead already exists
    const existingCredentials = await Credentials.findOne({ username: "projectlead" });
    if (existingCredentials) {
      console.log("❌ Project Lead user already exists with username 'projectlead'");
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Create credentials
    const credentials = new Credentials({
      username: "projectlead",
      password: hashedPassword,
      role: "Project Lead",
      is_online: false,
      status: {
        is_active: true,
        suspended: false,
        reason: "",
      }
    });

    await credentials.save();
    console.log("✅ Project Lead credentials created");

    // Create user profile
    const user = new User({
      credentialId: credentials._id,
      name: "John Project Lead",
      email: "projectlead@workfusion.com",
      contact_number: "+1234567890",
      address: "123 Tech Street, Dev City",
      skills: ["JavaScript", "React", "Node.js", "Team Leadership", "Project Management"],
      profile_picture: {
        url: "",
        upload_date: new Date()
      },
      preferences: {
        languages: ["English"]
      },
      status: "active"
    });

    await user.save();
    console.log("✅ Project Lead user profile created");

    console.log("\n🎉 Project Lead user created successfully!");
    console.log("📋 Login Details:");
    console.log("   Username: projectlead");
    console.log("   Password: password123");
    console.log("   Role: Project Lead");
    console.log("   Name: John Project Lead");
    console.log("\n🚀 You can now login with these credentials to access the Project Lead dashboard!");

  } catch (error) {
    console.error("❌ Error creating Project Lead:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
createProjectLead();