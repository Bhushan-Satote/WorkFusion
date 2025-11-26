import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null; // Initialize from localStorage
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user)); // Update localStorage whenever user changes
    } else {
      localStorage.removeItem('user'); // Remove user from localStorage if null
    }
  }, [user]);

  // Add a logout function that properly clears the user session
  const logout = () => {
    // Clear user from state
    setUser(null);
    
    // Remove from localStorage
    localStorage.removeItem('user');
    
    // You might also want to clear any other auth-related items
    localStorage.removeItem('token');
    
    // Return true to indicate successful logout
    return true;
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};