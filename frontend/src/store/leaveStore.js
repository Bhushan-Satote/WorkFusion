  import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../api/axios';
import useAuthStore from './authStore';

// Normalize backend status (pending/accepted/rejected or mixed-case) to UI-friendly values (Pending/Approved/Rejected)
const normalizeStatus = (status) => {
  const s = (status || 'pending').toString().toLowerCase();
  if (s === 'accepted' || s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  return 'Pending';
};

// Async thunks for API calls
export const fetchLeaves = createAsyncThunk(
  'leaves/fetchLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = useAuthStore.getState().user;
      const response = await axios.get('leaves');
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format');
      }

      const leavesData = response.data.data;
      
      const enhancedLeaves = leavesData
        .map((leave) => {
          if (!leave._id) {
            console.warn('Leave record missing _id:', leave);
            return null;
          }

          // Properly handle user_id from backend (already mapped to plain string in controller)
          const userId = leave.user_id || null;
          
          // Set user name based on the actual user_id
          let userName;
          if (userId === currentUser?.userId) {
            userName = currentUser.username;
          } else if (leave.user_name && leave.user_name !== 'Unknown') {
            userName = leave.user_name;
          } else {
            userName = 'Not Assigned';
          }

          return {
            ...leave,
            user_id: userId,
            user_name: userName,
            status: normalizeStatus(leave.status),
          };
        })
        .filter(Boolean);
      
      return enhancedLeaves;
    } catch (error) {
      console.error('Fetch leaves error:', error);
      return rejectWithValue(error.message || 'Failed to fetch leaves');
    }
  }
);

export const createLeave = createAsyncThunk(
  'leaves/createLeave',
  async (leaveData, { rejectWithValue }) => {
    try {
      const currentUser = useAuthStore.getState().user;

      if (!currentUser?.userId) {
        throw new Error('User not authenticated');
      }

      // Ensure user is always set when creating a leave (server trusts body)
      const leaveWithUser = {
        ...leaveData,
        user_id: currentUser.userId,
        user_name: currentUser.username || 'Not Assigned',
      };

      const response = await axios.post('leaves', leaveWithUser);
      const data = response.data?.data || {};

      return {
        ...data,
        user_id: currentUser.userId,
        user_name: currentUser.username || 'Not Assigned',
        status: normalizeStatus(data.status),
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create leave request');
    }
  }
);

export const updateLeave = createAsyncThunk(
  'leaves/updateLeave',
  async ({ id, leaveData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`leaves/${id}`, leaveData);
      const data = response.data?.data || {};
      return { ...data, status: normalizeStatus(data.status) };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave request');
    }
  }
);

// Accept leave request (admin action)
export const acceptLeave = createAsyncThunk(
  'leaves/acceptLeave',
  async (payload, { rejectWithValue }) => {
    try {
      let id; let admin_remarks;
      if (typeof payload === 'string') {
        id = payload;
      } else if (payload && typeof payload === 'object') {
        id = payload.id;
        admin_remarks = payload.admin_remarks;
      }
      if (!id) throw new Error('Invalid leave id');

      const response = await axios.patch(`leaves/${id}/accept`, admin_remarks ? { admin_remarks } : {});
      const data = response.data?.data || {};
      return { ...data, status: normalizeStatus(data.status) };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept leave request');
    }
  }
);

// Reject leave request (admin action)
export const rejectLeave = createAsyncThunk(
  'leaves/rejectLeave',
  async (payload, { rejectWithValue }) => {
    try {
      let id; let admin_remarks;
      if (typeof payload === 'string') {
        id = payload;
      } else if (payload && typeof payload === 'object') {
        id = payload.id;
        admin_remarks = payload.admin_remarks;
      }
      if (!id) throw new Error('Invalid leave id');

      // If remarks are not provided by caller, prompt here to ensure they're captured
      if (!admin_remarks && typeof window !== 'undefined' && typeof window.prompt === 'function') {
        const r = window.prompt('Please provide a reason for rejection:');
        if (r === null) {
          return rejectWithValue('Rejection cancelled');
        }
        admin_remarks = r;
      }

      const response = await axios.patch(`leaves/${id}/reject`, { admin_remarks });
      const data = response.data?.data || {};
      return { ...data, status: normalizeStatus(data.status) };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject leave request');
    }
  }
);

export const deleteLeave = createAsyncThunk(
  'leaves/deleteLeave',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`leaves/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete leave request');
    }
  }
);

export const fetchLeaveById = createAsyncThunk(
  'leaves/fetchLeaveById',
  async (id, { rejectWithValue, getState }) => {
    try {
      // First check if we already have the leave in our state
      const existingLeave = getState().leaves.leaves.find((leave) => leave._id === id);
      
      if (existingLeave) {
        return { ...existingLeave, status: normalizeStatus(existingLeave.status) };
      }
      
      // If not, fetch all leaves and find the one we need
      const response = await axios.get('leaves');
      const allLeaves = response.data.data || [];
      const targetLeave = allLeaves.find((leave) => leave._id === id);
      
      if (!targetLeave) {
        return rejectWithValue('Leave request not found');
      }
      
      return { ...targetLeave, status: normalizeStatus(targetLeave.status) };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave details');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leaves',
  initialState: {
    leaves: [],
    currentLeave: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentLeave: (state, action) => {
      state.currentLeave = action.payload;
    },
    clearCurrentLeave: (state) => {
      state.currentLeave = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchLeaves.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.leaves = action.payload || [];
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'An error occurred while fetching leaves';
        state.leaves = [];
      })
      // Create
      .addCase(createLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createLeave.fulfilled, (state, action) => {
        state.leaves.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLeave.fulfilled, (state, action) => {
        const index = state.leaves.findIndex((leave) => leave._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Accept
      .addCase(acceptLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptLeave.fulfilled, (state, action) => {
        const index = state.leaves.findIndex((leave) => leave._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = action.payload; // already normalized
        }
        state.isLoading = false;
      })
      .addCase(acceptLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reject
      .addCase(rejectLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectLeave.fulfilled, (state, action) => {
        const index = state.leaves.findIndex((leave) => leave._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = action.payload; // already normalized
        }
        state.isLoading = false;
      })
      .addCase(rejectLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteLeave.fulfilled, (state, action) => {
        state.leaves = state.leaves.filter((leave) => leave._id !== action.payload);
        state.isLoading = false;
      })
      .addCase(deleteLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch by ID
      .addCase(fetchLeaveById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaveById.fulfilled, (state, action) => {
        state.currentLeave = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchLeaveById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentLeave, clearCurrentLeave } = leaveSlice.actions;
export default leaveSlice.reducer;
