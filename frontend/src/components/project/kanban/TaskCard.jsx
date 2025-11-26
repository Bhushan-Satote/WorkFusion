import React from 'react';
import { 
  FaCalendarAlt, 
  FaUser, 
  FaFlag, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaEdit, 
  FaTrash, 
  FaEye 
} from 'react-icons/fa';

const TaskCard = ({ task, onViewTask, onEditTask, onDeleteTask, canManageTasks = true }) => {
  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'done':
      case 'completed':
        return <FaCheckCircle className="mr-1 text-green-600" />;
      case 'in progress':
        return <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5 ml-0.5"></div>;
      case 'blocked':
        return <FaExclamationCircle className="mr-1 text-red-600" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-400 mr-1.5 ml-0.5"></div>;
    }
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="border border-[#E0E7FF] rounded-lg p-4 bg-white hover:shadow-md transition-shadow duration-200">
      {/* Header with title and actions */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-[#2A2A34]">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-[#4A4A57] mt-1.5 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex space-x-1 ml-2">
          <button 
            onClick={() => onViewTask(task)}
            className="text-[#8BBAFC] hover:text-[#418EFD] p-1.5 rounded-md hover:bg-blue-50 transition-colors"
            title="View Task Details"
          >
            <FaEye />
          </button>
          {canManageTasks && (
            <>
              <button 
                onClick={() => onEditTask(task)}
                className="text-[#418EFD] hover:text-[#307ae3] p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                title="Edit Task"
              >
                <FaEdit />
              </button>
              <button 
                onClick={() => onDeleteTask(task._id)}
                className="text-[#F44336] hover:text-[#d32f2f] p-1.5 rounded-md hover:bg-red-50 transition-colors"
                title="Delete Task"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Status and priority badges */}
      <div className="mt-3 flex flex-wrap gap-2">
        {task.status && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center ${
            task.status.toLowerCase() === 'done' ? 'bg-green-100 text-green-800' :
            task.status.toLowerCase() === 'in progress' ? 'bg-blue-100 text-blue-800' :
            task.status.toLowerCase() === 'blocked' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
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
      </div>
      
      {/* Task details */}
      <div className="mt-3 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-[#4A4A57]">
        {task.due_date && (
          <div className="flex items-center">
            <FaCalendarAlt className="mr-1.5 text-[#418EFD]" />
            <span>Due: {formatDate(task.due_date)}</span>
          </div>
        )}
        
        {task.assigned_to && task.assigned_to.length > 0 && (
          <div className="flex items-center">
            <FaUser className="mr-1.5 text-[#418EFD]" />
            <span className="truncate">
              {Array.isArray(task.assigned_to) 
                ? task.assigned_to.map(user => typeof user === 'object' ? user.name || user.email : user).join(', ')
                : typeof task.assigned_to === 'object' 
                  ? task.assigned_to.name || task.assigned_to.email 
                  : task.assigned_to
              }
            </span>
          </div>
        )}
        
        {task.story_points && (
          <div className="flex items-center">
            <span className="w-4 h-4 bg-[#418EFD] rounded-full text-white flex items-center justify-center text-[10px] mr-1.5">
              SP
            </span>
            <span>Points: {task.story_points}</span>
          </div>
        )}
        
        {task.created_at && (
          <div className="flex items-center">
            <span className="text-[#4A4A57] opacity-75">
              Created: {new Date(task.created_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;