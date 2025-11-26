const callGeminiAPI = require("../utils/geminiApi");
const User = require("../models/User");
const Project = require("../models/Project");
const Attendance = require("../models/Attendance");
const Client = require("../models/Client");
const Leave = require("../models/Leave");
const Task = require("../models/Task");
const Credentials = require("../models/Credentials");
const Holiday = require("../models/Holiday");

const processAdminQuery = async (query) => {
    try {
        // Example of handling user information query
        if (query.includes("user details")) {
            const users = await User.find({});
            return users.length ? users : "No users found.";
        }

        // Example of handling project information query
        if (query.includes("project details")) {
            const projects = await Project.find({});
            return projects.length ? projects : "No projects found.";
        }

        // Fallback to Gemini API for general queries
        const response = await callGeminiAPI(query);
        return response;
    } catch (error) {
        console.error("Error processing query:", error.message);
        return "An error occurred while processing your request.";
    }
};

module.exports = {
    processAdminQuery,
};
