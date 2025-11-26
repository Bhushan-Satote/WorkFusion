import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createLeave, updateLeave, fetchLeaves } from '../../store/leaveStore';
import { useUser } from '../../context/UserContext';
import { FaCalendarAlt,FaExclamationCircle } from 'react-icons/fa';

const LeaveForm = ({ isOpen, onClose, isEditing = false, leave }) => {
  const dispatch = useDispatch();
  const { user } = useUser();
  const { isLoading, error } = useSelector((state) => state.leaves);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    user_id: user?.userId || '',
    from_date: '',
    to_date: '',
    leave_type: 'casual leave',
    reason: '',
    status: 'pending' // Added default status
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && leave) {
        setFormData({
          user_id: leave.user_id || user?.userId || '',
          from_date: leave.from_date ? new Date(leave.from_date).toISOString().split('T')[0] : '',
          to_date: leave.to_date ? new Date(leave.to_date).toISOString().split('T')[0] : '',
          leave_type: leave.leave_type || 'casual leave',
          reason: leave.reason || '',
          status: leave.status || 'pending'
        });
      } else {
        // Reset form for new leave
        setFormData({
          user_id: user?.userId || '',
          from_date: '',
          to_date: '',
          leave_type: 'casual leave',
          reason: '',
          status: 'pending'
        });
      }
    }
  }, [isOpen, isEditing, leave, user]);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // From date validation
    if (!formData.from_date) {
      newErrors.from_date = 'Start date is required';
    } else {
      const fromDate = new Date(formData.from_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (fromDate < today) {
        newErrors.from_date = 'Start date cannot be in the past';
      }
    }

    // To date validation
    if (!formData.to_date) {
      newErrors.to_date = 'End date is required';
    } else if (formData.from_date) {
      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);
      
      if (toDate < fromDate) {
        newErrors.to_date = 'End date must be after start date';
      }
    }

    // Leave type validation
    if (!formData.leave_type) {
      newErrors.leave_type = 'Leave type is required';
    }

    // Reason validation
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Please provide a more detailed reason (minimum 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditing && leave?._id) {
        await dispatch(updateLeave({ 
          id: leave._id,
          leaveData: formData
        }));
      } else {
        await dispatch(createLeave(formData)); // Remove the spread operator since status is already in formData
      }
      
      await dispatch(fetchLeaves());
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Single visibility check
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="bg-[#FFFFFF] rounded-xl p-6 z-10 w-full max-w-md shadow-2xl transform transition-all relative">
        <div className="border-b border-[#8BBAFC] mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-[#418EFD] text-xl" />
              <h2 className="text-[#2A2A34] text-xl font-bold">
                {isEditing ? 'Edit Leave Request' : 'Create New Leave Request'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#4A4A57] hover:text-[#2A2A34] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#F44336]/10 text-[#F44336] p-3 rounded-lg mb-4 flex items-center text-sm">
            <FaExclamationCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[#2A2A34] text-xs font-medium">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="from_date"
                value={formData.from_date}
                onChange={handleChange}
                min={today}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#418EFD] ${
                  errors.from_date 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-[#8BBAFC]/30 focus:border-[#418EFD]'
                }`}
              />
              {errors.from_date && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <FaExclamationCircle className="w-3 h-3 mr-1" />
                  {errors.from_date}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[#2A2A34] text-xs font-medium">
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="to_date"
                value={formData.to_date}
                onChange={handleChange}
                min={formData.from_date || today}
                className={`w-full px-3 py-1.5 rounded-lg border bg-gray-50 focus:ring-1 focus:ring-opacity-50 transition-all duration-200 text-sm ${
                  errors.to_date 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-[#8BBAFC] focus:border-[#418EFD] focus:ring-[#418EFD]'
                }`}
              />
              {errors.to_date && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <FaExclamationCircle className="w-3 h-3 mr-1" />
                  {errors.to_date}
                </p>
              )}
            </div>

            <div className="col-span-2 space-y-1">
              <label className="block text-[#2A2A34] text-xs font-medium">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                name="leave_type"
                value={formData.leave_type}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 rounded-lg border bg-gray-50 focus:ring-1 focus:ring-opacity-50 transition-all duration-200 text-sm ${
                  errors.leave_type 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-[#8BBAFC] focus:border-[#418EFD] focus:ring-[#418EFD]'
                }`}
              >
                <option value="casual leave">Casual Leave</option>
                <option value="duty leave">Duty Leave</option>
                <option value="special leave">Special Leave</option>
                <option value="sick leave">Sick Leave</option>
                <option value="personal leave">Personal Leave</option>
              </select>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="block text-[#2A2A34] text-xs font-medium">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 rounded-lg border bg-gray-50 focus:ring-1 focus:ring-opacity-50 transition-all duration-200 min-h-[80px] text-sm ${
                  errors.reason 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-[#8BBAFC] focus:border-[#418EFD] focus:ring-[#418EFD]'
                }`}
                rows="3"
                placeholder="Please provide a detailed reason for your leave request"
              />
              {errors.reason && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <FaExclamationCircle className="w-3 h-3 mr-1" />
                  {errors.reason}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-[#2A2A34] text-[#2A2A34] hover:bg-[#2A2A34] hover:text-white transition-colors duration-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 rounded-lg bg-[#418EFD] text-white hover:bg-[#307ae3] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? 'Processing...' : isEditing ? 'Update Leave Request' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm;