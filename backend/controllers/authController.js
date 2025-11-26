const Credentials = require("../models/Credentials");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

// Admin Initialization
const initializeAdmin = async () => {
  const adminExists = await Credentials.findOne({ role: "Admin" });
  if (!adminExists) {
    const admin = new Credentials({
      username: "admin",
      password: "$2a$12$A11wmZblu9E2Xs1qSls1ieXA2AKBumD3fGz6iSEqipu9wQZdFviWS",
      role: "Admin",
    });
    await admin.save();
    console.log("✅ Admin credentials created!");
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("🔍 Login attempt for username:", username);
    
    // Find credentials
    const credentials = await Credentials.findOne({ username });
    if (!credentials) {
      console.log("❌ Credentials not found for username:", username);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    console.log("✅ Credentials found:", {
      id: credentials._id,
      username: credentials.username,
      role: credentials.role
    });
    
    const isMatch = await bcrypt.compare(password, credentials.password);
    if (!isMatch) {
      console.log("❌ Password mismatch for username:", username);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // SPECIAL HANDLING FOR ADMIN
    if (credentials.role === 'Admin') {
      console.log("👑 Admin login detected");
      
      // For admin, use the credentials ID as the user ID
      const token = jwt.sign(
        { 
          userId: credentials._id,  // Use credentials ID for admin
          role: credentials.role,
          username: credentials.username
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      console.log("✅ Admin JWT token created with Credentials ID:", credentials._id);

      return res.json({ 
        token, 
        userId: credentials._id,  // Return Credentials ID for admin
        role: credentials.role, 
        username: credentials.username,
        name: "Administrator",  // Default name for admin
        message: "Login successful" 
      });
    }

    // FOR NON-ADMIN USERS: Find the actual User document that references these credentials
    const user = await User.findOne({ credentialId: credentials._id });
    if (!user) {
      console.log("❌ User document not found for credentials:", credentials._id);
      return res.status(400).json({ message: "User profile not found" });
    }
    
    console.log("✅ User found:", {
      userId: user._id,
      name: user.name,
      email: user.email,
      credentialId: user.credentialId
    });

    // Use the User ID (not Credentials ID) in the JWT token for non-admin users
    const token = jwt.sign(
      { 
        userId: user._id,  // This is the User model ID that projects reference
        role: credentials.role,
        username: credentials.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("✅ JWT token created with User ID:", user._id);

    res.json({ 
      token, 
      userId: user._id,  // Return User ID for non-admin users
      role: credentials.role, 
      username: credentials.username,
      name: user.name,
      message: "Login successful" 
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { login, initializeAdmin };