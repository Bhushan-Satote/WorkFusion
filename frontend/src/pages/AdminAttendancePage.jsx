import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { FaClock, FaUser, FaEnvelope, FaCalendarAlt, FaDownload, FaFilter, FaExclamationCircle, FaCheckCircle, FaTimesCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const AdminAttendancePage = () => {
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ userId: '', from: '', to: '', type: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.type) params.append('type', filters.type);
      
      const queryString = params.toString();
      const url = queryString ? `/attendance/admin/list?${queryString}` : '/attendance/admin/list';
      
      const res = await axios.get(url);
      const records = res.data.data || [];
      console.log('📊 Fetched records:', records.length);
      console.log('📋 Status values found:', [...new Set(records.map(r => r.status))]);
      console.log('📋 Sample records:', records.slice(0, 3));
      setAllRecords(records);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Set filtered records to all records (backend handles filtering)
  useEffect(() => {
    setFilteredRecords(allRecords);
    setCurrentPage(1); // Reset to first page when data changes
  }, [allRecords]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const exportCsv = () => {
    const header = ['User','Email','Status','Check In','Check Out'];
    const rows = filteredRecords.map(r => [
      r.userId?.name || '',
      r.userId?.email || '',
      r.type || '',
      r.type === 'check-in' && r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
      r.type === 'check-out' && r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
    ]);
    const csv = [header, ...rows].map(a => a.map(v => `"${(v ?? '').toString().replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#8BBAFC]/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start md:items-center">
              <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
                <FaClock className="text-white text-xl sm:text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Attendance Management</h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                <p className="text-white/90 text-xs sm:text-sm mt-1">Search, filter, and export attendance records</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white text-[#1b66d1] text-xs sm:text-sm font-semibold shadow-sm border border-white/70">Total: {allRecords.length}</span>
              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/15 text-white text-xs sm:text-sm font-medium">Checked In: {allRecords.filter(r => r.status !== 'checked-out').length}</span>
              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/15 text-white text-xs sm:text-sm font-medium">Checked Out: {allRecords.filter(r => r.status === 'checked-out').length}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC] mb-6">
        <div className="p-4 bg-[#418EFD] text-white flex items-center">
          <FaFilter className="mr-2" />
          <h2 className="text-lg font-semibold">Attendance Filters</h2>
        </div>
        
        <div className="p-4">
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2A2A34] mb-2">
                <FaUser className="inline mr-1" />
                Search User
              </label>
              <input 
                className="w-full border border-[#8BBAFC] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#418EFD] focus:border-transparent" 
                placeholder="Search by name, email, or ID" 
                value={filters.userId} 
                onChange={e=>setFilters({ ...filters, userId: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#2A2A34] mb-2">
                <FaCalendarAlt className="inline mr-1" />
                From Date
              </label>
              <input 
                className="w-full border border-[#8BBAFC] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#418EFD] focus:border-transparent" 
                type="date" 
                value={filters.from} 
                onChange={e=>setFilters({ ...filters, from: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#2A2A34] mb-2">
                <FaCalendarAlt className="inline mr-1" />
                To Date
              </label>
              <input 
                className="w-full border border-[#8BBAFC] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#418EFD] focus:border-transparent" 
                type="date" 
                value={filters.to} 
                onChange={e=>setFilters({ ...filters, to: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#2A2A34] mb-2">
                <FaClock className="inline mr-1" />
                Type
              </label>
              <select 
                className="w-full border border-[#8BBAFC] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#418EFD] focus:border-transparent" 
                value={filters.type} 
                onChange={e=>setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="check-in">Check In</option>
                <option value="check-out">Check Out</option>
              </select>
            </div>
            
            <div className="flex flex-col justify-end">
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilters({ userId: '', from: '', to: '', type: '' })}
                  className="bg-[#6B7280] hover:bg-[#4B5563] text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <FaFilter className="mr-1" />
                  Clear
                </button>
                <button 
                  onClick={exportCsv} 
                  className="bg-[#4A4A57] hover:bg-[#3a3a47] text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <FaDownload className="mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC]">
        <div className="p-4 bg-[#418EFD] text-white flex items-center justify-between">
          <div className="flex items-center">
            <FaClock className="mr-2" />
            <h2 className="text-lg font-semibold">Attendance Records</h2>
          </div>
          <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {filteredRecords.length} of {allRecords.length} records
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#418EFD]/10 border-b border-[#8BBAFC]">
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaUser className="text-[#418EFD]" />
                    <span>User</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaEnvelope className="text-[#418EFD]" />
                    <span>Email</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-[#418EFD]" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaCheckCircle className="text-[#418EFD]" />
                    <span>Check In</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaTimesCircle className="text-[#418EFD]" />
                    <span>Check Out</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8BBAFC]/30">
              {currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-[#418EFD]/5 transition-colors">
                    <td className="py-3 px-4 text-[#2A2A34] font-medium">{record.userId?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-[#4A4A57]">{record.userId?.email || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'checked-out' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {record.status === 'checked-out' ? (
                          <>
                            <FaTimesCircle className="mr-1" />
                            Checked Out
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="mr-1" />
                            Checked In
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#4A4A57]">
                      {record.checkInTime
                        ? new Date(record.checkInTime).toLocaleString()
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-[#4A4A57]">
                      {record.checkOutTime
                        ? new Date(record.checkOutTime).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[#4A4A57]">
                    <FaClock className="mx-auto text-4xl text-[#418EFD]/50 mb-3" />
                    <p className="font-medium">No attendance records found.</p>
                    <p className="text-sm text-[#4A4A57]/80">Try adjusting your filters or check back later.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-[#8BBAFC]/30 flex items-center justify-between">
            <div className="flex items-center text-sm text-[#4A4A57]">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-[#4A4A57] bg-white border border-[#8BBAFC] rounded-lg hover:bg-[#418EFD]/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                  // Show first page, last page, current page, and pages around current page
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNumber
                            ? 'bg-[#418EFD] text-white'
                            : 'text-[#4A4A57] bg-white border border-[#8BBAFC] hover:bg-[#418EFD]/5'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="px-2 text-[#4A4A57]">...</span>;
                  }
                  return null;
                })}
              </div>
              
              {/* Next Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 text-sm font-medium text-[#4A4A57] bg-white border border-[#8BBAFC] rounded-lg hover:bg-[#418EFD]/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <FaChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendancePage;


