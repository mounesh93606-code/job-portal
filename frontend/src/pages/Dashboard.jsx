import React, { useState, useEffect } from 'react';
import {
  Briefcase, Users, FileText, CheckCircle, AlertCircle, Clock, Plus, Trash2,
  Download, BarChart2, Eye, X, Settings, ArrowUpRight, Shield, Globe, MapPin, DollarSign,
  Calendar, Sparkles, Send, Video
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const COLORS = ['#6366f1', '#fbbf24', '#34d399', '#f87171'];
const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  
  // Modals & Forms State
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '', description: '', company: '', location: '', type: 'Full-time', salary: '', requirements: ''
  });
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(null);
  
  // Scheduling & Offer states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAppForSchedule, setSelectedAppForSchedule] = useState(null);
  const [scheduleData, setScheduleData] = useState({ interviewDate: '', interviewTime: '', interviewLink: '' });

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedAppForOffer, setSelectedAppForOffer] = useState(null);
  const [offerInputs, setOfferInputs] = useState({ salary: '', startDate: '', customNotes: '' });
  const [generatedOfferText, setGeneratedOfferText] = useState('');
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Analytics
      const analyticsRes = await API.get('/analytics');
      setAnalytics(analyticsRes.data);

      // 2. Fetch Applications (role specific)
      const appsRes = await API.get('/applications');
      setApplications(appsRes.data);

      // 3. Fetch Jobs (For Employer/Admin to display listings)
      if (user.role === 'employer' || user.role === 'admin') {
        const jobsRes = await API.get('/jobs');
        if (user.role === 'employer') {
          // Filter to only their jobs
          setJobs(jobsRes.data.filter(j => j.employer_id === user.id));
        } else {
          setJobs(jobsRes.data);
        }
      }

      // 4. Fetch Users (Admin Only)
      if (user.role === 'admin') {
        const usersRes = await API.get('/analytics/users');
        setAdminUsers(usersRes.data);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.role]);

  // Handle Application Status Update (Employer / Admin)
  const handleUpdateStatus = async (appId, newStatus) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await API.put(`/applications/${appId}/status`, { status: newStatus });
      setSuccess('Application status updated successfully.');
      // Update local state
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus } : app));
      // Re-fetch analytics to reflect status change
      const analyticsRes = await API.get('/analytics');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Create Job (Employer / Admin)
  const handleCreateJob = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await API.post('/jobs', newJob);
      setSuccess('Job listing posted successfully!');
      setShowPostJobModal(false);
      setNewJob({ title: '', description: '', company: '', location: '', type: 'Full-time', salary: '', requirements: '' });
      fetchData(); // Refresh lists and analytics
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Job (Employer / Admin)
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job listing? All corresponding applications will be deleted.')) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await API.delete(`/jobs/${jobId}`);
      setSuccess('Job listing deleted successfully.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete job.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete User (Admin Only)
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? All data associated with this user will be removed.')) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await API.delete(`/analytics/users/${userId}`);
      setSuccess('User deleted successfully.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Schedule Interview
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await API.put(`/applications/${selectedAppForSchedule.id}/schedule`, scheduleData);
      setSuccess('Interview scheduled and invitation email sent successfully!');
      setShowScheduleModal(false);
      setScheduleData({ interviewDate: '', interviewTime: '', interviewLink: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule interview.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to generate a mock Google Meet Link
  const generateMeetLinkHelper = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randCode = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const link = `https://meet.google.com/${randCode()}-${randCode()}-${randCode()}`;
    setScheduleData(prev => ({ ...prev, interviewLink: link }));
  };

  // Handle Generate Offer Letter Draft
  const handleGenerateOfferDraft = async (e) => {
    e.preventDefault();
    setIsGeneratingOffer(true);
    setError('');
    try {
      const res = await API.post(`/applications/${selectedAppForOffer.id}/generate-offer`, {
        salary: offerInputs.salary,
        startDate: offerInputs.startDate,
        customNotes: offerInputs.customNotes,
        jobTitle: selectedAppForOffer.job_title,
        company: selectedAppForOffer.company
      });
      setGeneratedOfferText(res.data.offerText);
      setSuccess('Offer letter draft generated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate offer letter draft.');
    } finally {
      setIsGeneratingOffer(false);
    }
  };

  // Handle Send Offer Letter PDF & Email
  const handleSendOfferFinal = async () => {
    if (!generatedOfferText) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await API.post(`/applications/${selectedAppForOffer.id}/send-offer`, {
        offerText: generatedOfferText,
        salary: offerInputs.salary,
        startDate: offerInputs.startDate
      });
      setSuccess('Offer letter PDF generated and emailed to candidate successfully!');
      setShowOfferModal(false);
      setGeneratedOfferText('');
      setOfferInputs({ salary: '', startDate: '', customNotes: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compile and send offer letter.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner"></div>
        <p>Loading your dashboard workspace...</p>
      </div>
    );
  }

  // Formatting Status Data for Recharts
  const statusData = analytics?.stats?.statusBreakdown
    ? Object.keys(analytics.stats.statusBreakdown).map(key => ({
        name: key,
        value: analytics.stats.statusBreakdown[key]
      })).filter(item => item.value > 0)
    : [];

  const jobMetricsData = analytics?.stats?.jobMetrics
    ? analytics.stats.jobMetrics.map(item => ({
        name: item.title.length > 15 ? `${item.title.substring(0, 15)}...` : item.title,
        Applications: item.applicationsCount
      }))
    : [];

  return (
    <div className="dashboard-page container-wide">
      {/* Sidebar Navigation */}
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar card">
          <div className="sidebar-header">
            <div className="user-avatar-wrap">
              <span className="user-avatar-initial">{user?.name?.charAt(0).toUpperCase()}</span>
              {user?.role === 'admin' && <Shield className="shield-icon" size={16} />}
            </div>
            <div className="sidebar-user-details">
              <h4>{user?.name}</h4>
              <p className="role-tag">{user?.role.toUpperCase()}</p>
            </div>
          </div>

          <div className="sidebar-menu">
            <button
              className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart2 size={18} />
              <span>Overview</span>
            </button>

            {user.role === 'seeker' && (
              <button
                className={`menu-item ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
              >
                <FileText size={18} />
                <span>My Applications</span>
              </button>
            )}

            {user.role === 'employer' && (
              <>
                <button
                  className={`menu-item ${activeTab === 'jobs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('jobs')}
                >
                  <Briefcase size={18} />
                  <span>My Job Listings</span>
                </button>
                <button
                  className={`menu-item ${activeTab === 'applicants' ? 'active' : ''}`}
                  onClick={() => setActiveTab('applicants')}
                >
                  <Users size={18} />
                  <span>Review Applicants</span>
                </button>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <button
                  className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  <Users size={18} />
                  <span>Manage Users</span>
                </button>
                <button
                  className={`menu-item ${activeTab === 'jobs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('jobs')}
                >
                  <Briefcase size={18} />
                  <span>Manage Jobs</span>
                </button>
                <button
                  className={`menu-item ${activeTab === 'applications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('applications')}
                >
                  <FileText size={18} />
                  <span>Manage Applications</span>
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Main Work Area */}
        <main className="dashboard-content">
          {error && <div className="alert alert-error mb-lg"><AlertCircle size={18} /><span>{error}</span></div>}
          {success && <div className="alert alert-success mb-lg"><CheckCircle size={18} /><span>{success}</span></div>}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>Workspace Overview</h2>
                <p>Real-time analytics and tracking summary.</p>
              </div>

              {/* Stat Cards Row */}
              <div className="grid-4 mb-xl">
                {user.role === 'seeker' && (
                  <>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--clr-accent1)' }}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{analytics?.stats?.totalApplications || 0}</div>
                        <div className="stat-label">Total Applications</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--clr-warning)' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{analytics?.stats?.statusBreakdown?.Interviewing || 0}</div>
                        <div className="stat-label">Interviewing</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--clr-success)' }}>
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{analytics?.stats?.statusBreakdown?.Offered || 0}</div>
                        <div className="stat-label">Offers Received</div>
                      </div>
                    </div>
                  </>
                )}

                {user.role === 'employer' && (
                  <>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--clr-accent1)' }}>
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{analytics?.stats?.totalJobs || 0}</div>
                        <div className="stat-label">Active Listings</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--clr-info)' }}>
                        <Users size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{analytics?.stats?.totalApplications || 0}</div>
                        <div className="stat-label">Applications Received</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--clr-warning)' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{analytics?.stats?.statusBreakdown?.Interviewing || 0}</div>
                        <div className="stat-label">Interviews Scheduled</div>
                      </div>
                    </div>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--clr-accent1)' }}>
                        <Users size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{(analytics?.stats?.totalSeekers || 0) + (analytics?.stats?.totalEmployers || 0)}</div>
                        <div className="stat-label">Total Users</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--clr-accent2)' }}>
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{analytics?.stats?.totalJobs || 0}</div>
                        <div className="stat-label">Active Jobs</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--clr-info)' }}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{analytics?.stats?.totalApplications || 0}</div>
                        <div className="stat-label">Applications Submitted</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Charts Panel */}
              <div className="charts-grid">
                {/* Status breakdown pie chart */}
                {statusData.length > 0 ? (
                  <div className="chart-card card">
                    <h3>Application Status Share</h3>
                    <div className="chart-container-wrap">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', color: '#fff' }} />
                          <Legend formatter={(value, entry) => <span style={{ color: 'var(--clr-text)' }}>{value}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="chart-card card empty-chart">
                    <h3>Application Status Share</h3>
                    <p>No application status tracking details available yet.</p>
                  </div>
                )}

                {/* Job metrics bar chart for employers */}
                {user.role === 'employer' && (
                  <div className="chart-card card">
                    <h3>Applications by Job (Top 5)</h3>
                    {jobMetricsData.length > 0 ? (
                      <div className="chart-container-wrap">
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={jobMetricsData}>
                            <XAxis dataKey="name" stroke="var(--clr-text-muted)" fontSize={11} />
                            <YAxis stroke="var(--clr-text-muted)" fontSize={11} />
                            <Tooltip contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', color: '#fff' }} />
                            <Bar dataKey="Applications" fill="var(--clr-accent2)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="loading-center">Post job listings to view recruitment analytics.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEEKER APPLICATIONS LIST */}
          {activeTab === 'applications' && user.role === 'seeker' && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>My Applied Jobs</h2>
                <p>Track your submitted applications and interview invites.</p>
              </div>

              <div className="table-responsive card">
                {applications.length > 0 ? (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Applied Date</th>
                        <th>Status</th>
                        <th>Resume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.id}>
                          <td data-label="Job Title">
                            <strong>{app.job_title}</strong>
                            {app.status === 'Interviewing' && app.interview_date && (
                              <div className="interview-details-card">
                                <div className="interview-meta">
                                  <strong>Interview Call:</strong> {new Date(app.interview_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {app.interview_time}
                                </div>
                                <a href={app.interview_link} target="_blank" rel="noopener noreferrer" className="meet-link-btn">
                                  <Video size={12} />
                                  <span>Join Meet Call</span>
                                </a>
                              </div>
                            )}
                            {app.status === 'Offered' && app.offer_letter_text && (
                              <div style={{ marginTop: '0.4rem' }}>
                                <a 
                                  href={`${API_URL}/applications/${app.id}/offer-pdf?token=${token}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-secondary btn-sm"
                                  style={{ gap: '4px', borderColor: 'var(--clr-success)', color: 'var(--clr-success)' }}
                                >
                                  <Download size={12} />
                                  <span>Download Offer (PDF)</span>
                                </a>
                              </div>
                            )}
                          </td>
                          <td data-label="Company">{app.company}</td>
                          <td data-label="Location"><span className="flex-align"><MapPin size={14} /> {app.location}</span></td>
                          <td data-label="Type"><span className={`badge badge-${app.job_type.toLowerCase().replace('-', '')}`}>{app.job_type}</span></td>
                          <td data-label="Applied Date">{new Date(app.applied_at).toLocaleDateString()}</td>
                          <td data-label="Status">
                            <span className={`badge badge-${app.status.toLowerCase()}`}>
                              {app.status}
                            </span>
                          </td>
                          <td data-label="Resume">
                            <a
                              href={`${BASE_URL}${app.resume_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-link"
                              title="Download Resume"
                            >
                              <Download size={16} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <FileText className="empty-state-icon" />
                    <p>You haven't applied to any jobs yet.</p>
                    <a href="/jobs" className="btn btn-primary mt-md">Explore Job Listings</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EMPLOYER MY JOBS */}
          {activeTab === 'jobs' && (user.role === 'employer' || user.role === 'admin') && (
            <div className="tab-pane">
              <div className="pane-header flex-between">
                <div>
                  <h2>Manage Active Listings</h2>
                  <p>View, update, or remove job opportunities listed under your account.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowPostJobModal(true)}>
                  <Plus size={18} />
                  <span>Create Listing</span>
                </button>
              </div>

              <div className="table-responsive card">
                {jobs.length > 0 ? (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Salary</th>
                        <th>Date Posted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job.id}>
                          <td data-label="Job Title"><strong>{job.title}</strong></td>
                          <td data-label="Company">{job.company}</td>
                          <td data-label="Location"><span className="flex-align"><MapPin size={14} /> {job.location}</span></td>
                          <td data-label="Type"><span className={`badge badge-${job.type.toLowerCase().replace('-', '')}`}>{job.type}</span></td>
                          <td data-label="Salary"><span className="flex-align"><DollarSign size={14} /> {job.salary || 'N/A'}</span></td>
                          <td data-label="Date Posted">{new Date(job.created_at).toLocaleDateString()}</td>
                          <td data-label="Actions">
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => handleDeleteJob(job.id)}
                              title="Delete Listing"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <Briefcase className="empty-state-icon" />
                    <p>No job listings posted yet.</p>
                    <button className="btn btn-primary mt-md" onClick={() => setShowPostJobModal(true)}>
                      Post Your First Job
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EMPLOYER REVIEW CANDIDATES */}
          {activeTab === 'applicants' && user.role === 'employer' && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>Review Candidates</h2>
                <p>Examine resumes and update recruitment statuses.</p>
              </div>

              <div className="table-responsive card">
                {applications.length > 0 ? (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job Applied</th>
                        <th>Email</th>
                        <th>Applied Date</th>
                        <th>Resume & Details</th>
                        <th>Recruitment Actions</th>
                        <th>Recruitment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.id}>
                          <td data-label="Candidate">
                            <strong>{app.seeker_name}</strong>
                            {app.interview_date && (
                              <div className="sub-text" style={{ color: 'var(--clr-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} />
                                <span>Scheduled: {new Date(app.interview_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </td>
                          <td data-label="Job Applied">{app.job_title}</td>
                          <td data-label="Email">{app.seeker_email}</td>
                          <td data-label="Applied Date">{new Date(app.applied_at).toLocaleDateString()}</td>
                          <td data-label="Resume & Details">
                            <div className="flex-align gap-sm">
                              <a
                                href={`${BASE_URL}${app.resume_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                title="Download Resume"
                              >
                                <Download size={14} />
                                <span>CV</span>
                              </a>
                              {app.cover_letter && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setSelectedCoverLetter(app.cover_letter)}
                                  title="View Cover Letter"
                                >
                                  <Eye size={14} />
                                  <span>Cover</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons-cell">
                              {app.status !== 'Offered' && app.status !== 'Rejected' && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setSelectedAppForSchedule(app);
                                    setScheduleData({
                                      interviewDate: app.interview_date ? app.interview_date.substring(0, 10) : '',
                                      interviewTime: app.interview_time || '',
                                      interviewLink: app.interview_link || ''
                                    });
                                    setShowScheduleModal(true);
                                  }}
                                  title="Schedule Interview"
                                  style={{ gap: '4px' }}
                                >
                                  <Calendar size={14} />
                                  <span>{app.interview_date ? 'Reschedule' : 'Schedule'}</span>
                                </button>
                              )}
                              
                              {(app.status === 'Interviewing' || app.status === 'Offered') && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    setSelectedAppForOffer(app);
                                    setOfferInputs({
                                      salary: '',
                                      startDate: '',
                                      customNotes: ''
                                    });
                                    setGeneratedOfferText(app.offer_letter_text || '');
                                    setShowOfferModal(true);
                                  }}
                                  title="Generate Offer"
                                  style={{ gap: '4px' }}
                                >
                                  <Sparkles size={14} />
                                  <span>Offer</span>
                                </button>
                              )}

                              {app.status === 'Offered' && app.offer_letter_text && (
                                <a
                                  href={`${API_URL}/applications/${app.id}/offer-pdf?token=${token}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-secondary btn-sm"
                                  title="View Offer Letter PDF"
                                  style={{ borderColor: 'var(--clr-success)', color: 'var(--clr-success)', gap: '4px' }}
                                >
                                  <FileText size={14} />
                                  <span>PDF</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                              className="form-select status-select-input"
                              disabled={actionLoading}
                            >
                              <option value="Applied">Applied</option>
                              <option value="Interviewing">Interviewing</option>
                              <option value="Offered">Offered</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <Users className="empty-state-icon" />
                    <p>No candidate submissions received yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADMIN MANAGE USERS */}
          {activeTab === 'users' && user.role === 'admin' && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>System Users</h2>
                <p>Monitor platform registrations and restrict access.</p>
              </div>

              <div className="table-responsive card">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email Address</th>
                      <th>System Role</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.id}>
                        <td data-label="Name"><strong>{u.name}</strong></td>
                        <td data-label="Email">{u.email}</td>
                        <td data-label="Role">
                          <span className={`role-pill role-${u.role}`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td data-label="Registered">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td data-label="Actions">
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user.id}
                            title={u.id === user.id ? 'Cannot delete self' : 'Delete User'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN MANAGE APPLICATIONS */}
          {activeTab === 'applications' && user.role === 'admin' && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>All Platform Applications</h2>
                <p>Manage candidate submissions and status changes across the entire system.</p>
              </div>

              <div className="table-responsive card">
                {applications.length > 0 ? (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Applied Date</th>
                        <th>Resume</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.id}>
                          <td data-label="Candidate">
                            <strong>{app.seeker_name}</strong>
                            <div className="sub-text">{app.seeker_email}</div>
                          </td>
                          <td data-label="Job Title">{app.job_title}</td>
                          <td data-label="Company">{app.company}</td>
                          <td data-label="Applied Date">{new Date(app.applied_at).toLocaleDateString()}</td>
                          <td data-label="Resume">
                            <a
                              href={`${BASE_URL}${app.resume_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              <Download size={14} />
                              <span>CV</span>
                            </a>
                          </td>
                          <td>
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                              className="form-select status-select-input"
                              disabled={actionLoading}
                            >
                              <option value="Applied">Applied</option>
                              <option value="Interviewing">Interviewing</option>
                              <option value="Offered">Offered</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <FileText className="empty-state-icon" />
                    <p>No job applications found in database.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE JOB MODAL */}
      {showPostJobModal && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <div className="modal-header">
              <h2>List a New Job Opportunity</h2>
              <button className="modal-close" onClick={() => setShowPostJobModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Senior Staff Engineer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Acme Inc"
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. San Francisco, CA / Remote"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Category</label>
                  <select
                    className="form-select"
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    required
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Details</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. $120k - $150k"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Requirements (One per line)</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. 5+ years React experience&#10;B.S. in Computer Science"
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Job Details / Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Elaborate on candidate roles and day-to-day requirements."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPostJobModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COVER LETTER MODAL */}
      {selectedCoverLetter && (
        <div className="modal-overlay">
          <div className="modal-card card max-width-600">
            <div className="modal-header">
              <h2>Candidate Cover Letter</h2>
              <button className="modal-close" onClick={() => setSelectedCoverLetter(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body cover-letter-text">
              {selectedCoverLetter.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedCoverLetter(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {showScheduleModal && selectedAppForSchedule && (
        <div className="modal-overlay">
          <div className="modal-card card max-width-600">
            <div className="modal-header">
              <h2>Schedule Interview with {selectedAppForSchedule.seeker_name}</h2>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Position</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedAppForSchedule.job_title}
                  disabled
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Interview Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={scheduleData.interviewDate}
                    onChange={(e) => setScheduleData({ ...scheduleData, interviewDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Interview Time</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2:00 PM EST"
                    value={scheduleData.interviewTime}
                    onChange={(e) => setScheduleData({ ...scheduleData, interviewTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label flex-between">
                  <span>Google Meet Join Link</span>
                  <button
                    type="button"
                    className="input-helper-btn"
                    onClick={generateMeetLinkHelper}
                  >
                    Auto-Generate Link
                  </button>
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={scheduleData.interviewLink}
                  onChange={(e) => setScheduleData({ ...scheduleData, interviewLink: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Scheduling...' : 'Save & Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI OFFER LETTER GENERATOR MODAL */}
      {showOfferModal && selectedAppForOffer && (
        <div className="modal-overlay">
          <div className="modal-card card" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Offer Letter Generator for {selectedAppForOffer.seeker_name}</h2>
              <button className="modal-close" onClick={() => setShowOfferModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
              <form onSubmit={handleGenerateOfferDraft} className="modal-form" style={{ overflowY: 'visible' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedAppForOffer.job_title}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedAppForOffer.company || user.name}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Offered Salary Details</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. $135,000 / year"
                      value={offerInputs.salary}
                      onChange={(e) => setOfferInputs({ ...offerInputs, salary: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Start Date</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. July 15, 2026"
                      value={offerInputs.startDate}
                      onChange={(e) => setOfferInputs({ ...offerInputs, startDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Custom Offer Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Sign-on bonus details, flexible hybrid requirements..."
                    value={offerInputs.customNotes}
                    onChange={(e) => setOfferInputs({ ...offerInputs, customNotes: e.target.value })}
                    style={{ minHeight: '60px' }}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isGeneratingOffer || actionLoading}
                  style={{ alignSelf: 'flex-start', marginTop: '10px' }}
                >
                  <Sparkles size={16} />
                  <span>{isGeneratingOffer ? 'Generating with AI...' : 'Generate AI Offer Letter'}</span>
                </button>
              </form>

              {isGeneratingOffer ? (
                <div className="ai-loading-box">
                  <div className="ai-loading-spinner"></div>
                  <p>AI is reading candidate details and formatting your custom offer letter...</p>
                </div>
              ) : generatedOfferText ? (
                <div className="ai-generated-editor">
                  <label className="form-label">Edit Generated Offer Letter Draft</label>
                  <textarea
                    className="form-input ai-editor-textarea"
                    value={generatedOfferText}
                    onChange={(e) => setGeneratedOfferText(e.target.value)}
                    required
                  ></textarea>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowOfferModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleSendOfferFinal} 
                      disabled={actionLoading}
                      style={{ background: 'var(--clr-success)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
                    >
                      <Send size={16} />
                      <span>{actionLoading ? 'Creating PDF & Sending...' : 'Send PDF Offer to Candidate'}</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
