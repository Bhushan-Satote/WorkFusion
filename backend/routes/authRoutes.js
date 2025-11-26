const express = require("express");
const { login } = require("../controllers/authController");
const router = express.Router();

router.post("/login", login);

module.exports = router;

// const express = require("express");
// const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");
// const User = require("../models/User"); // Ensure you have this model
// dotenv.config();

// const router = express.Router(); // ✅ Initialize router

// // Login Route
// // router.post("/login", async (req, res) => {
// //     const { username, password } = req.body;

// //     // Find user in DB
// //     const user = await User.findOne({ username });

// //     if (!user || user.password !== password) {
// //         return res.status(401).json({ message: "Invalid credentials" });
// //     }

// //     // Generate JWT Token
// //     const token = jwt.sign(
// //         { userId: user._id, role: user.role },
// //         process.env.JWT_SECRET,  // Ensure this is set in your .env
// //         { expiresIn: "1h" } // Token expiry
// //     );

// //     res.json({ token, message: "Login successful" });
// // });

// // router.post("/login", async (req, res) => {
// //     const { username, password } = req.body;
// //     console.log("Login attempt:", username);

// //     try {
// //         // Fetch ALL users to check data
// //         const users = await User.find();
// //         console.log("All users in DB:", users);

// //         // Find user by username
// //         const user = await User.findOne({ username });
// //         console.log("Found User:", user);

// //         if (!user) {
// //             return res.status(401).json({ message: "Invalid credentials (User not found)" });
// //         }

// //         // Check password
// //         const isMatch = await bcrypt.compare(password, user.password);
// //         console.log("Password match:", isMatch);

// //         if (!isMatch) {
// //             return res.status(401).json({ message: "Invalid credentials (Wrong password)" });
// //         }

// //         // Generate JWT token
// //         const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

// //         res.json({ token, message: "Login successful" });

// //     } catch (error) {
// //         console.error("Login Error:", error);
// //         res.status(500).json({ message: "Server error" });
// //     }
// // });

// module.exports = router; // ✅ Export router
