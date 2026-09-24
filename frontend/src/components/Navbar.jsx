import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-sky-400 font-bold text-lg">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          SecureTask
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-slate-300 hover:text-white text-sm transition-colors">Dashboard</Link>
          <Link to="/tasks" className="text-slate-300 hover:text-white text-sm transition-colors">Tasks</Link>
          <span className="hidden sm:inline text-sm text-slate-400">{user?.name}</span>
          <button onClick={handleLogout} className="btn-secondary text-sm py-1 px-3">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
