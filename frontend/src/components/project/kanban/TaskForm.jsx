import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { useDispatch, useSelector } from 'react-redux';
import { createTask, updateTask, fetchEpicTasks } from '../../../store/taskStore';
import useUserStore from '../../../store/userStore';
import { 
  FaTimes, 
  FaPlus, 
  FaTrash, 
  FaPaperclip, 
  FaTasks,
  FaUsers,
  FaCalendarAlt,
  FaFlag,
  FaChartLine,
  FaExclamationCircle // Add this import
} from 'react-icons/fa';
import Select from 'react-select';

const TaskForm = ({ isOpen, onClose, projectId, epicId, task, isEditing, epic, teamMembers: epicTeamMembers = [] }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(state => state.tasks);
  const { currentEpic, epics } = useSelector(state => state.kanban);
  // Compute epic timeline boundaries (YYYY-MM-DD strings and Date objects)
  const epicSource = epic || currentEpic || (Array.isArray(epics) ? epics.find(e => e._id === epicId || e.epic_id === epicId) : null);

  // Helper to derive creation date from a Mongo ObjectId string
  const getObjectIdCreationDate = (objectId) => {
    try {
      if (typeof objectId !== 'string' || objectId.length < 8) return null;
      const tsHex = objectId.substring(0, 8);
      const ts = parseInt(tsHex, 16);
      if (Number.isNaN(ts)) return null;
      return new Date(ts * 1000);
    } catch (_) {
      return null;
    }
  };

  // Prefer epic planned start_date; if missing, fall back to explicit createdAt or derive from _id/epic_id
  const epicStartDateStr = epicSource?.start_date
    ? new Date(epicSource.start_date).toISOString().split('T')[0]
    : (epicSource?.createdAt
      ? new Date(epicSource.createdAt).toISOString().split('T')[0]
      : (epicSource?._id && typeof epicSource._id === 'string')
        ? (getObjectIdCreationDate(epicSource._id)?.toISOString().split('T')[0] || '')
        : (epicSource?.epic_id && typeof epicSource.epic_id === 'string')
          ? (getObjectIdCreationDate(epicSource.epic_id)?.toISOString().split('T')[0] || '')
          : '');
  const epicStartDate = epicStartDateStr ? new Date(epicStartDateStr) : null;

  const epicEndDateStr = epicSource?.end_date
    ? new Date(epicSource.end_date).toISOString().split('T')[0]
    : '';
  const epicEndDate = epicEndDateStr ? new Date(epicEndDateStr) : null;
  
  // Use Zustand store for users
  const { users, fetchUsers } = useUserStore();

  // For Project Lead: fetched list of team members for the project lead
  const [fetchedTeamMembers, setFetchedTeamMembers] = useState([]);

  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const res = await axios.get('/project-lead/team-members');
        setFetchedTeamMembers(res.data.data || []);
      } catch (error) {
        setFetchedTeamMembers([]);
      }
    }
    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: [],
    start_date: '',
    due_date: '',
    priority: 'Medium',
    status: 'To-do',
    progress: 0,
    attachments: [],
    additional_fields: {}
  });

  // For managing additional fields UI
  const [additionalFields, setAdditionalFields] = useState([]);
  // For file uploads
  const [files, setFiles] = useState([]);

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (isEditing && task) {
      // Convert additional_fields object to array for UI
      const additionalFieldsArray = task.additional_fields ? 
        Object.entries(task.additional_fields).map(([key, value]) => ({ key, value })) : 
        [];
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigned_to: task.assigned_to || [],
        start_date: task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        priority: task.priority || 'Medium',
        status: task.status || 'To-do',
        progress: task.progress || 0,
        attachments: task.attachments || [],
        additional_fields: task.additional_fields || {}
      });
      
      setAdditionalFields(additionalFieldsArray);
    } else {
      // Reset form when not editing
      setFormData({
        title: '',
        description: '',
        assigned_to: [],
        start_date: epicStartDateStr || '',
        due_date: '',
        priority: 'Medium',
        status: 'To-do',
        progress: 0,
        attachments: [],
        additional_fields: {}
      });
      
      setAdditionalFields([]);
      setFiles([]);
    }
  }, [isEditing, task, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific error when input becomes valid
    if (name === 'title') {
      if (value.trim() && value.trim().length >= 3) {
        setErrors(prev => ({ ...prev, title: '' }));
      }
    } else if (name === 'description') {
      if (value.trim() && value.trim().length >= 10) {
        setErrors(prev => ({ ...prev, description: '' }));
      }
    } else if (name === 'start_date') {
      const startDate = value ? new Date(value) : null;
      const withinEpic = (!epicStartDate || (startDate && startDate >= epicStartDate)) && (!epicEndDate || (startDate && startDate <= epicEndDate));
      // Clamp to boundaries if outside range
      if (startDate) {
        if (epicStartDate && startDate < epicStartDate) {
          setFormData(prev => ({ ...prev, start_date: epicStartDateStr }));
          setErrors(prev => ({ ...prev, start_date: `Start date cannot be before epic start (${epicStartDateStr})` }));
        } else if (epicEndDate && startDate > epicEndDate) {
          setFormData(prev => ({ ...prev, start_date: epicEndDateStr }));
          setErrors(prev => ({ ...prev, start_date: `Start date cannot be after epic end (${epicEndDateStr})` }));
        } else if (withinEpic) {
          setErrors(prev => ({ ...prev, start_date: '' }));
        }
      }
    } else if (name === 'due_date') {
      const dueDate = value ? new Date(value) : null;
      const startDate = formData.start_date ? new Date(formData.start_date) : null;
      const withinEpic = (!epicStartDate || (dueDate && dueDate >= epicStartDate)) && (!epicEndDate || (dueDate && dueDate <= epicEndDate));
      // Clamp to boundaries if outside range
      if (dueDate) {
        if (epicEndDate && dueDate > epicEndDate) {
          setFormData(prev => ({ ...prev, due_date: epicEndDateStr }));
          setErrors(prev => ({ ...prev, due_date: `Due date cannot be after epic end (${epicEndDateStr})` }));
        } else if (epicStartDate && dueDate < epicStartDate) {
          setFormData(prev => ({ ...prev, due_date: epicStartDateStr }));
          setErrors(prev => ({ ...prev, due_date: `Due date cannot be before epic start (${epicStartDateStr})` }));
        } else if (dueDate && startDate && dueDate > startDate && withinEpic) {
          setErrors(prev => ({ ...prev, due_date: '' }));
        }
      }
    }
  };

  // Handle assigned_to with react-select
  const handleAssigneeChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: selectedOptions ? selectedOptions.map(option => option.value) : []
    }));

    // Clear assignee error when at least one assignee is selected
    if (selectedOptions && selectedOptions.length > 0) {
      setErrors(prev => ({ ...prev, assigned_to: '' }));
    }
  };

  // Handle progress slider
  const handleProgressChange = (e) => {
    setFormData(prev => ({
      ...prev,
      progress: parseInt(e.target.value, 10)
    }));
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle additional fields
  const addAdditionalField = () => {
    setAdditionalFields(prev => [...prev, { key: '', value: '' }]);
  };

  const removeAdditionalField = (index) => {
    setAdditionalFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdditionalFieldChange = (index, field, value) => {
    const updatedFields = [...additionalFields];
    updatedFields[index][field] = value;
    setAdditionalFields(updatedFields);
  };

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Task title must be at least 3 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Assignee validation
    if (formData.assigned_to.length === 0) {
      newErrors.assigned_to = 'At least one assignee is required';
    }

    // Date validations (strictly within epic start/end)
    const startDate = formData.start_date ? new Date(formData.start_date) : null;
    const dueDate = formData.due_date ? new Date(formData.due_date) : null;

    if (!startDate) {
      newErrors.start_date = 'Start date is required';
    }
    if (startDate) {
      if (epicStartDate && startDate < epicStartDate) {
        newErrors.start_date = `Start date cannot be before epic start (${epicStartDateStr})`;
      }
      if (epicEndDate && startDate > epicEndDate) {
        newErrors.start_date = `Start date cannot be after epic end (${epicEndDateStr})`;
      }
    }

    if (!dueDate) {
      newErrors.due_date = 'Due date is required';
    } else if (startDate && dueDate <= startDate) {
      newErrors.due_date = 'Due date must be after start date';
    }
    if (dueDate) {
      if (epicEndDate && dueDate > epicEndDate) {
        newErrors.due_date = `Due date cannot be after epic end (${epicEndDateStr})`;
      }
      if (epicStartDate && dueDate < epicStartDate) {
        newErrors.due_date = `Due date cannot be before epic start (${epicStartDateStr})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Convert additional fields array to object
    const additionalFieldsObj = {};
    additionalFields.forEach(field => {
      if (field.key.trim() !== '') {
        additionalFieldsObj[field.key] = field.value;
      }
    });
    
    // Handle file uploads (in a real app, you'd upload these to a server)
    const fileAttachments = files.map(file => ({
      file_name: file.name,
      file_url: URL.createObjectURL(file), // This is temporary, you'd use a real URL in production
      upload_date: new Date()
    }));
    
    const taskData = {
      ...formData,
      project_id: projectId,
      epic_id: epicId,
      additional_fields: additionalFieldsObj,
      // In a real app, you'd handle file uploads separately and then add the URLs
      attachments: isEditing ? [...formData.attachments, ...fileAttachments] : fileAttachments
    };
    
    try {
      if (isEditing) {
        await dispatch(updateTask({ 
          taskId: task._id,
          taskData,
          epicId,
          projectId // Add projectId for the correct API endpoint
        }));
      } else {
        // Make sure we're passing all required parameters
        await dispatch(createTask(taskData));
        
        // Refresh the epic tasks after creating a new task
        if (epicId && projectId) {
          dispatch(fetchEpicTasks({ projectId, epicId }));
        }
      }
      
      onClose();
    } catch (error) {
      console.error("Error in task submission:", error);
      // Error is already handled by the Redux action
    }
  };

  // Prepare user options for react-select
  // Only show fetched team members. If epicTeamMembers prop is provided, filter by those IDs (supports objects or IDs).
  const allowedIds = new Set(
    Array.isArray(epicTeamMembers)
      ? epicTeamMembers.map(tm => (typeof tm === 'object' ? tm._id || tm.id : tm)).filter(Boolean)
      : []
  );
  const availableUsers = allowedIds.size > 0
    ? fetchedTeamMembers.filter(u => allowedIds.has(u._id))
    : fetchedTeamMembers;

  const userOptions = availableUsers.map(user => ({
    value: user._id || user.username,
    label: user.name || user.username || user.email
  }));

  const assignedToValue = userOptions.filter(option => 
    formData.assigned_to.includes(option.value)
  );

  // Add custom styles for react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#8BBAFC' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 1px #8BBAFC' : 'none',
      '&:hover': {
        borderColor: '#8BBAFC'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#418EFD' : state.isFocused ? '#8BBAFC' : 'white',
      color: state.isSelected ? 'white' : '#2A2A34',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#418EFD/10',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#418EFD',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#418EFD',
      '&:hover': {
        backgroundColor: '#418EFD/20',
        color: '#307ae3',
      },
    }),
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b border-[#8BBAFC]">
          <h2 className="text-base font-medium text-[#2A2A34] flex items-center gap-2">
            <FaTasks className="text-[#418EFD]" />
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <FaTimes size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 bg-[#F44336]/10 border border-[#F44336] text-[#F44336] px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Title and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.title ? 'border-red-500 focus:ring-red-500' : 'border-[#8BBAFC]/30 focus:ring-[#418EFD]'
                  } focus:ring-1 focus:border-[#418EFD] bg-gray-50 hover:bg-gray-50/80`}
                  placeholder="Enter task title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="mr-1 h-4 w-4" />
                    {errors.title}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-[#418EFD] focus:border-[#418EFD]  bg-gray-50 hover:bg-gray-50/80"
                >
                  <option value="To-do">To-do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.description ? 'border-red-500 focus:ring-red-500' : 'border-[#8BBAFC]/30 focus:ring-[#418EFD]'
                } focus:ring-1 focus:border-[#418EFD] bg-gray-50 hover:bg-gray-50/80`}
                rows="3"
                placeholder="Enter task description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <FaExclamationCircle className="mr-1 h-4 w-4" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To <span className="text-red-500">*</span>
              </label>
              <Select
                isMulti
                value={assignedToValue}
                onChange={handleAssigneeChange}
                options={userOptions}
                styles={{
                  ...customSelectStyles,
                  control: (provided, state) => ({
                    ...provided,
                    borderColor: errors.assigned_to ? '#ef4444' : state.isFocused ? '#8BBAFC' : '#e2e8f0',
                    boxShadow: errors.assigned_to ? '0 0 0 1px #ef4444' : state.isFocused ? '0 0 0 1px #8BBAFC' : 'none',
                  })
                }}
                placeholder="Select assignees"
              />
              {errors.assigned_to && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <FaExclamationCircle className="mr-1 h-4 w-4" />
                  {errors.assigned_to}
                </p>
              )}
            </div>

            {/* Dates and Priority */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 border rounded-md ${
                    errors.start_date ? 'border-red-500 focus:ring-red-500' : 'border-[#8BBAFC]/30 focus:ring-[#418EFD]'
                  } focus:ring-1 focus:border-[#418EFD] bg-gray-50 hover:bg-gray-50/80`}
                  min={epicStartDateStr || undefined}
                  max={epicEndDateStr || undefined}
                />
                {(epicStartDateStr || epicEndDateStr) && (
                  <p className="mt-1 text-xs text-gray-500">
                    {epicStartDateStr && epicEndDateStr
                      ? `Allowed range: ${epicStartDateStr} to ${epicEndDateStr}`
                      : epicStartDateStr
                        ? `Allowed from: ${epicStartDateStr}`
                        : epicEndDateStr
                          ? `Allowed until: ${epicEndDateStr}`
                          : ''}
                  </p>
                )}
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="mr-1 h-4 w-4" />
                    {errors.start_date}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 border rounded-md ${
                    errors.due_date ? 'border-red-500 focus:ring-red-500' : 'border-[#8BBAFC]/30 focus:ring-[#418EFD]'
                  } focus:ring-1 focus:border-[#418EFD] bg-gray-50 hover:bg-gray-50/80`}
                  min={epicStartDateStr || undefined}
                  max={epicEndDateStr || undefined}
                />
                {(epicStartDateStr || epicEndDateStr) && (
                  <p className="mt-1 text-xs text-gray-500">
                    {epicStartDateStr && epicEndDateStr
                      ? `Allowed range: ${epicStartDateStr} to ${epicEndDateStr}`
                      : epicStartDateStr
                        ? `Allowed from: ${epicStartDateStr}`
                        : epicEndDateStr
                          ? `Allowed until: ${epicEndDateStr}`
                          : ''}
                  </p>
                )}
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="mr-1 h-4 w-4" />
                    {errors.due_date}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-[#418EFD] focus:border-[#418EFD] bg-gray-50 hover:bg-gray-50/80"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Progress */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Progress <span className="text-[#418EFD]">{formData.progress}%</span>
              </label>
              <input
                type="range"
                name="progress"
                min="0"
                max="100"
                step="5"
                value={formData.progress}
                onChange={handleProgressChange}
                className="w-full h-2 bg-[#418EFD]/10 rounded-lg appearance-none cursor-pointer bg-gray-50 hover:bg-gray-50/80"
              />
            </div>

            {/* Files section remains mostly the same but with updated styling */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                <FaPaperclip size={14} className="text-[#418EFD]" /> Attachments
              </label>
              <label className="flex items-center px-4 py-2 bg-[#418EFD]/10 text-[#418EFD] rounded-md cursor-pointer hover:bg-[#418EFD]/20 transition-colors">
                <FaPlus className="mr-2" size={14} />
                <span className="text-sm font-medium">Add Files</span>
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>
              
              {/* File list styling updated */}
              {files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-600 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-[#8BBAFC]/30">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm text-white bg-[#418EFD] rounded-md hover:bg-[#307ae3]"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;