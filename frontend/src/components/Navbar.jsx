import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Video, Upload, LayoutDashboard, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-gray-900 text-white shadow-lg w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2 text-xl font-bold text-blue-400">
              <Video size={24} />
              <span>VideoStream</span>
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link to="/dashboard" className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              {(user.role === 'admin' || user.role === 'editor') && (
                <Link to="/upload" className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
                  <Upload size={18} />
                  <span>Upload</span>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-300">
              <User size={18} />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{user.name}</span>
                <span className="text-xs text-gray-500 uppercase">{user.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-300 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
