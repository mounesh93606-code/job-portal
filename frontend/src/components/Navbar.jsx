import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase, LayoutDashboard, LogIn, UserPlus, LogOut,
  Menu, X, Sparkles, ChevronDown, Settings, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
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
              <div className="user-menu" ref={dropdownRef}>
                {/* Avatar + Name — click to open dropdown */}
                <button
                  className="user-info-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <div className="user-avatar">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user?.name}</span>
                    <span className="user-role">{user?.role}</span>
                  </div>
                  <ChevronDown size={14} className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="user-avatar dropdown-avatar">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="dropdown-name">{user?.name}</div>
                        <div className="dropdown-role">{user?.role}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link
                      to="/settings"
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings size={15} />
                      Settings
                    </Link>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item dropdown-item-danger"
                      onClick={() => { setDropdownOpen(false); setShowLogoutModal(true); }}
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                )}
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
                <Link to="/settings" className="mobile-link" onClick={() => setMenuOpen(false)}>
                  <Settings size={16} /> Settings
                </Link>
                <button
                  className="btn btn-danger btn-sm btn-full"
                  onClick={() => { setMenuOpen(false); setShowLogoutModal(true); }}
                >
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3 className="logout-modal-title">Sign Out?</h3>
            <p className="logout-modal-text">
              Are you sure you want to log out of your account?
            </p>
            <div className="logout-modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleLogoutConfirm}
              >
                <LogOut size={15} />
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
