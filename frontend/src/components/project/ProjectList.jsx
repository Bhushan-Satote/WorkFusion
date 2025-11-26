import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteProject, setCurrentProject, fetchProjects } from '../../store/projectStore';
import { fetchClients } from '../../store/clientStore';
import { FaEdit, FaTrash, FaEye, FaColumns, FaUser, FaProjectDiagram } from 'react-icons/fa';
import ProjectDetail from './ProjectDetail';

const ProjectList = ({ projects, onEditProject, onOpenKanban, onAssignProject }) => {
  const dispatch = useDispatch();
  const { clients, isLoading: clientsLoading } = useSelector((state) => state.clients);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);

  // Ensure clients are loaded when component mounts
  useEffect(() => {
    dispatch(fetchClients())
      .unwrap()
      .then(() => setClientsLoaded(true))
      .catch(err => console.error("Error loading clients:", err));
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      dispatch(deleteProject(id)).then(() => {
        // Refresh projects list after deletion
        dispatch(fetchProjects());
      });
    }
  };

  const handleEdit = (project) => {
    dispatch(setCurrentProject(project));
    if (onEditProject) {
      onEditProject(project);
    }
  };

  const handleView = (project) => {
    setSelectedProject(project);
    setShowProjectDetail(true);
  };

  // Function to handle opening the Kanban board
  const handleOpenKanban = (project) => {
    if (onOpenKanban) {
      onOpenKanban(project);
    }
  };

  // Enhanced function to get client name from client ID
  const getClientName = (clientId) => {
    if (!clientsLoaded || !clients || clients.length === 0) {
      return 'Loading...';
    }
    
    // Check if clientId is already a populated object with name field
    if (typeof clientId === 'object' && clientId !== null) {
      // If it has a name property, return it directly
      if (clientId.name) {
        return clientId.name;
      }
      
      // If it has an _id property, use that for comparison
      if (clientId._id) {
        clientId = clientId._id;
      }
    }
    
    const client = clients.find(c => c._id === clientId);
    return client ? client.client_name : 'Unknown Client';
  };

  if (!projects || projects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-[#8BBAFC]">
        <p className="text-[#4A4A57] text-center">No projects found. Create a new project to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC]">
        <div className="p-4 bg-[#418EFD] text-white flex items-center">
          <FaProjectDiagram className="mr-2" />
          <h2 className="text-lg font-semibold">Project List</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#418EFD]/10 border-b border-[#8BBAFC]">
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {/* <FaProjectDiagram className="text-[#418EFD]" /> */}
                    <span>Project Name</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap w-[200px]">
                  <div className="flex items-center space-x-2">
                    {/* <FaUser className="text-[#418EFD]" /> */}
                    <span>Client</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap w-[140px]">Status</th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap w-[120px]">Priority</th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap w-[180px]">Progress</th>
                <th className="py-4 px-6 text-center font-semibold text-sm text-[#2A2A34] whitespace-nowrap w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8BBAFC]/30">
              {projects.map((project) => (
                <tr key={project._id} className="hover:bg-[#418EFD]/5 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-[#2A2A34] truncate max-w-[300px]" title={project.project_details.name}>
                      {project.project_details.name}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-[#4A4A57] truncate" title={getClientName(project.client_id)}>
                      {getClientName(project.client_id)}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-block w-[100px] text-center ${
                      project.project_details.status === 'Completed' ? 'bg-[#4CAF50]/10 text-[#4CAF50]' :
                      project.project_details.status === 'In Progress' ? 'bg-[#418EFD]/10 text-[#418EFD]' :
                      project.project_details.status === 'On Hold' ? 'bg-[#FFA726]/10 text-[#FFA726]' :
                      'bg-[#4A4A57]/10 text-[#4A4A57]'
                    }`}>
                      {project.project_details.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-block w-[80px] text-center ${
                      project.project_details.priority === 'High' ? 'bg-[#F44336]/10 text-[#F44336]' :
                      project.project_details.priority === 'Medium' ? 'bg-[#FFA726]/10 text-[#FFA726]' :
                      'bg-[#4CAF50]/10 text-[#4CAF50]'
                    }`}>
                      {project.project_details.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-[120px] bg-[#418EFD]/10 rounded-full h-2">
                        <div 
                          className="bg-[#418EFD] h-2 rounded-full transition-all" 
                          style={{ width: `${project.project_details.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-[#4A4A57] w-[40px]">
                        {project.project_details.progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => handleView(project)}
                        className="text-[#418EFD] hover:text-[#307ae3] transition-colors p-1.5 hover:bg-[#418EFD]/10 rounded-lg"
                        title="View Details"
                      >
                        <FaEye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(project)}
                        className="text-[#FFA726] hover:text-[#F57C00] transition-colors p-1.5 hover:bg-[#FFA726]/10 rounded-lg"
                        title="Edit Project"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(project._id)}
                        className="text-[#F44336] hover:text-[#D32F2F] transition-colors p-1.5 hover:bg-[#F44336]/10 rounded-lg"
                        title="Delete Project"
                      >
                        <FaTrash size={16} />
                      </button>
                      {onAssignProject && (
                        <button 
                          onClick={() => onAssignProject(project)}
                          className="text-purple-600 hover:text-purple-900 transition-colors p-1.5 hover:bg-purple-100 rounded-lg"
                          title="Assign Project Manager"
                        >
                          <FaUser size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenKanban(project)}
                        className="text-[#418EFD] hover:text-[#307ae3] transition-colors p-1.5 hover:bg-[#418EFD]/10 rounded-lg"
                        title="Open Kanban Board"
                      >
                        <FaColumns size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProject && (
        <ProjectDetail 
          isOpen={showProjectDetail} 
          onClose={() => setShowProjectDetail(false)} 
          project={selectedProject}
          onEdit={handleEdit}
          getClientName={getClientName}
        />
      )}
    </>
  );
};

export default ProjectList;