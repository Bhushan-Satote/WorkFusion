import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../store/projectStore';
import useUserStore from '../store/userStore';
import useAuthStore from '../store/authStore';
import axios from '../api/axios';
import { 
  FaCode, 
  FaTasks, 
  FaUsers, 
  FaBug, 
  FaGitAlt, 
  FaClock, 
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaLaptopCode,
  FaClipboardCheck,
  FaComments,
  FaChartLine,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaPlay,
  FaPause,
  FaStop,
  FaProjectDiagram,
  FaUserTie,
  FaBuilding
} from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const ProjectLeadDashboard = () => {
  const { user } = useAuthStore();
  const { users, fetchUsers, isLoading: usersLoading } = useUserStore();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { projects, isLoading: projectsLoading } = useSelector(state => state.projects);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [codeReviews, setCodeReviews] = useState([]);
  const [timeTracking, setTimeTracking] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});

  // Mock data for tasks, code reviews, and time tracking
  useEffect(() => {
    // Mock tasks data
    setTasks([
      { id: 1, title: 'Implement user authentication', status: 'In Progress', priority: 'High', assignee: 'John Doe', dueDate: '2024-01-15', project: 'Web App' },
      { id: 2, title: 'Fix login bug', status: 'To Do', priority: 'Critical', assignee: 'Jane Smith', dueDate: '2024-01-12', project: 'Mobile App' },
      { id: 3, title: 'Code review for payment module', status: 'Review', priority: 'Medium', assignee: 'Mike Johnson', dueDate: '2024-01-18', project: 'E-commerce' },
      { id: 4, title: 'Database optimization', status: 'Done', priority: 'Low', assignee: 'Sarah Wilson', dueDate: '2024-01-10', project: 'Web App' },
      { id: 5, title: 'API documentation', status: 'In Progress', priority: 'Medium', assignee: 'Tom Brown', dueDate: '2024-01-20', project: 'API Service' }
    ]);

    // Mock code reviews data
    setCodeReviews([
      { id: 1, title: 'User Registration Feature', author: 'John Doe', status: 'Pending', priority: 'High', createdDate: '2024-01-10', project: 'Web App' },
      { id: 2, title: 'Payment Gateway Integration', author: 'Jane Smith', status: 'Approved', priority: 'Critical', createdDate: '2024-01-08', project: 'E-commerce' },
      { id: 3, title: 'Mobile UI Improvements', author: 'Mike Johnson', status: 'Changes Requested', priority: 'Medium', createdDate: '2024-01-09', project: 'Mobile App' },
      { id: 4, title: 'Database Schema Updates', author: 'Sarah Wilson', status: 'Approved', priority: 'High', createdDate: '2024-01-07', project: 'Backend' }
    ]);

    // Mock time tracking data
    setTimeTracking([
      { date: '2024-01-10', hours: 8, project: 'Web App', task: 'Frontend Development' },
      { date: '2024-01-11', hours: 6, project: 'Mobile App', task: 'Bug Fixes' },
      { date: '2024-01-12', hours: 7, project: 'E-commerce', task: 'Code Review' },
      { date: '2024-01-13', hours: 8, project: 'API Service', task: 'Documentation' },
      { date: '2024-01-14', hours: 5, project: 'Web App', task: 'Testing' }
    ]);
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await dispatch(fetchProjects());
    };
    loadData();
  }, [fetchUsers, dispatch]);

  // Calculate statistics
  const getTaskStats = () => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Done').length;
    const pending = tasks.filter(t => t.status === 'To Do').length;
    const review = tasks.filter(t => t.status === 'Review').length;
    
    return { total, inProgress, completed, pending, review };
  };

  const getCodeReviewStats = () => {
    const total = codeReviews.length;
    const pending = codeReviews.filter(cr => cr.status === 'Pending').length;
    const approved = codeReviews.filter(cr => cr.status === 'Approved').length;
    const changesRequested = codeReviews.filter(cr => cr.status === 'Changes Requested').length;
    
    return { total, pending, approved, changesRequested };
  };

  const getMyProjects = () => {
    // Filter projects where current user is involved (mock logic)
    return projects?.filter(project => 
      project.status === 'In Progress' || project.status === 'Planning'
    ) || [];
  };

  const getTotalHoursThisWeek = () => {
    return timeTracking.reduce((total, entry) => total + entry.hours, 0);
  };

  // Chart data
  const getTaskStatusChart = () => {
    const stats = getTaskStats();
    return {
      labels: ['To Do', 'In Progress', 'Review', 'Done'],
      datasets: [{
        data: [stats.pending, stats.inProgress, stats.review, stats.completed],
        backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#10B981'],
        borderColor: ['#DC2626', '#D97706', '#7C3AED', '#059669'],
        borderWidth: 1
      }]
    };
  };

  const getCodeReviewChart = () => {
    const stats = getCodeReviewStats();
    return {
      labels: ['Pending', 'Approved', 'Changes Requested'],
      datasets: [{
        data: [stats.pending, stats.approved, stats.changesRequested],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderColor: ['#D97706', '#059669', '#DC2626'],
        borderWidth: 1
      }]
    };
  };

  const getWeeklyHoursChart = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const hours = [8, 6, 7, 8, 5]; // Mock data
    
    return {
      labels: days,
      datasets: [{
        label: 'Hours Worked',
        data: hours,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  };

  const taskStats = getTaskStats();
  const codeReviewStats = getCodeReviewStats();
  const myProjects = getMyProjects();

  if (projectsLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Project Lead Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#8BBAFC]/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start md:items-center">
                <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
                  <FaLaptopCode className="text-white text-xl sm:text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Project Lead Dashboard</h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                  <p className="text-white/90 text-xs sm:text-sm mt-1">Welcome back, <strong>{user?.name || ''}. </strong>  Technical leadership, task execution, and code quality at a glance.</p>
                </div>
              </div>
              
              
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-[#8BBAFC]">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'code-reviews', label: 'Code Reviews' },
                { id: 'projects', label: 'Projects' },
                { id: 'time-tracking', label: 'Time Tracking' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-[#ffffff] text-[#ffffff] bg-white/10'
                      : 'text-white/80 hover:text-white'
                  }`}
                  style={activeTab !== tab.id ? { borderBottom: '2px solid transparent' } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Active Tasks</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{taskStats.inProgress}</p>
                    <p className="text-sm text-blue-600 mt-1">Total: {taskStats.total}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaTasks className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Code Reviews</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{codeReviewStats.pending}</p>
                    <p className="text-sm text-orange-600 mt-1">Pending Review</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <FaCode className="text-orange-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">My Projects</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{myProjects.length}</p>
                    <p className="text-sm text-green-600 mt-1">Active Projects</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <FaGitAlt className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Hours This Week</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{getTotalHoursThisWeek()}</p>
                    <p className="text-sm text-blue-600 mt-1">Target: 40h</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaClock className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaTasks className="mr-2 text-blue-600" />
                  Task Distribution
                </h3>
                <div className="h-64">
                  <Doughnut data={getTaskStatusChart()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaCode className="mr-2 text-orange-600" />
                  Code Review Status
                </h3>
                <div className="h-64">
                  <Doughnut data={getCodeReviewChart()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaClock className="mr-2 text-blue-600" />
                  Weekly Hours
                </h3>
                <div className="h-64">
                  <Bar data={getWeeklyHoursChart()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>

            {/* My Assigned Epics - Prominent Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-600 rounded-lg shadow-sm p-6 border mb-8">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-xl font-semibold mb-2 flex items-center">
                    <FaProjectDiagram className="mr-3" />
                    My Assigned Epics
                  </h3>
                  <p className="text-blue-100">
                    Manage epics assigned to you by Project Managers and create tasks within them.
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/project-lead/epics')}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  <FaProjectDiagram className="mr-2" />
                  View My Epics
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => navigate('/project-lead/epics')}
                  className="flex items-center justify-center p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FaProjectDiagram className="mr-2 text-blue-600" />
                  <span>Manage Epics</span>
                </button>
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaCode className="mr-2 text-orange-600" />
                  <span>Review Code</span>
                </button>
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaComments className="mr-2 text-green-600" />
                  <span>Team Standup</span>
                </button>
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaChartLine className="mr-2 text-blue-600" />
                  <span>Sprint Report</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Task Management</h3>
                <div className="flex items-center space-x-3">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Tasks</option>
                    <option value="my-tasks">My Tasks</option>
                    <option value="team-tasks">Team Tasks</option>
                  </select>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <FaPlus className="mr-2" />
                    New Task
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map(task => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-500">{task.project}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.assignee}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            task.status === 'Done' ? 'bg-green-100 text-green-800' :
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'Review' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                            task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <FaEye />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <FaEdit />
                            </button>
                            <button className="text-blue-600 hover:text-blue-900">
                              <FaPlay />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Code Reviews Tab */}
        {activeTab === 'code-reviews' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Code Reviews</h3>
                <div className="flex items-center space-x-3">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Reviews</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="changes">Changes Requested</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {codeReviews.map(review => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{review.title}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            review.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            review.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {review.status}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            review.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                            review.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {review.priority}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span>By {review.author}</span>
                          <span className="mx-2">•</span>
                          <span>{review.project}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(review.createdDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                          <FaEye className="mr-1" />
                          Review
                        </button>
                        <button className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                          <FaCheckCircle className="mr-1" />
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">My Projects</h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map(project => (
                  <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{project.description?.substring(0, 100)}...</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Progress:</span>
                        <span className="font-medium">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Deadline:</span>
                        <span className="font-medium">{new Date(project.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-200 flex space-x-2">
                      <button className="flex-1 text-center py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                        View Details
                      </button>
                      <button className="flex-1 text-center py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                        Manage Tasks
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Time Tracking Tab */}
        {activeTab === 'time-tracking' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Time Tracking</h3>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <FaPlay className="mr-2" />
                    Start Timer
                  </button>
                  <button className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    <FaPause className="mr-2" />
                    Pause
                  </button>
                  <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <FaStop className="mr-2" />
                    Stop
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeTracking.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.project}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.task}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.hours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <FaEdit />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectLeadDashboard;