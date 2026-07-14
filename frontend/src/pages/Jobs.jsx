import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, Briefcase, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import API from '../api/axios';
import './Jobs.css';

const JOB_TYPES = ['Full-time', 'Part-time', 'Remote', 'Contract'];

const getTypeBadgeClass = (type) => {
  const map = { 'Full-time': 'badge-fulltime', 'Part-time': 'badge-parttime', Remote: 'badge-remote', Contract: 'badge-contract' };
  return map[type] || 'badge-applied';
};

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (title) params.title = title;
      if (location) params.location = location;
      if (type) params.type = type;
      const res = await API.get('/jobs', { params });
      setJobs(res.data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [title, location, type]);

  useEffect(() => {
    fetchJobs();
    // Update URL params
    const p = {};
    if (title) p.title = title;
    if (location) p.location = location;
    if (type) p.type = type;
    setSearchParams(p);
  }, [fetchJobs, setSearchParams]);

  const clearFilters = () => {
    setTitle('');
    setLocation('');
    setType('');
  };

  const hasFilters = title || location || type;

  return (
    <div className="jobs-page">
      <div className="container">
        {/* Page Header */}
        <div className="jobs-header">
          <div>
            <h1 className="jobs-title">Browse <span className="gradient-text">All Jobs</span></h1>
            <p className="jobs-subtitle">{jobs.length} opportunity{jobs.length !== 1 ? 'ies' : 'y'} found</p>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="search-bar card">
          <div className="search-bar-field">
            <Search size={17} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Search jobs, companies, keywords..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              id="jobs-search-title"
            />
          </div>
          <div className="search-bar-divider" />
          <div className="search-bar-field">
            <MapPin size={17} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              id="jobs-search-location"
            />
          </div>
          <div className="search-bar-divider" />
          <div className="search-bar-actions">
            <button
              className={`filter-toggle ${filtersOpen ? 'active' : ''}`}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasFilters && <span className="filter-dot" />}
            </button>
            {hasFilters && (
              <button className="clear-filters" onClick={clearFilters} title="Clear filters">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Type Filters */}
        {filtersOpen && (
          <div className="type-filters">
            <span className="filter-label">
              <Filter size={14} /> Job Type
            </span>
            {JOB_TYPES.map((t) => (
              <button
                key={t}
                className={`type-chip ${type === t ? 'active' : ''}`}
                onClick={() => setType(type === t ? '' : t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Active filters display */}
        {hasFilters && (
          <div className="active-filters">
            {title && (
              <span className="active-filter-tag">
                Keyword: <strong>{title}</strong>
                <X size={12} onClick={() => setTitle('')} />
              </span>
            )}
            {location && (
              <span className="active-filter-tag">
                Location: <strong>{location}</strong>
                <X size={12} onClick={() => setLocation('')} />
              </span>
            )}
            {type && (
              <span className="active-filter-tag">
                Type: <strong>{type}</strong>
                <X size={12} onClick={() => setType('')} />
              </span>
            )}
          </div>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <p>Searching jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={64} className="empty-state-icon" />
            <h3>No jobs found</h3>
            <p>Try adjusting your search filters or check back later.</p>
            {hasFilters && (
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="jobs-list">
            {jobs.map((job) => (
              <Link to={`/jobs/${job.id}`} key={job.id} className="job-list-card card">
                <div className="jlc-company-avatar">{job.company?.charAt(0)}</div>
                <div className="jlc-info">
                  <div className="jlc-top">
                    <h3 className="jlc-title">{job.title}</h3>
                    <span className={`badge ${getTypeBadgeClass(job.type)}`}>{job.type}</span>
                  </div>
                  <div className="jlc-company">{job.company}</div>
                  <p className="jlc-desc">{job.description?.slice(0, 120)}...</p>
                  <div className="jlc-meta">
                    <span className="jlc-meta-item"><MapPin size={13} />{job.location}</span>
                    {job.salary && <span className="jlc-meta-item jlc-salary">💰 {job.salary}</span>}
                    <span className="jlc-meta-item">
                      🕒 {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="jlc-action">
                  <ChevronRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
