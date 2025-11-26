const Task = require('../models/Task');
const Project = require('../models/Project');

// ✅ Get all tasks across projects managed by current Project Manager
exports.getPMTasks = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'Project Manager') {
            return res.status(403).json({ success: false, message: 'Access denied. Only Project Managers can access this endpoint.' });
        }

        // Find projects assigned to this PM
        const projects = await Project.find({ project_manager_id: req.user._id }, { _id: 1, project_details: 1 });
        const projectIds = projects.map(p => p._id);

        // Fetch tasks for these projects
        const tasks = await Task.find({ project_id: { $in: projectIds } })
            .populate('assigned_to', 'name email')
            .populate('created_by', 'name email')
            .populate('project_id', 'project_details.name');

        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        console.error('Error fetching PM tasks:', error.message);
        res.status(500).json({ success: false, message: 'Error fetching tasks for Project Manager', error: error.message });
    }
};

// ✅ Create a new task
exports.createTask = async (req, res) => {    
    try {
        const { project_id, epic_id, title, description, assigned_to, start_date, due_date, priority,status } = req.body;

        // Check for required fields
        if (!project_id || !title || !req.user || !req.user._id) {
            return res.status(400).json({ success: false, message: 'Project ID, title, and created_by are required' });
        }

        const newTask = new Task({
            project_id,
            epic_id,
            title,
            description,
            assigned_to: Array.isArray(assigned_to) ? assigned_to : [assigned_to],
            created_by: req.user._id,
            start_date: start_date ? new Date(start_date) : null,
            due_date: due_date ? new Date(due_date) : null,
            priority,
            status
        });

        // Initialize status metadata
        const now = new Date();
        newTask.status_last_changed_at = now;
        newTask.status_history = [{ status: newTask.status, changed_by: req.user._id, changed_at: now }];

        await newTask.save();

        // Update the project with the new task reference
        if (epic_id) {
            await Project.findByIdAndUpdate(project_id, {
                $push: { "kanban.epics.$[epic].tasks": { task_id: newTask._id } }
            }, { arrayFilters: [{ "epic._id": epic_id }] });
        }

        res.status(201).json({ success: true, message: 'Task created successfully', task: newTask });

    } catch (error) {
        console.error('Error creating task:', error.message); 
        res.status(500).json({ success: false, message: 'Error creating task', error: error.message });
    }
};

// ✅ Get all tasks of a project
exports.getProjectTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ project_id: req.params.projectId }).populate('assigned_to', 'name email');
        res.status(200).json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tasks', error: error.message });
    }
};

// ✅ Update a task by ID
// exports. updateTask = async (req, res) => {
//     try {
//         const { title, description, assigned_to, due_date, priority, status, progress } = req.body;
//         const updatedTask = await Task.findByIdAndUpdate(req.params.taskId, { title, description, assigned_to, due_date, priority, status, progress }, { new: true });
//         if (!updatedTask) {
//             return res.status(404).json({ success: false, message: 'Task not found' });
//         }
//         res.status(200).json({ success: true, message: 'Task updated successfully', task: updatedTask });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Error updating task', error: error.message });
//     }
// };

exports.updateTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const updateData = req.body;

        // Ensure that updateData is not empty
        if (!Object.keys(updateData).length) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        // Update only the fields that are passed in the request body
        const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });

        if (!updatedTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({ success: true, message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
        console.error('Error updating task:', error.message);
        res.status(500).json({ success: false, message: 'Error updating task', error: error.message });
    }
};

// ✅ Delete a task by ID
exports.deleteTask = async (req, res) => {
    try {
        const { projectId, epicId } = req.body;

        // Find and delete the task
        const deletedTask = await Task.findByIdAndDelete(req.params.taskId);

        if (!deletedTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // If the task belongs to an epic, remove the task reference from the epic
        if (projectId && epicId) {
            await Project.updateOne(
                { _id: projectId, "kanban.epics.epic_id": epicId },
                { $pull: { "kanban.epics.$.tasks": { task_id: req.params.taskId } } }
            );
        }

        res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error.message);
        res.status(500).json({ success: false, message: 'Error deleting task', error: error.message });
    }
};


// ✅ Get tasks assigned to the logged-in employee
exports.getEmployeeTasks = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'Employee') {
            return res.status(403).json({ success: false, message: 'Access denied. Only Employees can access this endpoint.' });
        }

        const tasks = await Task.find({ assigned_to: req.user._id })
            .populate('assigned_to', 'name email')
            .populate('created_by', 'name email')
            .populate('project_id', 'project_details');

        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        console.error('Error fetching employee tasks:', error.message);
        res.status(500).json({ success: false, message: 'Error fetching tasks for Employee', error: error.message });
    }
};

// ✅ Allow an employee to update only status/progress of their assigned task
exports.employeeUpdateTaskStatus = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'Employee') {
            return res.status(403).json({ success: false, message: 'Access denied. Only Employees can update their tasks.' });
        }

        const { taskId } = req.params;
        const { status, progress } = req.body;

        const allowedStatuses = ['To-do', 'In Progress', 'Done'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Ensure the employee is assigned to this task
        const isAssigned = (task.assigned_to || []).some(u => u.toString() === req.user._id);
        if (!isAssigned) {
            return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you.' });
        }

        // Update only status and progress; record status change timestamp and history
        if (task.status !== status) {
            task.status = status;
            task.status_last_changed_at = new Date();
            task.status_history = task.status_history || [];
            task.status_history.push({ status, changed_by: req.user._id, changed_at: new Date() });
        }
        if (typeof progress === 'number') {
            task.progress = Math.max(0, Math.min(100, progress));
        }

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate('assigned_to', 'name email')
            .populate('created_by', 'name email')
            .populate('project_id', 'project_details');

        res.status(200).json({ success: true, message: 'Task status updated successfully', data: updatedTask });
    } catch (error) {
        console.error('Error updating employee task status:', error.message);
        res.status(500).json({ success: false, message: 'Error updating task status', error: error.message });
    }
};

console.log("Exported Functions:", {
    createTask: typeof exports.createTask,
    getProjectTasks: typeof exports.getProjectTasks,
    getPMTasks: typeof exports.getPMTasks,
    getEmployeeTasks: typeof exports.getEmployeeTasks,
    updateTask: typeof exports.updateTask,
    employeeUpdateTaskStatus: typeof exports.employeeUpdateTaskStatus,
    deleteTask: typeof exports.deleteTask,
});



// module.exports = {
//     createTask,
//     getProjectTasks,
//     updateTask,
//     deleteTask,
// };

