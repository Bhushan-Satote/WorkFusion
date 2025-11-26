import React from 'react';
import { FaBuilding, FaCalendarAlt, FaClipboardList, FaUser, FaTimes, FaEdit, FaChartLine } from 'react-icons/fa';

const ProjectDetail = ({ isOpen, onClose, project, onEdit, getClientName }) => {
  if (!isOpen || !project) return null;

  return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-2xl w-full border border-[#8BBAFC]">
        <div className="bg-[#418EFD] text-white p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold flex items-center">
              <FaClipboardList className="mr-2" />
              Project Details
            </h1>
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  if (onEdit) onEdit(project);
                  onClose();
                }} 
                className="bg-[#8BBAFC] hover:bg-[#418EFD] text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
              <button 
                onClick={onClose} 
                className="bg-[#4A4A57] hover:bg-[#2A2A34] text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
              >
                <FaTimes className="mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#418EFD]/5 p-3 rounded-lg border border-[#8BBAFC]/30">
              <h2 className="text-lg font-semibold mb-3 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">Project Information</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FaClipboardList className="text-[#418EFD] mr-3" />
                  <div>
                    <p className="text-sm text-[#4A4A57]">Project Name</p>
                    <p className="font-medium text-[#2A2A34]">{project.project_details.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaBuilding className="text-[#418EFD] mr-3" />
                  <div>
                    <p className="text-sm text-[#4A4A57]">Client</p>
                    <p className="font-medium text-[#2A2A34]">{getClientName ? getClientName(project.client_id) : 'Unknown Client'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="text-[#418EFD] mr-3" />
                  <div>
                    <p className="text-sm text-[#4A4A57]">Start Date</p>
                    <p className="font-medium text-[#2A2A34]">
                      {project.project_details.start_date 
                        ? new Date(project.project_details.start_date).toLocaleDateString() 
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="text-[#418EFD] mr-3" />
                  <div>
                    <p className="text-sm text-[#4A4A57]">End Date</p>
                    <p className="font-medium text-[#2A2A34]">
                      {project.project_details.end_date 
                        ? new Date(project.project_details.end_date).toLocaleDateString() 
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#418EFD]/5 p-4 rounded-lg border border-[#8BBAFC]/30">
              <h2 className="text-xl font-semibold mb-4 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">Status & Progress</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#4A4A57] mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.project_details.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                    project.project_details.status === 'In Progress' ? 'bg-[#418EFD]/10 text-[#418EFD] border border-[#418EFD]/20' :
                    'bg-[#8BBAFC]/10 text-[#8BBAFC] border border-[#8BBAFC]/20'
                  }`}>
                    {project.project_details.status}
                  </span>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-[#4A4A57]">Progress</p>
                    <p className="text-sm font-medium text-[#2A2A34]">{project.project_details.progress}%</p>
                  </div>
                  <div className="w-full bg-[#418EFD]/10 rounded-full h-2">
                    <div 
                      className="bg-[#418EFD] h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.project_details.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-[#418EFD]/5 p-3 rounded-lg border border-[#8BBAFC]/30">
            <h2 className="text-lg font-semibold mb-3 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">Description</h2>
            <p className="text-[#2A2A34] whitespace-pre-line">
              {project.project_details.description || 'No description provided.'}
            </p>
          </div>

          {project.team_members && project.team_members.length > 0 && (
            <div className="mt-4 bg-[#418EFD]/5 p-3 rounded-lg border border-[#8BBAFC]/30">
              <h2 className="text-lg font-semibold mb-3 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">Team Members</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.team_members.map((member, index) => (
                  <div key={index} className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-[#8BBAFC]/30 hover:border-[#418EFD]/50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-[#418EFD] flex items-center justify-center text-white">
                      <FaUser className="text-sm" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-[#2A2A34]">{typeof member === 'object' ? member.name : member}</p>
                      {typeof member === 'object' && member.role && (
                        <p className="text-sm text-[#4A4A57]">{member.role}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 bg-[#418EFD]/5 p-3 rounded-lg border border-[#8BBAFC]/30">
            <h2 className="text-lg font-semibold mb-3 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#4A4A57]">Created At</p>
                <p className="font-medium text-[#2A2A34]">
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#4A4A57]">Last Updated</p>
                <p className="font-medium text-[#2A2A34]">
                  {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;