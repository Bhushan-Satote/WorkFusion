import { create } from 'zustand';
import axios from '../api/axios';

const useAuthStore = create((set) => {
  // Check localStorage for token and user data
  const token = localStorage.getItem('token');
  
  // Fix the JSON parsing error by using a try-catch block
  let user = null;
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      user = JSON.parse(userData);
      // Ensure both userId and _id exist for compatibility across the app
      if (user && typeof user === 'object') {
        if (!user.userId && user._id) user.userId = user._id;
        if (!user._id && user.userId) user._id = user.userId;
      }
      // Persist any normalization back to localStorage
      localStorage.setItem('user', JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    // Clear the invalid data
    localStorage.removeItem('user');
  }
  
  // Set axios authorization header if token exists
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return {
    user: user,
    isAuthenticated: !!user,
    isLoading: false,
    error: null,

    login: async (username, password, setUser) => {
      console.log('🔍 Login attempt:', { username });
      set({ isLoading: true, error: null });
      
      try {
        console.log('🔍 Making API call to /auth/login');
        const response = await axios.post('/auth/login', { 
          username, 
          password 
        });
        
        console.log('🔍 API Response:', response.data);
        const { token, role, userId, name, username: returnedUsername } = response.data;
        
        // Store the complete user information with both keys for compatibility
        const userInfo = { 
          _id: userId,
          userId, // alias to satisfy components expecting userId
          username: returnedUsername || username, 
          role, 
          name 
        };
        
        // Store token and user information in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        // Set axios authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set user information in UserContext (if provided)
        if (setUser) {
          setUser(userInfo);
        }
        
        console.log('✅ Setting auth state:', { user: userInfo });
        set({ 
          user: userInfo,
          isAuthenticated: true,
          isLoading: false,
          error: null 
        });
        
        console.log('✅ Login successful with User ID:', userId);
        return true;
      } catch (error) {
        console.error('❌ Login error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        set({ 
          isLoading: false,
          error: error.response?.data?.message || error.message || 'Login failed',
          user: null,
          isAuthenticated: false
        });
        return false;
      }
    },

    logout: () => {
      console.log('🔍 Logging out');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      set({ 
        user: null,
        isAuthenticated: false,
        error: null 
      });
      console.log('✅ Logout complete');
    },
  };
});

export default useAuthStore;
