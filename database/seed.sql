USE job_portal;

-- Delete existing seed records to prevent duplicates
DELETE FROM applications;
DELETE FROM jobs;
DELETE FROM users;

-- Hashed password for 'password123' (using bcrypt strength 10)
-- Password Hash: $2a$10$Xm57Z.g1bX2mB1UeB.513erZ8.rK7zTq7Z2lBq9Jd85k2V1H2Jkye

-- Seed Users
INSERT INTO users (id, name, email, password, role) VALUES
(1, 'Admin Administrator', 'admin@jobportal.com', '$2a$10$4yyB2d.mFrJGs3axe1JQ7O8OzqJYjp24ApWm2HPxOrIxVk7f7Fso6', 'admin'),
(2, 'TechCorp Recruiter', 'techcorp@jobs.com', '$2a$10$4yyB2d.mFrJGs3axe1JQ7O8OzqJYjp24ApWm2HPxOrIxVk7f7Fso6', 'employer'),
(3, 'DesignStudio HR', 'designstudio@jobs.com', '$2a$10$4yyB2d.mFrJGs3axe1JQ7O8OzqJYjp24ApWm2HPxOrIxVk7f7Fso6', 'employer'),
(4, 'John Doe', 'john@seeker.com', '$2a$10$4yyB2d.mFrJGs3axe1JQ7O8OzqJYjp24ApWm2HPxOrIxVk7f7Fso6', 'seeker'),
(5, 'Jane Smith', 'jane@seeker.com', '$2a$10$4yyB2d.mFrJGs3axe1JQ7O8OzqJYjp24ApWm2HPxOrIxVk7f7Fso6', 'seeker');

-- Seed Jobs
INSERT INTO jobs (id, title, description, company, location, type, salary, requirements, employer_id) VALUES
(1, 'Senior Full-Stack Engineer', 'Join our dynamic engineering team building modern SaaS solutions. You will work with Node.js, React, and MySQL database management system. We expect solid experience in writing clean, scalable JavaScript and writing RESTful APIs.', 'TechCorp Inc.', 'San Francisco, CA', 'Full-time', '$120,000 - $150,000', '5+ years experience with Node.js, React, and MySQL\nExperience with AWS deployment\nStrong knowledge of unit testing', 2),
(2, 'Junior Front-End Developer', 'We are looking for an enthusiastic junior frontend developer. Work closely with product designers to create highly polished interfaces using React, CSS, and modern animations. We welcome self-starters with a strong portfolio.', 'TechCorp Inc.', 'Remote', 'Remote', '$60,000 - $80,000', 'Proficiency in React and vanilla CSS\nFamiliarity with Git and package managers\nPortfolio of web designs/apps', 2),
(3, 'Lead UI/UX Designer', 'Lead the visual and user experience design for client projects. Create wireframes, interactive user flows, and high fidelity layouts. Work with web designers to ensure aesthetics and pixel-perfect rendering.', 'DesignStudio', 'New York, NY', 'Contract', '$90,000 - $110,000', '4+ years agency experience\nExpert in Figma/Adobe Creative Suite\nStrong layout and typography principles', 3),
(4, 'Node.js Backend Specialist', 'Optimize backend services, improve database query performance, and design secure RESTful APIs. Must understand database indexation, caching strategies, and REST conventions.', 'TechCorp Inc.', 'Hybrid - San Francisco, CA', 'Part-time', '$50 - $75 / hr', 'Advanced JavaScript/ES6\nDeep knowledge of MySQL, queries, and optimization\nExperience in JWT authentication design', 2);

-- Seed Applications
INSERT INTO applications (id, job_id, seeker_id, resume_path, status, cover_letter) VALUES
(1, 1, 4, '/uploads/resumes/john_doe_resume.pdf', 'Interviewing', 'I am very excited about the Senior Full-Stack role at TechCorp. I have 6 years of experience working with React and Node.js, and I am highly proficient in writing optimized queries for MySQL databases.'),
(2, 2, 4, '/uploads/resumes/john_doe_resume.pdf', 'Applied', 'Hi, I would love to join TechCorp as a Junior Front-End Developer! I love CSS, React, and creating micro-animations.'),
(3, 3, 5, '/uploads/resumes/jane_smith_resume.pdf', 'Offered', 'Hello, as a visual designer with 5 years of agency experience, I am confident I can make DesignStudio\'s projects stand out. Please see my attached portfolio.');
