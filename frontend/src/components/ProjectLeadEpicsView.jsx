import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axios from '../api/axios';
import { 
  FaProjectDiagram, 
  FaTasks, 
  FaUsers, 
  FaCalendarAlt, 
  FaFlag, 
  FaBuilding, 
  FaUserTie, 
  FaSpinner, 
  FaExclamationTriangle,
  FaPlus,
  FaEye,
  FaEdit,
  FaPlay,
  FaCheckCircle,
  FaClock,
  FaArrowLeft
} from 'react-icons/fa';
import TaskForm from './project/kanban/TaskForm';

const   ProjectLeadEpicsView = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [epics, setEpics] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEpic, setSelectedEpic] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'Medium',
    due_date: ''
  });

  useEffect(() => {
    fetchMyEpics();
    fetchDashboardStats();
  }, []);

  const fetchMyEpics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/project-lead/epics');
      if (response.data.success) {
        setEpics(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching epics:', error);
      setError(error.response?.data?.message || 'Failed to fetch epics');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/project-lead/dashboard/stats');
      if (response.data.success) {
        setDashboardStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchEpicTasks = async (epicId) => {
    try {
      const response = await axios.get(`/project-lead/epics/${epicId}/tasks`);
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching epic tasks:', error);
    }
  };

  const handleEpicClick = (epic) => {
    setSelectedEpic(epic);
    fetchEpicTasks(epic._id);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedEpic) return;

    try {
      const response = await axios.post(`/project-lead/epics/${selectedEpic._id}/tasks`, newTask);
      if (response.data.success) {
        setTasks([...tasks, response.data.data]);
        setNewTask({
          title: '',
          description: '',
          assigned_to: '',
          priority: 'Medium',
          due_date: ''
        });
        setShowTaskForm(false);
        // Refresh stats
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.message || 'Failed to create task');
    }
  };

  // Project Leads cannot update task status; actions are disabled in UI.
  const updateTaskStatus = async () => {
    alert('Only assigned employees can change task status.');
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    if (selectedEpic?._id) {
      fetchEpicTasks(selectedEpic._id);
    }
    fetchDashboardStats();
  };

  const getStatusBadgeColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'to-do':
      case 'to do':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading your epics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <span>{error}</span>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#8BBAFC]/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start md:items-center">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="mr-3 p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
                >
                  <FaArrowLeft className="text-base sm:text-lg" />
                </button>
                <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
                  <FaProjectDiagram className="text-white text-xl sm:text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">My Assigned Epics</h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                  <p className="text-white/90 text-xs sm:text-sm mt-1">Manage epics assigned to you by Project Managers</p>
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Epics</p>
                <p className="text-2xl font-bold text-blue-800">{dashboardStats.totalEpics || 0}</p>
              </div>
              <FaProjectDiagram className="text-blue-600 text-2xl" />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Tasks</p>
                <p className="text-2xl font-bold text-blue-800">{dashboardStats.totalTasks || 0}</p>
              </div>
              <FaTasks className="text-blue-600 text-2xl" />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-800">{dashboardStats.completedTasks || 0}</p>
              </div>
              <FaCheckCircle className="text-green-600 text-2xl" />
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-orange-800">{dashboardStats.inProgressTasks || 0}</p>
              </div>
              <FaClock className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Epics List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Your Epics</h2>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {epics.length === 0 ? (
                  <div className="text-center py-8">
                    <FaProjectDiagram className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No epics assigned to you yet.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Project Managers will assign epics to you.
                    </p>
                  </div>
                ) : (
                  epics.map(epic => (
                    <div 
                      key={epic._id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedEpic?._id === epic._id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleEpicClick(epic)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate">{epic.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(epic.status)}`}>
                          {epic.status || 'Not Set'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FaBuilding className="mr-2 text-gray-400" />
                          <span className="truncate">{epic.project_name}</span>
                        </div>
                        <div className="flex items-center">
                          <FaUserTie className="mr-2 text-gray-400" />
                          <span className="truncate">{epic.client_name}</span>
                        </div>
                        {epic.end_date && (
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-400" />
                            <span>{new Date(epic.end_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Epic Details and Tasks */}
          <div className="lg:col-span-2">
            {selectedEpic ? (
              <div className="space-y-6">
                {/* Epic Details */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{selectedEpic.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedEpic.status)}`}>
                      {selectedEpic.status || 'Not Set'}
                    </span>
                  </div>
                  
                  {selectedEpic.description && (
                    <p className="text-gray-600 mb-4">{selectedEpic.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Project:</span>
                      <span className="ml-2 text-gray-600">{selectedEpic.project_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Client:</span>
                      <span className="ml-2 text-gray-600">{selectedEpic.client_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Project Manager:</span>
                      <span className="ml-2 text-gray-600">{selectedEpic.project_manager}</span>
                    </div>
                    {selectedEpic.end_date && (
                      <div>
                        <span className="font-medium text-gray-700">Due Date:</span>
                        <span className="ml-2 text-gray-600">{new Date(selectedEpic.end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tasks Section */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
                    <button 
                      onClick={() => setShowTaskForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
                    >
                      <FaPlus className="mr-2" />
                      Add Task
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {false && (
                      <form onSubmit={handleCreateTask} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-800 mb-4">Create New Task</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                              type="text"
                              value={newTask.title}
                              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                              value={newTask.priority}
                              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={newTask.description}
                              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                              type="date"
                              value={newTask.due_date}
                              onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-3 mt-4">
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                          >
                            Create Task
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowTaskForm(false)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {tasks.length === 0 ? (
                      <div className="text-center py-8">
                        <FaTasks className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No tasks created yet.</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Create your first task to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tasks.map(task => (
                          <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{task.title}</h4>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                  <span className={`px-2 py-1 rounded-full ${getPriorityBadgeColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  {task.due_date && (
                                    <span className="flex items-center">
                                      <FaCalendarAlt className="mr-1" />
                                      {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="flex flex-col">
                                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(task.status)}`}>
                                    {task.status}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {(task.status_last_changed_at || task.updatedAt) ? `Updated: ${new Date(task.status_last_changed_at || task.updatedAt).toLocaleString()}` : ''}
                                  </span>
                                </div>
                              <div className="flex space-x-1">
                                  {false && task.status !== 'Done' && (
                                    <button
                                      onClick={() => updateTaskStatus(task._id, task.status === 'To-do' ? 'In Progress' : 'Done')}
                                      className="text-green-600 hover:text-green-800 p-1"
                                      title={task.status === 'To-do' ? 'Start Task' : 'Complete Task'}
                                    >
                                      {task.status === 'To-do' ? <FaPlay /> : <FaCheckCircle />}
                                    </button>
                                  )}
                                  <button className="text-blue-600 hover:text-blue-800 p-1" title="View Details">
                                    <FaEye />
                                  </button>
                                  <button className="text-blue-600 hover:text-blue-800 p-1" title="Edit Task">
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm('Delete this task?')) return;
                                      try {
                                        await axios.delete(`/project-lead/tasks/${task._id}`);
                                        setTasks(tasks.filter(t => t._id !== task._id));
                                        fetchDashboardStats();
                                      } catch (err) {
                                        console.error('Delete failed', err);
                                        alert(err.response?.data?.message || 'Failed to delete task');
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Delete Task"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <FaProjectDiagram className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Epic</h3>
                <p className="text-gray-500">
                  Choose an epic from the left panel to view its details and manage tasks.
                </p>
              </div>
            )}
            <TaskForm 
                isOpen={showTaskForm}
                onClose={handleCloseTaskForm}
                projectId={selectedEpic?.project_id}
                epicId={selectedEpic?._id}
                task={null}
                isEditing={false}
                teamMembers={selectedEpic?.team_members || []}
                epic={selectedEpic}
              />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectLeadEpicsView;