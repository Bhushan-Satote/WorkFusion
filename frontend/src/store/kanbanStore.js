import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../api/axios';

// Async thunks for Epic operations
export const fetchEpics = createAsyncThunk(
  'kanban/fetchEpics',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`kanban/${projectId}/epics`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching epics:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch epics');
    }
  }
);

export const addEpic = createAsyncThunk(
  'kanban/addEpic',
  async ({ projectId, epicData }, { rejectWithValue }) => {
    try {
      // Ensure the data structure matches what the backend expects
      const formattedData = {
        name: epicData.name,
        description: epicData.description,
        team_lead_id: epicData.team_lead_id,
        team_members: epicData.team_members || [],
        technologies: epicData.technologies || [],
        start_date: epicData.start_date,
        end_date: epicData.end_date,
        status: epicData.status || 'Planned'
      };
      
      const response = await axios.post(`kanban/${projectId}/epics`, formattedData);
      return response.data.data;
    } catch (error) {
      console.error('Error adding epic:', error);
      return rejectWithValue(
        error.response?.data?.message || 
        `Failed to add epic: ${error.message}`
      );
    }
  }
);

export const updateEpic = createAsyncThunk(
  'kanban/updateEpic',
  async ({ projectId, epicId, epicData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`kanban/${projectId}/epics/${epicId}`, epicData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update epic');
    }
  }
);

export const deleteEpic = createAsyncThunk(
  'kanban/deleteEpic',
  async ({ projectId, epicId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`kanban/${projectId}/epics/${epicId}`);
      return { epicId, epics: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete epic');
    }
  }
);

const kanbanSlice = createSlice({
  name: 'kanban',
  initialState: {
    epics: [],
    currentEpic: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentEpic: (state, action) => {
      state.currentEpic = action.payload;
    },
    clearCurrentEpic: (state) => {
      state.currentEpic = null;
    },
    clearEpics: (state) => {
      state.epics = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch epics
      .addCase(fetchEpics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEpics.fulfilled, (state, action) => {
        state.epics = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchEpics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add epic
      .addCase(addEpic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addEpic.fulfilled, (state, action) => {
        state.epics = action.payload; // The API returns all epics
        state.isLoading = false;
      })
      .addCase(addEpic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update epic
      .addCase(updateEpic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEpic.fulfilled, (state, action) => {
        const index = state.epics.findIndex(epic => epic.epic_id === action.payload.epic_id);
        if (index !== -1) {
          state.epics[index] = action.payload;
        }
        if (state.currentEpic && state.currentEpic.epic_id === action.payload.epic_id) {
          state.currentEpic = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateEpic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete epic
      .addCase(deleteEpic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEpic.fulfilled, (state, action) => {
        state.epics = action.payload.epics;
        if (state.currentEpic && state.currentEpic.epic_id === action.payload.epicId) {
          state.currentEpic = null;
        }
        state.isLoading = false;
      })
      .addCase(deleteEpic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentEpic, clearCurrentEpic, clearEpics } = kanbanSlice.actions;
export default kanbanSlice.reducer;