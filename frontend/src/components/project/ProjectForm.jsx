import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, updateProject, clearCurrentProject } from '../../store/projectStore';
import { fetchClients } from '../../store/clientStore';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaBuilding, FaProjectDiagram, FaCalendarAlt, FaClipboardList, 
  FaFlag, FaChartLine, FaExclamationCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const ProjectForm = ({ isOpen, onClose, isEditing = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProject, isLoading, error } = useSelector((state) => state.projects);
  const { clients } = useSelector((state) => state.clients);

  const [formData, setFormData] = useState({
    client_id: '',
    project_details: {
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'Pending',
      priority: 'Medium',
      progress: 0
    }
  });

  // Local validation state for dates
  const [dateErrors, setDateErrors] = useState({ start_date: '', end_date: '' });
  const todayStr = new Date().toISOString().split('T')[0];

  const validateDates = (start, end) => {
    const errors = { start_date: '', end_date: '' };
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    const t = new Date(todayStr);

    if (s && s < t) {
      errors.start_date = 'Start date cannot be earlier than today.';
    }
    if (e && e < t) {
      errors.end_date = 'End date cannot be earlier than today.';
    }
    if (s && e && e < s) {
      errors.end_date = 'End date cannot be earlier than start date.';
    }
    return { errors, isValid: !errors.start_date && !errors.end_date };
  };

  useEffect(() => {
    dispatch(fetchClients());
    
    if (isEditing && currentProject) {
      setFormData({
        client_id: currentProject.client_id || '',
        project_details: {
          name: currentProject.project_details?.name || '',
          description: currentProject.project_details?.description || '',
          start_date: currentProject.project_details?.start_date ? new Date(currentProject.project_details.start_date).toISOString().split('T')[0] : '',
          end_date: currentProject.project_details?.end_date ? new Date(currentProject.project_details.end_date).toISOString().split('T')[0] : '',
          status: currentProject.project_details?.status || 'Pending',
          priority: currentProject.project_details?.priority || 'Medium',
          progress: currentProject.project_details?.progress || 0
        }
      });
    }

    return () => {
      if (isEditing) {
        dispatch(clearCurrentProject());
      }
    };
  }, [isEditing, currentProject, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'client_id') {
      setFormData(prev => ({ ...prev, client_id: value }));
      return;
    }

    // Update nested project_details
    const next = {
      ...formData,
      project_details: {
        ...formData.project_details,
        [name]: value
      }
    };
    setFormData(next);

    // Re-validate dates on any date field change
    if (name === 'start_date' || name === 'end_date') {
      const { errors } = validateDates(next.project_details.start_date, next.project_details.end_date);
      setDateErrors(errors);
    }
  };

  // Update the submit handler to handle errors better
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dates before submit
    const { errors, isValid } = validateDates(
      formData.project_details.start_date,
      formData.project_details.end_date
    );
    setDateErrors(errors);
    if (!isValid) return;
    
    try {
      if (isEditing && currentProject) {
        await dispatch(updateProject({ id: currentProject._id, projectData: formData })).unwrap();
      } else {
        await dispatch(createProject(formData)).unwrap();
      }
      
      // Reset form data
      setFormData({
        client_id: '',
        project_details: {
          name: '',
          description: '',
          start_date: '',
          end_date: '',
          status: 'Pending',
          priority: 'Medium',
          progress: 0
        }
      });
      setDateErrors({ start_date: '', end_date: '' });
      
      // Close the form after successful submission
      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
      // You might want to set an error state here or show a notification
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#2A2A34]/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl transform transition-all">
        <div className="flex justify-between items-center p-4 border-b border-[#8BBAFC]">
          <h2 className="text-xl font-semibold text-[#2A2A34] flex items-center">
            <FaProjectDiagram className="text-[#418EFD] mr-2" />
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button 
            onClick={onClose}
            className="text-[#4A4A57] hover:text-[#2A2A34] transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {error && (
            <div className="bg-[#F44336]/10 border border-[#F44336] text-[#F44336] px-4 py-3 rounded-lg relative mb-4 flex items-center" role="alert">
              <FaExclamationCircle className="mr-2" />
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-[#2A2A34] text-sm font-medium mb-2">
                  Client
                </label>
                <div className="relative">
                  <select
                    id="client_id"
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#8BBAFC] text-[#2A2A34] focus:ring-2 focus:ring-[#418EFD]/50 focus:border-[#418EFD] transition-all"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.client_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-[#2A2A34] text-sm font-medium mb-2">
                  Project Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.project_details.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#8BBAFC] text-[#2A2A34] focus:ring-2 focus:ring-[#418EFD]/50 focus:border-[#418EFD] transition-all"
                    required
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[#2A2A34] text-sm font-medium mb-2 flex items-center">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    id="description"
                    name="description"
                    value={formData.project_details.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#8BBAFC] text-[#2A2A34] focus:ring-2 focus:ring-[#418EFD]/50 focus:border-[#418EFD] transition-all"
                    rows="4"
                  />
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-[#2A2A34] text-sm font-medium mb-2 flex items-center" htmlFor="start_date">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.project_details.start_date}
                    onChange={handleChange}
                    min={todayStr}
                    max={formData.project_details.end_date || undefined}
                    className={`w-full px-4 py-2.5 rounded-lg border text-[#2A2A34] focus:ring-2 focus:ring-[#418EFD]/50 focus:border-[#418EFD] transition-all ${dateErrors.start_date ? 'border-red-500' : 'border-[#8BBAFC]'}`}
                    required
                  />
                  {dateErrors.start_date && (
                    <p className="mt-1 text-xs text-red-600">{dateErrors.start_date}</p>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-[#2A2A34] text-sm font-medium mb-2 flex items-center" htmlFor="end_date">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.project_details.end_date}
                    onChange={handleChange}
                    min={(formData.project_details.start_date && formData.project_details.start_date > todayStr) ? formData.project_details.start_date : todayStr}
                    className={`w-full px-4 py-2.5 rounded-lg border text-[#2A2A34] focus:ring-2 focus:ring-[#418EFD]/50 focus:border-[#418EFD] transition-all ${dateErrors.end_date ? 'border-red-500' : 'border-[#8BBAFC]'}`}
                    required
                  />
                  {dateErrors.end_date && (
                    <p className="mt-1 text-xs text-red-600">{dateErrors.end_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#2A2A34] text-sm font-medium mb-2 flex items-center" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.project_details.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#8BBAFC] text-[#2A2A34] focus:ring-2 focus:ring-[#418EFD]/50 focus:border-[#418EFD] transition-all"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[#2A2A34] text-sm font-medium mb-2 flex items-center" htmlFor="priority">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.project_details.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#8BBAFC] text-[#2A2A34] focus:ring-2 focus:ring-[#418EFD]/50 focus:border-[#418EFD] transition-all"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[#2A2A34] text-sm font-medium mb-2 flex items-center">
                  Progress ({formData.project_details.progress}%)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    id="progress"
                    name="progress"
                    value={formData.project_details.progress}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full h-2 bg-[#8BBAFC]/30 rounded-lg appearance-none cursor-pointer accent-[#418EFD]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-4 pt-4 border-t border-[#8BBAFC]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg border border-[#8BBAFC] text-[#2A2A34] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || Boolean(dateErrors.start_date) || Boolean(dateErrors.end_date)}
                className={`px-6 py-2.5 rounded-lg transition-colors flex items-center ${
                  isLoading || dateErrors.start_date || dateErrors.end_date
                    ? 'bg-[#8BBAFC] text-white cursor-not-allowed'
                    : 'bg-[#418EFD] text-white hover:bg-[#307ae3]'
                }`}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    {isEditing ? 'Update Project' : 'Create Project'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;