import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLeave, setCurrentLeave, fetchLeaves } from '../../store/leaveStore'; // Add fetchLeaves import
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaEye, FaCheck, FaTimes, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import { FaUser, FaEnvelope, FaPhone, FaUserCog } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import LeaveDetail from './LeaveDetail';

const LeaveList = ({ leaves, onEditLeave, onApproveLeave, onRejectLeave }) => {
  const dispatch = useDispatch();
  const { user } = useUser();
  const isAdmin = user?.role === 'Admin';
  const [hoveredLeaveId, setHoveredLeaveId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      dispatch(deleteLeave(id));
    }
  };

  const handleEdit = (leave) => {
    dispatch(setCurrentLeave(leave));
    if (onEditLeave) {
      onEditLeave(leave);
    }
  };

  const handleViewLeave = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    switch (normalizedStatus) {
      case 'approved':
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
    // Update the handlers to refresh data
    const handleApproveLeave = async (leaveId) => {
      try {
        await onApproveLeave?.(leaveId);
        await dispatch(fetchLeaves()); // Refresh the leaves data
      } catch (err) {
        console.error('Error approving leave:', err);
      }
    };

    const handleRejectLeave = async (leaveId) => {
      try {
        await onRejectLeave?.(leaveId);
        await dispatch(fetchLeaves()); // Refresh the leaves data
      } catch (err) {
        console.error('Error rejecting leave:', err);
      }
    };

  // Calculate duration in days between two dates
  const calculateDuration = (fromDate, toDate) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end days
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC]">
        <div className="p-4 bg-[#418EFD] text-white flex items-center">
          <FaCalendarAlt className="mr-2" />
          <h2 className="text-lg font-semibold">Leave Requests</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#418EFD]/10 border-b border-[#8BBAFC]">
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaUser className="text-[#418EFD]" />
                    <span>Employee</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt className="text-[#418EFD]" />
                    <span>Leave Type</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">From</th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">To</th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">Duration</th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">Status</th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaInfoCircle className="text-[#418EFD]" />
                    <span>Admin Remarks</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8BBAFC]/30">
              {leaves && leaves.length > 0 ? (
                leaves.map((leave) => (
                  <tr 
                    key={leave._id} 
                    className="hover:bg-[#418EFD]/5 transition-colors"
                    onMouseEnter={() => setHoveredLeaveId(leave._id)}
                    onMouseLeave={() => setHoveredLeaveId(null)}
                  >
                    <td className="py-3 px-4 text-[#2A2A34]">{leave.user_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-[#4A4A57]">
                        <FaCalendarAlt className="text-[#418EFD] mr-2" />
                        {leave.leave_type || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#4A4A57]">{formatDate(leave.from_date)}</td>
                    <td className="py-3 px-4 text-[#4A4A57]">{formatDate(leave.to_date)}</td>
                    <td className="py-3 px-4 text-[#4A4A57]">
                      {calculateDuration(leave.from_date, leave.to_date)} day(s)
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        leave.status?.toLowerCase() === 'approved' || leave.status?.toLowerCase() === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : leave.status?.toLowerCase() === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-[#418EFD]/10 text-[#418EFD]'
                      }`}>
                        {leave.status === 'accepted' ? 'Approved' : 
                         leave.status ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#4A4A57]">
                      {leave.admin_remarks ? (
                        <div className="max-w-[260px] truncate" title={leave.admin_remarks}>
                          {leave.admin_remarks}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-3 items-center">
                        <button 
                          onClick={() => handleViewLeave(leave._id)}
                          className="text-[#418EFD] hover:text-[#307ae3] p-1.5 hover:bg-[#418EFD]/10 rounded-md transition-colors"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        
                        {(!isAdmin && String(leave.user_id) === String(user?.userId) && 
                          (leave.status === 'Pending' || leave.status === 'pending' || !leave.status)) && (
                          <>
                            <Link 
                              to={`/leave-management/edit/${leave._id}`} 
                              className="text-[#418EFD] hover:text-[#307ae3] p-1.5 hover:bg-[#418EFD]/10 rounded-md transition-colors"
                              onClick={() => handleEdit(leave)}
                              title="Edit Request"
                            >
                              <FaEdit />
                            </Link>
                            
                            <button 
                              onClick={() => handleDelete(leave._id)} 
                              className="text-[#F44336] hover:text-[#d32f2f] p-1.5 hover:bg-[#F44336]/10 rounded-md transition-colors"
                              title="Delete Request"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}

                    
                         
                        {isAdmin && (leave.status === 'Pending' || leave.status === 'pending' || !leave.status) && (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleApproveLeave(leave._id)} // Updated handler
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center transition-colors"
                              title="Approve Leave"
                            >
                              <FaCheck className="mr-1.5" /> Accept
                            </button>
                            <button 
                              onClick={() => handleRejectLeave(leave._id)} // Updated handler
                              className="bg-[#F44336] hover:bg-[#d32f2f] text-white px-3 py-1.5 rounded-md text-sm flex items-center transition-colors"
                              title="Reject Leave"
                            >
                              <FaTimes className="mr-1.5" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FaCalendarAlt className="text-[#418EFD]/30 text-5xl mb-4" />
                      <p className="text-lg font-medium text-[#2A2A34]">No leave requests found</p>
                      <p className="text-sm text-[#4A4A57] mt-2">
                        {isAdmin ? "No leave requests have been submitted yet" : "Submit a new leave request to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Detail Modal */}
      <LeaveDetail 
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        leaveId={selectedLeaveId}
        onEdit={onEditLeave}
      />
    </>
  );
};

export default LeaveList;