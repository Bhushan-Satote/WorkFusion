const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { initializeAdmin } = require("./controllers/authController");

// const chatbotRoutes = require("./routes/chatbotRoutes");

dotenv.config();

const app = express();

// CORS and body size configuration (supports base64 images and PATCH)
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:3000'];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Fallback headers to ensure CORS on error responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

initializeAdmin();

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/clients", require("./routes/clientRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/leaves", require("./routes/leaveRoutes"));
app.use("/api/holidays", require("./routes/holidaysRoutes"));
app.use("/api/kanban", require("./routes/kanbanRoutes")); // ✅ For epic management
app.use("/api/tasks", require("./routes/taskRoutes")); // ✅ For task management
app.use("/api/project-lead", require("./routes/projectLeadRoutes")); // ✅ For project lead functionality
app.use("/api/chatbot", require("./routes/chatbot"));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  console.error("❌ Stack:", err.stack);
  console.error("❌ Request URL:", req.url);
  console.error("❌ Request Method:", req.method);
  res
    .status(500)
    .json({ success: false, message: "Server Error", error: err.message });
});

// 404 Not Found Middleware
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
