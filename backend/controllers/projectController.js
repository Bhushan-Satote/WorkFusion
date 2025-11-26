// Updated projectController.js with enhanced debugging

const Project = require("../models/Project");
const Client = require("../models/Client");

// ✅ Get all projects (Admin only) or projects assigned to Project Manager
exports.getAllProjects = async (req, res) => {
  try {
    console.log("🔍 getAllProjects - User from token:", req.user);
    
    let query = {};
    
    // If user is Project Manager, only show projects assigned to them and not completed
    if (req.user && req.user.role === 'Project Manager') {
      query.project_manager_id = req.user._id;
      // Filter out completed projects for project managers
      query.$or = [
        { 'project_details.status': { $ne: 'Completed' } },
        { 'project_details.status': { $exists: false } },
        { status: { $ne: 'Completed' } },
        { status: { $exists: false } }
      ];
      console.log("🎯 Project Manager detected, filtering by project_manager_id and excluding completed projects:", req.user._id);
    } else {
      console.log("👑 Admin or other role, showing all projects");
    }
    
    console.log("📋 Query being used:", query);
    
    const projects = await Project.find(query)
      .populate("client_id", "name email")
      .populate("project_manager_id", "name email role")
      .populate("project_leads", "name email");
    
    console.log("📊 Projects found:", projects.length);
    if (projects.length > 0) {
      console.log("📝 Projects details:");
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.project_details?.name || 'No name'}`);
        console.log(`     ID: ${project._id}`);
        console.log(`     Manager ID: ${project.project_manager_id?._id || project.project_manager_id || 'Not assigned'}`);
        console.log(`     Manager Name: ${project.project_manager_id?.name || 'Not assigned'}`);
      });
    }
    
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects" });
  }
};

// ✅ Assign Project Manager to a project (Admin only)
exports.assignProjectManager = async (req, res) => {
  try {
    const { projectId, projectManagerId } = req.body;
    
    console.log("🔧 Assigning project manager:", { projectId, projectManagerId });
    
    if (!projectId || !projectManagerId) {
      return res.status(400).json({
        success: false,
        message: "Project ID and Project Manager ID are required"
      });
    }
    
    // Check if project is already assigned and not completed
    const existingProject = await Project.findById(projectId);
    if (existingProject.project_manager_id && 
        existingProject.project_details?.status !== 'Completed' && 
        existingProject.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: "This project cannot be reassigned until it is completed"
      });
    }
    
    // Verify the user being assigned is actually a Project Manager
    const User = require("../models/User");
    const Credentials = require("../models/Credentials");
    
    const user = await User.findById(projectManagerId).populate('credentialId');
    if (!user || user.credentialId.role !== 'Project Manager') {
      console.log("❌ Invalid Project Manager:", { user: user?.name, role: user?.credentialId?.role });
      return res.status(400).json({
        success: false,
        message: "Selected user is not a Project Manager"
      });
    }
    
    console.log("✅ Valid Project Manager found:", { name: user.name, role: user.credentialId.role });
    
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { project_manager_id: projectManagerId },
      { new: true }
    ).populate("project_manager_id", "name email role");
    
    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }
    
    console.log("✅ Project updated successfully:", {
      projectId: updatedProject._id,
      projectName: updatedProject.project_details?.name,
      managerId: updatedProject.project_manager_id?._id,
      managerName: updatedProject.project_manager_id?.name
    });
    
    res.status(200).json({
      success: true,
      message: "Project Manager assigned successfully",
      data: updatedProject
    });
  } catch (error) {
    console.error("❌ Error assigning project manager:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign project manager"
    });
  }
};

// ✅ Get projects assigned to current Project Manager
exports.getMyProjects = async (req, res) => {
  try {
    console.log("🔍 getMyProjects - User from token:", req.user);
    
    if (!req.user || req.user.role !== 'Project Manager') {
      console.log("❌ Access denied - User role:", req.user?.role);
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Project Managers can access this endpoint."
      });
    }
    
    console.log("🎯 Searching for projects with project_manager_id:", req.user._id);
    
    // Let's also check all projects to see what's in the database
    const allProjects = await Project.find({});
    console.log("📊 Total projects in database:", allProjects.length);
    console.log("📝 All projects with their managers:");
    allProjects.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.project_details?.name || 'No name'}`);
      console.log(`     Project ID: ${p._id}`);
      console.log(`     Manager ID: ${p.project_manager_id || 'Not assigned'}`);
      console.log(`     Status: ${p.project_details?.status || p.status || 'Not set'}`);
    });
    
    // Filter out completed projects for project managers
    const projects = await Project.find({
      project_manager_id: req.user._id,
      $or: [
        { 'project_details.status': { $ne: 'Completed' } },
        { 'project_details.status': { $exists: false } },
        { status: { $ne: 'Completed' } },
        { status: { $exists: false } }
      ]
    })
      .populate("client_id", "name email")
      .populate("project_manager_id", "name email role")
      .populate("project_leads", "name email");
    
    console.log("✅ Found projects for PM:", projects.length);
    if (projects.length > 0) {
      console.log("📝 PM's projects:");
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.project_details?.name || 'No name'}`);
        console.log(`     ID: ${project._id}`);
        console.log(`     Manager: ${project.project_manager_id?.name || 'Not assigned'}`);
      });
    }
    
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("❌ Error fetching my projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects"
    });
  }
};

// ✅ Create a new project
exports.createProject = async (req, res) => {
  try {
    if (!req.body.project_details || !req.body.client_id) {
      return res.status(400).json({
        success: false,
        message: "Project details and client ID are required",
      });
    }
    
    const project = new Project(req.body);
    await project.save();

    // Add this code to update the client's projects array
    if (project.client_id) {
      const clientId = typeof project.client_id === 'object' 
        ? project.client_id._id 
        : project.client_id;
      
      await Client.findByIdAndUpdate(
        clientId,
        { $addToSet: { projects: project._id } },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ success: false, message: "Failed to create project" });
  }
};

// ✅ Update an existing project
exports.updateProject = async (req, res) => {
  try {
    console.log("🔧 Updating project:", req.params.id);
    console.log("🔧 Update data:", req.body);
    console.log("🔧 User making request:", req.user);
    
    // Get the existing project to check if client_id is changing
    const existingProject = await Project.findById(req.params.id);
    
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Check if user has permission to update this project
    if (req.user.role === 'Project Manager' && existingProject.project_manager_id.toString() !== req.user._id) {
      console.log("❌ Permission denied - Project Manager can only update their own projects");
      return res.status(403).json({
        success: false,
        message: "You can only update projects assigned to you"
      });
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true, runValidators: true }
    );

    console.log("✅ Project updated successfully:", {
      id: updatedProject._id,
      name: updatedProject.project_details?.name,
      status: updatedProject.status,
      progress: updatedProject.project_details?.progress
    });

    // Handle client_id changes if needed
    if (req.body.client_id && existingProject.client_id) {
      const oldClientId = typeof existingProject.client_id === 'object'
        ? existingProject.client_id._id
        : existingProject.client_id;
      
      const newClientId = typeof req.body.client_id === 'object'
        ? req.body.client_id._id
        : req.body.client_id;
      
      if (oldClientId.toString() !== newClientId.toString()) {
        await Client.findByIdAndUpdate(
          oldClientId,
          { $pull: { projects: existingProject._id } }
        );
        
        await Client.findByIdAndUpdate(
          newClientId,
          { $addToSet: { projects: existingProject._id } }
        );
      }
    } else if (req.body.client_id && !existingProject.client_id) {
      const clientId = typeof req.body.client_id === 'object'
        ? req.body.client_id._id
        : req.body.client_id;
      
      await Client.findByIdAndUpdate(
        clientId,
        { $addToSet: { projects: existingProject._id } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject
    });
  } catch (error) {
    console.error("❌ Error updating project:", error);
    res.status(400).json({ success: false, message: "Failed to update project" });
  }
};

// ✅ Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // If the project has a client, remove the project from the client's projects array
    if (project.client_id) {
      const clientId = typeof project.client_id === 'object'
        ? project.client_id._id
        : project.client_id;
      
      await Client.findByIdAndUpdate(
        clientId,
        { $pull: { projects: project._id } }
      );
    }

    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ success: false, message: "Failed to delete project" });
  }
};