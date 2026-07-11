const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'job_portal',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection & run auto-migration
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully.');
    
    // Auto-migration for applications table
    try {
      const [columns] = await pool.query('SHOW COLUMNS FROM applications');
      const columnNames = columns.map(c => c.Field);
      
      if (!columnNames.includes('interview_date')) {
        await pool.query('ALTER TABLE applications ADD COLUMN interview_date DATETIME NULL');
        console.log('Auto-migration: Added column interview_date to applications.');
      }
      if (!columnNames.includes('interview_time')) {
        await pool.query('ALTER TABLE applications ADD COLUMN interview_time VARCHAR(50) NULL');
        console.log('Auto-migration: Added column interview_time to applications.');
      }
      if (!columnNames.includes('interview_link')) {
        await pool.query('ALTER TABLE applications ADD COLUMN interview_link VARCHAR(255) NULL');
        console.log('Auto-migration: Added column interview_link to applications.');
      }
      if (!columnNames.includes('offer_letter_text')) {
        await pool.query('ALTER TABLE applications ADD COLUMN offer_letter_text TEXT NULL');
        console.log('Auto-migration: Added column offer_letter_text to applications.');
      }
      if (!columnNames.includes('offer_letter_path')) {
        await pool.query('ALTER TABLE applications ADD COLUMN offer_letter_path VARCHAR(255) NULL');
        console.log('Auto-migration: Added column offer_letter_path to applications.');
      }
    } catch (migErr) {
      console.error('Auto-migration failed:', migErr.message);
    }
    
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
})();

module.exports = pool;
