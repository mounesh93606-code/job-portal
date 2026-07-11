CREATE DATABASE IF NOT EXISTS job_portal;
USE job_portal;

-- Drop tables in reverse order of foreign keys
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS users;

-- Users table (Seeker, Employer, Admin)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('seeker', 'employer', 'admin') NOT NULL DEFAULT 'seeker',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs table (Posted by Employers)
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  type ENUM('Full-time', 'Part-time', 'Remote', 'Contract') NOT NULL DEFAULT 'Full-time',
  salary VARCHAR(100) DEFAULT NULL,
  requirements TEXT DEFAULT NULL,
  employer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Applications table (Job Seeker applying for Jobs)
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  seeker_id INT NOT NULL,
  resume_path VARCHAR(255) NOT NULL,
  status ENUM('Applied', 'Interviewing', 'Offered', 'Rejected') NOT NULL DEFAULT 'Applied',
  cover_letter TEXT DEFAULT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Interview scheduling fields
  interview_date DATE DEFAULT NULL,
  interview_time VARCHAR(20) DEFAULT NULL,
  interview_link VARCHAR(500) DEFAULT NULL,
  -- Offer letter fields
  offer_letter_text LONGTEXT DEFAULT NULL,
  offer_letter_path VARCHAR(500) DEFAULT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
