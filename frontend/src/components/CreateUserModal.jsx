import React, { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import { FaExclamationCircle } from 'react-icons/fa';

const CreateUserModal = ({ isOpen, onClose, onUserCreated, user, onUserUpdated }) => {
    const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee'); 
  const [name, setName] = useState(''); 
  const [password, setPassword] = useState('');
  // Remove status state
  const { createUser, updateUser, error, isLoading } = useUserStore();
  
  // Determine if we're in edit mode
  const isEditMode = !!user;
  
  // Load user data when in edit mode
  useEffect(() => {
    if (user) {
            setEmail(user.email || '');
      setName(user.name || '');
      setRole(user.credentialId?.role || user.role || '');
      setPassword('');
    }
  }, [user]);
  
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      newErrors.name = 'Full name can only contain letters and spaces';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (only for new users or when password is provided in edit mode)
    if (!isEditMode || password.length > 0) {
      if (!isEditMode && !password) {
        newErrors.password = 'Password is required';
      } else if (password.length > 0 && password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    // Role validation
    if (!role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const userData = { 
      name, 
      email,
      role,
      // Remove status from userData
    };
    
    // Include password: required in create, optional in edit
    if (isEditMode) {
      if (password && password.length >= 6) {
        userData.password = password;
      }
    } else {
      // Create mode: password is required and validated above
      userData.password = password;
    }
    
    let result;
    
    if (isEditMode) {
      // Update existing user
      result = await updateUser(user._id, userData);
      if (result && !error) {
        onUserUpdated && onUserUpdated();
        onClose();
      }
    } else {
      // Create new user
      result = await createUser(userData);
      if (result && !error) {
        // Reset form
        setEmail('');
        setRole('Employee');
        setName('');
        setPassword('');
        // Notify parent component
        onUserCreated && onUserCreated();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-xl p-8 z-10 w-full max-w-md shadow-2xl transform transition-all animate-slideIn">
        <div className="flex items-center justify-between mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6 flex items-center">
            <FaExclamationCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#8BBAFC]/30 focus:border-[#418EFD] focus:ring-[#418EFD]/20'
                  } transition-all bg-white hover:bg-[#418EFD]/5`}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-1.5 text-gray-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#8BBAFC]/30 focus:border-[#418EFD] focus:ring-[#418EFD]/20'
                  } transition-all bg-white hover:bg-[#418EFD]/5`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                {isEditMode ? 'Password (Optional)' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#8BBAFC]/30 focus:border-[#418EFD] focus:ring-[#418EFD]/20'
                  } transition-all bg-white hover:bg-[#418EFD]/5`}
                  required={!isEditMode}
                  placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="w-4 h-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-1.5 text-gray-700">Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#8BBAFC]/30 focus:border-[#418EFD] focus:ring-[#418EFD]/20'
                  } transition-all bg-white hover:bg-[#418EFD]/5`}
                >
                  <option value="">Select a role</option>
                  <option value="Employee">Employee</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Project Lead">Project Lead</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="w-4 h-4 mr-1" />
                    {errors.role}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isEditMode ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    )}
                  </svg>
                  {isEditMode ? 'Update User' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;