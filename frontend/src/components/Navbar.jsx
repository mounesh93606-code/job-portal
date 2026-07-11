import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, LogIn, UserPlus, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          <span className="logo-text">JobPortal</span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <Link to="/jobs" className={`nav-link ${isActive('/jobs') ? 'active' : ''}`}>
            <Briefcase size={16} />
            Browse Jobs
          </Link>

          {isAuthenticated && (
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">{user?.role}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                <LogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} />
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="navbar-mobile">
          <Link to="/jobs" className="mobile-link" onClick={() => setMenuOpen(false)}>
            <Briefcase size={16} /> Browse Jobs
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          )}
          <div className="mobile-divider" />
          {isAuthenticated ? (
            <>
              <div className="mobile-user">
                <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                  <div className="user-name">{user?.name}</div>
                  <div className="user-role">{user?.role}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-danger btn-sm btn-full">
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-full" onClick={() => setMenuOpen(false)}>
                <LogIn size={15} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-full" onClick={() => setMenuOpen(false)}>
                <UserPlus size={15} /> Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
