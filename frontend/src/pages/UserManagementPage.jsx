import React, { useEffect, useState, useRef } from 'react';
import useUserStore from '../store/userStore';
import { useUser } from '../context/UserContext';
import { FaUser, FaEnvelope, FaPhone, FaUserCog } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import CreateUserModal from '../components/CreateUserModal';
import { FaUsers, FaPlus, FaTimes, FaSearch, FaEye, FaRobot, FaComments, FaChevronUp } from 'react-icons/fa';
import ChatComponent from '../components/ChatComponent';

const UserManagementPage = () => {
  const { user } = useUser();
  const { users, fetchUsers, isLoading, error, deactivateUser, reactivateUser } = useUserStore();
  const chatRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionConfirmId, setActionConfirmId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showChatAssistant, setShowChatAssistant] = useState(true);
  const [minimizedChat, setMinimizedChat] = useState(true);
  
  const isAdmin = user?.role === 'Admin';
  
  const usersPerPage = 8;
  
  useEffect(() => {
    // Modify this section to only fetch all users
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchUsers, isAdmin]);
  
  // Only allow admins to change user status
  const handleStatusChange = async (userId, action) => {
    if (!isAdmin) return;
    
    if (action === 'deactivate') {
      await deactivateUser(userId);
    } else if (action === 'reactivate') {
      await reactivateUser(userId);
    }
    fetchUsers(); // Refresh the list after status change
    setActionConfirmId(null);
    setActionType(null);
  };
  
  const handleUserCreated = () => {
    if (isAdmin) {
      fetchUsers(); // Refresh the user list after creation
    }
  };
  
  // Update the filter users function to safely handle undefined properties
  const filteredUsers = users?.filter(user => {
    if (!searchTerm.trim()) return true;
    
    // Safely access nested properties
    const username = (user?.credentialId?.username || user?.username || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();
    const role = (user?.credentialId?.role || user?.role || '').toLowerCase();
    const contactNumber = user?.contact_number || '';
    const userId = user?._id || '';
    
    const searchLower = searchTerm.toLowerCase();
    
    return username.includes(searchLower) || 
           email.includes(searchLower) ||
           role.includes(searchLower) ||
           contactNumber.includes(searchLower) ||
           userId.includes(searchLower);
  });
  
  // Add null checks for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers?.slice(indexOfFirstUser, indexOfLastUser) || [];
  const totalPages = Math.ceil((filteredUsers?.length || 0) / usersPerPage);
  
  // Update the handleUserUpdated function with better error handling
  const handleUserUpdated = async () => {
    try {
      if (isAdmin) {
        await fetchUsers(); // Wait for the users to be fetched
      }
      setIsModalOpen(false);
      setUserToEdit(null);
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };
  
  // Fix the view modal structure at the bottom of the component
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Show different header based on user role */}
      <div className="mb-6">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#8BBAFC]/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start md:items-center">
              <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
                <FaUsers className="text-white text-xl sm:text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                  {isAdmin ? 'User Management' : 'My Profile'} 
                </h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                <p className="text-white/90 text-xs sm:text-sm mt-1">
                  {isAdmin ? 'Manage users, roles, and access' : 'View and update your personal information'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center px-4 py-2 rounded-lg bg-white text-[#1b66d1] hover:bg-[#f4f8ff] border border-white/70 shadow-sm transition-colors"
              >
                <FaPlus className="w-5 h-5 mr-2" />
                Create User
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat Window - Always visible */}
      <div 
        ref={chatRef}
        className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out ${minimizedChat ? 'h-14 w-14' : 'h-[600px] w-[750px]'}`}
      >
        <div className="flex flex-col h-full bg-white rounded-xl shadow-2xl border border-[#8BBAFC] overflow-hidden">
          {minimizedChat ? (
            <button 
              onClick={() => setMinimizedChat(false)}
              className="w-full h-full flex items-center justify-center bg-[#418EFD] text-white rounded-xl hover:bg-[#307ae3] transition-colors"
            >
              <FaComments className="text-2xl" />
            </button>
          ) : (
            <>
              <div className="bg-[#418EFD] text-white p-3 flex justify-between items-center">
                <h3 className="font-semibold flex items-center">
                  <FaRobot className="mr-2" />
                  AI Assistant
                </h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setMinimizedChat(true)}
                    className="p-1 hover:bg-[#307ae3] rounded transition-colors"
                    title="Minimize"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
              <div className="flex-grow overflow-hidden">
                <ChatComponent />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Only show search bar and user list to admins */}
      {isAdmin ? (
        <>
          {/* Search bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-[#418EFD]" />
              </div>
              <input
                type="text"
                placeholder="Search by username, email, role or contact number..."
                className="pl-10 pr-4 py-2 border border-[#8BBAFC] rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#418EFD] focus:border-[#418EFD]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* User list table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC]">
            <div className="p-4 bg-[#418EFD] text-white flex items-center">
              <FaUsers className="mr-2" />
              <h2 className="text-lg font-semibold">User List</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#418EFD]/10 border-b border-[#8BBAFC]">
                    <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>Username</span>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>Email</span>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>Contact Number</span>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>Role</span>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8BBAFC]/30">
                  {currentUsers && currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <tr key={user?._id || Math.random().toString()} className="hover:bg-[#418EFD]/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user?.profile_picture?.url ? (
                              <img
                                src={user.profile_picture.url}
                                alt={user?.name || user?.credentialId?.username || user?.username || 'User'}
                                className="w-9 h-9 rounded-full object-cover border mr-3"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#418EFD]/10 text-[#418EFD] flex items-center justify-center mr-3 font-semibold">
                                {(user?.name || user?.credentialId?.username || user?.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="text-sm font-medium text-[#2A2A34]">
                              {user?.name || user?.credentialId?.name || user?.credentialId?.username || user?.username}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          {user.email_verified && (
                            <div className="text-xs text-green-600 flex items-center mt-1">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Verified
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.contact_number || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            (user.credentialId?.role || user.role) === 'Admin' 
                              ? 'bg-[#418EFD]/10 text-[#418EFD] border border-[#418EFD]/20' 
                              : 'bg-[#8BBAFC]/10 text-[#8BBAFC] border border-[#8BBAFC]/20'
                          }`}>
                            {user.credentialId?.role || user.role}
                          </span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => {
                                setViewUser(user);
                                setIsViewModalOpen(true);
                              }}
                              className="text-[#418EFD] hover:text-[#307ae3] inline-flex items-center hover:bg-[#418EFD]/10 px-2 py-1 rounded transition-colors"
                            >
                              <FaEye className="w-4 h-4 mr-1" />
                              View
                            </button>
                            <button 
                              onClick={() => {
                                setUserToEdit(user);
                                setIsModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            {actionConfirmId === user._id ? (
                              <div className="inline-flex items-center space-x-2 bg-red-50 px-2 py-1 rounded border border-red-100">
                                <button 
                                  onClick={() => handleStatusChange(user._id, actionType)} 
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={() => {
                                    setActionConfirmId(null);
                                    setActionType(null);
                                  }} 
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                {user.status === 'active' ? (
                                  <button 
                                    onClick={() => {
                                      setActionConfirmId(user._id);
                                      setActionType('deactivate');
                                    }} 
                                    className="text-red-600 hover:text-red-900 inline-flex items-center hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      setActionConfirmId(user._id);
                                      setActionType('reactivate');
                                    }} 
                                    className="text-green-600 hover:text-green-900 inline-flex items-center hover:bg-green-50 px-2 py-1 rounded transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Reactivate
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <FaUsers className="text-[#418EFD]/30 text-5xl mb-4" />
                          <p className="text-lg font-medium text-[#2A2A34]">
                            {searchTerm ? 'No matching users found' : 'No users found'}
                          </p>
                          <p className="text-sm text-[#4A4A57] mt-2">
                            {searchTerm ? (
                              <>
                                Try adjusting your search criteria or 
                                <button 
                                  onClick={() => setSearchTerm('')}
                                  className="text-[#418EFD] hover:text-[#307ae3] ml-1"
                                >
                                  clear search
                                </button>
                              </>
                            ) : (
                              'Get started by creating a new user'
                            )}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination with updated colors */}
            {filteredUsers && filteredUsers.length > usersPerPage && (
              <div className="px-6 py-3 bg-[#418EFD]/5 border-t border-[#8BBAFC]/30 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastUser, filteredUsers.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredUsers.length}</span> users
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? "bg-[#418EFD]/10 text-[#418EFD]/40 cursor-not-allowed"
                        : "bg-[#418EFD]/10 text-[#418EFD] hover:bg-[#418EFD]/20"
                    }`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + idx;
                    } else {
                      pageNumber = currentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNumber
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? "bg-[#418EFD]/10 text-[#418EFD]/40 cursor-not-allowed"
                        : "bg-[#418EFD]/10 text-[#418EFD] hover:bg-[#418EFD]/20"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // For non-admin users, show only their own profile information
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC] p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-[#418EFD]/10 rounded-full flex items-center justify-center mb-4">
              <FaUser className="text-[#418EFD] text-4xl" />
            </div>
            <h2 className="text-xl font-semibold">{user?.name || user?.username}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium bg-[#418EFD]/10 text-[#418EFD] border border-[#418EFD]/20`}>
              {user?.role}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                <div className="mt-2 flex items-center">
                  <FaEnvelope className="text-[#418EFD] mr-2" />
                  <span>{user?.email}</span>
                </div>
                <div className="mt-2 flex items-center">
                  <FaPhone className="text-[#418EFD] mr-2" />
                  <span>{user?.contact_number || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => {
                setUserToEdit(user);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-[#418EFD] text-white rounded-lg hover:bg-[#307ae3] transition-colors duration-200 shadow-md"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update Profile
            </button>
          </div>
        </div>
      )}

      {/* Modals with updated colors - available to both admin and non-admin users */}
      <CreateUserModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setUserToEdit(null);
        }} 
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
        user={userToEdit}
        currentUserRole={user?.role || 'User'} // Pass the current user's role here
      />
      
      {/* User Details Modal with updated colors */}
      {viewUser && (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity ${isViewModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-[#8BBAFC]">
            <div className="bg-[#418EFD] text-white p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold flex items-center">
                  <FaUser className="mr-2" />
                  User Details
                </h3>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setViewUser(null);
                  }}
                  className="bg-[#4A4A57] hover:bg-[#2A2A34] text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                >
                  <FaTimes className="mr-2" />
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Rest of the user details content */}
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="h-20 w-20 rounded-full bg-[#418EFD] flex items-center justify-center text-white text-2xl font-semibold">
                    {(viewUser?.credentialId?.username || viewUser?.username || '').charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-6">
                    <h4 className="text-lg font-medium text-[#2A2A34]">
                      {viewUser?.name || 'N/A'}
                    </h4>
                    <p className="text-sm text-[#4A4A57]">
                      {viewUser?.credentialId?.username || viewUser?.username}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#4A4A57] block mb-1">Email</label>
                      <div className="flex items-center text-[#2A2A34]">
                        <FaEnvelope className="text-[#418EFD] mr-2" />
                        {viewUser?.email}
                        {viewUser?.email_verified && (
                          <span className="ml-2 text-green-600 text-xs flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-[#4A4A57] block mb-1">Contact Number</label>
                      <div className="flex items-center text-[#2A2A34]">
                        <FaPhone className="text-[#418EFD] mr-2" />
                        {viewUser?.contact_number || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#4A4A57] block mb-1">Role</label>
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          (viewUser?.credentialId?.role || viewUser?.role) === 'Admin'
                            ? 'bg-[#418EFD]/10 text-[#418EFD] border border-[#418EFD]/20'
                            : 'bg-[#8BBAFC]/10 text-[#8BBAFC] border border-[#8BBAFC]/20'
                        }`}>
                          {viewUser?.credentialId?.role || viewUser?.role}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-[#4A4A57] block mb-1">Status</label>
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          viewUser?.status === 'active'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {viewUser?.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;