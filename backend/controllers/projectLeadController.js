const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const mongoose = require("mongoose");

// ✅ Get epics assigned to current Project Lead
exports.getMyEpics = async (req, res) => {
  try {
    console.log("🔍 getMyEpics - User from token:", req.user);
    
    if (!req.user || req.user.role !== 'Project Lead') {
      console.log("❌ Access denied - User role:", req.user?.role);
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Project Leads can access this endpoint."
      });
    }
    
    console.log("🎯 Searching for epics with team_lead_id:", req.user._id);
    
    // Find all projects that have epics assigned to this project lead
    const projects = await Project.find({
      "kanban.epics.team_lead_id": req.user._id
    })
    .populate("client_id", "name email")
    .populate("project_manager_id", "name email")
    .populate("kanban.epics.team_members", "name email");
    
    // Extract only the epics assigned to this project lead
    const myEpics = [];
    projects.forEach(project => {
      project.kanban.epics.forEach(epic => {
        if (epic.team_lead_id && epic.team_lead_id.toString() === req.user._id) {
          myEpics.push({
            ...epic.toObject(),
            project_id: project._id,
            project_name: project.project_details?.name,
            client_name: project.client_id?.name,
            project_manager: project.project_manager_id?.name
          });
        }
      });
    });
    
    console.log("✅ Found epics for Project Lead:", myEpics.length);
    
    res.status(200).json({ 
      success: true, 
      data: myEpics,
      message: `Found ${myEpics.length} epics assigned to you`
    });
  } catch (error) {
    console.error("❌ Error fetching my epics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch epics"
    });
  }
};

// ✅ Get tasks for a specific epic (Project Lead only)
exports.getEpicTasks = async (req, res) => {
  try {
    const { epicId } = req.params;
    
    if (!req.user || req.user.role !== 'Project Lead') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Project Leads can access this endpoint."
      });
    }
    
    // Verify that this epic is assigned to the current project lead
    const project = await Project.findOne({
      "kanban.epics._id": epicId,
      "kanban.epics.team_lead_id": req.user._id
    });
    
    if (!project) {
      return res.status(403).json({
        success: false,
        message: "You can only view tasks for epics assigned to you."
      });
    }
    
    // Get all tasks for this epic
    const tasks = await Task.find({ epic_id: epicId })
      .populate('assigned_to', 'name email')
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error("❌ Error fetching epic tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks"
    });
  }
};

// ✅ Create task within assigned epic (Project Lead only)
exports.createTaskInEpic = async (req, res) => {
  try {
    const { epicId } = req.params;
    const { title, description, assigned_to, start_date, due_date, priority, status } = req.body;
    
    if (!req.user || req.user.role !== 'Project Lead') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Project Leads can create tasks."
      });
    }
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Task title is required"
      });
    }
    
    // Verify that this epic is assigned to the current project lead
    const project = await Project.findOne({
      "kanban.epics._id": epicId,
      "kanban.epics.team_lead_id": req.user._id
    });
    
    if (!project) {
      return res.status(403).json({
        success: false,
        message: "You can only create tasks for epics assigned to you."
      });
    }
    
    // Ensure assigned_to users are actually in this epic's team_members
    let validTeamMembers = [];
    let actualEpic = null;
    for (const epic of project.kanban.epics) {
      if (epic._id.toString() === epicId) {
        actualEpic = epic;
        validTeamMembers = (epic.team_members || []).map(m => m.toString());
        break;
      }
    }
    const assignedArray = Array.isArray(assigned_to) ? assigned_to : assigned_to ? [assigned_to] : [];
    const invalidAssignees = assignedArray.filter(userId => !validTeamMembers.includes(userId.toString()));
    if (invalidAssignees.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You can only assign tasks to employees on your epic's team.",
        invalidAssignees
      });
    }
    // Create the task
    const taskData = {
      project_id: project._id,
      epic_id: epicId,
      title,
      description,
      assigned_to: assignedArray,
      created_by: req.user._id,
      start_date: start_date ? new Date(start_date) : null,
      due_date: due_date ? new Date(due_date) : null,
      priority: priority || 'Medium',
      status: status || 'To-do'
    };
    
    const newTask = new Task(taskData);
    await newTask.save();
    
    // Update the project with the new task reference
    await Project.findByIdAndUpdate(
      project._id,
      {
        $push: { "kanban.epics.$[epic].tasks": { task_id: newTask._id } }
      },
      {
        arrayFilters: [{ "epic._id": epicId }],
        new: true
      }
    );
    
    // Populate the created task
    const populatedTask = await Task.findById(newTask._id)
      .populate('assigned_to', 'name email')
      .populate('created_by', 'name email');
    
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: populatedTask
    });
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task"
    });
  }
};

// ✅ Update task (Project Lead only for their epics)
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;

    // Restrict Project Lead from changing task status/progress
    if (Object.prototype.hasOwnProperty.call(updateData, 'status') || Object.prototype.hasOwnProperty.call(updateData, 'progress')) {
      return res.status(403).json({
        success: false,
        message: 'Project Leads cannot update task status/progress. Only assigned Employees can update status.'
      });
    }
    
    if (!req.user || req.user.role !== 'Project Lead') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Project Leads can update tasks."
      });
    }
    
    // Find the task and verify it belongs to an epic assigned to this project lead
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }
    
    // Verify that the epic is assigned to the current project lead
    const project = await Project.findOne({
      "kanban.epics._id": task.epic_id,
      "kanban.epics.team_lead_id": req.user._id
    });
    
    if (!project) {
      return res.status(403).json({
        success: false,
        message: "You can only update tasks for epics assigned to you."
      });
    }
    
    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    )
    .populate('assigned_to', 'name email')
    .populate('created_by', 'name email');

    // Do not change status here; status is updated by employees only via tasksController
    
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask
    });
  } catch (error) {
    console.error("❌ Error updating task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task"
    });
  }
};

// ✅ Delete task (Project Lead only for their epics)
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!req.user || req.user.role !== 'Project Lead') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Project Leads can delete tasks."
      });
    }
    
    // Find the task and verify it belongs to an epic assigned to this project lead
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }
    
    // Verify that the epic is assigned to the current project lead
    const project = await Project.findOne({
      "kanban.epics._id": task.epic_id,
      "kanban.epics.team_lead_id": req.user._id
    });
    
    if (!project) {
      return res.status(403).json({
        success: false,
        message: "You can only delete tasks for epics assigned to you."
      });
    }
    
    // Remove the task from the database
    await Task.findByIdAndDelete(taskId);
    
    // Remove the task reference from the epic
    await Project.updateOne(
      { _id: project._id },
      { $pull: { "kanban.epics.$[epic].tasks": { task_id: taskId } } },
      { arrayFilters: [{ "epic._id": task.epic_id }] }
    );
    
    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task"
    });
  }
};

// ✅ Get Project Lead dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Project Lead') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Project Leads can access this endpoint."
      });
    }
    
    // Get all epics assigned to this project lead
    const projects = await Project.find({
      "kanban.epics.team_lead_id": req.user._id
    });
    
    let totalEpics = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;
    const epicIds = [];
    
    // Count epics and collect epic IDs
    projects.forEach(project => {
      project.kanban.epics.forEach(epic => {
        if (epic.team_lead_id && epic.team_lead_id.toString() === req.user._id) {
          totalEpics++;
          epicIds.push(epic._id);
        }
      });
    });
    
    // Get task statistics
    if (epicIds.length > 0) {
      const tasks = await Task.find({ epic_id: { $in: epicIds } });
      totalTasks = tasks.length;
      completedTasks = tasks.filter(task => task.status === 'Done').length;
      inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
      todoTasks = tasks.filter(task => task.status === 'To-do').length;
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalEpics,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics"
    });
  }
};

// ✅ Get team members for Project Lead's epics
exports.getMyTeamMembers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Project Lead') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Project Leads can access this endpoint."
      });
    }
    
    // Get all epics assigned to this project lead
    const projects = await Project.find({
      "kanban.epics.team_lead_id": req.user._id
    }).populate("kanban.epics.team_members", "name email skills");
    
    const teamMemberIds = new Set();
    
    // Collect unique team member IDs
    projects.forEach(project => {
      project.kanban.epics.forEach(epic => {
        if (epic.team_lead_id && epic.team_lead_id.toString() === req.user._id) {
          epic.team_members.forEach(member => {
            teamMemberIds.add(member._id.toString());
          });
        }
      });
    });
    
    // Get detailed team member information
    const teamMembers = await User.find({
      _id: { $in: Array.from(teamMemberIds) }
    }).populate('credentialId', 'role status');
    
    res.status(200).json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    console.error("❌ Error fetching team members:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team members"
    });
  }
};