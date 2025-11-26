import React from 'react';
import { FaBuilding, FaEnvelope, FaPhone, FaProjectDiagram, FaTimes, FaEdit } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ClientDetail = ({ isOpen, onClose, client, onEdit }) => {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl w-full">
        <div className="bg-[#418EFD] text-white p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold flex items-center">
              <FaBuilding className="mr-3" />
              Client Details
            </h1>
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  if (onEdit) onEdit(client);
                  onClose();
                }} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
              <button 
                onClick={onClose} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
              >
                <FaTimes className="mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#418EFD]/5 p-6 rounded-xl border border-[#8BBAFC]/30">
              <h2 className="text-lg font-semibold mb-4 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">
                Client Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center p-3 rounded-lg   border-[#8BBAFC]/30">
                  <FaBuilding className="text-[#418EFD] mr-3" />
                  <div>
                    <p className="text-sm text-[#4A4A57]">Client Name</p>
                    <p className="font-medium text-[#2A2A34]">{client.client_name}</p>
                  </div>
                </div>
                <div className="flex items-center p-3 rounded-lg   border-[#8BBAFC]/30">
                  <FaEnvelope className="text-[#418EFD] mr-3" />
                  <div>
                    <p className="text-sm text-[#4A4A57]">Email</p>
                    <p className="font-medium text-[#2A2A34]">{client.client_contact?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center p-3 rounded-lg  border-[#8BBAFC]/30">
                  <FaPhone className="text-[#418EFD] mr-3" />
                  <div>
                    <p className="text-sm text-[#4A4A57]">Phone</p>
                    <p className="font-medium text-[#2A2A34]">{client.client_contact?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#418EFD]/5 p-6 rounded-xl border border-[#8BBAFC]/30">
              <h2 className="text-lg font-semibold mb-4 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">
                Projects
              </h2>
              {client.projects && client.projects.length > 0 ? (
                <ul className="space-y-3">
                  {client.projects.map((project, index) => (
                    <li key={index} className="flex items-center p-3 rounded-lg   border-[#8BBAFC]/30">
                      <FaProjectDiagram className="text-[#418EFD] mr-3" />
                      <span className="text-[#2A2A34] font-medium">
                        {typeof project === 'object' && project !== null
                          ? (project.project_details?.name || project.name || 'Unnamed Project')
                          : project}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#4A4A57] italic p-3 rounded-lg bg-white border border-[#8BBAFC]/30">
                  No projects associated with this client.
                </p>
              )}
            </div>
          </div>

          <div className="bg-[#418EFD]/5 p-6 rounded-xl border border-[#8BBAFC]/30">
            <h2 className="text-lg font-semibold mb-4 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">
              Additional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white border border-[#8BBAFC]/30">
                <p className="text-sm text-[#4A4A57]">Created At</p>
                <p className="font-medium text-[#2A2A34]">
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#8BBAFC]/30">
                <p className="text-sm text-[#4A4A57]">Last Updated</p>
                <p className="font-medium text-[#2A2A34]">
                  {client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;