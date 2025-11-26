const express = require("express");
const router = express.Router();
const { handleChat, analytics } = require("../controllers/chatbotController.new.js");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Project2 primary endpoint
router.post("/", verifyToken, handleChat);

// Legacy/extended endpoints from Project1
router.get("/analytics", verifyToken, isAdmin, analytics);
router.get("/test", (req, res) => res.json({ message: "Chatbot test endpoint" }));
router.post("/legacy", verifyToken, handleChat);

module.exports = router;
