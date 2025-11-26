const Project = require("../models/Project");
const mongoose = require("mongoose");

// ✅ Add Epic to Project
exports.addEpic = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { 
      name, 
      team_lead_id, 
      team_members, 
      technologies, 
      start_date, 
      end_date, 
      status,
      description
    } = req.body;

    // Create a new project document to properly format the epic
    const tempProject = new Project();
    const newEpic = tempProject.kanban.epics.create({
      name,
      description,
      // Only convert to ObjectId if it's a valid ObjectId string
      team_lead_id: mongoose.isValidObjectId(team_lead_id) ? team_lead_id : undefined,
      team_members: team_members || [],
      technologies: technologies || [],
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      tasks: [],
      status
    });

    const project = await Project.findByIdAndUpdate(
      projectId,
      { $push: { "kanban.epics": newEpic } },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({ success: true, message: "Epic added", data: project.kanban.epics });
  } catch (error) {
    console.error("Error adding epic:", error);
    res.status(500).json({ success: false, message: `Failed to add epic: ${error.message}` });
  }
};

// ✅ Get All Epics of a Project
exports.getEpics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    res.status(200).json({ success: true, data: project.kanban.epics });
  } catch (error) {
    console.error("Error fetching epics:", error);
    res.status(500).json({ success: false, message: "Failed to fetch epics" });
  }
};

// ✅ Update an Epic
exports.updateEpic = async (req, res) => {
  try {
    const { projectId, epicId } = req.params;
    const updatedFields = req.body;

    // Remove epic_id from updatedFields if it exists
    // to prevent trying to update the immutable _id field
    if (updatedFields.epic_id) {
      delete updatedFields.epic_id;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Find the epic by its _id value
    const epicIndex = project.kanban.epics.findIndex(epic => 
      epic._id.toString() === epicId || epic.epic_id?.toString() === epicId
    );

    if (epicIndex === -1) {
      return res.status(404).json({ success: false, message: "Epic not found" });
    }

    // Update the epic fields
    Object.assign(project.kanban.epics[epicIndex], updatedFields);
    await project.save();

    res.status(200).json({ success: true, message: "Epic updated", data: project.kanban.epics[epicIndex] });
  } catch (error) {
    console.error("Error updating epic:", error);
    res.status(500).json({ success: false, message: `Failed to update epic: ${error.message}` });
  }
};

// ✅ Delete an Epic
exports.deleteEpic = async (req, res) => {
  try {
    const { projectId, epicId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Find the epic by its _id value
    const epicIndex = project.kanban.epics.findIndex(epic => 
      epic._id.toString() === epicId || epic.epic_id?.toString() === epicId
    );

    if (epicIndex === -1) {
      return res.status(404).json({ success: false, message: "Epic not found" });
    }

    // Remove the epic
    project.kanban.epics.splice(epicIndex, 1);
    await project.save();

    res.status(200).json({ success: true, message: "Epic deleted", data: project.kanban.epics });
  } catch (error) {
    console.error("Error deleting epic:", error);
    res.status(500).json({ success: false, message: `Failed to delete epic: ${error.message}` });
  }
};

// ✅ Create a Task within an Epic (Restricted to Project Leads only)
exports.createEpicTask = async (req, res) => {
  try {
    const { projectId, epicId } = req.params;
    const { title, description, assigned_to, start_date, due_date, priority, status } = req.body;

    console.log('Creating epic task with data:', req.body);
    console.log('User object:', req.user);

    // Check for required fields
    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    // Restrict task creation to Project Leads only
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required to create tasks' 
      });
    }

    // Only Project Leads can create tasks
    if (req.user.role !== 'Project Lead') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Project Leads can create tasks. Project Managers should assign epics to Project Leads.'
      });
    }

    // Verify that this epic is assigned to the current project lead
    const project = await Project.findOne({
      _id: projectId,
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
    for (const epic of project.kanban.epics) {
      if (epic._id.toString() === epicId) {
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
    const Task = require('../models/Task');
    const taskData = {
      project_id: projectId,
      epic_id: epicId,
      title,
      description,
      assigned_to: Array.isArray(assigned_to) ? assigned_to : assigned_to ? [assigned_to] : [],
      created_by: req.user._id,
      start_date: start_date ? new Date(start_date) : null,
      due_date: due_date ? new Date(due_date) : null,
      priority: priority || 'Medium',
      status: status || 'To-do'
    };

    console.log('Creating task with project lead:', taskData);
    const newTask = new Task(taskData);
    await newTask.save();
    
    // Update the project with the new task reference
    await Project.findByIdAndUpdate(
      projectId,
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
      data: populatedTask,
      task: populatedTask
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to create task: ${error.message}`,
      error: error.stack
    });
  }
};

// ✅ Get All Tasks of an Epic
exports.getEpicTasks = async (req, res) => {
  try {
    const { projectId, epicId } = req.params;
    
    const Task = require('../models/Task');
    const tasks = await Task.find({ 
      project_id: projectId, 
      epic_id: epicId 
    }).populate('assigned_to', 'name email');

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching epic tasks:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};

// ✅ Update a Task within an Epic
exports.updateEpicTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updatedFields = req.body;

    const Task = require('../models/Task');
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updatedFields,
      { new: true }
    ).populate('assigned_to', 'name email');

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, message: "Task updated", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: `Failed to update task: ${error.message}` });
  }
};

// ✅ Delete a Task within an Epic
exports.deleteEpicTask = async (req, res) => {
  try {
    const { projectId, epicId, taskId } = req.params;

    // Remove the task from the database
    const Task = require('../models/Task');
    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Remove the task reference from the epic
    await Project.updateOne(
      { _id: projectId },
      { $pull: { "kanban.epics.$[epic].tasks": { task_id: taskId } } },
      { arrayFilters: [{ "epic._id": epicId }] }
    );

    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: `Failed to delete task: ${error.message}` });
  }
};