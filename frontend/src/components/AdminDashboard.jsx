import React, { useEffect, useState } from 'react';
import useUserStore from '../store/userStore';
import { FaUsers, FaSpinner, FaProjectDiagram, FaCalendarAlt, FaBuilding, FaChartBar, 
  FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaTachometerAlt, FaChartPie, 
  FaArrowUp, FaArrowDown, FaFilter, FaSearch, FaEllipsisV, FaUserTie, FaEye, FaEdit, FaPlus } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../store/projectStore';
import { fetchLeaves } from '../store/leaveStore';
import { fetchClients } from '../store/clientStore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const AdminDashboard = () => {
  // Existing state and store connections
  const { users, fetchUsers, isLoading: usersLoading, error: usersError } = useUserStore();
  const dispatch = useDispatch();
  const { projects, isLoading: projectsLoading, error: projectsError } = useSelector(
    (state) => state.projects
  );
  const { leaves, isLoading: leavesLoading, error: leavesError } = useSelector(
    (state) => state.leaves
  );
  const { clients, isLoading: clientsLoading, error: clientsError } = useSelector(
    (state) => state.clients
  );
  
  // New state for interactive features
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [chartData, setChartData] = useState({
    leaveData: null,
    projectData: null,
    trendData: null
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompletedProjectsAlert, setShowCompletedProjectsAlert] = useState(true);

  // Load data from stores
  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await Promise.all([
        dispatch(fetchProjects()),
        dispatch(fetchLeaves()),
        dispatch(fetchClients())
      ]);
      setIsDataLoaded(true);
    };
    
    loadData();
  }, [fetchUsers, dispatch]);

  // Prepare chart data when all data is loaded
  useEffect(() => {
    if (isDataLoaded && leaves && projects && clients) {
      // Prepare leave status chart data
      const pendingLeaves = getPendingLeaves();
      const approvedLeaves = getApprovedLeaves();
      const rejectedLeaves = getRejectedLeaves();
      
      const leaveChartData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [
          {
            data: [pendingLeaves, approvedLeaves, rejectedLeaves],
            backgroundColor: ['#FBBF24', '#34D399', '#F87171'],
            borderColor: ['#F59E0B', '#10B981', '#EF4444'],
            borderWidth: 1,
          },
        ],
      };
      
      // Prepare project distribution chart data
      const clientProjects = getProjectsWithClients();
      const internalProjects = projects.length - clientProjects;
      
      // Get top 5 clients with most projects
      const clientProjectCounts = {};
      projects.forEach(project => {
        if (project.client_id) {
          clientProjectCounts[project.client_id] = (clientProjectCounts[project.client_id] || 0) + 1;
        }
      });
      
      const clientNames = {};
      clients.forEach(client => {
        clientNames[client._id] = client.name || 'Unknown Client';
      });
      
      const topClients = Object.entries(clientProjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([clientId, count]) => ({
          id: clientId,
          name: clientNames[clientId] || 'Unknown Client',
          count
        }));
      
      const projectChartData = {
        labels: topClients.map(client => client.name),
        datasets: [
          {
            label: 'Number of Projects',
            data: topClients.map(client => client.count),
            backgroundColor: [
              'rgba(54, 162, 235, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(255, 99, 132, 0.6)',
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };
      
      // Create trend data (simulated monthly data based on available data)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      
      // Simulate monthly user growth
      const userGrowth = months.map((_, index) => {
        // Simulate growth pattern based on current user count
        return Math.max(0, Math.floor(users.length * (0.7 + (index * 0.05))));
      });
      
      // Simulate monthly project growth
      const projectGrowth = months.map((_, index) => {
        // Simulate growth pattern based on current project count
        return Math.max(0, Math.floor((projects?.length || 0) * (0.6 + (index * 0.08))));
      });
      
      const trendChartData = {
        labels: months,
        datasets: [
          {
            label: 'Employees',
            data: userGrowth,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.3,
          },
          {
            label: 'Projects',
            data: projectGrowth,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            tension: 0.3,
          }
        ],
      };
      
      setChartData({
        leaveData: leaveChartData,
        projectData: projectChartData,
        trendData: trendChartData
      });
    }
  }, [isDataLoaded, leaves, projects, clients, users]);

  // Calculate leave statistics
  const getPendingLeaves = () => {
    return leaves?.filter(leave => leave.status === 'Pending')?.length || 0;
  };

  const getApprovedLeaves = () => {
    return leaves?.filter(leave => leave.status === 'Approved')?.length || 0;
  };
  
  const getRejectedLeaves = () => {
    return leaves?.filter(leave => leave.status === 'Rejected')?.length || 0;
  };
  
  // Calculate project statistics
  const getProjectsWithClients = () => {
    if (!projects || !clients) return 0;
    const clientIds = clients.map(client => client._id);
    return projects.filter(project => project.client_id && clientIds.includes(project.client_id)).length;
  };
  
  // Calculate user statistics
  const getActiveUsers = () => {
    return users.filter(user => user.status === 'active').length;
  };
  
  // Get completed projects that need reassignment
  const getCompletedProjectsNeedingReassignment = () => {
    if (!projects || !users) return [];
    
    return projects.filter(project => {
      const status = project.project_details?.status || project.status;
      const hasProjectManager = project.project_manager_id && users.some(user => user._id === project.project_manager_id);
      return status === 'Completed' && hasProjectManager;
    });
  };
  
  // Handle project manager reassignment
  // const handleAssignProjectManager = (projectId) => {
  //   setSelectedProjectId(projectId);
  //   setShowAssignModal(true);
  // };
  
  // Close the completed projects alert
  const handleCloseCompletedProjectsAlert = () => {
    setShowCompletedProjectsAlert(false);
  };

  // Chart options
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Leave Distribution',
        font: {
          size: 16,
        }
      },
    },
  };
  
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top Clients by Projects',
        font: {
          size: 16,
        }
      },
    },
  };
  
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '6-Month Growth Trend',
        font: {
          size: 16,
        }
      },
    },
  };
  
  // Helper function to determine if card should be shown based on search
  const shouldShowCard = (title, description) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return title.toLowerCase().includes(term) || description.toLowerCase().includes(term);
  };
  
  // Card click handler for interactivity
  const handleCardClick = (cardId) => {
    setSelectedCard(selectedCard === cardId ? null : cardId);
  };

  // Project Manager assignment handler
  const handleAssignProjectManager = (projectId) => {
    // Find the project to check its status
    const project = projects.find(p => p._id === projectId);
    
    // If project is already assigned and not completed, show alert
    if (project.project_manager_id && (project.status !== 'Completed' && project.project_details?.status !== 'Completed')) {
      alert('This project cannot be reassigned until it is completed.');
      return;
    }
    
    setSelectedProjectId(projectId);
    setSelectedManagerId('');
    setShowAssignModal(true);
  };

  // Get Project Managers from users
  const getProjectManagers = () => {
    return users.filter(user => user.credentialId?.role === 'Project Manager' || user.role === 'Project Manager');
  };

  // FIXED: Assign Project Manager API call with correct URL
  const assignProjectManager = async () => {
    if (!selectedManagerId) {
      alert('Please select a Project Manager');
      return;
    }

    try {
      console.log('Assigning project manager:', {
        projectId: selectedProjectId,
        projectManagerId: selectedManagerId
      });

      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      // FIXED: Use the correct backend URL
      const response = await fetch('http://localhost:5000/api/projects/assign-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          projectId: selectedProjectId, 
          projectManagerId: selectedManagerId 
        })
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (response.ok) {
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          result = { message: 'Assignment successful' };
        }
        console.log('Assignment successful:', result);
        
        // Refresh projects data
        dispatch(fetchProjects());
        setShowAssignModal(false);
        setSelectedProjectId(null);
        setSelectedManagerId('');
        alert('Project Manager assigned successfully!');
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: responseText || 'Unknown error' };
        }
        console.error('Assignment failed:', errorData);
        alert(`Failed to assign project manager: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error assigning project manager:', error);
      alert(`Error assigning project manager: ${error.message}. Please check console for details.`);
    }
  };

  // Cancel assignment
  const cancelAssignment = () => {
    setShowAssignModal(false);
    setSelectedProjectId(null);
    setSelectedManagerId('');
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Project Manager Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {projects?.find(p => p._id === selectedProjectId)?.status === 'Completed' || 
               projects?.find(p => p._id === selectedProjectId)?.project_details?.status === 'Completed' 
                ? 'Reassign Completed Project' : 'Assign Project Manager'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <div className="p-3 bg-gray-50 rounded-md">
                {projects?.find(p => p._id === selectedProjectId)?.project_details?.name || 
                 projects?.find(p => p._id === selectedProjectId)?.name || 'Selected Project'}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Project Manager</label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a Project Manager --</option>
                {getProjectManagers().map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelAssignment}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={assignProjectManager}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {projects?.find(p => p._id === selectedProjectId)?.status === 'Completed' || 
                 projects?.find(p => p._id === selectedProjectId)?.project_details?.status === 'Completed' 
                  ? 'Reassign Project' : 'Assign Project'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Alert for completed projects that need reassignment */}
        {showCompletedProjectsAlert && getCompletedProjectsNeedingReassignment().length > 0 && (
          <div className="mb-6 bg-purple-50 border-l-4 border-purple-500 p-4 rounded-md shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaUserTie className="text-purple-600 text-xl mr-3" />
                <div>
                  <h3 className="font-medium text-purple-800">Completed Projects Need Reassignment</h3>
                  <p className="text-purple-600 mt-1">
                    {getCompletedProjectsNeedingReassignment().length} completed project(s) can be reassigned to new project managers
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => { setActiveTab('projects'); setFilterStatus('Completed'); }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                >
                  View Projects
                </button>
                <button 
                  onClick={handleCloseCompletedProjectsAlert}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <FaTimesCircle />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <header className="mb-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#8BBAFC]/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start md:items-center">
                <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
                  <FaTachometerAlt className="text-white text-xl sm:text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Admin Dashboard</h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                  <p className="text-white/90 text-xs sm:text-sm mt-1">Welcome to your administration panel</p>
                </div>
              </div>

              
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-[#8BBAFC] animate-fadeIn">
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setFilterPeriod('all')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterPeriod === 'all' 
                      ? 'bg-[#418EFD] text-white' 
                      : 'bg-[#8BBAFC]/10 text-[#2A2A34] hover:bg-[#8BBAFC]/20'
                  }`}
                >
                  All Time
                </button>
                <button 
                  onClick={() => setFilterPeriod('month')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterPeriod === 'month' 
                      ? 'bg-[#418EFD] text-white' 
                      : 'bg-[#8BBAFC]/10 text-[#2A2A34] hover:bg-[#8BBAFC]/20'
                  }`}
                >
                  This Month
                </button>
                <button 
                  onClick={() => setFilterPeriod('week')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterPeriod === 'week' 
                      ? 'bg-[#418EFD] text-white' 
                      : 'bg-[#8BBAFC]/10 text-[#2A2A34] hover:bg-[#8BBAFC]/20'
                  }`}
                >
                  This Week
                </button>
                <button 
                  onClick={() => setFilterPeriod('day')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterPeriod === 'day' 
                      ? 'bg-[#418EFD] text-white' 
                      : 'bg-[#8BBAFC]/10 text-[#2A2A34] hover:bg-[#8BBAFC]/20'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>
          )}
          
        </header>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Employees Card */}
          {shouldShowCard('Total Employees', 'Total number of employees registered in the system') && (
            <div 
              className={`bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${selectedCard === 'employees' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleCardClick('employees')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Employees</p>
                  {usersLoading ? (
                    <div className="flex items-center mt-2">
                      <FaSpinner className="animate-spin text-blue-500 mr-2" />
                      <p className="text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{users.length}</p>
                      <p className="text-sm text-green-500 flex items-center mt-1">
                        <FaArrowUp className="mr-1" /> 12% from last month
                      </p>
                    </div>
                  )}
                  {usersError && <p className="text-red-500 text-sm mt-2">{usersError}</p>}
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaUsers className="text-blue-500 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Total number of employees registered in the system
                </p>
              </div>
              
              {selectedCard === 'employees' && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active:</span>
                    <span className="font-medium">{getActiveUsers()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Inactive:</span>
                    <span className="font-medium">{users.length - getActiveUsers()}</span>
                  </div>
                  <button className="mt-3 text-blue-500 text-sm font-medium hover:text-blue-700">
                    View All Employees →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Total Projects Card */}
          {shouldShowCard('Total Projects', 'Total number of projects managed in the system') && (
            <div 
              className={`bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${selectedCard === 'projects' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => handleCardClick('projects')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Projects</p>
                  {projectsLoading ? (
                    <div className="flex items-center mt-2">
                      <FaSpinner className="animate-spin text-green-500 mr-2" />
                      <p className="text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{projects?.length || 0}</p>
                      <p className="text-sm text-green-500 flex items-center mt-1">
                        <FaArrowUp className="mr-1" /> 8% from last month
                      </p>
                    </div>
                  )}
                  {projectsError && <p className="text-red-500 text-sm mt-2">{projectsError}</p>}
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaProjectDiagram className="text-green-500 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Total number of projects managed in the system
                </p>
              </div>
              
              {selectedCard === 'projects' && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Client Projects:</span>
                    <span className="font-medium">{getProjectsWithClients()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Internal Projects:</span>
                    <span className="font-medium">{projects?.length - getProjectsWithClients() || 0}</span>
                  </div>
                  <button className="mt-3 text-green-500 text-sm font-medium hover:text-green-700">
                    View All Projects →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Leave Insights Card */}
          {shouldShowCard('Leave Insights', 'Overview of leave requests in the system') && (
            <div 
              className={`bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${selectedCard === 'leaves' ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => handleCardClick('leaves')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Leave Insights</p>
                  {leavesLoading ? (
                    <div className="flex items-center mt-2">
                      <FaSpinner className="animate-spin text-purple-500 mr-2" />
                      <p className="text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-3xl font-bold text-gray-800">{leaves?.length || 0}</p>
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <FaArrowDown className="mr-1" /> 3% from last month
                      </p>
                    </div>
                  )}
                  {leavesError && <p className="text-red-500 text-sm mt-2">{leavesError}</p>}
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaCalendarAlt className="text-purple-500 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Overview of leave requests in the system
                </p>
              </div>
              
              {selectedCard === 'leaves' && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pending:</span>
                    <span className="font-medium">{getPendingLeaves()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Approved:</span>
                    <span className="font-medium">{getApprovedLeaves()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Rejected:</span>
                    <span className="font-medium">{getRejectedLeaves()}</span>
                  </div>
                  <button className="mt-3 text-purple-500 text-sm font-medium hover:text-purple-700">
                    View All Leaves →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Client Insights Card */}
          {shouldShowCard('Total Clients', 'Total number of clients registered in the system') && (
            <div 
              className={`bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${selectedCard === 'clients' ? 'ring-2 ring-orange-500' : ''}`}
              onClick={() => handleCardClick('clients')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Clients</p>
                  {clientsLoading ? (
                    <div className="flex items-center mt-2">
                      <FaSpinner className="animate-spin text-orange-500 mr-2" />
                      <p className="text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-3xl font-bold text-gray-800">{clients?.length || 0}</p>
                      <p className="text-sm text-green-500 flex items-center mt-1">
                        <FaArrowUp className="mr-1" /> 5% from last month
                      </p>
                    </div>
                  )}
                  {clientsError && <p className="text-red-500 text-sm mt-2">{clientsError}</p>}
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <FaBuilding className="text-orange-500 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Total number of clients registered in the system
                </p>
              </div>
              
              {selectedCard === 'clients' && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active Clients:</span>
                    <span className="font-medium">{clients?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">With Projects:</span>
                    <span className="font-medium">{Object.keys(clientProjectCounts || {}).length}</span>
                  </div>
                  <button className="mt-3 text-orange-500 text-sm font-medium hover:text-orange-700">
                    View All Clients →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Trend Chart Section */}
        {activeTab === 'overview' && isDataLoaded && chartData.trendData && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center text-gray-800">
                <FaChartBar className="mr-2 text-blue-600" />
                Growth Trends
              </h2>
              <div className="flex items-center">
                <div className="text-sm text-gray-500 mr-4">Last updated: {new Date().toLocaleDateString()}</div>
                <button className="text-gray-400 hover:text-gray-600">
                  <FaEllipsisV />
                </button>
              </div>
            </div>
            
            <div className="h-80">
              <Line data={chartData.trendData} options={lineChartOptions} />
            </div>
          </div>
        )}
        
        {/* Charts Section */}
        {activeTab === 'overview' && isDataLoaded && chartData.leaveData && chartData.projectData && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center text-gray-800">
                <FaChartPie className="mr-2 text-blue-600" />
                Data Visualization
              </h2>
              <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leave Distribution Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="h-64">
                  <Pie data={chartData.leaveData} options={pieChartOptions} />
                </div>
              </div>
              
              {/* Project by Client Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="h-64">
                  <Bar data={chartData.projectData} options={barChartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Project Management</h3>
                <div className="flex items-center space-x-3">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                  
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Manager</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects?.filter(project => 
                      filterStatus === 'all' || project.status === filterStatus
                    ).map(project => {
                      const client = clients?.find(c => c._id === project.client_id);
                      const projectManager = users?.find(u => u._id === project.project_manager_id);
                      const isOverdue = new Date(project.end_date) < new Date() && project.status !== 'Completed';
                      const isCompleted = project.project_details?.status === 'Completed' || project.status === 'Completed';
                      const needsReassignment = isCompleted && projectManager;
                      
                      return (
                        <tr key={project._id} className={`hover:bg-gray-50 ${isCompleted ? 'bg-green-50' : ''} ${needsReassignment ? 'border-l-4 border-purple-500' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{project.project_details?.name || project.name}</div>
                              <div className="text-sm text-gray-500">{project.project_details?.description?.substring(0, 50) || project.description?.substring(0, 50)}...</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client?.name || 'Internal'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {projectManager ? (
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-xs font-medium text-blue-600">
                                    {projectManager.name?.charAt(0)}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-900">Assigned to {projectManager.name}</span>
                                {(project.status === 'Completed' || project.project_details?.status === 'Completed') && (
                                  <button 
                                    onClick={() => handleAssignProjectManager(project._id)}
                                    className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 text-xs font-medium"
                                  >
                                    Reassign
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleAssignProjectManager(project._id)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Assign Manager
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              project.project_details?.status === 'Completed' || project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              project.project_details?.status === 'In Progress' || project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {project.project_details?.status || project.status || 'Planning'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${project.project_details?.progress || project.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{project.project_details?.progress || project.progress || 0}%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {new Date(project.project_details?.end_date || project.end_date).toLocaleDateString()}
                              {isOverdue && <span className="ml-1">⚠️</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <FaEye />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <FaEdit />
                              </button>
                              {(!projectManager || project.status === 'Completed' || project.project_details?.status === 'Completed') && (
                                <button 
                                  onClick={() => handleAssignProjectManager(project._id)}
                                  className={`${(project.status === 'Completed' || project.project_details?.status === 'Completed') ? 'text-purple-600 hover:text-purple-900 animate-pulse' : 'text-purple-600 hover:text-purple-900'}`}
                                  title={`${(project.status === 'Completed' || project.project_details?.status === 'Completed') ? 'Reassign Project Manager' : 'Assign Project Manager'}`}
                                >
                                  <FaUserTie />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Statistics Section */}
        {activeTab === 'overview' && isDataLoaded && !usersLoading && !projectsLoading && !leavesLoading && !clientsLoading && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center text-gray-800">
                <FaChartBar className="mr-2 text-blue-600" />
                Detailed Statistics
              </h2>
              <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Employee Status */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                    <FaUsers className="text-blue-500 mr-2" />
                    Employee Status
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                          <span className="text-sm">Active</span>
                        </div>
                        <span className="font-medium">{getActiveUsers()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full" 
                          style={{ width: `${users.length ? (getActiveUsers() / users.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                          <span className="text-sm">Inactive</span>
                        </div>
                        <span className="font-medium">{users.length - getActiveUsers()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-400 h-2 rounded-full" 
                          style={{ width: `${users.length ? ((users.length - getActiveUsers()) / users.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Project Distribution */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                    <FaProjectDiagram className="text-green-500 mr-2" />
                    Project Distribution
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                          <span className="text-sm">With Clients</span>
                        </div>
                        <span className="font-medium">{getProjectsWithClients()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full" 
                          style={{ width: `${projects?.length ? (getProjectsWithClients() / projects.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                          <span className="text-sm">Internal</span>
                        </div>
                        <span className="font-medium">{projects?.length - getProjectsWithClients() || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${projects?.length ? ((projects.length - getProjectsWithClients()) / projects.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Leave Status */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                    <FaCalendarAlt className="text-purple-500 mr-2" />
                    Leave Status
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <FaHourglassHalf className="text-yellow-500 mr-2 text-sm" />
                          <span className="text-sm">Pending</span>
                        </div>
                        <span className="font-medium">{getPendingLeaves()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${leaves?.length ? (getPendingLeaves() / leaves.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <FaCheckCircle className="text-green-500 mr-2 text-sm" />
                          <span className="text-sm">Approved</span>
                        </div>
                        <span className="font-medium">{getApprovedLeaves()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full" 
                          style={{ width: `${leaves?.length ? (getApprovedLeaves() / leaves.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <FaTimesCircle className="text-red-500 mr-2 text-sm" />
                          <span className="text-sm">Rejected</span>
                        </div>
                        <span className="font-medium">{getRejectedLeaves()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-400 h-2 rounded-full" 
                          style={{ width: `${leaves?.length ? (getRejectedLeaves() / leaves.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Manager Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Assign Project Manager</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project Manager
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                >
                  <option value="">Choose a Project Manager...</option>
                  {getProjectManagers().map(manager => (
                    <option key={manager._id} value={manager._id}>
                      {manager.name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={cancelAssignment}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={assignProjectManager}
                  disabled={!selectedManagerId}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    selectedManagerId
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Assign Manager
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
