import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEpics, addEpic, deleteEpic } from '../../../store/kanbanStore';
import { fetchProjectTasks } from '../../../store/taskStore';
import { fetchProjectById } from '../../../store/projectStore';
import useUserStore from '../../../store/userStore';
import { FaPlus, FaArrowLeft, FaEdit, FaTrash, FaExclamationCircle, FaCalendarAlt, FaUser, FaFlag } from 'react-icons/fa';
import EpicForm from './EpicForm';
import useAuthStore from '../../../store/authStore';
import TaskList from './TaskList';
import TaskForm from './TaskForm';

const KanbanBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { epics, isLoading: epicsLoading, error: epicsError } = useSelector(state => state.kanban);

  // Current authenticated user
  const { user } = useAuthStore();
  const canManageTasks = user?.role === 'Project Lead';
  const isProjectManager = user?.role === 'Project Manager';
  const { tasks, isLoading: tasksLoading } = useSelector(state => state.tasks);
  const { currentProject } = useSelector(state => state.projects);
  
  // Use the Zustand userStore instead of Redux
  const { users, fetchUsers } = useUserStore();
  
  const [showEpicForm, setShowEpicForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [currentEpic, setCurrentEpic] = useState(null);
  const [isEditingEpic, setIsEditingEpic] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
      dispatch(fetchEpics(projectId));
      dispatch(fetchProjectTasks(projectId));
      fetchUsers(); // Fetch users from the Zustand store
    }
  }, [dispatch, projectId, fetchUsers]);

  const handleAddEpic = () => {
    setCurrentEpic(null);
    setIsEditingEpic(false);
    setShowEpicForm(true);
  };

  const handleEditEpic = (epic) => {
    setCurrentEpic(epic);
    setIsEditingEpic(true);
    setShowEpicForm(true);
  };

  const handleDeleteEpic = (epicId) => {
    if (window.confirm('Are you sure you want to delete this epic? All associated tasks will be orphaned.')) {
      dispatch(deleteEpic({ projectId, epicId }));
    }
  };

  const handleAddTask = (epic) => {
    setCurrentTask(null);
    setIsEditingTask(false);
    // Store full epic so we can access team_members for assignee restriction
    setCurrentEpic(epic);
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setCurrentTask(task);
    // Ensure currentEpic is set to the epic of this task so TaskForm receives correct teamMembers
    const epicForTask = epics.find(e => e.epic_id === task.epic_id);
    if (epicForTask) setCurrentEpic(epicForTask);
    setIsEditingTask(true);
    setShowTaskForm(true);
  };

  const handleCloseEpicForm = () => {
    setShowEpicForm(false);
    setCurrentEpic(null);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setCurrentTask(null);
  };

  // Support both epic._id and epic.epic_id to cover legacy data, compare as strings
  const getTasksForEpic = (epic) => {
    const epicIds = [epic?._id, epic?.epic_id].filter(Boolean).map(id => String(id));
    return tasks.filter(task => epicIds.includes(String(task.epic_id)));
  };

  const getTeamLeadName = (teamLeadId) => {
    if (!users || !teamLeadId) return 'Unassigned';
    
    // Add debugging to see the actual structure
    console.log('Users:', users);
    console.log('Looking for team lead ID:', teamLeadId);
    
    // Try different possible ID field names
    const teamLead = users.find(user => 
      user.user_id === teamLeadId || 
      user._id === teamLeadId || 
      user.id === teamLeadId
    );
    
    if (!teamLead) {
      console.log('Team lead not found');
      return 'Unknown';
    }
    
    console.log('Found team lead:', teamLead);
    
    // Try different possible name field combinations
    if (teamLead.first_name && teamLead.last_name) {
      return `${teamLead.first_name} ${teamLead.last_name}`;
    } else if (teamLead.firstName && teamLead.lastName) {
      return `${teamLead.firstName} ${teamLead.lastName}`;
    } else if (teamLead.name) {
      return teamLead.name;
    } else if (teamLead.username) {
      return teamLead.username;
    } else {
      return 'Unknown';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-[#4CAF50] text-white';
      case 'in progress':
        return 'bg-[#418EFD] text-white';
      case 'blocked':
        return 'bg-[#F44336] text-white';
      case 'to do':
      case 'not started':
        return 'bg-[#2A2A34] text-white';
      default:
        return 'bg-[#8BBAFC] text-[#2A2A34]';
    }
  };

  if (epicsLoading || tasksLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#FFFFFF]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#418EFD] mb-4"></div>
        <p className="text-[#4A4A57] font-medium">Loading Kanban Board...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-[#FFFFFF]">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/project-management')}
            className="mr-4 text-[#418EFD] hover:text-[#307ae3] transition-colors p-2 rounded-full hover:bg-[#418EFD]/10"
            title="Back to Projects"
          >
            <FaArrowLeft className="text-2xl" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#2A2A34]">
              {currentProject ? currentProject.project_details.name : 'Kanban Board'}
            </h1>
            {currentProject && (
              <p className="text-[#4A4A57] mt-1">{currentProject.project_details.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleAddEpic}
          className="bg-[#418EFD] hover:bg-[#307ae3] text-white font-medium py-2.5 px-5 rounded-lg flex items-center transition-colors shadow-md"
        >
          <FaPlus className="mr-2" /> Add Epic
        </button>
      </div>

      {epicsError && (
        <div className="bg-[#F44336]/10 border border-[#F44336] text-[#F44336] px-4 py-3 rounded-lg relative mb-6 flex items-center" role="alert">
          <FaExclamationCircle className="mr-2" />
          <span className="block sm:inline">{epicsError}</span>
        </div>
      )}

      {epics.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center border border-[#8BBAFC] max-w-2xl mx-auto">
          <div className="text-[#418EFD] mb-4">
            <FaPlus className="text-5xl mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-[#2A2A34] mb-2">No Epics Found</h2>
          <p className="text-[#4A4A57] mb-6">Create a new epic to organize your project tasks.</p>
          <button
            onClick={handleAddEpic}
            className="bg-[#418EFD] hover:bg-[#307ae3] text-white font-medium py-2.5 px-5 rounded-lg flex items-center transition-colors mx-auto"
          >
            <FaPlus className="mr-2" /> Create Your First Epic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {epics.map(epic => (
            <div key={epic._id || epic.epic_id} className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC] flex flex-col h-full hover:shadow-lg transition-shadow">
              <div className="bg-[#418EFD] text-white p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold truncate">{epic.name}</h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleEditEpic(epic)}
                    className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-[#307ae3]"
                    title="Edit Epic"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDeleteEpic(epic.epic_id)}
                    className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-[#307ae3]"
                    title="Delete Epic"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="p-4 flex-grow">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusBadgeColor(epic.status)}`}>
                      {epic.status || 'Not Set'}
                    </span>
                    <span className="text-sm text-[#4A4A57] font-medium">
                      {getTasksForEpic(epic).length} Tasks
                    </span>
                  </div>
                  
                  {epic.description && (
                    <p className="text-sm text-[#4A4A57] mt-2 line-clamp-2">{epic.description}</p>
                  )}
                  
                  {epic.team_lead_id && (
                    <div className="flex items-center text-sm text-[#4A4A57] mt-1">
                      <FaUser className="mr-2 text-[#418EFD]" />
                      <span>Lead: {getTeamLeadName(epic.team_lead_id)}</span>
                    </div>
                  )}
                  
                  {epic.start_date && epic.end_date && (
                    <div className="flex items-center text-sm text-[#4A4A57]">
                      <FaCalendarAlt className="mr-2 text-[#418EFD]" />
                      <span>
                        {new Date(epic.start_date).toLocaleDateString()} - {new Date(epic.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {epic.priority && (
                    <div className="flex items-center text-sm text-[#4A4A57]">
                      <FaFlag className="mr-2 text-[#418EFD]" />
                      <span>Priority: {epic.priority}</span>
                    </div>
                  )}
                </div>

                {/* Team members assigned to this epic */}
                <div className="mt-3">
                  <div className="text-xs font-semibold text-[#2A2A34] mb-1">Team Members</div>
                  <div className="flex flex-wrap gap-2">
                    {(epic.team_members || []).length === 0 ? (
                      <span className="text-xs text-[#4A4A57]">No team members assigned</span>
                    ) : (
                      (epic.team_members || []).map(tm => {
                        const tmId = tm?._id || tm;
                        const userObj = users?.find(u => u._id === tmId);
                        const label = userObj?.name || userObj?.username || String(tmId).slice(-6);
                        return (
                          <span key={tmId} className="text-xs bg-[#8BBAFC]/20 text-[#2A2A34] px-2 py-1 rounded">
                            {label}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <div className="border-t border-[#8BBAFC]/50 pt-4 mt-2">
                  <TaskList 
                    tasks={getTasksForEpic(epic)} 
                    onEditTask={handleEditTask} 
                    epicId={epic._id || epic.epic_id}
                    canManageTasks={canManageTasks}
                  />
                </div>
                
                {canManageTasks && (
                  <button
                    onClick={() => handleAddTask(epic)}
                    className="mt-4 w-full bg-[#418EFD]/10 hover:bg-[#418EFD]/20 text-[#418EFD] font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <FaPlus className="mr-2" /> Add Task
                  </button>
                )}
                
                {isProjectManager && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> As a Project Manager, you can create epics and assign them to Project Leads. 
                      Only Project Leads can create and manage tasks within their assigned epics.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forms remain the same */}
      <EpicForm 
        isOpen={showEpicForm}
        onClose={handleCloseEpicForm}
        projectId={projectId}
        epic={currentEpic}
        isEditing={isEditingEpic}
      />

      <TaskForm 
        isOpen={showTaskForm}
        onClose={handleCloseTaskForm}
        projectId={projectId}
        epicId={currentEpic?._id || currentEpic?.epic_id}
        task={currentTask}
        isEditing={isEditingTask}
        teamMembers={currentEpic?.team_members}
      />
    </div>
  );
};

export default KanbanBoard;