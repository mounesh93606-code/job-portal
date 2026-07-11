import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Briefcase, ArrowRight, Zap,
  Users, Building2, TrendingUp, ChevronRight, Star
} from 'lucide-react';
import API from '../api/axios';
import './Home.css';

const jobTypes = ['Full-time', 'Part-time', 'Remote', 'Contract'];

const Home = () => {
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await API.get('/jobs');
        setFeaturedJobs(res.data.slice(0, 6));
      } catch {
        setFeaturedJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTitle) params.set('title', searchTitle);
    if (searchLocation) params.set('location', searchLocation);
    navigate(`/jobs?${params.toString()}`);
  };

  const getTypeBadgeClass = (type) => {
    const map = { 'Full-time': 'badge-fulltime', 'Part-time': 'badge-parttime', Remote: 'badge-remote', Contract: 'badge-contract' };
    return map[type] || 'badge-applied';
  };

  return (
    <div className="home-page">
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="container">
          <div className="hero-badge">
            <Zap size={14} />
            <span>The #1 Job Portal for Modern Talent</span>
          </div>
          <h1 className="hero-title">
            Find Your <span className="gradient-text">Dream Career</span>
            <br />in Minutes
          </h1>
          <p className="hero-subtitle">
            Connect with top employers, discover thousands of opportunities,
            and take the next step in your career journey.
          </p>

          {/* Search Bar */}
          <form className="hero-search" onSubmit={handleSearch}>
            <div className="search-field">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Job title, keyword, or company..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="search-input"
                id="home-search-title"
              />
            </div>
            <div className="search-divider" />
            <div className="search-field">
              <MapPin size={18} className="search-icon" />
              <input
                type="text"
                placeholder="City, state, or 'Remote'"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="search-input"
                id="home-search-location"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg search-btn">
              <Search size={18} />
              Search Jobs
            </button>
          </form>

          {/* Quick Tags */}
          <div className="hero-tags">
            <span className="tags-label">Popular:</span>
            {['React Developer', 'UI/UX Designer', 'Node.js', 'Remote Work', 'Full-Stack'].map((tag) => (
              <button
                key={tag}
                className="tag-chip"
                onClick={() => { setSearchTitle(tag); }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {[
              { icon: <Briefcase size={24} />, value: '10K+', label: 'Active Jobs', color: '#6366f1' },
              { icon: <Building2 size={24} />, value: '2K+', label: 'Top Companies', color: '#8b5cf6' },
              { icon: <Users size={24} />, value: '50K+', label: 'Job Seekers', color: '#06b6d4' },
              { icon: <TrendingUp size={24} />, value: '95%', label: 'Placement Rate', color: '#10b981' },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <div className="stat-value gradient-text">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED JOBS ── */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <Star size={22} className="section-title-icon" />
                Featured Opportunities
              </h2>
              <p className="section-subtitle">Handpicked roles from top-tier companies</p>
            </div>
            <Link to="/jobs" className="btn btn-secondary">
              View All Jobs <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              <p>Loading jobs...</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {featuredJobs.map((job) => (
                <Link to={`/jobs/${job.id}`} key={job.id} className="job-card card">
                  <div className="job-card-header">
                    <div className="company-avatar">
                      {job.company?.charAt(0)}
                    </div>
                    <div>
                      <div className="company-name">{job.company}</div>
                      <div className="post-date">
                        {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <span className={`badge ${getTypeBadgeClass(job.type)} ml-auto`}>{job.type}</span>
                  </div>
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-description">{job.description?.slice(0, 100)}...</p>
                  <div className="job-meta">
                    <span className="job-meta-item">
                      <MapPin size={13} />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="job-meta-item job-salary">
                        💰 {job.salary}
                      </span>
                    )}
                  </div>
                  <div className="job-card-footer">
                    <span className="view-job">
                      View Job <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-grid">
            <div className="cta-card cta-seeker">
              <div className="cta-icon"><Users size={32} /></div>
              <h3>Looking for a Job?</h3>
              <p>Browse thousands of opportunities and apply with one click. Your next chapter starts here.</p>
              <Link to="/register" className="btn btn-primary">
                Get Started <ArrowRight size={16} />
              </Link>
            </div>
            <div className="cta-card cta-employer">
              <div className="cta-icon"><Building2 size={32} /></div>
              <h3>Hiring Talent?</h3>
              <p>Post jobs, receive applications, and find the right candidates with our powerful analytics.</p>
              <Link to="/register" className="btn btn-secondary">
                Post a Job <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
