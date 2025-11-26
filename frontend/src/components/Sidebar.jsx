import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import useAuthStore from '../store/authStore';
import useUserStore from '../store/userStore';
// Adding icons import
import { FaHome, FaUsers, FaProjectDiagram, FaBuilding, FaUser, FaTasks, FaSignOutAlt, FaCalendarAlt, FaCode, FaClock, FaChartLine, FaUserTie, FaLaptopCode } from 'react-icons/fa';
// This import isn't needed in the Sidebar component

const Sidebar = () => {
  // Use authStore directly for logout functionality
  const { user } = useUser();
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(location.pathname);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { fetchUserById, currentUser } = useUserStore();
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const load = async () => {
      try {
        const id = user?._id || user?.userId;
        if (user?.role !== 'Admin' && id) {
          const data = await fetchUserById(id);
          const url = data?.profile_picture?.url;
          setAvatarUrl(url || null);
        } else {
          setAvatarUrl(null);
        }
      } catch (e) {
        setAvatarUrl(null);
      }
    };
    load();
  }, [user?._id, user?.userId, user?.role, fetchUserById]);

  // Reflect updates to the current user's profile picture immediately after crop/save
  useEffect(() => {
    const id = user?._id || user?.userId;
    if (user?.role !== 'Admin' && id && currentUser?._id === id) {
      setAvatarUrl(currentUser?.profile_picture?.url || null);
    }
  }, [currentUser, user?._id, user?.userId, user?.role]);

  const isLinkActive = (path) => {
    // Highlight My Tasks when either on /tasks OR on /dashboard#tasks
    if (path === '/tasks') {
      return activePath === '/tasks' || (activePath === '/dashboard' && location.hash === '#tasks');
    }
    return activePath === path;
  };

  // Updated handleLogout to use the authStore logout function
  const handleLogout = () => {
    // Call the logout function from authStore
    logout();
    // Navigate to login page
    navigate('/');
  };

  const adminLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome className="mr-3 text-xl" /> },
    { path: '/user-management', label: 'User Management', icon: <FaUsers className="mr-3 text-xl" /> },
    { path: '/project-management', label: 'Project Management', icon: <FaProjectDiagram className="mr-3 text-xl" /> },
    { path: '/client-management', label: 'Client Management', icon: <FaBuilding className="mr-3 text-xl" /> },
    { path: '/leave-management', label: 'Leave Management', icon: <FaCalendarAlt className="mr-3 text-xl" /> },
    { path: '/admin/attendance', label: 'Attendance Management', icon: <FaClock className="mr-3 text-xl" /> },
  ];

  const projectManagerLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome className="mr-3 text-xl" /> },
    { path: '/project-management', label: 'Project Management', icon: <FaProjectDiagram className="mr-3 text-xl" /> },
    { path: '/leave-management', label: 'Leave Management', icon: <FaCalendarAlt className="mr-3 text-xl" /> },
    { path: '/attendance', label: 'Attendance', icon: <FaClock className="mr-3 text-xl" /> },
    { path: '/face-register', label: 'Face Registration', icon: <FaUser className="mr-3 text-xl" /> },
    { path: '/profile', label: 'Profile', icon: <FaUser className="mr-3 text-xl" /> },
  ];

  const projectLeadLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome className="mr-3 text-xl" /> },
    { path: '/project-lead/epics', label: 'My Assigned Epics', icon: <FaLaptopCode className="mr-3 text-xl" /> },
    { path: '/leave-management', label: 'Leave Requests', icon: <FaCalendarAlt className="mr-3 text-xl" /> },
    { path: '/attendance', label: 'Attendance', icon: <FaClock className="mr-3 text-xl" /> },
    { path: '/face-register', label: 'Face Registration', icon: <FaUser className="mr-3 text-xl" /> },
    { path: '/profile', label: 'Profile', icon: <FaUser className="mr-3 text-xl" /> },
  ];

  const employeeLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome className="mr-3 text-xl" /> },
    { path: '/tasks', label: 'My Tasks', icon: <FaTasks className="mr-3 text-xl" /> },
    { path: '/attendance', label: 'Attendance', icon: <FaClock className="mr-3 text-xl" /> },
    { path: '/face-register', label: 'Face Registration', icon: <FaUser className="mr-3 text-xl" /> },
    { path: '/leave-management', label: 'Leave Requests', icon: <FaCalendarAlt className="mr-3 text-xl" /> },
    { path: '/profile', label: 'Profile', icon: <FaUser className="mr-3 text-xl" /> },
  ];

  // Function to get navigation links based on user role
  const getNavigationLinks = () => {
    switch (user?.role) {
      case 'Admin':
        return adminLinks;
      case 'Project Manager':
        return projectManagerLinks;
      case 'Project Lead':
        return projectLeadLinks;
      case 'Employee':
      default:
        return employeeLinks;
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64 md:w-80'} h-full bg-white text-blue-900 shadow-xl transition-all duration-300 relative`}>
      <div className="flex justify-between items-center p-4 border-b border-blue-100">
        {!isCollapsed && <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">WorkFusion</h2>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-all duration-200"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      
      <ul className="flex flex-col space-y-2 p-4">
        {getNavigationLinks().map((link) => (
          <li key={link.path}>
            <Link 
              to={link.path} 
              className={`flex items-center p-3 rounded-lg transition duration-200 ${
                isLinkActive(link.path)
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                  : 'hover:bg-blue-50 text-blue-800'
              }`}
            >
              {link.icon}
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          </li>
        ))}
      </ul>
      
      {!isCollapsed ? (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-100 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border"
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <p className="font-medium text-blue-900">{user?.name || 'User'}</p>
                <p className="text-xs text-blue-600">{user?.role || 'Role'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
              title="Logout"
            >
              <FaSignOutAlt className="text-xl" />
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-100 bg-blue-50 flex justify-center">
          <button 
            onClick={handleLogout}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <FaSignOutAlt className="text-xl" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;