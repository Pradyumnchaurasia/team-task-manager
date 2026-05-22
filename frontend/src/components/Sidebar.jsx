import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button className="mobile-nav-toggle" onClick={toggleSidebar}>
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar container */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-glow"></div>
          <span>Team Task Manager</span>
        </div>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-name">{user.name}</div>
          <div className="user-email">{user.email}</div>
          <div>
            <span className={`badge ${user.role === 'ADMIN' ? 'badge-in-progress' : 'badge-todo'}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <span>📊</span> Dashboard
          </NavLink>
          
          {user.role === 'ADMIN' && (
            <NavLink 
              to="/admin" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <span>⚙️</span> Admin Panel
            </NavLink>
          )}
        </nav>

        {/* Footer with Logout */}
        <div className="sidebar-footer">
          <button className="btn logout-btn" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
