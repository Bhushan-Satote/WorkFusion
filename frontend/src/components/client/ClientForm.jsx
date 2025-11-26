import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createClient, updateClient, clearCurrentClient } from '../../store/clientStore';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaExclamationCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const ClientForm = ({ isOpen, onClose, isEditing = false }) => {
  const dispatch = useDispatch();
  const { currentClient, isLoading, error } = useSelector((state) => state.clients);

  const [formData, setFormData] = useState({
    client_name: '',
    client_contact: {
      email: '',
      phone: ''
    }
  });

  useEffect(() => {
    if (isEditing && currentClient) {
      setFormData({
        client_name: currentClient.client_name || '',
        client_contact: {
          email: currentClient.client_contact?.email || '',
          phone: currentClient.client_contact?.phone || ''
        }
      });
    }

    return () => {
      if (isEditing) {
        dispatch(clearCurrentClient());
      }
    };
  }, [isEditing, currentClient, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email' || name === 'phone') {
      setFormData({
        ...formData,
        client_contact: {
          ...formData.client_contact,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear specific error when input becomes valid
    if (name === 'client_name') {
      if (value.trim() && value.trim().length >= 2) {
        setErrors(prev => ({ ...prev, client_name: '' }));
      }
    } else if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.trim() && emailRegex.test(value)) {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    } else if (name === 'phone') {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (value.trim() && phoneRegex.test(value)) {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    }
  };

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Client name validation
    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required';
    } else if (formData.client_name.trim().length < 2) {
      newErrors.client_name = 'Client name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.client_contact.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.client_contact.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!formData.client_contact.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.client_contact.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEditing && currentClient) {
      await dispatch(updateClient({ id: currentClient._id, clientData: formData }));
    } else {
      await dispatch(createClient(formData));
    }
    
    if (!error) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#2A2A34]/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm transform transition-all">
        <div className="flex justify-between items-center p-3 border-b border-[#8BBAFC]">
          <h2 className="text-lg font-semibold text-[#2A2A34] flex items-center">
            <FaUser className="text-[#418EFD] mr-2" />
            {isEditing ? 'Edit Client' : 'Create New Client'}
          </h2>
          <button 
            onClick={onClose}
            className="text-[#4A4A57] hover:text-[#2A2A34] transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {error && (
            <div className="bg-[#F44336]/10 border border-[#F44336] text-[#F44336] px-4 py-3 rounded-lg relative mb-4 flex items-center" role="alert">
              <FaExclamationCircle className="mr-2" />
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <label className="block text-[#2A2A34] text-sm font-medium mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="client_name"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.client_name 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-[#8BBAFC] focus:ring-[#418EFD]/50 focus:border-[#418EFD]'
                    } text-[#2A2A34] focus:ring-2 transition-all bg-gray-50 hover:bg-gray-50/80`}
                    placeholder="Enter client name"
                  />
                </div>
                {errors.client_name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="mr-1 h-4 w-4" />
                    {errors.client_name}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-[#2A2A34] text-sm font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.client_contact.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.email 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-[#8BBAFC] focus:ring-[#418EFD]/50 focus:border-[#418EFD]'
                    } text-[#2A2A34] focus:ring-2 transition-all bg-gray-50 hover:bg-gray-50/80`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="mr-1 h-4 w-4" />
                    {errors.email}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-[#2A2A34] text-sm font-medium mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.client_contact.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.phone 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-[#8BBAFC] focus:ring-[#418EFD]/50 focus:border-[#418EFD]'
                    } text-[#2A2A34] focus:ring-2 transition-all bg-gray-50 hover:bg-gray-50/80`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="mr-1 h-4 w-4" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-[#8BBAFC]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#8BBAFC] text-[#2A2A34] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-[#418EFD] text-white hover:bg-[#307ae3] transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    {isEditing ? 'Update Client' : 'Create Client'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;