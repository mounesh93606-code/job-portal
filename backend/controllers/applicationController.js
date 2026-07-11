const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const PDFDocument = require('pdfkit');
const pdfParse = require('pdf-parse');
const { sendMail } = require('../config/mailer');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('resume');

// Apply to a job (Seeker only)
exports.applyToJob = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const { jobId, coverLetter } = req.body;
    const seekerId = req.user.id;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload your resume.' });
    }

    // Store relative path for URL access or server serving
    const resumePath = `/uploads/resumes/${req.file.filename}`;

    try {
      // 1. Verify Job exists
      const [jobs] = await db.query('SELECT id FROM jobs WHERE id = ?', [jobId]);
      if (jobs.length === 0) {
        // Remove uploaded file if job not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Job not found.' });
      }

      // 2. Verify not already applied
      const [existing] = await db.query(
        'SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?',
        [jobId, seekerId]
      );
      if (existing.length > 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'You have already applied for this job.' });
      }

      // 3. Save application
      const [result] = await db.query(
        'INSERT INTO applications (job_id, seeker_id, resume_path, cover_letter) VALUES (?, ?, ?, ?)',
        [jobId, seekerId, resumePath, coverLetter || null]
      );

      res.status(201).json({
        message: 'Application submitted successfully.',
        applicationId: result.insertId,
        resumePath
      });
    } catch (error) {
      console.error('Job application submission error:', error);
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Server error submitting application.' });
    }
  });
};

// Get list of applications based on role
exports.getApplications = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let query = '';
    let params = [];

    if (role === 'seeker') {
      // Seekers see their own applications
      query = `
        SELECT a.*, j.title as job_title, j.company, j.location, j.type as job_type
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE a.seeker_id = ?
        ORDER BY a.applied_at DESC
      `;
      params = [userId];
    } else if (role === 'employer') {
      // Employers see applications for their posted jobs
      query = `
        SELECT a.*, j.title as job_title, u.name as seeker_name, u.email as seeker_email
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON a.seeker_id = u.id
        WHERE j.employer_id = ?
        ORDER BY a.applied_at DESC
      `;
      params = [userId];
    } else if (role === 'admin') {
      // Admins see all applications
      query = `
        SELECT a.*, j.title as job_title, j.company, u.name as seeker_name, u.email as seeker_email
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON a.seeker_id = u.id
        ORDER BY a.applied_at DESC
      `;
    }

    const [applications] = await db.query(query, params);
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error retrieving applications.' });
  }
};

// Update Application Status (Employer/Admin only)
exports.updateApplicationStatus = async (req, res) => {
  const applicationId = req.params.id;
  const { status } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!status || !['Applied', 'Interviewing', 'Offered', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing status.' });
  }

  try {
    // Check if application exists and belongs to employer's job (or is admin)
    const [apps] = await db.query(
      `SELECT a.id, j.employer_id 
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (apps.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const app = apps[0];
    if (app.employer_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. You can only update candidates applying to your jobs.' });
    }

    await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId]);
    res.status(200).json({ message: 'Application status updated successfully.', status });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Server error updating application status.' });
  }
};

// Schedule Interview (Employer / Admin)
exports.scheduleInterview = async (req, res) => {
  const applicationId = req.params.id;
  const { interviewDate, interviewTime, interviewLink } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!interviewDate || !interviewTime || !interviewLink) {
    return res.status(400).json({ message: 'Interview date, time, and link are required.' });
  }

  try {
    // 1. Verify application exists and belongs to employer
    const [apps] = await db.query(
      `SELECT a.id, j.employer_id, j.title as job_title, u.name as seeker_name, u.email as seeker_email
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.seeker_id = u.id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (apps.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const app = apps[0];
    if (app.employer_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    // 2. Update DB and set status to 'Interviewing'
    await db.query(
      `UPDATE applications 
       SET interview_date = ?, interview_time = ?, interview_link = ?, status = 'Interviewing' 
       WHERE id = ?`,
      [interviewDate, interviewTime, interviewLink, applicationId]
    );

    // 3. Send email to seeker
    const emailSubject = `Interview Invitation: ${app.job_title} at ApexHire`;
    const formattedDate = new Date(interviewDate).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const emailText = `Hello ${app.seeker_name},\n\nYou have been invited to an interview for the ${app.job_title} position.\n\nDetails:\nDate: ${formattedDate}\nTime: ${interviewTime}\nJoin Link (Google Meet): ${interviewLink}\n\nBest regards,\nApexHire Recruitment Team`;
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">Interview Invitation</h2>
        <p>Dear <strong>${app.seeker_name}</strong>,</p>
        <p>We are pleased to invite you to an interview for the position of <strong>${app.job_title}</strong>.</p>
        <div style="background: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #eee; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${interviewTime}</p>
          <p style="margin: 5px 0;"><strong>Format:</strong> Video Call (Google Meet)</p>
        </div>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${interviewLink}" target="_blank" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Google Meet</a>
        </p>
        <p>Please log into your ApexHire dashboard to manage or view your applications.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 0.85em; color: #777;">This is an automated notification from ApexHire recruitment platform.</p>
      </div>
    `;

    await sendMail({
      to: app.seeker_email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    res.status(200).json({ 
      message: 'Interview scheduled and candidate notified.', 
      interview: { interviewDate, interviewTime, interviewLink } 
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ message: 'Server error scheduling interview.' });
  }
};

// Generate AI Offer Letter Draft (Employer / Admin)
exports.generateOfferLetter = async (req, res) => {
  const applicationId = req.params.id;
  const { salary, startDate, jobTitle, company, customNotes } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!salary || !startDate) {
    return res.status(400).json({ message: 'Salary and Start Date are required.' });
  }

  try {
    // 1. Get application info
    const [apps] = await db.query(
      `SELECT a.id, a.resume_path, a.cover_letter, j.employer_id, j.title as default_title, j.company as default_company, u.name as seeker_name, u.email as seeker_email
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.seeker_id = u.id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (apps.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const app = apps[0];
    if (app.employer_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const finalTitle = jobTitle || app.default_title;
    const finalCompany = company || app.default_company;

    // 2. Read resume file if it exists and try to parse it
    let resumeText = '';
    if (app.resume_path) {
      const fullResumePath = path.join(__dirname, '..', app.resume_path);
      if (fs.existsSync(fullResumePath) && path.extname(fullResumePath).toLowerCase() === '.pdf') {
        try {
          const dataBuffer = fs.readFileSync(fullResumePath);
          const pdfData = await pdfParse(dataBuffer);
          resumeText = pdfData.text ? pdfData.text.substring(0, 3000) : '';
          console.log(`Successfully parsed ${resumeText.length} characters from resume.`);
        } catch (parseErr) {
          console.warn('Could not parse resume PDF. Skipping resume text:', parseErr.message);
        }
      }
    }

    let offerDraftText = '';
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
Generate a highly professional, official, and detailed job offer letter for a candidate.
Employer / Company: ${finalCompany}
Candidate Name: ${app.seeker_name}
Candidate Email: ${app.seeker_email}
Job Title: ${finalTitle}
Offered Salary: ${salary}
Target Start Date: ${startDate}

Candidate's Background (Extracted from Resume/Cover Letter):
${resumeText || app.cover_letter || 'No extensive background provided.'}

Custom Recruiter Notes to Incorporate:
${customNotes || 'None'}

Please structure the document as a formal offer letter. Start directly with the date and professional salutation.
Include paragraphs for:
1. Formal Job Offer details (Title, reporting structure)
2. Compensation (specifically detailing the base salary of ${salary})
3. Benefits outline (health insurance, 401k match, paid time off, etc.)
4. Terms of employment & Start Date (specifically ${startDate})
5. Offer acceptance instructions & deadline (give them 7 days)
6. Signatures block

Do not write markdown headings (like "# Offer Letter" or "### Section") in the text of the letter. Keep it formatted nicely as a clean, continuous official block of text with standard line break formatting. Ensure it uses the company name "${finalCompany}" as the sender.
`;

        const result = await model.generateContent(prompt);
        offerDraftText = result.response.text();
      } catch (aiErr) {
        console.error('Gemini API execution failed, falling back to local template:', aiErr.message);
      }
    }

    // 3. Fallback/Template engine if no Gemini or failed call
    if (!offerDraftText) {
      const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      offerDraftText = `
Date: ${today}

To: ${app.seeker_name}
Email: ${app.seeker_email}

Dear ${app.seeker_name},

On behalf of ${finalCompany}, we are absolutely thrilled to offer you the position of ${finalTitle}. We were incredibly impressed by your qualifications and background during our discussions, particularly your experience highlighted in your resume. We believe your skills and character will be a tremendous addition to our team.

In this role, you will report directly to the Hiring Manager for the department. Below are the terms and details of this formal employment offer:

Position: ${finalTitle}
Starting Date: ${startDate}
Base Compensation: ${salary} (payable in regular semi-monthly installments)

Benefits Summary:
As a full-time employee of ${finalCompany}, you will be eligible for our comprehensive benefits package starting on your first day. This includes:
- Premium medical, dental, and vision insurance options
- 401(k) retirement savings plan with employer matching up to 4%
- 15 days of Paid Time Off (PTO) per calendar year, plus 10 paid public holidays
- Flexible workspace benefits and professional development stipends
${customNotes ? `\nSpecial Notes:\n${customNotes}\n` : ''}
Terms of Employment:
This offer is contingent upon the successful completion of a background check. Please note that employment with ${finalCompany} is "at-will," meaning either you or the company may terminate the relationship at any time for any reason.

To accept this offer, please sign and date this letter below and return it to us within seven (7) business days. 

We look forward to welcoming you to the ${finalCompany} family!

Sincerely,

The HR Recruitment Team
${finalCompany}

---
Acceptance of Offer:

I accept the offer of employment as outlined above.

Signature: __________________________    Date: __________________
`;
    }

    res.status(200).json({
      message: 'Offer letter draft generated.',
      offerText: offerDraftText.trim(),
      details: {
        seekerName: app.seeker_name,
        jobTitle: finalTitle,
        company: finalCompany,
        salary,
        startDate
      }
    });
  } catch (error) {
    console.error('Error generating offer letter:', error);
    res.status(500).json({ message: 'Server error generating offer letter.' });
  }
};

// Send Offer Letter (Employer / Admin)
exports.sendOfferLetter = async (req, res) => {
  const applicationId = req.params.id;
  const { offerText, salary, startDate } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!offerText) {
    return res.status(400).json({ message: 'Offer letter text is required.' });
  }

  // Ensure offers directory exists
  const offersDir = path.join(__dirname, '../uploads/offers');
  if (!fs.existsSync(offersDir)) {
    fs.mkdirSync(offersDir, { recursive: true });
  }

  try {
    // 1. Get application & job info
    const [apps] = await db.query(
      `SELECT a.id, j.employer_id, j.title as job_title, j.company, u.name as seeker_name, u.email as seeker_email
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.seeker_id = u.id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (apps.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const app = apps[0];
    if (app.employer_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    // 2. Generate PDF using PDFKit
    const filename = `offer_${applicationId}_${Date.now()}.pdf`;
    const relativePdfPath = `/uploads/offers/${filename}`;
    const absolutePdfPath = path.join(offersDir, filename);

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(absolutePdfPath);
    doc.pipe(writeStream);

    // Styling the PDF letter professionally
    // Draw simple premium letterhead line
    doc.strokeColor('#6366f1').lineWidth(3).moveTo(50, 45).lineTo(562, 45).stroke();
    
    // Add Company logo/header text
    doc.fillColor('#0d0f1c').font('Helvetica-Bold').fontSize(22).text(app.company.toUpperCase(), 50, 60);
    doc.fillColor('#8890b5').font('Helvetica').fontSize(9).text('OFFICIAL WORKER AGREEMENT & EMPLOYMENT OFFER', 50, 85);
    
    doc.moveDown(2);

    // Letter Body Text
    doc.fillColor('#222222').font('Helvetica').fontSize(11).lineGap(4);
    
    // Split the offerText by lines and write them
    const textLines = offerText.split('\n');
    textLines.forEach(line => {
      if (line.trim() === '---') {
        doc.moveDown(1);
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(1);
      } else {
        doc.text(line);
      }
    });

    // Draw Footer bar
    doc.strokeColor('#8b5cf6').lineWidth(2).moveTo(50, 740).lineTo(562, 740).stroke();
    doc.fillColor('#8890b5').font('Helvetica').fontSize(8).text(`ApexHire Recruitment Platform - Confidentially prepared for ${app.seeker_name}`, 50, 750, { align: 'center' });

    doc.end();

    // Wait for the file to be fully written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // 3. Update DB
    await db.query(
      `UPDATE applications 
       SET status = 'Offered', offer_letter_text = ?, offer_letter_path = ? 
       WHERE id = ?`,
      [offerText, relativePdfPath, applicationId]
    );

    // 4. Send email with PDF attachment
    const emailSubject = `Official Job Offer: ${app.job_title} at ${app.company}`;
    const emailText = `Dear ${app.seeker_name},\n\nCongratulations! We are pleased to extend an official offer of employment for the ${app.job_title} position at ${app.company}. Your official offer letter is attached as a PDF.\n\nPlease review the offer letter, sign it, and upload your signed copy or respond via our system dashboard.\n\nWarm regards,\n${app.company} HR & Recruitment`;
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa;">
        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Employment Offer Extended!</h2>
        <p>Dear <strong>${app.seeker_name}</strong>,</p>
        <p>We are delighted to extend to you a formal offer of employment for the position of <strong>${app.job_title}</strong> at <strong>${app.company}</strong>.</p>
        <p>Your detailed offer letter containing compensation, benefits, and next steps has been compiled and is attached to this email as a PDF document.</p>
        <p>Please review the attachment and check your ApexHire dashboard to submit your final response.</p>
        <br/>
        <p>Congratulations once again, and we look forward to having you join us!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 0.85em; color: #777;">This is an automated notification from ApexHire recruitment platform.</p>
      </div>
    `;

    await sendMail({
      to: app.seeker_email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      attachments: [
        {
          filename: `Offer_Letter_${app.company.replace(/\s+/g, '_')}.pdf`,
          path: absolutePdfPath
        }
      ]
    });

    res.status(200).json({
      message: 'Offer letter PDF created and sent to candidate.',
      pdfPath: relativePdfPath,
      status: 'Offered'
    });
  } catch (error) {
    console.error('Error generating/sending offer letter PDF:', error);
    res.status(500).json({ message: 'Server error processing offer letter PDF.' });
  }
};
