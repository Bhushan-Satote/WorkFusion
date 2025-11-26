import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../store/projectStore';
import { fetchLeaves } from '../store/leaveStore';
import { fetchClients } from '../store/clientStore';
import useUserStore from '../store/userStore';
import useAuthStore from '../store/authStore';
import {
  FaProjectDiagram,
  FaUsers,
  FaCalendarAlt,
  FaChartLine,
  FaTasks,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaBuilding,
  FaUserTie,
  FaClipboardList,
  FaBell,
  FaFilter,
  FaSearch,
  FaEye,
  FaEdit,
  FaPlus,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import api from '../api/axios';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const ProjectManagerDashboard = () => {
  const { user } = useAuthStore();
  const { users, fetchUsers, isLoading: usersLoading } = useUserStore();
  const dispatch = useDispatch();

  const { projects, isLoading: projectsLoading } = useSelector(state => state.projects);
  const { leaves, isLoading: leavesLoading } = useSelector(state => state.leaves);
  const { clients, isLoading: clientsLoading } = useSelector(state => state.clients);

  const [activeTab, setActiveTab] = useState('overview');
  const [pmTasks, setPmTasks] = useState([]);
  const [pmTasksLoading, setPmTasksLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [projectUpdates, setProjectUpdates] = useState({});

  // Load data - fetch projects assigned to this project manager
  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await Promise.all([
        dispatch(fetchProjects()), // This will automatically filter for Project Manager
        dispatch(fetchLeaves()),
        dispatch(fetchClients())
      ]);
      // Fetch tasks across PM's projects
      try {
        setPmTasksLoading(true);
        const res = await api.get('tasks/pm/my-tasks');
        setPmTasks(res.data.data || []);
      } catch (e) {
        console.error('Failed to load PM tasks', e);
      } finally {
        setPmTasksLoading(false);
      }
    };
    loadData();
  }, [fetchUsers, dispatch]);

  // Fallback: if aggregated PM tasks are empty but projects exist, fetch per-project tasks
  useEffect(() => {
    const fetchFallbackTasks = async () => {
      if (pmTasksLoading) return;
      if (!projects || projects.length === 0) return;
      if (pmTasks && pmTasks.length > 0) return;

      try {
        setPmTasksLoading(true);
        const responses = await Promise.all(
          projects.map(p => api.get(`tasks/project/${p._id}`))
        );
        const merged = responses.flatMap(r => r.data?.tasks || []);
        setPmTasks(merged);
      } catch (err) {
        console.error('Fallback task fetch failed', err);
      } finally {
        setPmTasksLoading(false);
      }
    };
    fetchFallbackTasks();
  }, [projects, pmTasks, pmTasksLoading]);
  
  // Additional client-side filtering to ensure completed projects are not shown
  // Using useMemo to prevent unnecessary recalculations
  const filteredProjects = React.useMemo(() => {
    return projects?.filter(project => {
      const projectStatus = project.project_details?.status || project.status;
      return projectStatus !== 'Completed';
    }) || [];
  }, [projects]);

  // Generate notifications for project manager
  

  // Calculate statistics
  const getProjectStats = () => {
    if (!projects) return { total: 0, active: 0, completed: 0, overdue: 0 };

    const total = projects.length;
    const active = projects.filter(p => p.status === 'In Progress').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const overdue = projects.filter(p => {
      const endDate = new Date(p.project_details?.end_date || p.end_date);
      return endDate < new Date() && p.status !== 'Completed';
    }).length;

    return { total, active, completed, overdue };
  };

  const getTeamStats = () => {
    if (!users || !projects) return { total: 0, active: 0, onLeave: 0 };

    // Get unique team members from all assigned projects
    const teamMemberIds = new Set();
    projects.forEach(project => {
      if (project.project_leads) {
        project.project_leads.forEach(lead => teamMemberIds.add(lead._id || lead));
      }
      if (project.team_members) {
        project.team_members.forEach(member => teamMemberIds.add(member._id || member));
      }
    });

    const teamMembers = users.filter(u => teamMemberIds.has(u._id));
    const total = teamMembers.length;
    const active = teamMembers.filter(u => u.status === 'active').length;
    const onLeave = leaves?.filter(l =>
      l.status === 'Approved' &&
      new Date(l.end_date) >= new Date() &&
      teamMemberIds.has(l.user_id)
    ).length || 0;

    return { total, active, onLeave };
  };

  // Update project function
  const updateProject = async (projectId, updates) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Refresh projects data
        dispatch(fetchProjects());
        setEditingProject(null);
        setProjectUpdates({});
        alert('Project updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update project: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project. Please try again.');
    }
  };

  // Handle project edit
  const handleEditProject = (project) => {
    setEditingProject(project._id);
    setProjectUpdates({
      status: project.status,
      progress: project.project_details?.progress || project.progress || 0,
      description: project.project_details?.description || project.description || '',
      project_manager_id: project.project_manager_id || ''
    });
  };

  // Handle save project
  const handleSaveProject = (projectId) => {
    // Get the current project to preserve existing project_details
    const currentProject = projects.find(p => p._id === projectId);
    
    // Format updates properly to ensure status is updated correctly
    const formattedUpdates = {
      ...projectUpdates,
      // Ensure status is updated at the root level
      status: projectUpdates.status,
      // Preserve existing project_details and update only what's changed
      project_details: {
        ...(currentProject?.project_details || {}),
        status: projectUpdates.status,
        progress: projectUpdates.progress !== undefined ? projectUpdates.progress : currentProject?.project_details?.progress,
        description: projectUpdates.description || currentProject?.project_details?.description
      }
    };
    
    updateProject(projectId, formattedUpdates);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingProject(null);
    setProjectUpdates({});
  };

  const getResourceUtilization = () => {
    if (!projects || !users) return [];

    // Get team members from assigned projects
    const teamMemberIds = new Set();
    projects.forEach(project => {
      if (project.project_leads) {
        project.project_leads.forEach(lead => teamMemberIds.add(lead._id || lead));
      }
      if (project.team_members) {
        project.team_members.forEach(member => teamMemberIds.add(member._id || member));
      }
    });

    const teamMembers = users.filter(u => teamMemberIds.has(u._id));

    return teamMembers.map(member => {
      const assignedProjects = projects.filter(p =>
        (p.project_leads && p.project_leads.some(lead => (lead._id || lead) === member._id)) ||
        (p.team_members && p.team_members.some(tm => (tm._id || tm) === member._id))
      ).length;

      return {
        name: member.name,
        projects: assignedProjects,
        utilization: Math.min((assignedProjects / 3) * 100, 100) // Assuming 3 projects is 100% utilization
      };
    }).sort((a, b) => b.utilization - a.utilization);
  };

  // Chart data
  const getProjectStatusChart = () => {
    const stats = getProjectStats();
    return {
      labels: ['Active', 'Completed', 'Overdue'],
      datasets: [{
        data: [stats.active, stats.completed, stats.overdue],
        backgroundColor: ['#3B82F6', '#10B981', '#EF4444'],
        borderColor: ['#2563EB', '#059669', '#DC2626'],
        borderWidth: 1
      }]
    };
  };

  const getResourceChart = () => {
    const resources = getResourceUtilization().slice(0, 5);
    return {
      labels: resources.map(r => r.name),
      datasets: [{
        label: 'Utilization %',
        data: resources.map(r => r.utilization),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  };

  const projectStats = getProjectStats();
  const teamStats = getTeamStats();

  if (projectsLoading || usersLoading || leavesLoading || clientsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Project Manager Dashboard...</p>
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
                  <FaUserTie className="text-white text-xl sm:text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Project Manager Dashboard</h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                  <p className="text-white/90 text-xs sm:text-sm mt-1">Welcome back, <strong className='text-white'> {user?.name} </strong> . Manage your projects, team, and tasks effectively.</p>
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
                { id: 'projects', label: 'Projects' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'team', label: 'Team' },
                { id: 'resources', label: 'Resources' },
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

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-l-4 ${notification.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                    : 'bg-blue-50 border-blue-400 text-blue-800'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{notification.message}</span>
                  <button className="text-sm underline hover:no-underline">
                    {notification.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">My Projects</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{projectStats.total}</p>
                    <p className="text-sm text-blue-600 mt-1">Active: {projectStats.active}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaProjectDiagram className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Team Members</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{teamStats.total}</p>
                    <p className="text-sm text-green-600 mt-1">Active: {teamStats.active}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <FaUsers className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Completed Projects</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{projectStats.completed}</p>
                    <p className="text-sm text-green-600 mt-1">Success Rate: {projectStats.total > 0 ? Math.round((projectStats.completed / projectStats.total) * 100) : 0}%</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <FaCheckCircle className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Overdue Projects</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{projectStats.overdue}</p>
                    <p className="text-sm text-red-600 mt-1">Needs Attention</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <FaExclamationTriangle className="text-red-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaChartLine className="mr-2 text-blue-600" />
                  Project Status Distribution
                </h3>
                <div className="h-64">
                  <Pie data={getProjectStatusChart()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaUsers className="mr-2 text-green-600" />
                  Team Resource Utilization
                </h3>
                <div className="h-64">
                  <Bar data={getResourceChart()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">My Projects</h3>
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
                    {filteredProjects?.filter(project =>
                      filterStatus === 'all' || project.status === filterStatus
                    ).map(project => {
                      const client = clients?.find(c => c._id === project.client_id);
                      const isOverdue = new Date(project.project_details?.end_date || project.end_date) < new Date() && project.status !== 'Completed';
                      const isEditing = editingProject === project._id;

                      return (
                        <tr key={project._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {project.project_details?.name || project.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={projectUpdates.description || ''}
                                    onChange={(e) => setProjectUpdates({ ...projectUpdates, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                                    placeholder="Project description"
                                  />
                                ) : (
                                  (project.project_details?.description || project.description || '').substring(0, 50) + '...'
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client?.name || 'Internal'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={projectUpdates.project_manager_id || project.project_manager_id || ''}
                                onChange={(e) => setProjectUpdates({ ...projectUpdates, project_manager_id: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                              >
                                <option value="">Select Project Manager</option>
                                {users.filter(user => user.credentialId?.role === 'Project Manager' || user.role === 'Project Manager').map(manager => (
                                  <option key={manager._id} value={manager._id}>{manager.name}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center">
                                {project.project_manager_id ? (
                                  <>
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                      <span className="text-xs font-medium text-blue-600">
                                        {users?.find(u => u._id === project.project_manager_id)?.username.charAt(0) || user?.username.charAt(0)}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-900">Assigned to {user?.username}</span>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-500">Not Assigned</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={projectUpdates.status || project.status}
                                onChange={(e) => setProjectUpdates({ ...projectUpdates, status: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                              >
                                <option value="Planning">Planning</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                    project.status === 'On Hold' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                }`}>
                                {project.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={projectUpdates.progress || 0}
                                  onChange={(e) => setProjectUpdates({ ...projectUpdates, progress: parseInt(e.target.value) })}
                                  className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
                                />
                                <span className="text-xs">%</span>
                              </div>
                            ) : (
                              <div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${project.project_details?.progress || project.progress || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{project.project_details?.progress || project.progress || 0}%</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {new Date(project.project_details?.end_date || project.end_date).toLocaleDateString()}
                              {isOverdue && <span className="ml-1">⚠️</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveProject(project._id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Save Changes"
                                  >
                                    <FaSave />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-red-600 hover:text-red-900"
                                    title="Cancel"
                                  >
                                    <FaTimes />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setSelectedProject(project)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View Details"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    onClick={() => handleEditProject(project)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Edit Project"
                                  >
                                    <FaEdit />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredProjects?.length === 0 && (
                <div className="text-center py-8">
                  <FaProjectDiagram className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-500">No projects assigned to you yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center"><FaTasks className="mr-2 text-blue-600" /> Tasks Across My Projects</h3>
              <div className="text-sm text-gray-500">Total: {pmTasks.length}</div>
            </div>
            <div className="p-6">
              {pmTasksLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500"><FaSpinner className="animate-spin mr-2" /> Loading tasks...</div>
              ) : pmTasks.length === 0 ? (
                <div className="text-center py-8">
                  <FaTasks className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-500">No tasks found for your projects.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignees</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pmTasks.map(t => (
                        <tr key={t._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{t.title}</div>
                            <div className="text-xs text-gray-500">Created by {t.created_by?.name || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.project_id?.project_details?.name || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(t.assigned_to || []).map(u => u?.name).filter(Boolean).join(', ') || 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              t.priority === 'High' ? 'bg-red-100 text-red-800' : t.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {t.priority || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              t.status === 'Done' ? 'bg-green-100 text-green-800' : t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">My Team</h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getResourceUtilization().map(resource => {
                  const member = users?.find(u => u.name === resource.name);
                  const memberLeaves = leaves?.filter(l =>
                    l.user_id === member?._id && l.status === 'Approved' &&
                    new Date(l.end_date) >= new Date()
                  ) || [];

                  return (
                    <div key={resource.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUsers className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{resource.name}</h4>
                          <p className="text-sm text-gray-500">{member?.role || 'Team Member'}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Active Projects:</span>
                          <span className="font-medium">{resource.projects}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span className={`font-medium ${memberLeaves.length > 0 ? 'text-yellow-600' :
                              member?.status === 'active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {memberLeaves.length > 0 ? 'On Leave' : member?.status || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Utilization:</span>
                          <span className="font-medium">{resource.utilization.toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${resource.utilization > 80 ? 'bg-red-500' :
                                resource.utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                            style={{ width: `${resource.utilization}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button className="text-blue-600 text-sm hover:text-blue-800">
                          View Details →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {getResourceUtilization().length === 0 && (
                <div className="text-center py-8">
                  <FaUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-500">No team members assigned to your projects yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Resource Allocation</h3>
              <div className="space-y-4">
                {getResourceUtilization().map(resource => (
                  <div key={resource.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUsers className="text-blue-600 text-sm" />
                      </div>
                      <div>
                        <h4 className="font-medium">{resource.name}</h4>
                        <p className="text-sm text-gray-500">{resource.projects} active projects</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${resource.utilization > 80 ? 'bg-red-500' :
                                resource.utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                            style={{ width: `${resource.utilization}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {resource.utilization.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {getResourceUtilization().length === 0 && (
                <div className="text-center py-8">
                  <FaChartLine className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-500">No resource data available.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Project Details Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Project Details</h3>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProject.project_details?.name || selectedProject.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProject.project_details?.description || selectedProject.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProject.status}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Progress</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProject.project_details?.progress || selectedProject.progress || 0}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedProject.project_details?.start_date || selectedProject.start_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedProject.project_details?.end_date || selectedProject.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Client</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {clients?.find(c => c._id === selectedProject.client_id)?.name || 'Internal'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleEditProject(selectedProject);
                    setSelectedProject(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;