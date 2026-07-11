# ApexHire | Premium Next-Gen Job Board Portal

Welcome to **ApexHire**, a premium, full-stack job board portal web application built using **React**, **Node.js (Express)**, and **MySQL**. 

This system provides a modern, responsive user experience with glassmorphic visuals, real-time analytics dashboards, JWT-based authentication, and structured role management for **Job Seekers**, **Employers**, and **Admins**.

---

## 🚀 Key Features

* **JWT-Based Authentication**: Custom auth system with role authorization.
* **Job Search & Filters**: Filter jobs by title, company, location, and job type.
* **Resume Upload & Apply**: Seekers can upload PDF/Word resumes and submit cover letters.
* **Recruitment Dashboards**:
  * **Job Seekers**: Track active applications, check statuses (Applied, Interviewing, Offered, Rejected) and view overall progress.
  * **Employers**: Post new job listings, manage active listings, download applicant resumes, read cover letters, and update candidate statuses.
  * **Admins**: Monitor system analytics, delete inappropriate listings, and manage system users.
* **Interactive Data Visualization**: Recharts dashboards showing recruitment shares, applications per job, and metrics.
* **Stunning Design Aesthetics**: Sleek dark theme featuring glassmorphism, harmony gradients, micro-animations, and responsive tables.

---

## 📂 Project Structure

```text
c:/eeeee/
├── backend/
│   ├── config/             # Database connection configuration
│   ├── controllers/        # Business logic for auth, jobs, applications, analytics
│   ├── middleware/         # Auth verification and role gates
│   ├── routes/             # Express API routing tables
│   ├── uploads/resumes/    # Upload directory for seeker resumes
│   ├── .env.example        # Environment variables configuration template
│   ├── server.js           # Server entry point
│   └── package.json
├── database/
│   ├── schema.sql          # Table definitions (users, jobs, applications)
│   └── seed.sql            # Seed records for quick platform testing
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/            # Centralized Axios client with token interceptors
    │   ├── components/     # Layout headers, navigation bars, css
    │   ├── context/        # AuthContext for global session management
    │   ├── pages/          # Home, Jobs, JobDetails, Login, Register, Dashboard
    │   ├── App.jsx         # App router and protected routes
    │   ├── index.css       # Design tokens, global layout styles, utility css
    │   └── main.jsx        # Entry script
    ├── index.html          # HTML Shell
    ├── package.json
    └── vite.config.js
```

---

## 🛠️ Step-by-Step Installation & Setup

### Prerequisite
* [Node.js](https://nodejs.org/) (v16 or higher)
* [MySQL Server](https://dev.mysql.com/downloads/installer/) (v8.0 or higher)

---

### Step 1: Database Initialization

1. Open your MySQL Command Line Client or preferred GUI tool (e.g. phpMyAdmin, DBeaver).
2. Execute `database/schema.sql` to create the database and tables:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
3. Seed the database with demo accounts and job listings:
   ```bash
   mysql -u root -p < database/seed.sql
   ```

---

### Step 2: Backend Configuration

1. Open `backend/.env` (pre-created or copy from `.env.example`).
2. Update database credentials if they differ from default:
   ```ini
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=YOUR_PASSWORD_HERE
   DB_NAME=job_portal
   DB_PORT=3306
   JWT_SECRET=supersecretkey123_change_this_in_production
   JWT_EXPIRES_IN=7d
   ```
3. Install backend packages and launch the server:
   ```bash
   cd backend
   npm install
   npm run start   # Runs on http://localhost:5000
   ```

---

### Step 3: Frontend Configuration

1. Install frontend packages:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev     # Runs on http://localhost:5173 or http://localhost:5174
   ```
3. Open your browser and navigate to the local address (typically `http://localhost:5173`).

---

## 🔑 Demo Seed Credentials

All accounts use the password: `password123`

| Name | Role | Email |
| :--- | :--- | :--- |
| **Admin Administrator** | Admin | `admin@jobportal.com` |
| **TechCorp Recruiter** | Employer | `techcorp@jobs.com` |
| **DesignStudio HR** | Employer | `designstudio@jobs.com` |
| **John Doe** | Job Seeker | `john@seeker.com` |
| **Jane Smith** | Job Seeker | `jane@seeker.com` |

---

## 🧪 Verification & API Testing

See [API.md](file:///c:/eeeee/API.md) for a comprehensive list of all endpoints, parameters, and payloads. You can use tools like Postman, curl, or VS Code REST Client to test endpoint behaviors.
