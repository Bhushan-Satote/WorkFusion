import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteTask } from '../../../store/taskStore';
import { 
  FaFilter, 
  FaSort, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaCalendarAlt,
  FaUser,
  FaFlag
} from 'react-icons/fa';
import TaskCard from './TaskCard';
import TaskDetailView from './TaskDetailView';

const TaskList = ({ tasks, onEditTask, epicId, canManageTasks = true }) => {
  const dispatch = useDispatch();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask({ taskId, projectId: tasks[0]?.project_id, epicId }));
    }
  };

  const filteredTasks = tasks.filter(task => {
    let statusMatch = true;
    let priorityMatch = true;
    
    if (filterStatus && task.status) {
      statusMatch = task.status.toLowerCase() === filterStatus.toLowerCase();
    }
    
    if (filterPriority && task.priority) {
      priorityMatch = task.priority.toLowerCase() === filterPriority.toLowerCase();
    }
    
    return statusMatch && priorityMatch;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!sortBy) return 0;
    
    switch (sortBy) {
      case 'priority-high':
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return (priorityOrder[b.priority?.toLowerCase()] || 0) - (priorityOrder[a.priority?.toLowerCase()] || 0);
      case 'priority-low':
        const priorityOrderAsc = { 'high': 3, 'medium': 2, 'low': 1 };
        return (priorityOrderAsc[a.priority?.toLowerCase()] || 0) - (priorityOrderAsc[b.priority?.toLowerCase()] || 0);
      case 'due-date-asc':
        return new Date(a.due_date || 0) - new Date(b.due_date || 0);
      case 'due-date-desc':
        return new Date(b.due_date || 0) - new Date(a.due_date || 0);
      default:
        return 0;
    }
  });

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
        <FaExclamationCircle className="mx-auto text-2xl mb-2 text-gray-400" />
        <p>No tasks in this epic yet.</p>
      </div>
    );
  }

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

  // Helper function to handle viewing a task
  const handleViewTask = (task) => {
    setViewingTask(task);
  };

  // Helper function to close task view modal
  const closeTaskView = () => {
    setViewingTask(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-[#2A2A34]">Tasks ({filteredTasks.length})</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-md transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            title="Filter Tasks"
          >
            <FaFilter />
          </button>
          <button 
            onClick={() => setSortBy(sortBy === 'priority-high' ? 'priority-low' : 'priority-high')}
            className={`p-1.5 rounded-md transition-colors ${sortBy.startsWith('priority') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            title="Sort by Priority"
          >
            <FaSort />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-[#F5F8FF] p-4 rounded-lg mb-4 border border-[#8BBAFC]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A4A57] mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A4A57] mb-1">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterPriority('');
                setSortBy('');
              }}
              className="text-xs text-[#418EFD] hover:text-[#307ae3] font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {sortedTasks.map(task => (
          <TaskCard 
            key={task._id}
            task={task}
            onViewTask={handleViewTask}
            onEditTask={onEditTask}
            onDeleteTask={handleDeleteTask}
            canManageTasks={canManageTasks}
          />
        ))}
      </div>
      
      {/* Task View Modal */}
      {viewingTask && (
        <TaskDetailView
          task={viewingTask}
          onClose={closeTaskView}
          onEdit={(task) => {
            closeTaskView();
            onEditTask(task);
          }}
        />
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </div>
  );
};

export default TaskList;