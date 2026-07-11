import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Briefcase, DollarSign, Clock, ArrowLeft,
  Building2, Upload, CheckCircle, AlertCircle, Send
} from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './JobDetails.css';

const getTypeBadgeClass = (type) => {
  const map = { 'Full-time': 'badge-fulltime', 'Part-time': 'badge-parttime', Remote: 'badge-remote', Contract: 'badge-contract' };
  return map[type] || 'badge-applied';
};

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [applyStatus, setApplyStatus] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await API.get(`/jobs/${id}`);
        setJob(res.data);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setApplyStatus({ type: 'error', message: 'Please upload your resume.' });
      return;
    }
    setApplying(true);
    setApplyStatus(null);
    try {
      const formData = new FormData();
      formData.append('jobId', id);
      formData.append('coverLetter', coverLetter);
      formData.append('resume', resumeFile);
      await API.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setApplyStatus({ type: 'success', message: '🎉 Application submitted successfully! The employer will review your resume.' });
      setShowApplyForm(false);
      setCoverLetter('');
      setResumeFile(null);
    } catch (err) {
      setApplyStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit application. Please try again.'
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p>Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="empty-state" style={{ paddingTop: '6rem' }}>
        <AlertCircle size={64} className="empty-state-icon" />
        <h3>Job Not Found</h3>
        <p>This listing may have been removed or doesn't exist.</p>
        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/jobs')}>
          <ArrowLeft size={15} /> Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="job-details-page">
      <div className="container">
        {/* Back */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Jobs
        </button>

        <div className="jd-layout">
          {/* Main Content */}
          <div className="jd-main">
            {/* Header Card */}
            <div className="jd-header card">
              <div className="jd-company-row">
                <div className="jd-company-avatar">{job.company?.charAt(0)}</div>
                <div>
                  <div className="jd-company-name">{job.company}</div>
                  <div className="jd-posted">
                    Posted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <span className={`badge ${getTypeBadgeClass(job.type)} ml-auto`}>{job.type}</span>
              </div>
              <h1 className="jd-title">{job.title}</h1>
              <div className="jd-meta">
                <span className="jd-meta-item"><MapPin size={15} />{job.location}</span>
                <span className="jd-meta-item"><Briefcase size={15} />{job.type}</span>
                {job.salary && <span className="jd-meta-item jd-salary"><DollarSign size={15} />{job.salary}</span>}
                <span className="jd-meta-item">
                  <Clock size={15} />
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Apply Status */}
            {applyStatus && (
              <div className={`alert ${applyStatus.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {applyStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {applyStatus.message}
              </div>
            )}

            {/* Description */}
            <div className="jd-section card">
              <h2 className="jd-section-title">Job Description</h2>
              <p className="jd-desc">{job.description}</p>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="jd-section card">
                <h2 className="jd-section-title">Requirements</h2>
                <ul className="jd-requirements">
                  {job.requirements.split('\n').filter(Boolean).map((req, i) => (
                    <li key={i} className="jd-req-item">
                      <CheckCircle size={16} className="req-icon" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Application Form */}
            {showApplyForm && (
              <div className="apply-form-card card">
                <h2 className="jd-section-title">Submit Your Application</h2>
                <form onSubmit={handleApply} className="apply-form">
                  <div className="form-group">
                    <label className="form-label">Cover Letter (Optional)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Tell the employer why you're a great fit for this role..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={6}
                      id="cover-letter-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Resume *</label>
                    <div className="file-upload-zone" onClick={() => document.getElementById('resume-upload').click()}>
                      <Upload size={28} className="upload-icon" />
                      {resumeFile ? (
                        <>
                          <p className="upload-filename">{resumeFile.name}</p>
                          <p className="upload-hint">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <p className="upload-label">Click to upload or drag & drop</p>
                          <p className="upload-hint">PDF, DOC, DOCX — Max 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => setResumeFile(e.target.files[0])}
                    />
                  </div>

                  <div className="apply-form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowApplyForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={applying}>
                      {applying ? (
                        <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Submitting...</>
                      ) : (
                        <><Send size={16} /> Submit Application</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="jd-sidebar">
            {/* Apply Box */}
            <div className="apply-box card">
              <div className="apply-box-header">
                <h3>Ready to Apply?</h3>
                <p>Join the applicants for this exciting role at {job.company}.</p>
              </div>

              {isAuthenticated ? (
                user?.role === 'seeker' ? (
                  !showApplyForm && (
                    <button
                      className="btn btn-primary btn-full btn-lg"
                      onClick={() => { setShowApplyForm(true); setApplyStatus(null); }}
                    >
                      <Send size={18} /> Apply Now
                    </button>
                  )
                ) : (
                  <div className="alert alert-info">
                    <AlertCircle size={16} />
                    Only job seekers can apply for positions.
                  </div>
                )
              ) : (
                <div className="apply-login-prompt">
                  <p>Please log in as a job seeker to apply.</p>
                  <a href="/login" className="btn btn-primary btn-full">Log In to Apply</a>
                  <a href="/register" className="btn btn-secondary btn-full">Create Account</a>
                </div>
              )}
            </div>

            {/* Job Summary */}
            <div className="jd-summary card">
              <h3 className="summary-title">Job Summary</h3>
              <div className="summary-items">
                <div className="summary-item">
                  <Building2 size={16} className="summary-icon" />
                  <div>
                    <div className="summary-label">Company</div>
                    <div className="summary-value">{job.company}</div>
                  </div>
                </div>
                <div className="summary-item">
                  <MapPin size={16} className="summary-icon" />
                  <div>
                    <div className="summary-label">Location</div>
                    <div className="summary-value">{job.location}</div>
                  </div>
                </div>
                <div className="summary-item">
                  <Briefcase size={16} className="summary-icon" />
                  <div>
                    <div className="summary-label">Job Type</div>
                    <div className="summary-value">{job.type}</div>
                  </div>
                </div>
                {job.salary && (
                  <div className="summary-item">
                    <DollarSign size={16} className="summary-icon" />
                    <div>
                      <div className="summary-label">Salary</div>
                      <div className="summary-value" style={{ color: 'var(--clr-success)' }}>{job.salary}</div>
                    </div>
                  </div>
                )}
                <div className="summary-item">
                  <Clock size={16} className="summary-icon" />
                  <div>
                    <div className="summary-label">Posted</div>
                    <div className="summary-value">{new Date(job.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
