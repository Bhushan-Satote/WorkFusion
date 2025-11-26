import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClients, deleteClient, setCurrentClient } from '../../store/clientStore';
import { FaEdit, FaTrash, FaEye, FaUserTie, FaExclamationCircle } from 'react-icons/fa';
import ClientDetail from './ClientDetail';
import { FaUser, FaEnvelope, FaPhone, FaUserCog } from 'react-icons/fa';

const ClientList = ({ onEditClient }) => {
  const dispatch = useDispatch();
  const { clients, isLoading, error } = useSelector((state) => state.clients);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetail, setShowClientDetail] = useState(false);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      dispatch(deleteClient(id));
    }
  };

  const handleEdit = (client) => {
    if (onEditClient) {
      onEditClient(client);
    } else {
      dispatch(setCurrentClient(client));
    }
  };

  const handleView = (client) => {
    setSelectedClient(client);
    setShowClientDetail(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#418EFD]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F44336]/10 border border-[#F44336] text-[#F44336] px-4 py-3 rounded-lg relative flex items-center" role="alert">
        <FaExclamationCircle className="mr-2" />
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC]">
        <div className="p-4 bg-[#418EFD] text-white flex items-center">
          <FaUserTie className="mr-2" />
          <h2 className="text-lg font-semibold">Client List</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#418EFD]/10 border-b border-[#8BBAFC]">
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {/* <FaUserTie className="text-[#418EFD]" /> */}
                    <span>Client Name</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {/* <FaEnvelope className="text-[#418EFD]" /> */}
                    <span>Email</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {/* <FaPhone className="text-[#418EFD]" /> */}
                    <span>Phone</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8BBAFC]/30">
              {clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client._id} className="hover:bg-[#418EFD]/5 transition-colors">
                    <td className="py-3 px-4 text-[#2A2A34]">{client.client_name}</td>
                    <td className="py-3 px-4 text-[#4A4A57]">{client.client_contact.email}</td>
                    <td className="py-3 px-4 text-[#4A4A57]">{client.client_contact.phone}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-3">
                        <button 
                          className="text-[#418EFD] hover:text-[#307ae3] transition-colors p-1.5"
                          onClick={() => handleView(client)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="text-[#418EFD] hover:text-[#307ae3] transition-colors p-1.5"
                          onClick={() => handleEdit(client)}
                          title="Edit Client"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(client._id)} 
                          className="text-[#F44336] hover:text-[#d32f2f] transition-colors p-1.5"
                          title="Delete Client"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-[#4A4A57]">
                    <FaUserTie className="mx-auto text-4xl text-[#418EFD]/50 mb-3" />
                    <p className="font-medium">No clients found.</p>
                    <p className="text-sm text-[#4A4A57]/80">Create a new client to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientDetail 
        isOpen={showClientDetail}
        onClose={() => setShowClientDetail(false)}
        client={selectedClient}
        onEdit={handleEdit}
      />
    </>
  );
};

export default ClientList;