import { create } from 'zustand';
import axios from '../api/axios';

const useUserStore = create((set, get) => {
  return {
    users: [],
    currentUser: null,
    isLoading: false,
    error: null,
    
    // Fetch all users (admin only)
    fetchUsers: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get('/users');
        // Sort users so the newest are first based on createdAt or _id timestamp fallback
        const sortedUsers = [...response.data].sort((a, b) => {
          const getTime = (u) =>
            u.createdAt ? new Date(u.createdAt).getTime() :
            parseInt(u._id.substring(0, 8), 16) * 1000; // _id contains timestamp in first 8 chars
          return getTime(b) - getTime(a);
        });
        set({ users: sortedUsers, isLoading: false });
        return response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
        set({ 
          isLoading: false, 
          error: error.response?.data?.message || 'Failed to fetch users' 
        });
        return null;
      }
    },
    
    // Fetch a single user by ID
    fetchUserById: async (userId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get(`/users/${userId}`);
        set({ currentUser: response.data, isLoading: false });
        return response.data;
      } catch (error) {
        console.error('Error fetching user:', error);
        set({ 
          isLoading: false, 
          error: error.response?.data?.message || 'Failed to fetch user' 
        });
        return null;
      }
    },
    
    // Create a new user (admin only)
    createUser: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post('/users/create', userData);
        set(state => ({ 
          users: [response.data.user, ...state.users], 
          isLoading: false 
        }));
        return response.data;
      } catch (error) {
        console.error('Error creating user:', error);
        // Enhanced error handling to capture more details
        const errorMessage = error.response?.data?.message || 
                            (error.response?.data?.error) || 
                            (error.response?.data?.errors && JSON.stringify(error.response.data.errors)) ||
                            'Failed to create user';
        
        console.log('Detailed error info:', {
          status: error.response?.status,
          data: error.response?.data,
          message: errorMessage
        });
        
        set({ 
          isLoading: false, 
          error: errorMessage
        });
        return null;
      }
    },
    
    // Update user details
    updateUser: async (userId, userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.patch(`/users/${userId}`, userData);
        // Backend returns { message, user }
        const updated = response.data?.user || response.data;
        set(state => ({
          users: state.users.map(user => 
            user._id === userId ? { ...user, ...updated } : user
          ),
          currentUser: state.currentUser?._id === userId ? { ...state.currentUser, ...updated } : state.currentUser,
          isLoading: false
        }));
        return updated;
      } catch (error) {
        console.error('Error updating user:', error);
        set({ 
          isLoading: false, 
          error: error.response?.data?.message || 'Failed to update user' 
        });
        return null;
      }
    },
    
    // Deactivate a user (replaces delete functionality)
    deactivateUser: async (userId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.patch(`/users/${userId}/deactivate`);
        set(state => ({
          users: state.users.map(user => 
            user._id === userId ? {...user, status: 'inactive'} : user
          ),
          isLoading: false
        }));
        return response.data;
      } catch (error) {
        console.error('Error deactivating user:', error);
        set({ 
          isLoading: false, 
          error: error.response?.data?.message || 'Failed to deactivate user' 
        });
        return false;
      }
    },
    
    // Reactivate a user
    reactivateUser: async (userId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.patch(`/users/${userId}/reactivate`);
        set(state => ({
          users: state.users.map(user => 
            user._id === userId ? {...user, status: 'active'} : user
          ),
          isLoading: false
        }));
        return response.data;
      } catch (error) {
        console.error('Error reactivating user:', error);
        set({ 
          isLoading: false, 
          error: error.response?.data?.message || 'Failed to reactivate user' 
        });
        return false;
      }
    },
    
    // Delete a user (keeping for backward compatibility, but mark as deprecated)
    // Consider removing this method in future updates
    deleteUser: async (userId) => {
      console.warn('deleteUser is deprecated. Use deactivateUser instead.');
      return get().deactivateUser(userId);
    },
    
    // Clear current user
    clearCurrentUser: () => {
      set({ currentUser: null });
    },
    
    // Clear errors
    clearErrors: () => {
      set({ error: null });
    },

    // Get current user profile (for face registration)
    getCurrentUserProfile: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get('/users/me/profile');
        set({ currentUser: response.data.user, isLoading: false });
        return response.data;
      } catch (error) {
        console.error('Error fetching current user profile:', error);
        set({ 
          isLoading: false, 
          error: error.response?.data?.message || 'Failed to fetch user profile' 
        });
        return null;
      }
    },

    // Register face data for current user
    registerFaceData: async (faceData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post('/users/me/face-register', faceData);
        set({ isLoading: false });
        return response.data;
      } catch (error) {
        console.error('Error registering face data:', error);
        set({ 
          isLoading: false, 
          error: error.response?.data?.message || 'Failed to register face data' 
        });
        return null;
      }
    }
  };
});

export default useUserStore;