import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../store/projectStore';
import { fetchLeaves } from '../store/leaveStore';
import useAuthStore from '../store/authStore';
import { 
  FaUser, 
  FaTasks, 
  FaCalendarAlt, 
  FaClock, 
  FaCheckCircle,
  FaSpinner,
  FaProjectDiagram,
  FaClipboardList,
  FaBell,
  FaChartPie,
  FaPlay,
  FaPause,
  FaStop,
  FaPlus,
  FaEye,
  FaEdit,
  FaCalendarCheck,
  FaHourglassHalf
} from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { fetchMyTasks, updateMyTaskStatus } from '../store/taskStore';
import { useLocation } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const UserDashboard = () => {
  const { user } = useAuthStore();
  const dispatch = useDispatch();
  const location = useLocation();
  
  const { projects, isLoading: projectsLoading } = useSelector(state => state.projects);
  const { leaves, isLoading: leavesLoading } = useSelector(state => state.leaves);
  const { tasks, isLoading: tasksLoading } = useSelector(state => state.tasks);
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // Sync initial tab from URL hash
  useEffect(() => {
    if (location.hash === '#tasks') {
      setActiveTab('tasks');
    }
  }, [location.hash]);

  // Keep URL hash in sync with selected tab (for sidebar highlighting)
  useEffect(() => {
    const base = window.location.pathname + window.location.search;
    if (activeTab === 'tasks') {
      if (window.location.hash !== '#tasks') {
        window.history.replaceState(null, '', `${base}#tasks`);
      }
    } else if (window.location.hash) {
      window.history.replaceState(null, '', base);
    }
  }, [activeTab]);
    const [timeEntries, setTimeEntries] = useState([]);
  const [currentTimer, setCurrentTimer] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');
  const filteredTasks = React.useMemo(() => {
    if (taskFilter === 'all') return tasks;
    return tasks.filter(t => t.status === taskFilter);
  }, [tasks, taskFilter]);

  // Load my assigned tasks and mock time entries
  useEffect(() => {
    dispatch(fetchMyTasks());

    // Mock time entries
    setTimeEntries([
      { date: '2024-01-10', task: 'Frontend Development', hours: 8, project: 'Web Application' },
      { date: '2024-01-11', task: 'Bug Fixes', hours: 6, project: 'Mobile App' },
      { date: '2024-01-12', task: 'Documentation', hours: 3, project: 'Web Application' },
      { date: '2024-01-13', task: 'Testing', hours: 7, project: 'API Service' }
    ]);
  }, [dispatch]);

  // Load data
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchLeaves());
  }, [dispatch]);

  // Calculate statistics
  const getMyStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'To-do').length;

    const totalHoursThisWeek = timeEntries.reduce((total, entry) => total + entry.hours, 0);

    const myProjects = projects?.slice(0, 3) || [];
    const myLeaves = leaves?.filter(leave => leave.status === 'Pending') || [];

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalHoursThisWeek,
      myProjects: myProjects.length,
      pendingLeaves: myLeaves.length
    };
  };

  // Chart data
  const getTaskStatusChart = () => {
    const stats = getMyStats();
    return {
      labels: ['To-do', 'In Progress', 'Done'],
      datasets: [{
        data: [stats.pendingTasks, stats.inProgressTasks, stats.completedTasks],
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
        borderColor: ['#DC2626', '#D97706', '#059669'],
        borderWidth: 1
      }]
    };
  };

  const getWeeklyHoursChart = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const hours = [8, 6, 3, 7, 0]; // Mock data based on timeEntries
    
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

  const stats = getMyStats();

  if (projectsLoading || leavesLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Employee Dashboard...</p>
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
                  <FaUser className="text-white text-xl sm:text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Employee Dashboard</h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                  <p className="text-white/90 text-xs sm:text-sm mt-1">Welcome back, <strong> {user?.name || user?.username}.</strong>  Here is your overview.</p>
                </div>
              </div>
              
            </div>
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
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">My Tasks</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalTasks}</p>
                    <p className="text-sm text-blue-600 mt-1">In Progress: {stats.inProgressTasks}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaTasks className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Completed Tasks</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.completedTasks}</p>
                    <p className="text-sm text-green-600 mt-1">Success Rate: {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <FaCheckCircle className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">My Projects</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.myProjects}</p>
                    <p className="text-sm text-purple-600 mt-1">Active Projects</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <FaProjectDiagram className="text-purple-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Hours This Week</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalHoursThisWeek}</p>
                    <p className="text-sm text-orange-600 mt-1">Target: 40h</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <FaClock className="text-orange-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaChartPie className="mr-2 text-blue-600" />
                  My Task Distribution
                </h3>
                <div className="h-64">
                  <Doughnut data={getTaskStatusChart()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaClock className="mr-2 text-orange-600" />
                  Weekly Hours
                </h3>
                <div className="h-64">
                  <Bar data={getWeeklyHoursChart()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaPlay className="mr-2 text-green-600" />
                  <span>Start Timer</span>
                </button>
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaCalendarAlt className="mr-2 text-blue-600" />
                  <span>Request Leave</span>
                </button>
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaClipboardList className="mr-2 text-purple-600" />
                  <span>View Tasks</span>
                </button>
                <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaUser className="mr-2 text-orange-600" />
                  <span>Update Profile</span>
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
                <h3 className="text-lg font-semibold">My Tasks</h3>
                <div className="flex items-center space-x-3">
                  <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All</option>
                    <option value="To-do">To-do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {filteredTasks.map(task => (
                  <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            task.status === 'Done' ? 'bg-green-100 text-green-800' :
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Updated: {(task.status_last_changed_at || task.updatedAt) ? new Date(task.status_last_changed_at || task.updatedAt).toLocaleString() : '—'}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span>{task.project_id?.project_details?.name || '—'}</span>
                          <span className="mx-2">•</span>
                          <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {task.status !== 'To-do' && (
                          <button onClick={() => dispatch(updateMyTaskStatus({ taskId: task._id, status: 'To-do' }))} className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            To-do
                          </button>
                        )}
                        {task.status !== 'In Progress' && (
                          <button onClick={() => dispatch(updateMyTaskStatus({ taskId: task._id, status: 'In Progress' }))} className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                            In Progress
                          </button>
                        )}
                        {task.status !== 'Done' && (
                          <button onClick={() => dispatch(updateMyTaskStatus({ taskId: task._id, status: 'Done' }))} className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                            Mark Done
                          </button>
                        )}
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
                {projects?.slice(0, 6).map(project => (
                  <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'Completed' ? 'bg-green-100 text-green-800' :
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
                    
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button className="w-full text-center py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                        View Details
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeEntries.map((entry, index) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">My Leave Requests</h3>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <FaPlus className="mr-2" />
                  Request Leave
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {leaves?.slice(0, 5).map(leave => (
                  <div key={leave._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{leave.leave_type}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span>{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>{leave.reason}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <FaEye />
                        </button>
                        {leave.status === 'Pending' && (
                          <button className="text-green-600 hover:text-green-900">
                            <FaEdit />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard; 
