import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ClientList from '../components/client/ClientList';
import ClientForm from '../components/client/ClientForm';
import ClientDetail from '../components/client/ClientDetail';
import { FaPlus, FaUsers } from 'react-icons/fa';
import { fetchClients, setCurrentClient, clearCurrentClient } from '../store/clientStore';

const ClientManagementPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const handleCreateClient = () => {
    dispatch(clearCurrentClient());
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditClient = (client) => {
    dispatch(setCurrentClient(client));
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    // Clear the current client when form is closed
    dispatch(clearCurrentClient());
    // Refresh the clients list to show updated data
    dispatch(fetchClients());
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#8BBAFC]/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start md:items-center">
              <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
                <FaUsers className="text-white text-xl sm:text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Client Management</h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                <p className="text-white/90 text-xs sm:text-sm mt-1">Manage clients, relationships, and projects</p>
              </div>
            </div>
            <button 
              onClick={handleCreateClient} 
              className="flex items-center px-4 py-2 rounded-lg bg-white text-[#1b66d1] hover:bg-[#f4f8ff] border border-white/70 shadow-sm transition-colors"
            >
              <FaPlus className="mr-2" />
              Add New Client
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <ClientList onEditClient={handleEditClient} />
      </div>

      <ClientForm 
        isOpen={showForm}
        onClose={handleCloseForm}
        isEditing={isEditing}
      />
    </div>
  );
};

export default ClientManagementPage;