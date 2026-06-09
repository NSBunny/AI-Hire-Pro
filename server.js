import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pool } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and parsing of JSON request bodies
app.use(cors());
app.use(express.json());


async function logActivity(email, action) {
  try {
    await pool.query(
      'INSERT INTO activity_logs (user_email, action) VALUES ($1, $2)',
      [email || 'system', action]
    );
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}

// Database Schemas Initialization and Mock Seeding
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing Neon PostgreSQL database tables...');
    await client.query('BEGIN');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        salary VARCHAR(100),
        experience VARCHAR(100),
        skills TEXT[] NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        posted_date DATE DEFAULT CURRENT_DATE
      )
    `);

    // 3. Candidates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        applied_job_id VARCHAR(100) REFERENCES jobs(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'applied',
        resume_name VARCHAR(255),
        skills_matched TEXT[],
        skills_missing TEXT[],
        ai_score INT,
        ai_recommendation TEXT,
        match_breakdown JSONB,
        communication_analysis JSONB,
        interview_score INT,
        interview_answers JSONB
      )
    `);

    // 4. Leave Requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        requested_date DATE DEFAULT CURRENT_DATE
      )
    `);

    // 5. Attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(100) PRIMARY KEY,
        date DATE NOT NULL,
        check_in VARCHAR(50) NOT NULL,
        check_out VARCHAR(50),
        duration_hours NUMERIC,
        status VARCHAR(50) DEFAULT 'Present'
      )
    `);

    // 6. Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        text TEXT NOT NULL,
        time VARCHAR(100) NOT NULL,
        read BOOLEAN DEFAULT FALSE
      )
    `);

    // 7. Platform Content table
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_content (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Activity Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        action TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alter tables for status & featured column if not exists
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'
    `);
    await client.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE
    `);
    await client.query(`
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS chat_screening_score INT,
      ADD COLUMN IF NOT EXISTS chat_screening_answers JSONB,
      ADD COLUMN IF NOT EXISTS resume_questions JSONB,
      ADD COLUMN IF NOT EXISTS resume_suggestions JSONB
    `);

    // SEEDING DEFAULT MOCK DATA IF TABLES ARE EMPTY
    
    // Seed Users
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('Seeding initial demo user accounts...');
      await client.query(`
        INSERT INTO users (name, email, password, role) VALUES
        ('Rohan Sharma', 'rohan.sharma@example.com', 'mockpassword123', 'candidate'),
        ('Sarah Jenkins', 'recruiter@aihirepro.com', 'mockpassword123', 'recruiter'),
        ('Alex Rivera', 'manager@aihirepro.com', 'mockpassword123', 'manager'),
        ('Jane Doe', 'jane.doe@company.com', 'mockpassword123', 'employee'),
        ('Admin User', 'admin@aihirepro.com', 'mockpassword123', 'admin')
      `);
    }

    // Seed Jobs
    const jobCount = await client.query('SELECT COUNT(*) FROM jobs');
    if (parseInt(jobCount.rows[0].count) === 0) {
      console.log('Seeding initial jobs data...');
      await client.query(`
        INSERT INTO jobs (id, title, department, location, type, salary, experience, skills, description, status, posted_date) VALUES
        ('job-1', 'Senior Frontend Developer', 'Engineering', 'Bangalore, India', 'Full-time', '₹18 - ₹25 LPA', '3-5 years', ARRAY['React', 'TypeScript', 'CSS Flexbox/Grid', 'Vite', 'Next.js', 'State Management'], 'We are looking for a Senior Frontend Developer to lead our client-side development.', 'active', '2026-05-30'),
        ('job-2', 'Senior HR Tech Consultant', 'Human Resources', 'Remote', 'Full-time', '₹15 - ₹22 LPA', '5+ years', ARRAY['HRMS Solutions', 'Workday Integrations', 'Stakeholder Management', 'Payroll Architecture'], 'Lead client integrations and configure enterprise human resource management modules.', 'active', '2026-06-01'),
        ('job-3', 'Python Backend & AI Engineer', 'AI & Data Science', 'Bangalore, India', 'Full-time', '₹22 - ₹30 LPA', '4-7 years', ARRAY['Python', 'FastAPI', 'Gemini Flash SDK', 'Pinecone Vector DB', 'RAG Implementations'], 'Build core AI pipelines for resume ingestion, semantic profile matching, and audio transcripts.', 'active', '2026-05-28'),
        ('job-4', 'UI/UX Interface Designer', 'Product Design', 'Remote', 'Contract', '₹12 - ₹16 LPA equivalent', '2-4 years', ARRAY['Figma', 'Typography Scale', 'Glassmorphism Design', 'Design Systems', 'Micro-interactions'], 'Shape the next generation visual experience of AIHire Pro.', 'draft', '2026-06-02')
      `);
    }

    // Seed Candidates
    const candidateCount = await client.query('SELECT COUNT(*) FROM candidates');
    if (parseInt(candidateCount.rows[0].count) === 0) {
      console.log('Seeding initial candidates data...');
      
      const cand1Breakdown = JSON.stringify({ skills: 85, experience: 80, education: 90, cultural: 85 });
      const cand1Comm = JSON.stringify({ pace: 'Good (125 wpm)', fillerWords: ['uh', 'like'], tone: 'Confident & Structural', clarity: 88 });
      
      const cand2Breakdown = JSON.stringify({ skills: 100, experience: 95, education: 90, cultural: 98 });
      const cand2Comm = JSON.stringify({ pace: 'Excellent (135 wpm)', fillerWords: ['so'], tone: 'Collaborative & Articulate', clarity: 95 });
      const cand2Answers = JSON.stringify([
        {
          question: 'Explain how you optimize a slow React application.',
          answer: 'I start by profiling using Chrome DevTools. I look for unnecessary re-renders and apply memoization with useMemo or useCallback. I also implement code-splitting using React.lazy, lazy-load heavy assets, and optimize CSS bundle deliveries.',
          score: 95,
          feedback: 'Very detailed explanation covering profiling, re-renders, React APIs, and network optimizations.'
        },
        {
          question: 'What is your approach to maintaining custom UI design systems?',
          answer: 'I prefer using native CSS custom properties for spacing, colors, and transitions, mapped to semantic component parameters. This ensures consistency and simplifies toggling themes like dark mode in a clean manner without extra libraries.',
          score: 90,
          feedback: 'Strong alignment with our custom vanilla-CSS architectural guideline.'
        }
      ]);

      await client.query(`
        INSERT INTO candidates (id, name, email, phone, applied_job_id, status, resume_name, skills_matched, skills_missing, ai_score, ai_recommendation, match_breakdown, communication_analysis) VALUES
        ('cand-1', 'Aishwarya Sen', 'aishwarya.sen@example.com', '+91 98765 43210', 'job-1', 'screening', 'Aishwarya_Resume_Frontend.pdf', ARRAY['React', 'TypeScript', 'CSS Flexbox/Grid', 'Next.js'], ARRAY['Vite', 'State Management'], 84, 'STRONG FIT: Candidate exhibits solid React and TypeScript skills.', $1, $2)
      `, [cand1Breakdown, cand1Comm]);

      await client.query(`
        INSERT INTO candidates (id, name, email, phone, applied_job_id, status, resume_name, skills_matched, skills_missing, ai_score, ai_recommendation, match_breakdown, communication_analysis, interview_score, interview_answers) VALUES
        ('cand-2', 'Rohan Sharma', 'rohan.sharma@example.com', '+91 87654 32109', 'job-1', 'interviewing', 'Rohan_Senior_Frontend.pdf', ARRAY['React', 'TypeScript', 'Vite', 'Next.js', 'State Management', 'CSS Flexbox/Grid'], ARRAY[]::TEXT[], 96, 'EXCEPTIONAL FIT: Fits all required technical profiles perfectly.', $1, $2, 92, $3)
      `, [cand2Breakdown, cand2Comm, cand2Answers]);

      await client.query(`
        INSERT INTO candidates (id, name, email, phone, applied_job_id, status, resume_name, skills_matched, skills_missing, ai_score, ai_recommendation, match_breakdown) VALUES
        ('cand-3', 'Vikram Mehta', 'vikram.mehta@example.com', '+91 76543 21098', 'job-3', 'applied', 'Vikram_AI_Engineer.docx', ARRAY['Python', 'FastAPI', 'Gemini Flash SDK'], ARRAY['Pinecone Vector DB', 'RAG Implementations'], 68, 'BORDERLINE FIT: Moderate Python capability but lacks direct experience.', '{"skills": 60, "experience": 70, "education": 80, "cultural": 72}')
      `);
    }

    // Seed Leaves
    const leaveCount = await client.query('SELECT COUNT(*) FROM leave_requests');
    if (parseInt(leaveCount.rows[0].count) === 0) {
      console.log('Seeding initial leave requests...');
      await client.query(`
        INSERT INTO leave_requests (id, employee_id, employee_name, type, start_date, end_date, reason, status, requested_date) VALUES
        ('leave-1', 'emp-101', 'Jane Doe (Current User)', 'Annual', '2026-06-15', '2026-06-18', 'Family vacation trip', 'Pending', '2026-06-01'),
        ('leave-2', 'emp-102', 'Rahul Kumar', 'Sick', '2026-05-25', '2026-05-26', 'Severe seasonal flu', 'Approved', '2026-05-24')
      `);
    }

    // Seed Attendance
    const attendanceCount = await client.query('SELECT COUNT(*) FROM attendance');
    if (parseInt(attendanceCount.rows[0].count) === 0) {
      console.log('Seeding initial attendance data...');
      await client.query(`
        INSERT INTO attendance (id, date, check_in, check_out, duration_hours, status) VALUES
        ('att-1', '2026-06-02', '09:12 AM', NULL, NULL, 'Present'),
        ('att-2', '2026-06-01', '08:58 AM', '05:30 PM', 8.53, 'Present'),
        ('att-3', '2026-05-29', '09:35 AM', '05:00 PM', 7.42, 'Late'),
        ('att-4', '2026-05-28', '09:05 AM', '06:05 PM', 9.00, 'Present')
      `);
    }

    // Seed Notifications
    const notifCount = await client.query('SELECT COUNT(*) FROM notifications');
    if (parseInt(notifCount.rows[0].count) === 0) {
      console.log('Seeding initial notifications data...');
      await client.query(`
        INSERT INTO notifications (id, text, time, read) VALUES
        ('n-1', 'New candidate Rohan Sharma applied for Senior Frontend Developer.', '2 hours ago', FALSE),
        ('n-2', 'Your leave request for June 15th is currently pending manager approval.', '1 day ago', FALSE),
        ('n-3', 'AI screening report generated for candidate Aishwarya Sen.', '1 day ago', TRUE)
      `);
    }

    // Seed Platform Content
    const contentCount = await client.query('SELECT COUNT(*) FROM platform_content');
    if (parseInt(contentCount.rows[0].count) === 0) {
      console.log('Seeding initial platform content (FAQs and blogs)...');
      await client.query(`
        INSERT INTO platform_content (type, title, content) VALUES
        ('faq', 'How does AI Resume Ingestion work?', 'Our platform parses uploaded PDF and DOCX resumes, extracting key skills, match scores, and communication indicators via custom Gemini LLM schemas in real-time.'),
        ('faq', 'Is candidate information secure?', 'Yes. All candidate profiles, voice answers transcripts, and company configurations are fully secured in an enterprise Neon database over SSL/TLS.'),
        ('blog', 'Best Practices for Virtual Audits', 'Automation in virtual audits ensures compliance, tracks check-in coordinates, and simplifies team leave ledger distributions without manual email loops.'),
        ('blog', 'Leveraging Voice Analytics in Candidate Funnels', 'Measuring tone, filler words, and technical depth through automated simulations reduces screening backlogs by up to 64% in engineering roles.')
      `);
    }

    await client.query('COMMIT');
    console.log('Neon DB initialized successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize Neon DB:', err);
  } finally {
    client.release();
  }
}

// Trigger DB Initialization
initializeDatabase().catch(err => console.error('Database initialization failed:', err));

// ==========================================
// REST API ENDPOINTS
// ==========================================

// --- AUTHENTICATION ---

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields (name, email, password, role) are required.' });
  }

  try {
    const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, password, role]
    );

    await logActivity(email, `Registered a new user account with role: ${role}`);

    res.status(201).json({
      message: 'Account created successfully.',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server database error during registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password, role, status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const user = result.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This user account has been suspended by the platform administrator.' });
    }

    await logActivity(user.email, `Successfully logged in`);

    res.status(200).json({
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server database error during login.' });
  }
});

// --- GOOGLE OAUTH ---

app.get('/api/auth/google', (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) {
    return res.redirect('/google-login.html');
  }

  const host = req.get('host');
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${host}/api/auth/google/callback`;

  const state = req.query.state || 'secure-state';
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&state=${state}`;

  res.redirect(googleAuthUrl);
});

const handleGoogleCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).send('Google OAuth credentials not configured on backend.');
  }

  const host = req.get('host');
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${host}${req.path}`;

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return res.status(500).send(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
    }

    const { access_token } = tokenData;

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userInfo = await userInfoResponse.json();
    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', userInfo);
      return res.status(500).send('Failed to retrieve user profile from Google.');
    }

    const { name, email } = userInfo;

    let user;
    const userRes = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', [email]);
    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
      await logActivity(email, 'Logged in via Google OAuth');
    } else {
      const insertRes = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
        [name, email, 'google-auth-no-password-123', 'candidate']
      );
      user = insertRes.rows[0];
      await logActivity(email, 'Registered new account via Google OAuth');
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Success</title>
      </head>
      <body>
        <p>Signing in, please wait...</p>
        <script>
          if (window.opener && typeof window.opener.onGoogleLoginSuccess === 'function') {
            window.opener.onGoogleLoginSuccess({
              id: ${user.id},
              name: "${user.name.replace(/"/g, '\\"')}",
              email: "${user.email.replace(/"/g, '\\"')}",
              role: "${user.role}"
            });
          }
          window.close();
        </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).send('Internal server error during Google Sign-In.');
  }
};

app.get('/api/auth/google/callback', handleGoogleCallback);
app.get('/api/auth/callback/google', handleGoogleCallback);

// --- JOBS ---

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY posted_date DESC, id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: 'Failed to retrieve jobs.' });
  }
});

// Post a new job
app.post('/api/jobs', async (req, res) => {
  const { id, title, department, location, type, salary, experience, skills, description, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO jobs (id, title, department, location, type, salary, experience, skills, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [id, title, department, location, type, salary, experience, skills, description, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Failed to create job opening.' });
  }
});

// --- CANDIDATES ---

// Get all candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
    // Map JSON fields back to objects
    const mapped = result.rows.map(row => ({
      ...row,
      appliedJobId: row.applied_job_id,
      resumeName: row.resume_name,
      skillsMatched: row.skills_matched,
      skillsMissing: row.skills_missing,
      aiScore: row.ai_score,
      aiRecommendation: row.ai_recommendation,
      matchBreakdown: row.match_breakdown,
      communicationAnalysis: row.communication_analysis,
      interviewScore: row.interview_score,
      interviewAnswers: row.interview_answers,
      chatScreeningScore: row.chat_screening_score,
      chatScreeningAnswers: row.chat_screening_answers,
      resumeQuestions: row.resume_questions,
      resumeSuggestions: row.resume_suggestions
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Get candidates error:', err);
    res.status(500).json({ error: 'Failed to retrieve candidates list.' });
  }
});

// Create/Apply candidate
app.post('/api/candidates', async (req, res) => {
  const { id, name, email, phone, appliedJobId, status, resumeName, skillsMatched, skillsMissing, aiScore, aiRecommendation, matchBreakdown } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO candidates (id, name, email, phone, applied_job_id, status, resume_name, skills_matched, skills_missing, ai_score, ai_recommendation, match_breakdown) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [id, name, email, phone, appliedJobId, status || 'applied', resumeName, skillsMatched, skillsMissing, aiScore, aiRecommendation, matchBreakdown]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add candidate error:', err);
    res.status(500).json({ error: 'Failed to submit candidate profile.' });
  }
});

// Parse resume with Gemini and create candidate
app.post('/api/candidates/parse-resume', async (req, res) => {
  const { name, email, phone, appliedJobId, fileName, fileBase64 } = req.body;
  if (!appliedJobId || !fileBase64 || !name || !email) {
    return res.status(400).json({ error: 'Missing required candidate properties or file data.' });
  }

  try {
    // 1. Fetch Job opening
    const jobRes = await pool.query('SELECT title, skills, description FROM jobs WHERE id = $1', [appliedJobId]);
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ error: 'Applied job opening not found.' });
    }
    const job = jobRes.rows[0];

    // 2. Parse base64 mime type and data
    let cleanBase64 = fileBase64;
    let mimeType = 'application/pdf';
    if (fileBase64.includes(';base64,')) {
      const parts = fileBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      cleanBase64 = parts[1];
    } else {
      if (fileName.endsWith('.docx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
    }

    let aiParsed = null;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (API_KEY) {
      try {
        const prompt = `You are an expert AI Technical Recruiter. Analyze this candidate's resume against the following job opening:
Job Title: ${job.title}
Required Skills: ${job.skills.join(', ')}
Job Description: ${job.description}

Analyze the resume and output a JSON object with the following structure:
{
  "skillsMatched": ["skill1", "skill2"],
  "skillsMissing": ["skill3"],
  "aiScore": 85,
  "aiRecommendation": "Brief summary of recommendation...",
  "matchBreakdown": {
    "skills": 85,
    "experience": 80,
    "education": 90,
    "cultural": 85
  },
  "resumeQuestions": [
    // Generate exactly 8 distinct highly-specific technical screening questions tailored to the candidate's actual projects, achievements, and work history listed on their resume.
    {
      "question": "First technical question based on their resume experience or project.",
      "skill": "Skill related to the question"
    },
    {
      "question": "Second technical question...",
      "skill": "Skill..."
    },
    {
      "question": "Third technical question...",
      "skill": "Skill..."
    },
    {
      "question": "Fourth technical question...",
      "skill": "Skill..."
    },
    {
      "question": "Fifth technical question...",
      "skill": "Skill..."
    },
    {
      "question": "Sixth technical question...",
      "skill": "Skill..."
    },
    {
      "question": "Seventh technical question...",
      "skill": "Skill..."
    },
    {
      "question": "Eighth technical question...",
      "skill": "Skill..."
    }
  ],
  "resumeSuggestions": [
    "A direct recommendation for their resume (e.g. Add keywords like React to match ATS score thresholds).",
    "Another actionable advice to improve their resume profile."
  ]
}

Ensure the output is valid JSON and only valid JSON. Do not include markdown codeblocks or any additional text.`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            aiParsed = JSON.parse(responseText.trim());
          }
        } else {
          console.warn('Gemini API returned status:', geminiRes.status);
        }
      } catch (geminiError) {
        console.error('Error invoking Gemini model:', geminiError);
      }
    }

    // 3. Fallback if Gemini failed or parsed incorrectly
    if (!aiParsed || !aiParsed.skillsMatched || !aiParsed.resumeQuestions) {
      console.log('Using simulated fallback resume analysis.');
      const jobSkills = job.skills || ['React', 'TypeScript', 'CSS'];
      const skillsMatched = jobSkills.filter(() => Math.random() > 0.3);
      const skillsMissing = jobSkills.filter(s => !skillsMatched.includes(s));
      const aiScore = Math.floor(Math.random() * 25) + 70;
      
      const recommendations = [
        `STRONG RECOMMENDATION: Candidate parsed layout indicates robust exposure in ${skillsMatched.slice(0, 2).join(' and ')}. Excellent alignments on typography and custom animations.`,
        `SUITABLE ACCENT: Good foundational match on ${skillsMatched.slice(0, 2).join(' and ')}, though further inquiries on ${skillsMissing.join(', ') || 'cultural fit'} are advised during initial screenings.`
      ];

      aiParsed = {
        skillsMatched,
        skillsMissing,
        aiScore,
        aiRecommendation: recommendations[Math.floor(Math.random() * recommendations.length)],
        matchBreakdown: {
          skills: aiScore,
          experience: Math.floor(Math.random() * 20) + 75,
          education: 85,
          cultural: Math.floor(Math.random() * 20) + 80
        },
        resumeQuestions: [
          {
            question: `Welcome to the screening. Could you detail your experience building application architectures using ${skillsMatched.slice(0, 2).join(' and ')}?`,
            skill: skillsMatched[0] || 'General'
          },
          {
            question: `How do you approach optimizing network bundle sizes, lazy-loading routes, and handling application speed constraints in modern web apps?`,
            skill: 'Optimization'
          },
          {
            question: `Tell me about a time you encountered a severe merge conflict in a shared team branch. How did you resolve the codebase delta?`,
            skill: 'Collaboration'
          },
          {
            question: `How do you ensure proper state management and data synchronization across complex nested components?`,
            skill: 'State Management'
          },
          {
            question: `What strategies do you use to secure api communication, guard against cross-site scripting (XSS), and protect cookies?`,
            skill: 'Security'
          },
          {
            question: `Explain your experience with writing automated unit or integration tests. How do you decide what percentage of coverage is sufficient?`,
            skill: 'Testing'
          },
          {
            question: `How do you configure and optimize build/bundler configurations (like Vite, Webpack, or Rollup) for staging and production deployments?`,
            skill: 'Build Systems'
          },
          {
            question: `Describe your process for debugging a difficult performance bottleneck or memory leak in a production environment.`,
            skill: 'Debugging'
          }
        ],
        resumeSuggestions: [
          `Enhance bullet points emphasizing ${skillsMatched[0] || 'engineering'} implementations.`,
          `Highlight experience details involving ${skillsMissing[0] || 'advanced state policies'} if applicable.`,
          "Ensure layout formats use a structured chronology to pass parsing models."
        ]
      };
    }

    // 4. Save Candidate to Database
    const candidateId = `cand-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO candidates (
        id, name, email, phone, applied_job_id, status, resume_name, 
        skills_matched, skills_missing, ai_score, ai_recommendation, 
        match_breakdown, resume_questions, resume_suggestions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        candidateId,
        name,
        email,
        phone,
        appliedJobId,
        'screening',
        fileName,
        aiParsed.skillsMatched,
        aiParsed.skillsMissing,
        aiParsed.aiScore,
        aiParsed.aiRecommendation,
        JSON.stringify(aiParsed.matchBreakdown),
        JSON.stringify(aiParsed.resumeQuestions),
        JSON.stringify(aiParsed.resumeSuggestions)
      ]
    );

    const saved = result.rows[0];
    const mapped = {
      ...saved,
      appliedJobId: saved.applied_job_id,
      resumeName: saved.resume_name,
      skillsMatched: saved.skills_matched,
      skillsMissing: saved.skills_missing,
      aiScore: saved.ai_score,
      aiRecommendation: saved.ai_recommendation,
      matchBreakdown: saved.match_breakdown,
      resumeQuestions: saved.resume_questions,
      resumeSuggestions: saved.resume_suggestions
    };

    await logActivity(email, `Uploaded resume and initiated AI screening for job: ${job.title}`);
    res.status(201).json(mapped);

  } catch (err) {
    console.error('Parse resume backend error:', err);
    res.status(500).json({ error: 'Server database error during resume parsing.' });
  }
});

// ==========================================
// NEW MULTI-AI COPILOT REST APIs
// ==========================================

// 1. AI Resume Bullet Enhancer
app.post('/api/ai/enhance-bullet', async (req, res) => {
  const { bullet, skill } = req.body;
  if (!bullet || !skill) {
    return res.status(400).json({ error: 'Bullet text and target skill are required.' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.json({ enhancedBullet: `Enhanced: Implemented robust ${skill} architectures, optimizing load speeds and reducing rendering cycles.` });
  }

  try {
    const prompt = `You are a professional resume writer. Enhance the following resume bullet point to highlight the candidate's achievements in the skill "${skill}". Make it high-impact, professional, and start with an active verb. Return ONLY the enhanced bullet point sentence and nothing else.
Bullet: "${bullet}"`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return res.json({ enhancedBullet: text.trim().replace(/^"|"$/g, '') });
      }
    }
    res.json({ enhancedBullet: `Leveraged ${skill} to execute production pipelines, improving performance metrics by 15%.` });
  } catch (e) {
    console.error('Enhance bullet error:', e);
    res.status(500).json({ error: 'Failed to enhance bullet.' });
  }
});

// 2. AI Job Description Generator
app.post('/api/ai/generate-jd', async (req, res) => {
  const { title, department, skills, experience, description } = req.body;
  if (!title || !department) {
    return res.status(400).json({ error: 'Job title and department are required.' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.json({ descriptionMarkdown: `### Job Description: ${title}\n- **Department**: ${department}\n- **Experience**: ${experience || '3+ years'}\n- **Required Skills**: ${skills ? skills.join(', ') : 'React'}\n\n#### Overview\nWe are looking for a qualified candidate to join our team.` });
  }

  try {
    const prompt = `You are an enterprise HR recruiter. Write a comprehensive, detailed, and beautifully structured job description in Markdown format for:
Job Title: ${title}
Department: ${department}
Experience Required: ${experience || 'Not specified'}
Target Skills: ${skills ? skills.join(', ') : 'Not specified'}
Job Context/Briefing: ${description || 'Standard requirements'}

Include sections:
1. ## Role Overview
2. ## Key Responsibilities
3. ## Technical Requirements
4. ## What We Offer (Benefits)

Return ONLY the markdown string. Do not include markdown code fence formatting (e.g. no \`\`\`markdown wrappers).`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return res.json({ descriptionMarkdown: text.trim() });
      }
    }
    res.status(500).json({ error: 'Failed to generate job description.' });
  } catch (e) {
    console.error('Generate JD error:', e);
    res.status(500).json({ error: 'Failed to generate job description.' });
  }
});

// 3. AI Candidate Fit Benchmarking & Comparison
app.post('/api/ai/compare-candidates', async (req, res) => {
  const { candidate1, candidate2 } = req.body;
  if (!candidate1 || !candidate2) {
    return res.status(400).json({ error: 'Both candidate profiles are required for comparison.' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.json({ comparisonMarkdown: `### Candidate Comparison\n- **Candidate 1**: ${candidate1.name} (Score: ${candidate1.aiScore}%)\n- **Candidate 2**: ${candidate2.name} (Score: ${candidate2.aiScore}%)\n\nBoth candidates show good technical capability.` });
  }

  try {
    const prompt = `Compare these two candidate profiles and provide a structured comparative analysis in Markdown.
Candidate 1: ${JSON.stringify(candidate1)}
Candidate 2: ${JSON.stringify(candidate2)}

Structure your report into these sections:
1. ## Technical Profile Comparison (Skills matched/missing)
2. ## Communication & Presentation Review (Pacing, tone from interview)
3. ## Pros & Cons Breakdown for each candidate
4. ## Final Recommendation (Suggest who is the better fit and explain why)

Return ONLY the markdown text. Do not wrap in backticks.`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return res.json({ comparisonMarkdown: text.trim() });
      }
    }
    res.status(500).json({ error: 'Failed to compare candidates.' });
  } catch (e) {
    console.error('Compare candidates error:', e);
    res.status(500).json({ error: 'Failed to compare candidates.' });
  }
});

// 4. AI Interview Technical Probes Generator
app.post('/api/ai/generate-questions', async (req, res) => {
  const { candidateProfile } = req.body;
  if (!candidateProfile) {
    return res.status(400).json({ error: 'Candidate profile is required.' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.json({ questionsMarkdown: `### Interview Questions for ${candidateProfile.name}\n1. Explain your experience in React and state management.\n2. Detail how you handle production bugs under time pressure.` });
  }

  try {
    const prompt = `Based on this candidate's profile, generate exactly 5 challenging, technical interview questions tailored specifically to their resume achievements.
Candidate Profile: ${JSON.stringify(candidateProfile)}

For each of the 5 questions, output:
- ### Question X: [The Question Text]
- **Goal**: [What specific resume skill or project this probes]
- **Ideal Answer Criteria**: [What concepts a strong engineering candidate should hit in their reply]

Return ONLY the markdown text, with no backticks wrapper.`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return res.json({ questionsMarkdown: text.trim() });
      }
    }
    res.status(500).json({ error: 'Failed to generate technical probes.' });
  } catch (e) {
    console.error('Generate questions error:', e);
    res.status(500).json({ error: 'Failed to generate questions.' });
  }
});

// 5. AI RAG Chatbot
app.post('/api/ai/chat', async (req, res) => {
  const { text, chatHistory } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Query text is required.' });
  }

  try {
    // Query knowledge base FAQs and blogs
    const contentRes = await pool.query('SELECT type, title, content FROM platform_content');
    const knowledgeBase = contentRes.rows;

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.json({
        responseText: "Connection to AI chatbot server offline. Using simulated response: I accrue Annual Leave at 1.16 days per month (14 days annually).",
        citations: ["Employee Handbook Sec 4.2"]
      });
    }

    const prompt = `You are a professional AI HR Assistant named Ava for AIHire Pro.
You help employees, recruiters, and managers answer questions about company policies, leave benefits, attendance regulations, or payroll.

Answer the user's question: "${text}"

Refer to the recent chat history for context:
${JSON.stringify(chatHistory || [])}

Here is the verified company policy context from the knowledge base database:
${JSON.stringify(knowledgeBase)}

Answer in a warm, professional, helpful tone. Keep your answer concise (under 3 paragraphs).
If you used information from the knowledge base context, list the titles of the sources you used as citations in your JSON response.

Return your response in a JSON object with this exact structure:
{
  "responseText": "Your detailed answer...",
  "citations": ["Title of Source 1", "Title of Source 2"]
}

Return ONLY valid JSON and nothing else.`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        return res.json(parsed);
      }
    }
    res.json({ responseText: "I'm sorry, I couldn't process your question at the moment. Can I help you with leaves or payroll?", citations: [] });
  } catch (e) {
    console.error('AI Chatbot error:', e);
    res.status(500).json({ error: 'Chatbot endpoint failed.' });
  }
});

// Update candidate status or answers
app.put('/api/candidates/:id', async (req, res) => {
  const { id } = req.params;
  const { status, interviewScore, interviewAnswers, communicationAnalysis, chatScreeningScore, chatScreeningAnswers } = req.body;

  try {
    let query = 'UPDATE candidates SET ';
    const params = [];
    let idx = 1;

    if (status !== undefined) {
      query += `status = $${idx}, `;
      params.push(status);
      idx++;
    }
    if (interviewScore !== undefined) {
      query += `interview_score = $${idx}, `;
      params.push(interviewScore);
      idx++;
    }
    if (interviewAnswers !== undefined) {
      query += `interview_answers = $${idx}, `;
      params.push(JSON.stringify(interviewAnswers));
      idx++;
    }
    if (communicationAnalysis !== undefined) {
      query += `communication_analysis = $${idx}, `;
      params.push(JSON.stringify(communicationAnalysis));
      idx++;
    }
    if (chatScreeningScore !== undefined) {
      query += `chat_screening_score = $${idx}, `;
      params.push(chatScreeningScore);
      idx++;
    }
    if (chatScreeningAnswers !== undefined) {
      query += `chat_screening_answers = $${idx}, `;
      params.push(JSON.stringify(chatScreeningAnswers));
      idx++;
    }

    // Strip trailing comma and space
    query = query.slice(0, -2);
    query += ` WHERE id = $${idx} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update candidate error:', err);
    res.status(500).json({ error: 'Failed to update candidate record.' });
  }
});

// --- LEAVE REQUESTS ---

// Get all leave requests
app.get('/api/leaves', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_requests ORDER BY requested_date DESC, id DESC');
    const mapped = result.rows.map(row => ({
      ...row,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      startDate: row.start_date.toISOString().split('T')[0],
      endDate: row.end_date.toISOString().split('T')[0],
      requestedDate: row.requested_date.toISOString().split('T')[0]
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Get leaves error:', err);
    res.status(500).json({ error: 'Failed to retrieve leave requests.' });
  }
});

// Submit leave request
app.post('/api/leaves', async (req, res) => {
  const { id, employeeId, employeeName, type, startDate, endDate, reason, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO leave_requests (id, employee_id, employee_name, type, start_date, end_date, reason, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, employeeId, employeeName, type, startDate, endDate, reason, status || 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create leave error:', err);
    res.status(500).json({ error: 'Failed to request leave.' });
  }
});

// Update leave status (Approve/Reject)
app.put('/api/leaves/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update leave error:', err);
    res.status(500).json({ error: 'Failed to resolve leave request.' });
  }
});

// --- ATTENDANCE ---

// Get all attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attendance ORDER BY date DESC, id DESC');
    const mapped = result.rows.map(row => ({
      ...row,
      date: row.date.toISOString().split('T')[0],
      checkIn: row.check_in,
      checkOut: row.check_out,
      durationHours: row.duration_hours ? parseFloat(row.duration_hours) : null
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance history.' });
  }
});

// Add check-in or clock-out
app.post('/api/attendance', async (req, res) => {
  const { id, date, checkIn, checkOut, durationHours, status } = req.body;
  try {
    // If checking out, we might want to update an existing record
    if (checkOut !== undefined) {
      const checkRecord = await pool.query('SELECT * FROM attendance WHERE date = $1 AND check_out IS NULL', [date]);
      if (checkRecord.rows.length > 0) {
        const result = await pool.query(
          'UPDATE attendance SET check_out = $1, duration_hours = $2 WHERE id = $3 RETURNING *',
          [checkOut, durationHours, checkRecord.rows[0].id]
        );
        return res.json(result.rows[0]);
      }
    }

    // Else insert new check-in record
    const result = await pool.query(
      'INSERT INTO attendance (id, date, check_in, check_out, duration_hours, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, date, checkIn, checkOut || null, durationHours || null, status || 'Present']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Attendance mutation error:', err);
    res.status(500).json({ error: 'Failed to process clock-in/out trigger.' });
  }
});

// --- NOTIFICATIONS ---

// Get notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// Mark all as read
app.put('/api/notifications/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = TRUE');
    res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    console.error('Mark read notifications error:', err);
    res.status(500).json({ error: 'Failed to resolve read statuses.' });
  }
});

// Add notification
app.post('/api/notifications', async (req, res) => {
  const { id, text, time } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO notifications (id, text, time, read) VALUES ($1, $2, $3, FALSE) RETURNING *',
      [id, text, time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Failed to post notification.' });
  }
});


// ==========================================
// ADMIN CONTROL PANEL REST APIs
// ==========================================

// Get all users in the system
app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get admin users error:', err);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// Update user details
app.put('/api/admin/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role, status',
      [name, email, role, id]
    );
    await logActivity('admin@aihirepro.com', `Admin updated user details for user ID ${id} (${email})`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// Suspend/Activate/Approve user account
app.put('/api/admin/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active', 'suspended', 'pending'
  try {
    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, role, status',
      [status, id]
    );
    if (result.rows.length > 0) {
      await logActivity('admin@aihirepro.com', `Admin changed user status of ${result.rows[0].email} to: ${status}`);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// Delete user account
app.delete('/api/admin/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
    if (userResult.rows.length > 0) {
      const email = userResult.rows[0].email;
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      await logActivity('admin@aihirepro.com', `Admin deleted user account: ${email}`);
      res.json({ message: 'User deleted successfully.' });
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Update job status
app.put('/api/admin/jobs/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    await logActivity('admin@aihirepro.com', `Admin changed job ${id} status to: ${status}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update job status error:', err);
    res.status(500).json({ error: 'Failed to update job status.' });
  }
});

// Toggle job featured status
app.put('/api/admin/jobs/:id/featured', async (req, res) => {
  const { id } = req.params;
  const { featured } = req.body;
  try {
    const result = await pool.query(
      'UPDATE jobs SET featured = $1 WHERE id = $2 RETURNING *',
      [featured, id]
    );
    await logActivity('admin@aihirepro.com', `Admin toggled featured status of job ${id} to: ${featured}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle job featured error:', err);
    res.status(500).json({ error: 'Failed to toggle featured job state.' });
  }
});

// Delete inappropriate job postings
app.delete('/api/admin/jobs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
    await logActivity('admin@aihirepro.com', `Admin deleted job posting: ${id}`);
    res.json({ message: 'Job deleted successfully.' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Failed to delete job posting.' });
  }
});

// Fetch recent activity logs
app.get('/api/admin/logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Get activity logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve activity logs.' });
  }
});

// Fetch system analytics
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const usersCount = await pool.query('SELECT role, status, COUNT(*) FROM users GROUP BY role, status');
    const jobsCount = await pool.query('SELECT status, COUNT(*) FROM jobs GROUP BY status');
    const candidatesCount = await pool.query('SELECT status, COUNT(*) FROM candidates GROUP BY status');
    const activityCount = await pool.query('SELECT COUNT(*) FROM activity_logs');
    
    res.json({
      users: usersCount.rows,
      jobs: jobsCount.rows,
      candidates: candidatesCount.rows,
      activityTotal: parseInt(activityCount.rows[0].count)
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch platform metrics.' });
  }
});

// Fetch platform content FAQs & blogs
app.get('/api/admin/content', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM platform_content ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get content error:', err);
    res.status(500).json({ error: 'Failed to retrieve content.' });
  }
});

// Add new platform content
app.post('/api/admin/content', async (req, res) => {
  const { type, title, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO platform_content (type, title, content) VALUES ($1, $2, $3) RETURNING *',
      [type, title, content]
    );
    await logActivity('admin@aihirepro.com', `Admin added content of type ${type}: ${title}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create content error:', err);
    res.status(500).json({ error: 'Failed to publish content.' });
  }
});


// Serve static frontend build files in production (non-Vercel only)
if (process.env.VERCEL !== '1') {
  app.use(express.static(path.join(__dirname, 'dist')));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start Express Listener (only in local dev, not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`AIHire Pro API Server is running on port ${PORT}`);
  });
}

export default app;
