// Check if this import path is correct
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../api/axios';

// Fetch tasks by epic
export const fetchEpicTasks = createAsyncThunk(
  'tasks/fetchEpicTasks',
  async ({ projectId, epicId }, { rejectWithValue }) => {
    try {
      // Make sure the API endpoint matches your backend route structure
      const response = await axios.get(`kanban/${projectId}/epics/${epicId}/tasks`);
      console.log('Epic tasks response:', response.data);
      return response.data.data || response.data.tasks;
    } catch (error) {
      console.error('Error fetching epic tasks:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch epic tasks');
    }
  }
);

// Create a new task
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      // If epicId is provided, use the kanban API endpoint
      if (taskData.epic_id) {
        console.log('Creating task with epic:', taskData);
        const response = await axios.post(
          `kanban/${taskData.project_id}/epics/${taskData.epic_id}/tasks`, 
          taskData
        );
        console.log('Create task response:', response.data);
        return response.data.data || response.data.task;
      } else {
        // Otherwise use the original tasks endpoint
        console.log('Creating task without epic:', taskData);
        const response = await axios.post('tasks/create', taskData);
        console.log('Create task response:', response.data);
        return response.data.task;
      }
    } catch (error) {
      console.error('Error creating task:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

// Update a task
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, taskData, epicId }, { rejectWithValue }) => {
    try {
      // If epicId is provided, use the kanban API endpoint
      if (epicId) {
        const response = await axios.patch(
          `kanban/${taskData.project_id}/epics/${epicId}/tasks/${taskId}`, 
          taskData
        );
        return response.data.data || response.data.task;
      } else {
        // Otherwise use the original tasks endpoint
        const response = await axios.patch(`tasks/update/${taskId}`, taskData);
        return response.data.task;
      }
    } catch (error) {
      console.error('Error updating task:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

// Delete a task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async ({ taskId, projectId, epicId }, { rejectWithValue }) => {
    try {
      // If epicId is provided, use the kanban API endpoint
      if (epicId) {
        const response = await axios.delete(`kanban/${projectId}/epics/${epicId}/tasks/${taskId}`);
        return { taskId, tasks: response.data.data };
      } else {
        // Otherwise use the original tasks endpoint with body data
        await axios.delete(`tasks/delete/${taskId}`, { 
          data: { projectId, epicId } 
        });
        return { taskId };
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

// Fetch all tasks for a project
export const fetchProjectTasks = createAsyncThunk(
  'tasks/fetchProjectTasks',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`tasks/project/${projectId}`);
      return response.data.tasks;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

// Fetch tasks assigned to the logged-in employee
export const fetchMyTasks = createAsyncThunk(
  'tasks/fetchMyTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('tasks/employee/my-tasks');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my tasks');
    }
  }
);

// Employee updates status/progress of their task
export const updateMyTaskStatus = createAsyncThunk(
  'tasks/updateMyTaskStatus',
  async ({ taskId, status, progress }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`tasks/employee/tasks/${taskId}/status`, { status, progress });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task status');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    currentTask: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    clearTasks: (state) => {
      state.tasks = [];
    },
    // For employee dashboard quick local update
    setTaskStatusLocally: (state, action) => {
      const { taskId, status, progress } = action.payload;
      const idx = state.tasks.findIndex(t => t._id === taskId);
      if (idx !== -1) {
        state.tasks[idx].status = status ?? state.tasks[idx].status;
        if (typeof progress === 'number') state.tasks[idx].progress = progress;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Epic Tasks
      .addCase(fetchEpicTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEpicTasks.fulfilled, (state, action) => {
        state.tasks = action.payload || [];
        state.isLoading = false;
      })
      .addCase(fetchEpicTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Project Tasks
      .addCase(fetchProjectTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.tasks = action.payload || [];
        state.isLoading = false;
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        // Handle both response formats (single task or array of tasks)
        if (Array.isArray(action.payload)) {
          state.tasks = action.payload;
        } else if (action.payload) {
          state.tasks.push(action.payload);
        }
        state.isLoading = false;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch My Tasks
      .addCase(fetchMyTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.tasks = action.payload || [];
        state.isLoading = false;
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update My Task Status
      .addCase(updateMyTaskStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMyTaskStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.tasks.findIndex(task => task._id === updated._id);
        if (index !== -1) {
          state.tasks[index] = updated;
        }
        state.isLoading = false;
      })
      .addCase(updateMyTaskStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Task
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        // Handle both response formats
        if (Array.isArray(action.payload)) {
          state.tasks = action.payload;
        } else if (action.payload) {
          const index = state.tasks.findIndex(task => task._id === action.payload._id);
          if (index !== -1) {
            state.tasks[index] = action.payload;
          }
          if (state.currentTask && state.currentTask._id === action.payload._id) {
            state.currentTask = action.payload;
          }
        }
        state.isLoading = false;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Task
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        // Handle both response formats
        if (action.payload.tasks) {
          state.tasks = action.payload.tasks;
        } else {
          state.tasks = state.tasks.filter(task => task._id !== action.payload.taskId);
        }
        
        if (state.currentTask && state.currentTask._id === action.payload.taskId) {
          state.currentTask = null;
        }
        
        state.isLoading = false;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentTask, clearCurrentTask, clearTasks } = taskSlice.actions;
export default taskSlice.reducer;