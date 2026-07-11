# ApexHire API Documentation

This document lists all API endpoints, auth restrictions, request payloads, and expected responses.

* **Base URL**: `http://localhost:5000/api`
* **Content-Type**: `application/json` (unless specified otherwise)
* **Authentication**: All protected endpoints require a `Bearer <JWT_TOKEN>` token inside the `Authorization` header.

---

## 🔐 Authentication Endpoints

### 1. Register User
* **Method**: `POST`
* **Path**: `/auth/register`
* **Auth**: Public
* **Request Body**:
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@seeker.com",
    "password": "password123",
    "role": "seeker" 
  }
  ```
  *(Roles allowed: `seeker`, `employer`, `admin`. Defaults to `seeker`)*
* **Success Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully.",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 5,
      "name": "Jane Smith",
      "email": "jane@seeker.com",
      "role": "seeker"
    }
  }
  ```

### 2. Login User
* **Method**: `POST`
* **Path**: `/auth/login`
* **Auth**: Public
* **Request Body**:
  ```json
  {
    "email": "john@seeker.com",
    "password": "password123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "message": "Logged in successfully.",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 4,
      "name": "John Doe",
      "email": "john@seeker.com",
      "role": "seeker"
    }
  }
  ```

### 3. Get User Profile
* **Method**: `GET`
* **Path**: `/auth/profile`
* **Auth**: Protected (All Roles)
* **Success Response (200 OK)**:
  ```json
  {
    "id": 4,
    "name": "John Doe",
    "email": "john@seeker.com",
    "role": "seeker",
    "created_at": "2026-06-10T09:00:00.000Z"
  }
  ```

---

## 💼 Job Management Endpoints

### 1. Get All Jobs (With Filters)
* **Method**: `GET`
* **Path**: `/jobs`
* **Auth**: Public
* **Query Parameters (Optional)**:
  * `title`: Search titles, companies, or description contents.
  * `location`: Search job locations.
  * `type`: Exact match on job type (`Full-time`, `Part-time`, `Remote`, `Contract`).
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "title": "Senior Full-Stack Engineer",
      "description": "Join our dynamic engineering team...",
      "company": "TechCorp Inc.",
      "location": "San Francisco, CA",
      "type": "Full-time",
      "salary": "$120,000 - $150,000",
      "requirements": "5+ years experience...",
      "employer_id": 2,
      "created_at": "2026-06-10T09:00:00.000Z",
      "employer_name": "TechCorp Recruiter",
      "employer_email": "techcorp@jobs.com"
    }
  ]
  ```

### 2. Get Single Job Details
* **Method**: `GET`
* **Path**: `/jobs/:id`
* **Auth**: Public
* **Success Response (200 OK)**:
  ```json
  {
    "id": 1,
    "title": "Senior Full-Stack Engineer",
    "description": "Join our dynamic engineering team...",
    "company": "TechCorp Inc.",
    "location": "San Francisco, CA",
    "type": "Full-time",
    "salary": "$120,000 - $150,000",
    "requirements": "5+ years experience...",
    "employer_id": 2,
    "created_at": "2026-06-10T09:00:00.000Z",
    "employer_name": "TechCorp Recruiter",
    "employer_email": "techcorp@jobs.com"
  }
  ```

### 3. Post a Job Listing
* **Method**: `POST`
* **Path**: `/jobs`
* **Auth**: Protected (Role: `employer`, `admin`)
* **Request Body**:
  ```json
  {
    "title": "Backend Architect",
    "description": "Lead design of microservices...",
    "company": "TechCorp Inc.",
    "location": "Hybrid - SF",
    "type": "Full-time",
    "salary": "$180,000 - $220,000",
    "requirements": "Deep MySQL optimization knowledge\nGraphQL"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "message": "Job listing created successfully.",
    "jobId": 5
  }
  ```

### 4. Update Job Listing
* **Method**: `PUT`
* **Path**: `/jobs/:id`
* **Auth**: Protected (Role: `employer` owner, or `admin`)
* **Request Body**:
  *(Provide all fields to update)*
* **Success Response (200 OK)**:
  ```json
  {
    "message": "Job listing updated successfully."
  }
  ```

### 5. Delete Job Listing
* **Method**: `DELETE`
* **Path**: `/jobs/:id`
* **Auth**: Protected (Role: `employer` owner, or `admin`)
* **Success Response (200 OK)**:
  ```json
  {
    "message": "Job listing deleted successfully."
  }
  ```

---

## 📝 Application Management Endpoints

### 1. Apply to a Job
* **Method**: `POST`
* **Path**: `/applications`
* **Auth**: Protected (Role: `seeker` only)
* **Content-Type**: `multipart/form-data`
* **Request Parameters**:
  * `jobId`: integer (Required)
  * `coverLetter`: string (Optional)
  * `resume`: File upload (Supported: `.pdf`, `.doc`, `.docx`, Max 5MB)
* **Success Response (201 Created)**:
  ```json
  {
    "message": "Application submitted successfully.",
    "applicationId": 4,
    "resumePath": "/uploads/resumes/resume-1686411234-987654321.pdf"
  }
  ```

### 2. View Applications
* **Method**: `GET`
* **Path**: `/applications`
* **Auth**: Protected (All Roles)
* **Behavior**:
  * **Seeker**: Returns seeker's own applications.
  * **Employer**: Returns applications for employer's posted jobs.
  * **Admin**: Returns all platform applications.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "job_id": 1,
      "seeker_id": 4,
      "resume_path": "/uploads/resumes/john_doe_resume.pdf",
      "status": "Interviewing",
      "cover_letter": "I am very excited...",
      "applied_at": "2026-06-10T09:00:00.000Z",
      "job_title": "Senior Full-Stack Engineer",
      "company": "TechCorp Inc.",
      "location": "San Francisco, CA",
      "job_type": "Full-time"
    }
  ]
  ```

### 3. Update Application Status
* **Method**: `PUT`
* **Path**: `/applications/:id/status`
* **Auth**: Protected (Role: `employer` owner, or `admin`)
* **Request Body**:
  ```json
  {
    "status": "Interviewing"
  }
  ```
  *(Supported statuses: `Applied`, `Interviewing`, `Offered`, `Rejected`)*
* **Success Response (200 OK)**:
  ```json
  {
    "message": "Application status updated successfully.",
    "status": "Interviewing"
  }
  ```

---

## 📊 Analytics & Admin Endpoints

### 1. View Analytics Dashboard
* **Method**: `GET`
* **Path**: `/analytics`
* **Auth**: Protected (All Roles)
* **Response payload varies based on role:**
  * **Seeker**: Total applications and status breakdown map.
  * **Employer**: Total jobs, total applications received, status breakdown map, and top 5 job metric counts.
  * **Admin**: Total active jobs, seekers count, employers count, application counts, and overall status breakdowns.
* **Success Response example (Employer role, 200 OK)**:
  ```json
  {
    "role": "employer",
    "stats": {
      "totalJobs": 3,
      "totalApplications": 12,
      "statusBreakdown": {
        "Applied": 6,
        "Interviewing": 4,
        "Offered": 1,
        "Rejected": 1
      },
      "jobMetrics": [
        { "id": 1, "title": "Senior Full-Stack Engineer", "applicationsCount": 8 }
      ]
    }
  }
  ```

### 2. Admin: Get Platform Users
* **Method**: `GET`
* **Path**: `/analytics/users`
* **Auth**: Protected (Role: `admin` only)
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Admin Administrator",
      "email": "admin@jobportal.com",
      "role": "admin",
      "created_at": "2026-06-10T09:00:00.000Z"
    }
  ]
  ```

### 3. Admin: Delete User
* **Method**: `DELETE`
* **Path**: `/analytics/users/:id`
* **Auth**: Protected (Role: `admin` only)
* **Success Response (200 OK)**:
  ```json
  {
    "message": "User deleted successfully."
  }
  ```
