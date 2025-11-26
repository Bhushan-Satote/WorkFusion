import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import AdminDashboard from '../components/AdminDashboard';
import UserDashboard from '../components/UserDashboard';
import ProjectManagerDashboard from '../components/ProjectManagerDashboard';
import ProjectLeadDashboard from '../components/ProjectLeadDashboard';

const DashboardPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (user?.role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Project Manager':
        return <ProjectManagerDashboard />;
      case 'Project Lead':
        return <ProjectLeadDashboard />;
      case 'Employee':
      default:
        return <UserDashboard />;
    }
  };

  return renderDashboard();
};

export default DashboardPage;