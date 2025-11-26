import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addEpic, updateEpic } from '../../../store/kanbanStore';
import useUserStore from '../../../store/userStore'; // Import Zustand user store
import { 
  FaTimes, 
  FaPlus, 
  FaTrash, 
  FaUser, 
  FaUsers, 
  FaCode, 
  FaCalendarAlt, 
  FaCheckCircle,
  FaEdit,
  FaPencilAlt,
  FaExclamationCircle
} from 'react-icons/fa';
import Select from 'react-select'; // You'll need to install this package
import {
  FaLaptopCode,
  FaCodeBranch,
  FaCogs,
  FaLayerGroup
} from 'react-icons/fa';

const EpicForm = ({ isOpen, onClose, projectId, epic, isEditing }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(state => state.kanban);
  // Add current project to enforce date range constraints
  const { currentProject } = useSelector(state => state.projects);

  // Use Zustand store instead of Redux
  const { users, fetchUsers, isLoading: usersLoading } = useUserStore();

  // Compute project timeline boundaries (YYYY-MM-DD strings and Date objects)
  const projectStartDateStr = currentProject?.project_details?.start_date
    ? new Date(currentProject.project_details.start_date).toISOString().split('T')[0]
    : '';
  const projectEndDateStr = currentProject?.project_details?.end_date
    ? new Date(currentProject.project_details.end_date).toISOString().split('T')[0]
    : '';
  const projectStartDate = projectStartDateStr ? new Date(projectStartDateStr) : null;
  const projectEndDate = projectEndDateStr ? new Date(projectEndDateStr) : null;
  
  // Get existing epics for the current project to determine already-assigned members
  const { epics } = useSelector(state => state.kanban);

  // Memoized list of member IDs that are already allocated to an active (non-completed) epic
  const unavailableMemberIds = React.useMemo(() => {
    if (!epics) return [];
    let ids = [];
    epics.forEach(e => {
      if (!e) return;
      const status = (e.status || '').toLowerCase();
      // Consider an epic active if its status is anything except \"completed\" or \"done\"
      if (status !== 'completed' && status !== 'done') {
        if (Array.isArray(e.team_members)) {
          ids.push(
            ...e.team_members.map(m =>
              typeof m === 'object' ? (m._id || m.id) : m
            )
          );
        }
      }
    });
    // While editing an epic, allow its existing members to remain selectable
    if (isEditing && epic && Array.isArray(epic.team_members)) {
      ids = ids.filter(id => !epic.team_members.includes(id));
    }
    return ids;
  }, [epics, isEditing, epic]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_lead_id: '',
    team_members: [],
    technologies: [{ name: '', version: '', type: '' }],
    start_date: '',
    end_date: '',
    status: 'Planned'
  });

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (isEditing && epic) {
      setFormData({
        name: epic.name || '',
        description: epic.description || '',
        team_lead_id: epic.team_lead_id || '',
        team_members: Array.isArray(epic.team_members) ? epic.team_members : [],
        technologies: Array.isArray(epic.technologies) && epic.technologies.length > 0 
          ? epic.technologies 
          : [{ name: '', version: '', type: '' }],
        start_date: epic.start_date ? new Date(epic.start_date).toISOString().split('T')[0] : '',
        end_date: epic.end_date ? new Date(epic.end_date).toISOString().split('T')[0] : '',
        status: epic.status || 'Planned'
      });
    } else {
      // Reset form when not editing
      setFormData({
        name: '',
        description: '',
        team_lead_id: '',
        team_members: [],
        technologies: [{ name: '', version: '', type: '' }],
        start_date: '',
        end_date: '',
        status: 'Planned'
      });
    }
  }, [isEditing, epic, isOpen]);

  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    validateField(name, value);
  };

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          setErrors(prev => ({
            ...prev,
            name: 'Epic name is required'
          }));
        } else if (value.trim().length < 3) {
          setErrors(prev => ({
            ...prev,
            name: 'Epic name must be at least 3 characters'
          }));
        } else if (value.trim().length > 50) {
          setErrors(prev => ({
            ...prev,
            name: 'Epic name cannot exceed 50 characters'
          }));
        } else {
          setErrors(prev => ({ ...prev, name: '' }));
        }
        break;

      case 'description':
        if (!value.trim()) {
          setErrors(prev => ({
            ...prev,
            description: 'Description is required'
          }));
        } else if (value.trim().length < 10) {
          setErrors(prev => ({
            ...prev,
            description: 'Description must be at least 10 characters'
          }));
        } else {
          setErrors(prev => ({ ...prev, description: '' }));
        }
        break;

      case 'start_date':
      case 'end_date':
        // Validate with the latest typed value, avoiding stale state
        validateDates(
          fieldName === 'start_date' ? value : formData.start_date,
          fieldName === 'end_date' ? value : formData.end_date
        );
        break;

      default:
        break;
    }
  };

  const validateDates = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const newErrors = { ...errors };

    // Start date must be within project timeline
    if (start) {
      if (projectStartDate && start < projectStartDate) {
        newErrors.start_date = `Start date cannot be before project start (${projectStartDateStr})`;
      } else if (projectEndDate && start > projectEndDate) {
        newErrors.start_date = `Start date cannot be after project end (${projectEndDateStr})`;
      } else {
        delete newErrors.start_date;
      }
    }

    // End date must be after start and within project timeline
    if (start && end) {
      if (end < start) {
        newErrors.end_date = 'End date must be after start date';
      } else if (projectEndDate && end > projectEndDate) {
        newErrors.end_date = `End date cannot be after project end (${projectEndDateStr})`;
      } else if (projectStartDate && end < projectStartDate) {
        newErrors.end_date = `End date cannot be before project start (${projectStartDateStr})`;
      } else {
        delete newErrors.end_date;
      }
    }

    setErrors(newErrors);
  };

  const handleTeamLeadChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      team_lead_id: selectedOption ? selectedOption.value : '',
      team_members: [] // reset selections when lead changes
    }));
    
    if (selectedOption) {
      setErrors(prev => ({ ...prev, team_lead_id: '', team_members: '' }));
    } else {
      setErrors(prev => ({
        ...prev,
        team_lead_id: 'Team lead is required'
      }));
    }
  };

  const handleTeamMembersChange = (selectedOptions) => {
    const members = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prev => ({
      ...prev,
      team_members: members
    }));
    if (errors.team_members) {
      setErrors(prev => ({
        ...prev,
        team_members: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Epic name is required';
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Epic name must be at least 3 characters';
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
      isValid = false;
    }

    // Team lead validation
    if (!formData.team_lead_id) {
      newErrors.team_lead_id = 'Team lead is required';
      isValid = false;
    }

    // Team members validation
    if (!formData.team_members || formData.team_members.length === 0) {
      newErrors.team_members = 'At least one team member is required';
      isValid = false;
    }

    // Date validations against project timeline
    const startDate = formData.start_date ? new Date(formData.start_date) : null;
    const endDate = formData.end_date ? new Date(formData.end_date) : null;

    if (!startDate) {
      newErrors.start_date = 'Start date is required';
      isValid = false;
    } else {
      if (projectStartDate && startDate < projectStartDate) {
        newErrors.start_date = `Start date cannot be before project start (${projectStartDateStr})`;
        isValid = false;
      }
      if (projectEndDate && startDate > projectEndDate) {
        newErrors.start_date = `Start date cannot be after project end (${projectEndDateStr})`;
        isValid = false;
      }
    }

    if (!endDate) {
      newErrors.end_date = 'End date is required';
      isValid = false;
    } else {
      if (startDate && endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
        isValid = false;
      }
      if (projectEndDate && endDate > projectEndDate) {
        newErrors.end_date = `End date cannot be after project end (${projectEndDateStr})`;
        isValid = false;
      }
      if (projectStartDate && endDate < projectStartDate) {
        newErrors.end_date = `End date cannot be before project start (${projectStartDateStr})`;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleTechChange = (index, field, value) => {
    const updatedTechnologies = [...formData.technologies];
    updatedTechnologies[index][field] = value;
    setFormData(prev => ({
      ...prev,
      technologies: updatedTechnologies
    }));
    
    // Clear technology error when user starts typing
    if (field === 'name' && value.trim() && errors.technologies) {
      setErrors(prev => ({ ...prev, technologies: '' }));
    }
  };

  const addTechnology = () => {
    setFormData(prev => ({
      ...prev,
      technologies: [...prev.technologies, { name: '', version: '', type: '' }]
    }));
  };

  const removeTechnology = (index) => {
    if (formData.technologies.length > 1) {
      const updatedTechnologies = [...formData.technologies];
      updatedTechnologies.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        technologies: updatedTechnologies
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const processedData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      team_lead_id: formData.team_lead_id,
      team_members: formData.team_members,
      technologies: formData.technologies.filter(tech => tech.name.trim() !== ''),
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status
    };
    
    if (isEditing) {
      await dispatch(updateEpic({ 
        projectId, 
        epicId: epic._id || epic.epic_id,
        epicData: processedData 
      }));
    } else {
      await dispatch(addEpic({ 
        projectId, 
        epicData: processedData 
      }));
    }
    
    onClose();
  };

    // Prepare options for select components
    // Only include users with the \"Project Lead\" role for Team Lead selection
    const projectLeadUsers = users?.filter(
    (user) => (user.credentialId?.role || user.role) === "Project Lead"
    ) || [];
    
    const userOptions = projectLeadUsers.map((user) => ({
    value: user._id || user.username || user.name, // Use ID if available, otherwise username or name
    label: user.name || user.username || user._id,
    }));
  
    const teamLeadValue = userOptions.find(option => option.value === formData.team_lead_id) || null;
  
    const teamMembersValue = userOptions.filter(option => 
      formData.team_members.includes(option.value)
    );
  
    const statusOptions = [
      { value: 'Planned', label: 'Planned' },
      { value: 'In Progress', label: 'In Progress' },
      { value: 'Completed', label: 'Completed' },
      { value: 'On Hold', label: 'On Hold' }
    ];
  
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
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-[#2A2A34]/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl transform transition-all">
          <div className="flex justify-between items-center p-4 border-b border-[#8BBAFC]">
            <h2 className="text-xl font-semibold text-[#2A2A34] flex items-center">
              <FaLayerGroup className="text-[#418EFD] mr-2" />
              {isEditing ? 'Edit Epic' : 'Create New Epic'}
            </h2>
            <button 
              onClick={onClose}
              className="text-[#4A4A57] hover:text-[#2A2A34] transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-[#F44336]/10 border border-[#F44336] text-[#F44336] px-4 py-3 rounded-lg relative mb-4 flex items-center">
                <FaExclamationCircle className="mr-2" />
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#2A2A34]">
                    Epic Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.name ? 'border-red-500 focus:ring-red-500' : 'border-[#8BBAFC] focus:ring-[#418EFD]/50 focus:border-[#418EFD]'
                      } text-[#2A2A34] transition-all bg-gray-50 hover:bg-gray-50/80`}
                      placeholder="Enter epic name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm flex items-center">
                      <FaExclamationCircle className="mr-1 h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#2A2A34]">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#8BBAFC] text-[#2A2A34] focus:ring-2 focus:ring-[#418EFD]/50 focus:border-[#418EFD] transition-all bg-gray-50"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#2A2A34]">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md bg-gray-50 hover:bg-gray-50/80 ${
                      errors.description ? 'border-red-500 focus:ring-red-500' : 'border-[#8BBAFC]/30 focus:ring-[#418EFD]/20'
                    }`}
                    rows="3"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <FaExclamationCircle className="mr-1 h-4 w-4" />
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
  
              {/* Team Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2A2A34]">Team Lead <span className="text-red-500">*</span></label>
                  <div className="relative">
                    {/* <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={14} /> */}
                    <Select
                      styles={{
                        ...customSelectStyles,

                        control: (provided, state) => ({
                          ...provided,
                          // paddingLeft: '2rem',
                          borderColor: errors.team_lead_id ? '#ef4444' : state.isFocused ? '#8BBAFC' : '#e2e8f0',
                          boxShadow: errors.team_lead_id ? '0 0 0 1px #ef4444' : state.isFocused ? '0 0 0 1px #8BBAFC' : 'none',
                        })
                      }}
                      value={teamLeadValue}
                      onChange={handleTeamLeadChange}
                      options={userOptions}
                      isClearable
                    />
                    {errors.team_lead_id && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <FaExclamationCircle className="mr-1 h-4 w-4" />
                        {errors.team_lead_id}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[#2A2A34] text-sm font-medium">
                    Team Members <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isMulti
                    isDisabled={!formData.team_lead_id}
                    options={users
                      ?.filter(user => {
                        const uid = user._id || user.id;
                        return !['Project Manager', 'Project Lead'].includes(user.credentialId?.role || user.role) && !unavailableMemberIds.includes(uid);
                      })
                      .map(user => ({
                      value: user._id,
                      label: user.name || user.username
                    }))}
                    value={formData.team_members.map(id => {
                      const user = users.find(u => u._id === id);
                      return {
                        value: id,
                        label: user ? (user.name || user.username) : id
                      };
                    })}
                    onChange={handleTeamMembersChange}
                    className={errors.team_members ? 'border-red-500' : ''}
                  />
                  {errors.team_members && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <FaExclamationCircle className="mr-1 h-4 w-4" />
                      {errors.team_members}
                    </p>
                  )}
                </div>
              </div>
  
              {/* Technologies */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Technologies <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addTechnology}
                    className="text-xs text-[#418EFD] hover:text-[#307ae3] flex items-center gap-1"
                  >
                    <FaPlus size={10} /> Add
                  </button>
                </div>
                <div className={`space-y-2 ${errors.technologies ? 'border border-red-500 p-2 rounded-md' : ''}`}>
                  {formData.technologies.map((tech, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Tech name"
                          value={tech.name}
                          onChange={(e) => handleTechChange(index, 'name', e.target.value)}
                          className="w-full px-4 py-1.5 border rounded-md text-sm bg-gray-50 hover:bg-gray-50/80"
                        />
                      </div>
                      <div className="relative w-24">
                        <input
                          type="text"
                          placeholder="Version"
                          value={tech.version}
                          onChange={(e) => handleTechChange(index, 'version', e.target.value)}
                          className="w-full px-4 py-1.5 border rounded-md text-sm bg-gray-50 hover:bg-gray-50/80"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTechnology(index)}
                        className="text-red-500 hover:text-red-600 p-1.5"
                        disabled={formData.technologies.length <= 1}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.technologies && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <FaExclamationCircle className="mr-1 h-4 w-4" />
                    {errors.technologies}
                  </p>
                )}
              </div>

              {/* Date Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#2A2A34]">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      min={projectStartDateStr || undefined}
                      max={projectEndDateStr || undefined}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.start_date ? 'border-red-500 focus:ring-red-500' : 'border-[#8BBAFC] focus:ring-[#418EFD]/50 focus:border-[#418EFD]'
                      } text-[#2A2A34] transition-all bg-gray-50 hover:bg-gray-50/80`}
                    />
                    {projectStartDateStr && projectEndDateStr && (
                      <p className="mt-1 text-xs text-gray-500">
                        Allowed range: {projectStartDateStr} to {projectEndDateStr}
                      </p>
                    )}
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <FaExclamationCircle className="mr-1 h-4 w-4" />
                        {errors.start_date}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#2A2A34]">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      min={projectStartDateStr || undefined}
                      max={projectEndDateStr || undefined}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.end_date ? 'border-red-500 focus:ring-red-500' : 'border-[#8BBAFC] focus:ring-[#418EFD]/50 focus:border-[#418EFD]'
                      } text-[#2A2A34] transition-all bg-gray-50 hover:bg-gray-50/80`}
                    />
                    {projectStartDateStr && projectEndDateStr && (
                      <p className="mt-1 text-xs text-gray-500">
                        Allowed range: {projectStartDateStr} to {projectEndDateStr}
                      </p>
                    )}
                    {errors.end_date && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <FaExclamationCircle className="mr-1 h-4 w-4" />
                        {errors.end_date}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-[#4A4A57] hover:text-[#2A2A34] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#418EFD] text-white rounded-lg text-sm font-medium hover:bg-[#307ae3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : isEditing ? 'Update Epic' : 'Create Epic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
};

export default EpicForm;