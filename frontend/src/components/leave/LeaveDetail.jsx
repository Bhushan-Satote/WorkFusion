import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaEdit, FaCalendarAlt, FaUser, FaInfoCircle, FaCheck, FaTimes } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import { acceptLeave, rejectLeave, fetchLeaves } from '../../store/leaveStore';

const LeaveDetail = ({ isOpen, onClose, leaveId, onEdit }) => {
  const dispatch = useDispatch();
  const { user } = useUser();
  const isAdmin = user?.role === 'Admin';
  
  // Get leave from Redux store
  const leave = useSelector(state => 
    state.leaves.leaves.find(leave => leave._id === leaveId)
  );
  const loading = useSelector(state => state.leaves.isLoading);
  const error = useSelector(state => state.leaves.error);

  const handleApprove = async () => {
    try {
      await dispatch(acceptLeave(leaveId)).unwrap();
      await dispatch(fetchLeaves());
      onClose();
    } catch (err) {
      console.error('Failed to approve leave:', err);
    }
  };

  const handleReject = async () => {
    try {
      const remarks = window.prompt('Please provide a reason for rejection:');
      if (remarks === null) return; // cancelled
      await dispatch(rejectLeave({ id: leaveId, admin_remarks: remarks })).unwrap();
      await dispatch(fetchLeaves());
      onClose();
    } catch (err) {
      console.error('Failed to reject leave:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!isOpen) return null;

  console.log("LeaveDetail rendering with:", { isOpen, leaveId, leave });

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="bg-[#418EFD] text-white p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold flex items-center">
              <FaCalendarAlt className="mr-2" />
              Leave Request Details
            </h1>
            <div className="flex space-x-2">
              {leave && leave.status === 'Pending' && (
                <button 
                  onClick={() => {
                    if (onEdit) onEdit(leave);
                    onClose();
                  }} 
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center transition-colors duration-200 text-sm"
                >
                  <FaEdit className="mr-1.5" />
                  Edit
                </button>
              )}
              <button 
                onClick={onClose} 
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center transition-colors duration-200 text-sm"
              >
                <FaTimes className="mr-1.5" />
                Close
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          </div>
        ) : !leave ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-700">Leave request not found</h2>
            <p className="text-gray-500 mt-1">The leave request you're looking for doesn't exist or has been removed.</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#418EFD]/5 p-6 rounded-xl border border-[#8BBAFC]/30">
                <h2 className="text-lg font-semibold mb-4 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">
                  Employee Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center p-3 rounded-lg   border-[#8BBAFC]/30">
                    <FaUser className="text-[#418EFD] mr-3 text-base" />
                    <div>
                      <p className="text-sm text-[#4A4A57]">Employee Name</p>
                      <p className="font-medium text-[#2A2A34] mt-1">{leave.user_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg  border-[#8BBAFC]/30">
                    <FaInfoCircle className="text-[#418EFD] mr-3 text-base" />
                    <div>
                      <p className="text-sm text-[#4A4A57]">Leave Type</p>
                      <p className="font-medium text-[#2A2A34] mt-1">{leave.leave_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg  border-[#8BBAFC]/30">
                    <FaInfoCircle className="text-[#418EFD] mr-3 text-base" />
                    <div>
                      <p className="text-sm text-[#4A4A57]">Status</p>
                      <p className="font-medium mt-1">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {leave.status || 'Pending'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#418EFD]/5 p-6 rounded-xl border border-[#8BBAFC]/30">
                <h2 className="text-lg font-semibold mb-4 text-[#2A2A34] border-b border-[#8BBAFC]/30 pb-2">
                  Leave Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border-[#8BBAFC]/30">
                    <p className="text-sm text-[#4A4A57]">From Date</p>
                    <p className="font-medium text-[#2A2A34] mt-1">{formatDate(leave.from_date)}</p>
                  </div>
                  <div className="p-3 rounded-lg border-[#8BBAFC]/30">
                    <p className="text-sm text-[#4A4A57]">To Date</p>
                    <p className="font-medium text-[#2A2A34] mt-1">{formatDate(leave.to_date)}</p>
                  </div>
                  {leave.status_updated_at && (
                    <div className="p-3 rounded-lg border-[#8BBAFC]/30">
                      <p className="text-sm text-[#4A4A57]">Status Updated</p>
                      <p className="font-medium text-[#2A2A34] mt-1">{formatDate(leave.status_updated_at)}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-white border border-[#8BBAFC]/30">
                  <p className="text-sm text-[#4A4A57]">Reason</p>
                  <p className="font-medium text-[#2A2A34] mt-2 p-3 rounded bg-[#418EFD]/5 border border-[#8BBAFC]/30">{leave.reason}</p>
                </div>
                {leave.admin_remarks && (
                  <div className="mt-4 p-3 rounded-lg bg-white border border-[#8BBAFC]/30">
                    <p className="text-sm text-[#4A4A57]">Admin Remarks</p>
                    <p className="font-medium text-[#2A2A34] mt-2 p-3 rounded bg-[#418EFD]/5 border border-[#8BBAFC]/30">{leave.admin_remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {isAdmin && leave.status === 'Pending' && (
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleApprove}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                >
                  <FaCheck className="mr-2" />
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                >
                  <FaTimes className="mr-2" />
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveDetail;