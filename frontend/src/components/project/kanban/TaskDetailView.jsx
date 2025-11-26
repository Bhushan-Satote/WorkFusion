import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaCalendarAlt, 
  FaUser, 
  FaFlag, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaClock, 
  FaListAlt, 
  FaComments,
  FaProjectDiagram,
  FaTag,
  FaLink,
  FaHistory,
  FaCodeBranch,
  FaChartLine
} from 'react-icons/fa';
import { fetchProjects } from '../../../store/projectStore';
import { fetchEpics } from '../../../store/kanbanStore';
import useUserStore from '../../../store/userStore'; // Import Zustand store

const TaskDetailView = ({ task, onClose, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  
  // Get data from Redux stores
  const projects = useSelector(state => state.projects?.projects || []);
  const epics = useSelector(state => state.kanban?.epics || []);
  
  // Get users from Zustand store
  const { users, fetchUsers } = useUserStore();

  // Helper function to get project details
  const getProjectDetails = (projectId) => {
    if (!projectId) return 'Not assigned';
    const project = projects.find(p => p._id === projectId || p.id === projectId);
    return project ? project.name || project.title : projectId;
  };

  // Helper function to get epic details
  const getEpicDetails = (epicId) => {
    if (!epicId) return 'Not assigned';
    const epic = epics.find(e => e._id === epicId || e.id === epicId);
    return epic ? epic.name || epic.title : epicId;
  };
  
  // Fetch necessary data when component mounts
  useEffect(() => {
    // Fetch projects and epics if they're not already loaded
    if (projects.length === 0) {
      dispatch(fetchProjects());
    }
    
    if (epics.length === 0 && task.project_id) {
      dispatch(fetchEpics(task.project_id));
    }
    
    // Fetch users if they're not already loaded
    if (users.length === 0) {
      fetchUsers();
    }
    
    // Debug log to see what data we have
    console.log('Task data:', task);
    console.log('Projects:', projects);
    console.log('Epics:', epics);
    console.log('Users:', users);
    
  }, [dispatch, projects.length, epics.length, users.length, task.project_id, fetchUsers]);
  
  // Get project name - improved version
  const getProjectName = (projectId) => {
    if (!projectId) return 'Not assigned';
    const project = projects.find(p => p._id === projectId);
    if (project?.name) {
      return project.name;
    }
    // Debug log
    console.log('Project not found:', projectId, 'Available projects:', projects);
    return 'Project not found';
  };

  // Get epic name - improved version
  const getEpicName = (epicId) => {
    if (!epicId) return 'Not assigned';
    const epic = epics.find(e => e._id === epicId);
    if (epic?.name) {
      return epic.name;
    }
    // Debug log
    console.log('Epic not found:', epicId, 'Available epics:', epics);
    return 'Epic not found';
  };

  // Update useEffect to ensure data is loaded
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (projects.length === 0) {
          await dispatch(fetchProjects());
        }
        
        if (epics.length === 0 && task.project_id) {
          await dispatch(fetchEpics(task.project_id));
        }
        
        if (users.length === 0) {
          await fetchUsers();
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dispatch, projects.length, epics.length, users.length, task.project_id, fetchUsers]);
  
  // Update user details function
  const getAssignedUserDetails = (userId) => {
    if (!userId) return 'Unassigned';
    
    // Handle [object Object] issue
    if (typeof userId === 'object' && userId !== null) {
      return userId.name || userId.email || 'Unknown User';
    }
    
    if (Array.isArray(userId)) {
      return userId.map(id => {
        if (typeof id === 'object' && id !== null) {
          return id.name || id.email || 'Unknown User';
        }
        const user = users.find(u => u._id === id);
        return user ? (user.name || user.email || id) : id;
      }).join(', ');
    }
    
    const user = users.find(u => u._id === userId);
    return user ? (user.name || user.email || userId) : userId;
  };
  
  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'done':
      case 'completed':
        return <FaCheckCircle className="mr-1 text-green-600" />;
      case 'in progress':
        return <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5 ml-0.5"></div>;
      case 'to-do':
      case 'todo':
        return <div className="w-3 h-3 rounded-full bg-gray-400 mr-1.5 ml-0.5"></div>;
      case 'blocked':
        return <FaExclamationCircle className="mr-1 text-red-600" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-400 mr-1.5 ml-0.5"></div>;
    }
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  // Calculate time difference in days
  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-red-600 font-medium">Overdue by {Math.abs(diffDays)} days</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600 font-medium">Due today</span>;
    } else if (diffDays === 1) {
      return <span className="text-orange-600 font-medium">Due tomorrow</span>;
    } else if (diffDays <= 3) {
      return <span className="text-yellow-600 font-medium">Due in {diffDays} days</span>;
    } else {
      return <span className="text-green-600">Due in {diffDays} days</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-start p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl w-full my-4">
        {/* Header Section - Fixed */}
        <div className="sticky top-0 z-10 bg-[#418EFD] text-white py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold flex items-center">
              <FaListAlt className="mr-2" />
              Task Details
            </h1>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Title section */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center mb-2">
                <FaCodeBranch className="mr-2 text-[#418EFD]" />
                <h3 className="text-2xl font-bold text-[#2A2A34]">{task.title}</h3>
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                {/* Task ID: {task._id || 'Not available'} */}
              </div>
            </div>
          </div>
          
          {/* Status, Priority and Progress */}
          <div className="flex flex-wrap gap-2 mb-6">
            {task.status && (
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center shadow-sm ${
                task.status.toLowerCase() === 'done' || task.status.toLowerCase() === 'completed' 
                  ? 'bg-green-50 text-green-700 border border-green-200' :
                task.status.toLowerCase() === 'in progress' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                task.status.toLowerCase() === 'blocked' 
                  ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                {getStatusIcon(task.status)}
                {task.status}
              </span>
            )}
            
            {task.priority && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center ${
                task.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
                task.priority.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                <FaFlag className="mr-1 text-xs" />
                {task.priority}
              </span>
            )}
            
            {task.due_date && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center bg-blue-50 text-blue-700">
                {getTimeRemaining(task.due_date)}
              </span>
            )}
            
            {typeof task.progress === 'number' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center bg-indigo-100 text-indigo-800">
                <FaChartLine className="mr-1 text-xs" />
                Progress: {task.progress}%
              </span>
            )}
          </div>
          
          {/* Description */}
          {task.description && (
            <div className="mb-6">
              <h4 className="text-base font-semibold text-[#2A2A34] mb-3 flex items-center">
                <FaListAlt className="mr-2 text-[#418EFD]" />
                Description
              </h4>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-[#2A2A34] whitespace-pre-wrap">
                {task.description}
              </div>
            </div>
          )}

          {/* Task Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {task.start_date && (
              <div>
                <h4 className="text-sm font-medium text-[#4A4A57] mb-1">Start Date</h4>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-[#418EFD]" />
                  <span>{formatDateTime(task.start_date)}</span>
                </div>
              </div>
            )}
            
            {task.due_date && (
              <div>
                <h4 className="text-sm font-medium text-[#4A4A57] mb-1">Due Date</h4>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-[#418EFD]" />
                  <span>{formatDateTime(task.due_date)}</span>
                </div>
              </div>
            )}
            
            {task.assigned_to && (
              <div>
                <h4 className="text-sm font-medium text-[#4A4A57] mb-1">Assigned To</h4>
                <div className="flex items-center">
                  <FaUser className="mr-2 text-[#418EFD]" />
                  <span>
                    {Array.isArray(task.assigned_to) 
                      ? task.assigned_to.map(user => typeof user === 'object' ? user.name || user.email : user).join(', ')
                      : typeof task.assigned_to === 'object' 
                        ? task.assigned_to.name || task.assigned_to.email 
                        : task.assigned_to
                    }
                  </span>
                </div>
              </div>
            )}
            
            {task.created_by && (
              <div>
                <h4 className="text-sm font-medium text-[#4A4A57] mb-1">Created By</h4>
                <div className="flex items-center">
                  <FaUser className="mr-2 text-[#418EFD]" />
                  <span>
                    {task.user_name || (
                      Array.isArray(task.created_by) 
                        ? task.created_by.map(user => typeof user === 'object' ? user.name || user.email : getAssignedUserDetails(user)).join(', ')
                        : typeof task.created_by === 'object' 
                          ? task.created_by.name || task.created_by.email 
                          : getAssignedUserDetails(task.created_by)
                    )}
                  </span>
                </div>
              </div>
            )}
{/*             
            {task.project_id && (
              <div>
                <h4 className="text-sm font-medium text-[#4A4A57] mb-1">Project</h4>
                <div className="flex items-center">
                  <FaProjectDiagram className="mr-2 text-[#418EFD]" />
                  <span>
                    {loading ? 'Loading...' : getProjectDetails(task.project_id)}
                  </span>
                </div>
              </div>
            )}
            
            {task.epic_id && (
              <div>
                <h4 className="text-sm font-medium text-[#4A4A57] mb-1">Epic</h4>
                <div className="flex items-center">
                  <FaListAlt className="mr-2 text-[#418EFD]" />
                  <span>
                    {loading ? 'Loading...' : getEpicDetails(task.epic_id)}
                  </span>
                </div>
              </div>
            )} */}
            
            {task.createdAt && (
              <div>
                <h4 className="text-sm font-medium text-[#4A4A57] mb-1">Created</h4>
                <div className="flex items-center text-[#4A4A57]">
                  <FaClock className="mr-2 text-[#418EFD]" />
                  <span>{formatDateTime(task.createdAt)}</span>
                </div>
              </div>
            )}
            
            {task.updatedAt && (
              <div>
                <h4 className="text-sm font-medium text-[#4A4A57] mb-1">Last Updated</h4>
                <div className="flex items-center text-[#4A4A57]">
                  <FaClock className="mr-2 text-[#418EFD]" />
                  <span>{formatDateTime(task.updatedAt)}</span>
                </div>
              </div>
            )}
            
            {typeof task.progress === 'number' && (
              <div>
                <h4 className="text-sm font-medium text-[#4A4A57] mb-1">Progress</h4>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                  <span>{task.progress}%</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Attachments if available */}
          {task.attachments && task.attachments.length > 0 ? (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[#4A4A57] mb-2">Attachments</h4>
              <div className="space-y-2">
                {task.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                    <FaLink className="mr-2 text-[#418EFD]" />
                    <a 
                      href={attachment.url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {attachment.name || `Attachment ${index + 1}`}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[#4A4A57] mb-2 flex justify-between">
                <span>Attachments</span>
                <button 
                  onClick={() => onEdit({...task, showAttachmentTab: true})}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Add Attachment
                </button>
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-sm italic">
                No attachments added to this task yet
              </div>
            </div>
          )}
          
          {/* Comments section if available */}
          {task.comments && task.comments.length > 0 ? (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[#4A4A57] mb-2 flex justify-between">
                <div className="flex items-center">
                  <FaComments className="mr-2 text-[#418EFD]" />
                  Comments ({task.comments.length})
                </div>
                <button 
                  onClick={() => onEdit({...task, showCommentTab: true})}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Add Comment
                </button>
              </h4>
              <div className="space-y-3">
                {task.comments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{comment.author || getAssignedUserDetails(comment.user_id) || 'Anonymous'}</span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(comment.date || comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{comment.text || comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[#4A4A57] mb-2 flex justify-between">
                <div className="flex items-center">
                  <FaComments className="mr-2 text-[#418EFD]" />
                  Comments
                </div>
                <button 
                  onClick={() => onEdit({...task, showCommentTab: true})}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Add Comment
                </button>
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-sm italic">
                No comments on this task yet
              </div>
            </div>
          )}
          
          {/* Additional fields section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-[#4A4A57] mb-2 flex justify-between">
              <span>Additional Fields</span>
              <button 
                onClick={() => onEdit({...task, showCustomFieldsTab: true})}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Add Field
              </button>
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Display any custom fields if they exist */}
              {task.custom_fields && Object.keys(task.custom_fields).length > 0 ? (
                Object.entries(task.custom_fields).map(([key, value], index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-xs font-medium text-gray-600 mb-1">{key}</h5>
                    <p className="text-sm">{value}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-4 bg-gray-50 rounded-lg text-gray-500 text-sm italic">
                  No additional fields added to this task
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-4 pt-6 mt-8 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onEdit(task)}
              className="px-6 py-2.5 bg-[#418EFD] text-white rounded-lg hover:bg-[#307ae3] font-medium transition-colors shadow-sm"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Edit Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailView;
