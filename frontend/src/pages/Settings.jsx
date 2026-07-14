import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Shield, Moon, Sun, Info, ArrowLeft,
  Briefcase, Send, CheckCircle, Globe, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mailForm, setMailForm] = useState({ subject: '', message: '' });
  const [mailSent, setMailSent] = useState(false);
  const [activeSection, setActiveSection] = useState('account');

  const handleMailSubmit = (e) => {
    e.preventDefault();
    // Opens user's email client with prefilled message
    const mailto = `mailto:support@jobportal.com?subject=${encodeURIComponent(mailForm.subject)}&body=${encodeURIComponent(mailForm.message)}`;
    window.open(mailto, '_blank');
    setMailSent(true);
    setTimeout(() => setMailSent(false), 4000);
    setMailForm({ subject: '', message: '' });
  };

  const sections = [
    { id: 'account', label: 'Account Info', icon: User },
    { id: 'theme', label: 'Appearance', icon: Moon },
    { id: 'mail', label: 'Contact Us', icon: Mail },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="settings-page">
      <div className="container">
        {/* Header */}
        <div className="settings-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account and preferences</p>
        </div>

        <div className="settings-layout">
          {/* Sidebar Nav */}
          <nav className="settings-sidebar card">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`settings-nav-item ${activeSection === id ? 'active' : ''}`}
                onClick={() => setActiveSection(id)}
              >
                <Icon size={18} />
                <span>{label}</span>
                <ChevronRight size={14} className="nav-arrow" />
              </button>
            ))}
          </nav>

          {/* Content Panel */}
          <div className="settings-content">

            {/* ── ACCOUNT INFO ── */}
            {activeSection === 'account' && (
              <div className="settings-panel card">
                <div className="panel-header">
                  <User size={22} className="panel-icon" />
                  <div>
                    <h2>Account Information</h2>
                    <p>Your personal details linked to this account.</p>
                  </div>
                </div>

                <div className="account-avatar-row">
                  <div className="account-avatar">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="account-avatar-name">{user?.name}</div>
                    <div className="account-avatar-role">{user?.role}</div>
                  </div>
                </div>

                <div className="info-grid">
                  <div className="info-field">
                    <div className="info-label"><User size={13} /> Full Name</div>
                    <div className="info-value">{user?.name || '—'}</div>
                  </div>
                  <div className="info-field">
                    <div className="info-label"><Mail size={13} /> Email Address</div>
                    <div className="info-value">{user?.email || '—'}</div>
                  </div>
                  <div className="info-field">
                    <div className="info-label"><Shield size={13} /> Role</div>
                    <div className="info-value">
                      <span className={`role-chip role-chip-${user?.role}`}>
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="info-field">
                    <div className="info-label"><Globe size={13} /> Account Status</div>
                    <div className="info-value">
                      <span className="status-active">● Active</span>
                    </div>
                  </div>
                </div>

                <div className="info-notice">
                  <Info size={14} />
                  <span>To update your name or email, please contact support via the <button className="link-btn" onClick={() => setActiveSection('mail')}>Contact Us</button> section.</span>
                </div>
              </div>
            )}

            {/* ── APPEARANCE / THEME ── */}
            {activeSection === 'theme' && (
              <div className="settings-panel card">
                <div className="panel-header">
                  <Moon size={22} className="panel-icon" />
                  <div>
                    <h2>Appearance</h2>
                    <p>Choose how JobPortal looks for you.</p>
                  </div>
                </div>

                <div className="theme-options">
                  <button
                    className={`theme-card ${theme === 'dark' ? 'theme-active' : ''}`}
                    onClick={() => theme !== 'dark' && toggleTheme()}
                  >
                    <div className="theme-preview theme-preview-dark">
                      <div className="tp-bar" />
                      <div className="tp-content">
                        <div className="tp-line tp-line-long" />
                        <div className="tp-line tp-line-short" />
                      </div>
                    </div>
                    <div className="theme-label">
                      <Moon size={16} />
                      Dark Mode
                      {theme === 'dark' && <span className="theme-active-badge">Active</span>}
                    </div>
                  </button>

                  <button
                    className={`theme-card ${theme === 'light' ? 'theme-active' : ''}`}
                    onClick={() => theme !== 'light' && toggleTheme()}
                  >
                    <div className="theme-preview theme-preview-light">
                      <div className="tp-bar tp-bar-light" />
                      <div className="tp-content">
                        <div className="tp-line tp-line-long tp-line-light" />
                        <div className="tp-line tp-line-short tp-line-light" />
                      </div>
                    </div>
                    <div className="theme-label">
                      <Sun size={16} />
                      Light Mode
                      {theme === 'light' && <span className="theme-active-badge">Active</span>}
                    </div>
                  </button>
                </div>

                <div className="theme-toggle-row">
                  <div>
                    <div className="toggle-label">Quick Toggle</div>
                    <div className="toggle-sublabel">Switch between dark and light instantly</div>
                  </div>
                  <button
                    className={`toggle-switch ${theme === 'light' ? 'toggled' : ''}`}
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                  >
                    <span className="toggle-knob">
                      {theme === 'dark' ? <Moon size={10} /> : <Sun size={10} />}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ── CONTACT / MAIL US ── */}
            {activeSection === 'mail' && (
              <div className="settings-panel card">
                <div className="panel-header">
                  <Mail size={22} className="panel-icon" />
                  <div>
                    <h2>Contact Us</h2>
                    <p>Send us a message — we usually respond within 24 hours.</p>
                  </div>
                </div>

                <div className="contact-info-row">
                  <div className="contact-info-item">
                    <Mail size={16} />
                    <span>support@jobportal.com</span>
                  </div>
                  <div className="contact-info-item">
                    <Briefcase size={16} />
                    <span>Mon – Fri, 9AM – 6PM IST</span>
                  </div>
                </div>

                {mailSent && (
                  <div className="alert alert-success">
                    <CheckCircle size={16} />
                    Your email client has been opened with your message pre-filled!
                  </div>
                )}

                <form className="mail-form" onSubmit={handleMailSubmit}>
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={user?.name || ''}
                      readOnly
                      style={{ opacity: 0.6 }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      style={{ opacity: 0.6 }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Account issue, Feature request..."
                      value={mailForm.subject}
                      onChange={e => setMailForm(p => ({ ...p, subject: e.target.value }))}
                      required
                      id="mail-subject"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe your issue or feedback..."
                      value={mailForm.message}
                      onChange={e => setMailForm(p => ({ ...p, message: e.target.value }))}
                      rows={5}
                      required
                      id="mail-message"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <Send size={16} />
                    Send Message
                  </button>
                </form>
              </div>
            )}

            {/* ── ABOUT ── */}
            {activeSection === 'about' && (
              <div className="settings-panel card">
                <div className="panel-header">
                  <Info size={22} className="panel-icon" />
                  <div>
                    <h2>About JobPortal</h2>
                    <p>Platform information and version details.</p>
                  </div>
                </div>

                <div className="about-logo-row">
                  <div className="about-logo">
                    <Briefcase size={32} />
                  </div>
                  <div>
                    <div className="about-app-name">JobPortal</div>
                    <div className="about-tagline">Next-Gen Premium Job Board</div>
                  </div>
                </div>

                <div className="about-grid">
                  <div className="about-item">
                    <div className="about-item-label">Version</div>
                    <div className="about-item-value">1.0.0</div>
                  </div>
                  <div className="about-item">
                    <div className="about-item-label">Platform</div>
                    <div className="about-item-value">Web App</div>
                  </div>
                  <div className="about-item">
                    <div className="about-item-label">Built With</div>
                    <div className="about-item-value">React + Node.js</div>
                  </div>
                  <div className="about-item">
                    <div className="about-item-label">Hosted On</div>
                    <div className="about-item-value">Vercel + Railway</div>
                  </div>
                </div>

                <div className="about-description">
                  <p>
                    JobPortal is a modern, full-stack job board platform connecting talented job seekers
                    with forward-thinking employers. Browse thousands of opportunities, apply with ease,
                    and track your career journey — all in one place.
                  </p>
                </div>

                <div className="about-features">
                  <h4>Key Features</h4>
                  <ul>
                    {[
                      'Browse & search job listings by role, location, type',
                      'One-click applications with resume & cover letter upload',
                      'Employer dashboard with applicant management',
                      'AI-powered offer letter generation',
                      'Interview scheduling with Google Meet integration',
                      'Real-time analytics & recruitment stats',
                    ].map((f, i) => (
                      <li key={i}><CheckCircle size={14} /> {f}</li>
                    ))}
                  </ul>
                </div>

                <div className="about-footer">
                  © 2026 JobPortal. All rights reserved.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
