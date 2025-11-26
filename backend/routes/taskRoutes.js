const express = require("express");
const router = express.Router();
// const taskController = require('../controllers/tasksController');  // Import full object
const { verifyToken } = require("../middleware/authMiddleware");

const {createTask,getProjectTasks,updateTask,deleteTask, getPMTasks, getEmployeeTasks, employeeUpdateTaskStatus} = require("../controllers/tasksController");

console.log("createTask:", createTask);
console.log("getProjectTasks:", getProjectTasks);
console.log("updateTask:", updateTask);
console.log("deleteTask:", deleteTask);

// 🟢 Create a new task
router.post("/create", verifyToken, createTask);
router.get("/project/:projectId", verifyToken, getProjectTasks);
// 🟢 Get all tasks across PM's projects
router.get("/pm/my-tasks", verifyToken, getPMTasks);

// 🟢 Get tasks assigned to the logged-in employee
router.get("/employee/my-tasks", verifyToken, getEmployeeTasks);

// 🟢 Employee updates only their task status/progress
router.patch("/employee/tasks/:taskId/status", verifyToken, employeeUpdateTaskStatus);
router.patch("/update/:taskId", verifyToken, updateTask);
router.delete("/delete/:taskId", verifyToken, deleteTask);

// router.post("/create", createTask);  
// router.get("/project/:projectId", getProjectTasks);
// router.put("/update/:taskId", updateTask);
// router.delete("/delete/:taskId", deleteTask);

// router.post("/create",verifyToken, taskController.createTask);
// router.get("/project/:projectId",verifyToken, taskController.getProjectTasks);
// router.put("/update/:taskId", verifyToken, taskController.updateTask);
// router.delete("/delete/:taskId", verifyToken, taskController.deleteTask);

module.exports = router;

