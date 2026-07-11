const db = require('../config/db');

// Get all jobs with filtering
exports.getAllJobs = async (req, res) => {
  const { title, location, type, minSalary } = req.query;

  let query = `
    SELECT j.*, u.name as employer_name, u.email as employer_email 
    FROM jobs j 
    JOIN users u ON j.employer_id = u.id 
    WHERE 1=1
  `;
  const params = [];

  if (title) {
    query += ' AND (j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ?)';
    const searchVal = `%${title}%`;
    params.push(searchVal, searchVal, searchVal);
  }

  if (location) {
    query += ' AND j.location LIKE ?';
    params.push(`%${location}%`);
  }

  if (type) {
    query += ' AND j.type = ?';
    params.push(type);
  }

  // Sort by newest
  query += ' ORDER BY j.created_at DESC';

  try {
    const [jobs] = await db.query(query, params);
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to retrieve jobs. Server error.' });
  }
};

// Get single job details
exports.getJobById = async (req, res) => {
  const jobId = req.params.id;

  try {
    const [jobs] = await db.query(
      `SELECT j.*, u.name as employer_name, u.email as employer_email 
       FROM jobs j 
       JOIN users u ON j.employer_id = u.id 
       WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    res.status(200).json(jobs[0]);
  } catch (error) {
    console.error('Error fetching job detail:', error);
    res.status(500).json({ message: 'Server error retrieving job details.' });
  }
};

// Create a new job listing (Employer / Admin only)
exports.createJob = async (req, res) => {
  const { title, description, company, location, type, salary, requirements } = req.body;
  const employerId = req.user.id;

  if (!title || !description || !company || !location || !type) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO jobs (title, description, company, location, type, salary, requirements, employer_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, company, location, type, salary || null, requirements || null, employerId]
    );

    res.status(201).json({
      message: 'Job listing created successfully.',
      jobId: result.insertId
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error creating job listing.' });
  }
};

// Update job listing (Employer / Admin only)
exports.updateJob = async (req, res) => {
  const jobId = req.params.id;
  const { title, description, company, location, type, salary, requirements } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Check if job exists and user is owner or admin
    const [jobs] = await db.query('SELECT employer_id FROM jobs WHERE id = ?', [jobId]);
    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const job = jobs[0];
    if (job.employer_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. You can only update your own job posts.' });
    }

    await db.query(
      `UPDATE jobs 
       SET title = ?, description = ?, company = ?, location = ?, type = ?, salary = ?, requirements = ? 
       WHERE id = ?`,
      [title, description, company, location, type, salary, requirements, jobId]
    );

    res.status(200).json({ message: 'Job listing updated successfully.' });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Server error updating job listing.' });
  }
};

// Delete job listing (Employer / Admin only)
exports.deleteJob = async (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Check if job exists and user is owner or admin
    const [jobs] = await db.query('SELECT employer_id FROM jobs WHERE id = ?', [jobId]);
    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const job = jobs[0];
    if (job.employer_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. You can only delete your own job posts.' });
    }

    await db.query('DELETE FROM jobs WHERE id = ?', [jobId]);
    res.status(200).json({ message: 'Job listing deleted successfully.' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error deleting job listing.' });
  }
};
