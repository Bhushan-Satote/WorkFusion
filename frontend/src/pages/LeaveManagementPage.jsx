import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaves, acceptLeave, rejectLeave, setCurrentLeave, clearCurrentLeave } from '../store/leaveStore';
import LeaveList from '../components/leave/LeaveList';
import LeaveForm from '../components/leave/LeaveForm';
import LeaveDetail from '../components/leave/LeaveDetail';
import { FaPlus, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import { useUser } from '../context/UserContext';

const LeaveManagementPage = () => {
  const dispatch = useDispatch();
  const { user } = useUser();
  const { leaves, isLoading, error } = useSelector((state) => state.leaves);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    dispatch(fetchLeaves());
  }, [dispatch]);

  useEffect(() => {
    if (!leaves) return;

    // Base list (by role)
    const baseLeaves = isAdmin ? leaves : leaves.filter(leave => leave.user_id === user?.userId);

    // Filter by status
    const filtered = filterStatus === 'all'
      ? baseLeaves
      : baseLeaves.filter(leave => leave.status === filterStatus);

    // Sort so most recently acted-on (status_updated_at) or newly created (createdAt) are on top
    const sorted = [...filtered].sort((a, b) => {
      const aStatus = a.status_updated_at ? new Date(a.status_updated_at).getTime() : 0;
      const bStatus = b.status_updated_at ? new Date(b.status_updated_at).getTime() : 0;
      if (aStatus !== bStatus) return bStatus - aStatus;
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    });

    setFilteredLeaves(sorted);
  }, [leaves, filterStatus, isAdmin, user]);

  const handleApproveLeave = async (id) => {
    if (window.confirm('Are you sure you want to approve this leave request?')) {
      await dispatch(acceptLeave(id));
      await dispatch(fetchLeaves());
    }
  };

  const handleRejectLeave = async (id) => {
    const remarks = window.prompt('Please provide a reason for rejection:');
    if (remarks !== null) {
      await dispatch(rejectLeave({ id, admin_remarks: remarks }));
      await dispatch(fetchLeaves());
    }
  };

  const handleEditLeave = (leave) => {
    setSelectedLeave(leave);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
    dispatch(fetchLeaves()); // Refresh the list after modal closes
  };

  // Add success handler
  const handleLeaveSuccess = () => {
    dispatch(fetchLeaves()); // Refresh the list
    handleCloseModal(); // Close the modal
  };

  // Header metrics (role-aware)
  const baseLeaves = (isAdmin ? (leaves || []) : (leaves || []).filter(l => l.user_id === user?.userId));
  const totalLeaves = baseLeaves.length;
  const pendingCount = baseLeaves.filter(l => l.status === 'Pending').length;
  const approvedCount = baseLeaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = baseLeaves.filter(l => l.status === 'Rejected').length;

  return (
    <div className="container mx-auto px-4 md:px-6 py-6">
      <div className="mb-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#8BBAFC]/40">
          {/* Decorative radial highlight */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-white/20 blur-2xl sm:blur-3xl opacity-40"></div>
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-[#8BBAFC]/30 blur-2xl sm:blur-3xl opacity-50"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
            <div className="flex items-start md:items-center">
              <div className="relative p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
                <span className="absolute inset-0 rounded-xl animate-pulse bg-white/10" aria-hidden="true"></span>
                <FaCalendarAlt className="relative text-white text-xl sm:text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Leave Management</h1>
                <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                <p className="text-white/90 text-xs sm:text-sm mt-2">Apply for leave, track status, and manage approvals with clarity.</p>
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white text-[#1b66d1] text-xs sm:text-sm font-semibold shadow-sm border border-white/70">
                Total: {totalLeaves}
              </span>

              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/15 text-white text-xs sm:text-sm font-medium flex items-center">
                <FaHourglassHalf className="mr-1.5 sm:mr-2" /> {pendingCount} Pending
              </span>
              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/15 text-white text-xs sm:text-sm font-medium flex items-center">
                <FaCheckCircle className="mr-1.5 sm:mr-2" /> {approvedCount} Approved
              </span>
              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/15 text-white text-xs sm:text-sm font-medium flex items-center">
                <FaTimesCircle className="mr-1.5 sm:mr-2" /> {rejectedCount} Rejected
              </span>

              {!isAdmin && (
                <button
                  onClick={() => {
                    setSelectedLeave(null);
                    setIsModalOpen(true);
                  }}
                  className="relative bg-white text-[#1b66d1] hover:bg-[#f4f8ff] active:scale-[0.98] font-semibold py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl flex items-center transition-all border border-white/80 shadow-md focus:outline-none focus:ring-2 focus:ring-white/60"
                >
                  <span className="relative inline-flex items-center">
                    <span className="relative mr-2">
                      <span className="absolute inset-0 rounded-full bg-[#1b66d1]/20 animate-ping" aria-hidden="true"></span>
                      <FaPlus className="relative" />
                    </span>
                    New Leave
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="filterStatus">
            Filter by Status:
          </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="all">All Requests</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <LeaveList 
            leaves={filteredLeaves} 
            onEditLeave={handleEditLeave}
            onApproveLeave={handleApproveLeave}
            onRejectLeave={handleRejectLeave}
          />
        )}
      </div>

      {/* Update the LeaveForm usage */}
      <LeaveForm 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isEditing={!!selectedLeave}
        leave={selectedLeave}
        onSuccess={handleLeaveSuccess}
      />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<MainContent />} />
      <Route path="/view/:id" element={<LeaveDetail />} />
    </Routes>
  );
};

export default LeaveManagementPage;
