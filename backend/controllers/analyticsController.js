const db = require('../config/db');

exports.getAnalytics = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    if (role === 'seeker') {
      // 1. Total applications
      const [[{ total }]] = await db.query(
        'SELECT COUNT(*) as total FROM applications WHERE seeker_id = ?',
        [userId]
      );

      // 2. Applications by status
      const [statusBreakdown] = await db.query(
        'SELECT status, COUNT(*) as count FROM applications WHERE seeker_id = ? GROUP BY status',
        [userId]
      );

      // Format status breakdown to make it frontend-ready
      const statusMap = { Applied: 0, Interviewing: 0, Offered: 0, Rejected: 0 };
      statusBreakdown.forEach(row => {
        if (statusMap[row.status] !== undefined) {
          statusMap[row.status] = row.count;
        }
      });

      return res.status(200).json({
        role,
        stats: {
          totalApplications: total,
          statusBreakdown: statusMap
        }
      });
    }

    if (role === 'employer') {
      // 1. Total posted jobs
      const [[{ totalJobs }]] = await db.query(
        'SELECT COUNT(*) as totalJobs FROM jobs WHERE employer_id = ?',
        [userId]
      );

      // 2. Total applications received
      const [[{ totalApplications }]] = await db.query(
        `SELECT COUNT(a.id) as totalApplications 
         FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.employer_id = ?`,
        [userId]
      );

      // 3. Applications status breakdown
      const [statusBreakdown] = await db.query(
        `SELECT a.status, COUNT(a.id) as count 
         FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE j.employer_id = ? 
         GROUP BY a.status`,
        [userId]
      );

      const statusMap = { Applied: 0, Interviewing: 0, Offered: 0, Rejected: 0 };
      statusBreakdown.forEach(row => {
        if (statusMap[row.status] !== undefined) {
          statusMap[row.status] = row.count;
        }
      });

      // 4. Job specific metrics (applications per job)
      const [jobMetrics] = await db.query(
        `SELECT j.id, j.title, COUNT(a.id) as applicationsCount 
         FROM jobs j 
         LEFT JOIN applications a ON j.id = a.job_id 
         WHERE j.employer_id = ? 
         GROUP BY j.id, j.title 
         LIMIT 5`,
        [userId]
      );

      return res.status(200).json({
        role,
        stats: {
          totalJobs,
          totalApplications,
          statusBreakdown: statusMap,
          jobMetrics
        }
      });
    }

    if (role === 'admin') {
      // 1. General counts
      const [[{ totalJobs }]] = await db.query('SELECT COUNT(*) as totalJobs FROM jobs');
      const [[{ totalSeekers }]] = await db.query("SELECT COUNT(*) as totalSeekers FROM users WHERE role = 'seeker'");
      const [[{ totalEmployers }]] = await db.query("SELECT COUNT(*) as totalEmployers FROM users WHERE role = 'employer'");
      const [[{ totalApplications }]] = await db.query('SELECT COUNT(*) as totalApplications FROM applications');

      // 2. System status breakdown
      const [statusBreakdown] = await db.query('SELECT status, COUNT(*) as count FROM applications GROUP BY status');
      const statusMap = { Applied: 0, Interviewing: 0, Offered: 0, Rejected: 0 };
      statusBreakdown.forEach(row => {
        if (statusMap[row.status] !== undefined) {
          statusMap[row.status] = row.count;
        }
      });

      return res.status(200).json({
        role,
        stats: {
          totalJobs,
          totalSeekers,
          totalEmployers,
          totalApplications,
          statusBreakdown: statusMap
        }
      });
    }

    res.status(400).json({ message: 'Invalid user role for analytics.' });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error retrieving analytics.' });
  }
};

// Admin route to manage users (list users)
exports.adminGetUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ message: 'Server error listing users.' });
  }
};

// Admin route to delete a user
exports.adminDeleteUser = async (req, res) => {
  const targetUserId = req.params.id;

  try {
    // Prevent self-deletion
    if (parseInt(targetUserId) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [targetUserId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [targetUserId]);
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
};
