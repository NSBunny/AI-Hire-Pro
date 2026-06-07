import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Initial mock data matching the seeds in server.js
const initialData = {
  users: [
    { id: 1, name: 'Rohan Sharma', email: 'rohan.sharma@example.com', password: 'mockpassword123', role: 'candidate', status: 'active', created_at: new Date().toISOString() },
    { id: 2, name: 'Sarah Jenkins', email: 'recruiter@aihirepro.com', password: 'mockpassword123', role: 'recruiter', status: 'active', created_at: new Date().toISOString() },
    { id: 3, name: 'Alex Rivera', email: 'manager@aihirepro.com', password: 'mockpassword123', role: 'manager', status: 'active', created_at: new Date().toISOString() },
    { id: 4, name: 'Jane Doe', email: 'jane.doe@company.com', password: 'mockpassword123', role: 'employee', status: 'active', created_at: new Date().toISOString() },
    { id: 5, name: 'Admin User', email: 'admin@aihirepro.com', password: 'mockpassword123', role: 'admin', status: 'active', created_at: new Date().toISOString() }
  ],
  jobs: [
    { id: 'job-1', title: 'Senior Frontend Developer', department: 'Engineering', location: 'Bangalore, India', type: 'Full-time', salary: '₹18 - ₹25 LPA', experience: '3-5 years', skills: ['React', 'TypeScript', 'CSS Flexbox/Grid', 'Vite', 'Next.js', 'State Management'], description: 'We are looking for a Senior Frontend Developer to lead our client-side development.', status: 'active', posted_date: '2026-05-30', featured: false },
    { id: 'job-2', title: 'Senior HR Tech Consultant', department: 'Human Resources', location: 'Remote', type: 'Full-time', salary: '₹15 - ₹22 LPA', experience: '5+ years', skills: ['HRMS Solutions', 'Workday Integrations', 'Stakeholder Management', 'Payroll Architecture'], description: 'Lead client integrations and configure enterprise human resource management modules.', status: 'active', posted_date: '2026-06-01', featured: false },
    { id: 'job-3', title: 'Python Backend & AI Engineer', department: 'AI & Data Science', location: 'Bangalore, India', type: 'Full-time', salary: '₹22 - ₹30 LPA', experience: '4-7 years', skills: ['Python', 'FastAPI', 'Gemini Flash SDK', 'Pinecone Vector DB', 'RAG Implementations'], description: 'Build core AI pipelines for resume ingestion, semantic profile matching, and audio transcripts.', status: 'active', posted_date: '2026-05-28', featured: false },
    { id: 'job-4', title: 'UI/UX Interface Designer', department: 'Product Design', location: 'Remote', type: 'Contract', salary: '₹12 - ₹16 LPA equivalent', experience: '2-4 years', skills: ['Figma', 'Typography Scale', 'Glassmorphism Design', 'Design Systems', 'Micro-interactions'], description: 'Shape the next generation visual experience of AIHire Pro.', status: 'draft', posted_date: '2026-06-02', featured: false }
  ],
  candidates: [
    { id: 'cand-1', name: 'Aishwarya Sen', email: 'aishwarya.sen@example.com', phone: '+91 98765 43210', applied_job_id: 'job-1', status: 'screening', resume_name: 'Aishwarya_Resume_Frontend.pdf', skills_matched: ['React', 'TypeScript', 'CSS Flexbox/Grid', 'Next.js'], skills_missing: ['Vite', 'State Management'], ai_score: 84, ai_recommendation: 'STRONG FIT: Candidate exhibits solid React and TypeScript skills.', match_breakdown: { skills: 85, experience: 80, education: 90, cultural: 85 }, communication_analysis: { pace: 'Good (125 wpm)', fillerWords: ['uh', 'like'], tone: 'Confident & Structural', clarity: 88 } },
    { id: 'cand-2', name: 'Rohan Sharma', email: 'rohan.sharma@example.com', phone: '+91 87654 32109', applied_job_id: 'job-1', status: 'interviewing', resume_name: 'Rohan_Senior_Frontend.pdf', skills_matched: ['React', 'TypeScript', 'Vite', 'Next.js', 'State Management', 'CSS Flexbox/Grid'], skills_missing: [], ai_score: 96, ai_recommendation: 'EXCEPTIONAL FIT: Fits all required technical profiles perfectly.', match_breakdown: { skills: 100, experience: 95, education: 90, cultural: 98 }, communication_analysis: { pace: 'Excellent (135 wpm)', fillerWords: ['so'], tone: 'Collaborative & Articulate', clarity: 95 }, interview_score: 92, interview_answers: [
      { question: 'Explain how you optimize a slow React application.', answer: 'I start by profiling using Chrome DevTools. I look for unnecessary re-renders and apply memoization with useMemo or useCallback. I also implement code-splitting using React.lazy, lazy-load heavy assets, and optimize CSS bundle deliveries.', score: 95, feedback: 'Very detailed explanation covering profiling, re-renders, React APIs, and network optimizations.' },
      { question: 'What is your approach to maintaining custom UI design systems.', answer: 'I prefer using native CSS custom properties for spacing, colors, and transitions, mapped to semantic component parameters. This ensures consistency and simplifies toggling themes like dark mode in a clean manner without extra libraries.', score: 90, feedback: 'Strong alignment with our custom vanilla-CSS architectural guideline.' }
    ] },
    { id: 'cand-3', name: 'Vikram Mehta', email: 'vikram.mehta@example.com', phone: '+91 76543 21098', applied_job_id: 'job-3', status: 'applied', resume_name: 'Vikram_AI_Engineer.docx', skills_matched: ['Python', 'FastAPI', 'Gemini Flash SDK'], skills_missing: ['Pinecone Vector DB', 'RAG Implementations'], ai_score: 68, ai_recommendation: 'BORDERLINE FIT: Moderate Python capability but lacks direct experience.', match_breakdown: { skills: 60, experience: 70, education: 80, cultural: 72 } }
  ],
  leave_requests: [
    { id: 'leave-1', employee_id: 'emp-101', employee_name: 'Jane Doe (Current User)', type: 'Annual', start_date: '2026-06-15', end_date: '2026-06-18', reason: 'Family vacation trip', status: 'Pending', requested_date: '2026-06-01' },
    { id: 'leave-2', employee_id: 'emp-102', employee_name: 'Rahul Kumar', type: 'Sick', start_date: '2026-05-25', end_date: '2026-05-26', reason: 'Severe seasonal flu', status: 'Approved', requested_date: '2026-05-24' }
  ],
  attendance: [
    { id: 'att-1', date: '2026-06-02', check_in: '09:12 AM', check_out: null, duration_hours: null, status: 'Present' },
    { id: 'att-2', date: '2026-06-01', check_in: '08:58 AM', check_out: '05:30 PM', duration_hours: 8.53, status: 'Present' },
    { id: 'att-3', date: '2026-05-29', check_in: '09:35 AM', check_out: '05:00 PM', duration_hours: 7.42, status: 'Late' },
    { id: 'att-4', date: '2026-05-28', check_in: '09:05 AM', check_out: '06:05 PM', duration_hours: 9.00, status: 'Present' }
  ],
  notifications: [
    { id: 'n-1', text: 'New candidate Rohan Sharma applied for Senior Frontend Developer.', time: '2 hours ago', read: false },
    { id: 'n-2', text: 'Your leave request for June 15th is currently pending manager approval.', time: '1 day ago', read: false },
    { id: 'n-3', text: 'AI screening report generated for candidate Aishwarya Sen.', time: '1 day ago', read: true }
  ],
  platform_content: [
    { id: 1, type: 'faq', title: 'How does AI Resume Ingestion work?', content: 'Our platform parses uploaded PDF and DOCX resumes, extracting key skills, match scores, and communication indicators via custom Gemini LLM schemas in real-time.', created_at: new Date().toISOString() },
    { id: 2, type: 'faq', title: 'Is candidate information secure?', content: 'Yes. All candidate profiles, voice answers transcripts, and company configurations are fully secured in an enterprise Neon database over SSL/TLS.', created_at: new Date().toISOString() },
    { id: 3, type: 'blog', title: 'Best Practices for Virtual Audits', content: 'Automation in virtual audits ensures compliance, tracks check-in coordinates, and simplifies team leave ledger distributions without manual email loops.', created_at: new Date().toISOString() },
    { id: 4, type: 'blog', title: 'Leveraging Voice Analytics in Candidate Funnels', content: 'Measuring tone, filler words, and technical depth through automated simulations reduces screening backlogs by up to 64% in engineering roles.', created_at: new Date().toISOString() }
  ],
  activity_logs: []
};

// JSON Database Helper
const getData = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading JSON DB, resetting to defaults:', err);
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
};

const saveData = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Helper to convert date strings to Date objects for compatibility
const mapDates = (row, dateFields) => {
  if (!row) return row;
  const mapped = { ...row };
  for (const field of dateFields) {
    if (mapped[field]) {
      mapped[field] = new Date(mapped[field]);
    }
  }
  return mapped;
};

class MockClient {
  release() {
    // No-op
  }
  async query(sql, params = []) {
    const data = getData();
    const sqlClean = sql.trim().replace(/\s+/g, ' ');

    // 1. Transaction queries
    if (sqlClean.match(/^(BEGIN|COMMIT|ROLLBACK)$/i)) {
      return { rows: [], rowCount: 0 };
    }

    // 2. Schema / DB creation queries
    if (sqlClean.match(/^(CREATE TABLE|ALTER TABLE|CREATE INDEX)/i)) {
      return { rows: [], rowCount: 0 };
    }

    // 3. Table row counts
    if (sqlClean.match(/^SELECT COUNT\(\*\) FROM (\w+)/i)) {
      const match = sqlClean.match(/^SELECT COUNT\(\*\) FROM (\w+)/i);
      const tableName = match[1].toLowerCase();
      const count = data[tableName] ? data[tableName].length : 0;
      return { rows: [{ count: count.toString() }] };
    }

    // 4. Activity Logs table
    if (sqlClean.startsWith('INSERT INTO activity_logs')) {
      const [user_email, action] = params;
      const newLog = {
        id: data.activity_logs.length + 1,
        user_email: user_email || 'system',
        action,
        created_at: new Date().toISOString()
      };
      data.activity_logs.push(newLog);
      saveData(data);
      return { rows: [mapDates(newLog, ['created_at'])], rowCount: 1 };
    }
    if (sqlClean.includes('FROM activity_logs')) {
      const sorted = [...data.activity_logs]
        .sort((a, b) => b.id - a.id)
        .slice(0, 100)
        .map(r => mapDates(r, ['created_at']));
      return { rows: sorted };
    }

    // 5. Users table
    if (sqlClean.includes('FROM users')) {
      if (sqlClean.includes('email = $1')) {
        const email = params[0];
        const user = data.users.find(u => u.email === email);
        return { rows: user ? [mapDates(user, ['created_at'])] : [] };
      }
      const sorted = [...data.users]
        .sort((a, b) => b.id - a.id)
        .map(r => mapDates(r, ['created_at']));
      return { rows: sorted };
    }
    if (sqlClean.startsWith('INSERT INTO users')) {
      const [name, email, password, role] = params;
      const newUser = {
        id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
        name,
        email,
        password,
        role,
        status: 'active',
        created_at: new Date().toISOString()
      };
      data.users.push(newUser);
      saveData(data);
      return { rows: [mapDates(newUser, ['created_at'])], rowCount: 1 };
    }
    if (sqlClean.startsWith('UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4')) {
      const [name, email, role, id] = params;
      const user = data.users.find(u => u.id === parseInt(id));
      if (user) {
        user.name = name;
        user.email = email;
        user.role = role;
        saveData(data);
      }
      return { rows: [mapDates(user, ['created_at'])], rowCount: user ? 1 : 0 };
    }
    if (sqlClean.startsWith('UPDATE users SET status = $1 WHERE id = $2')) {
      const [status, id] = params;
      const user = data.users.find(u => u.id === parseInt(id));
      if (user) {
        user.status = status;
        saveData(data);
      }
      return { rows: [mapDates(user, ['created_at'])], rowCount: user ? 1 : 0 };
    }
    if (sqlClean.startsWith('DELETE FROM users WHERE id = $1')) {
      const [id] = params;
      const initialLength = data.users.length;
      data.users = data.users.filter(u => u.id !== parseInt(id));
      saveData(data);
      return { rowCount: initialLength - data.users.length };
    }

    // 6. Jobs table
    if (sqlClean.includes('FROM jobs')) {
      if (sqlClean.includes('WHERE id = $1')) {
        const id = params[0];
        const job = data.jobs.find(j => j.id === id);
        return { rows: job ? [job] : [] };
      }
      const sorted = [...data.jobs].sort((a, b) => b.posted_date.localeCompare(a.posted_date));
      return { rows: sorted };
    }
    if (sqlClean.startsWith('INSERT INTO jobs')) {
      const [id, title, department, location, type, salary, experience, skills, description, status] = params;
      const newJob = {
        id,
        title,
        department,
        location,
        type,
        salary,
        experience,
        skills,
        description,
        status: status || 'active',
        posted_date: new Date().toISOString().split('T')[0],
        featured: false
      };
      data.jobs.push(newJob);
      saveData(data);
      return { rows: [newJob], rowCount: 1 };
    }
    if (sqlClean.startsWith('UPDATE jobs SET status = $1 WHERE id = $2')) {
      const [status, id] = params;
      const job = data.jobs.find(j => j.id === id);
      if (job) {
        job.status = status;
        saveData(data);
      }
      return { rows: [job], rowCount: job ? 1 : 0 };
    }
    if (sqlClean.startsWith('UPDATE jobs SET featured = $1 WHERE id = $2')) {
      const [featured, id] = params;
      const job = data.jobs.find(j => j.id === id);
      if (job) {
        job.featured = featured;
        saveData(data);
      }
      return { rows: [job], rowCount: job ? 1 : 0 };
    }
    if (sqlClean.startsWith('DELETE FROM jobs WHERE id = $1')) {
      const [id] = params;
      const initialLength = data.jobs.length;
      data.jobs = data.jobs.filter(j => j.id !== id);
      saveData(data);
      return { rowCount: initialLength - data.jobs.length };
    }

    // 7. Candidates table
    if (sqlClean.includes('FROM candidates')) {
      const sorted = [...data.candidates].sort((a, b) => b.id.localeCompare(a.id));
      return { rows: sorted };
    }
    if (sqlClean.startsWith('INSERT INTO candidates')) {
      const candidateObj = {};
      if (sqlClean.includes('resume_questions')) {
        const [id, name, email, phone, applied_job_id, status, resume_name, skills_matched, skills_missing, ai_score, ai_recommendation, match_breakdown, resume_questions, resume_suggestions] = params;
        Object.assign(candidateObj, {
          id, name, email, phone, applied_job_id, status, resume_name,
          skills_matched, skills_missing, ai_score, ai_recommendation,
          match_breakdown: typeof match_breakdown === 'string' ? JSON.parse(match_breakdown) : match_breakdown,
          resume_questions: typeof resume_questions === 'string' ? JSON.parse(resume_questions) : resume_questions,
          resume_suggestions: typeof resume_suggestions === 'string' ? JSON.parse(resume_suggestions) : resume_suggestions
        });
      } else {
        const [id, name, email, phone, applied_job_id, status, resume_name, skills_matched, skills_missing, ai_score, ai_recommendation, match_breakdown] = params;
        Object.assign(candidateObj, {
          id, name, email, phone, applied_job_id, status, resume_name,
          skills_matched, skills_missing, ai_score, ai_recommendation,
          match_breakdown: typeof match_breakdown === 'string' ? JSON.parse(match_breakdown) : match_breakdown
        });
      }
      data.candidates.push(candidateObj);
      saveData(data);
      return { rows: [candidateObj], rowCount: 1 };
    }
    if (sqlClean.startsWith('UPDATE candidates SET')) {
      const id = params[params.length - 1];
      const candidate = data.candidates.find(c => c.id === id);
      if (candidate) {
        if (sqlClean.includes('status =')) {
          const idx = sqlClean.split(',').findIndex(part => part.includes('status ='));
          if (idx !== -1) candidate.status = params[idx];
        }
        if (sqlClean.includes('interview_score =')) {
          const parts = sqlClean.split(',');
          const idx = parts.findIndex(part => part.includes('interview_score ='));
          if (idx !== -1) candidate.interview_score = params[idx];
        }
        if (sqlClean.includes('interview_answers =')) {
          const parts = sqlClean.split(',');
          const idx = parts.findIndex(part => part.includes('interview_answers ='));
          if (idx !== -1) candidate.interview_answers = typeof params[idx] === 'string' ? JSON.parse(params[idx]) : params[idx];
        }
        if (sqlClean.includes('communication_analysis =')) {
          const parts = sqlClean.split(',');
          const idx = parts.findIndex(part => part.includes('communication_analysis ='));
          if (idx !== -1) candidate.communication_analysis = typeof params[idx] === 'string' ? JSON.parse(params[idx]) : params[idx];
        }
        if (sqlClean.includes('chat_screening_score =')) {
          const parts = sqlClean.split(',');
          const idx = parts.findIndex(part => part.includes('chat_screening_score ='));
          if (idx !== -1) candidate.chat_screening_score = params[idx];
        }
        if (sqlClean.includes('chat_screening_answers =')) {
          const parts = sqlClean.split(',');
          const idx = parts.findIndex(part => part.includes('chat_screening_answers ='));
          if (idx !== -1) candidate.chat_screening_answers = typeof params[idx] === 'string' ? JSON.parse(params[idx]) : params[idx];
        }
        saveData(data);
      }
      return { rows: [candidate], rowCount: candidate ? 1 : 0 };
    }

    // 8. Leave Requests table
    if (sqlClean.includes('FROM leave_requests')) {
      const sorted = [...data.leave_requests]
        .sort((a, b) => b.id.localeCompare(a.id))
        .map(r => mapDates(r, ['start_date', 'end_date', 'requested_date']));
      return { rows: sorted };
    }
    if (sqlClean.startsWith('INSERT INTO leave_requests')) {
      const [id, employee_id, employee_name, type, start_date, end_date, reason, status] = params;
      const newLeave = {
        id,
        employee_id,
        employee_name,
        type,
        start_date,
        end_date,
        reason,
        status: status || 'Pending',
        requested_date: new Date().toISOString().split('T')[0]
      };
      data.leave_requests.push(newLeave);
      saveData(data);
      return { rows: [mapDates(newLeave, ['start_date', 'end_date', 'requested_date'])], rowCount: 1 };
    }
    if (sqlClean.startsWith('UPDATE leave_requests SET status = $1 WHERE id = $2')) {
      const [status, id] = params;
      const leave = data.leave_requests.find(l => l.id === id);
      if (leave) {
        leave.status = status;
        saveData(data);
      }
      return { rows: [mapDates(leave, ['start_date', 'end_date', 'requested_date'])], rowCount: leave ? 1 : 0 };
    }

    // 9. Attendance table
    if (sqlClean.includes('FROM attendance')) {
      if (sqlClean.includes('WHERE date = $1 AND check_out IS NULL')) {
        const date = params[0];
        const record = data.attendance.find(a => a.date === date && a.check_out === null);
        return { rows: record ? [mapDates(record, ['date'])] : [] };
      }
      const sorted = [...data.attendance]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(r => mapDates(r, ['date']));
      return { rows: sorted };
    }
    if (sqlClean.startsWith('UPDATE attendance SET check_out = $1, duration_hours = $2 WHERE id = $3')) {
      const [check_out, duration_hours, id] = params;
      const record = data.attendance.find(a => a.id === id);
      if (record) {
        record.check_out = check_out;
        record.duration_hours = parseFloat(duration_hours);
        saveData(data);
      }
      return { rows: [mapDates(record, ['date'])], rowCount: record ? 1 : 0 };
    }
    if (sqlClean.startsWith('INSERT INTO attendance')) {
      const [id, date, check_in, check_out, duration_hours, status] = params;
      const newRecord = {
        id,
        date,
        check_in,
        check_out: check_out || null,
        duration_hours: duration_hours ? parseFloat(duration_hours) : null,
        status: status || 'Present'
      };
      data.attendance.push(newRecord);
      saveData(data);
      return { rows: [mapDates(newRecord, ['date'])], rowCount: 1 };
    }

    // 10. Notifications table
    if (sqlClean.includes('FROM notifications')) {
      const sorted = [...data.notifications].sort((a, b) => b.id.localeCompare(a.id));
      return { rows: sorted };
    }
    if (sqlClean.startsWith('UPDATE notifications SET read = TRUE')) {
      data.notifications.forEach(n => n.read = true);
      saveData(data);
      return { rowCount: data.notifications.length };
    }
    if (sqlClean.startsWith('INSERT INTO notifications')) {
      const [id, text, time] = params;
      const newNotif = {
        id,
        text,
        time,
        read: false
      };
      data.notifications.push(newNotif);
      saveData(data);
      return { rows: [newNotif], rowCount: 1 };
    }

    // 11. Platform Content table
    if (sqlClean.includes('FROM platform_content')) {
      const sorted = [...data.platform_content]
        .sort((a, b) => b.id - a.id)
        .map(r => mapDates(r, ['created_at']));
      return { rows: sorted };
    }
    if (sqlClean.startsWith('INSERT INTO platform_content')) {
      const [type, title, content] = params;
      const newContent = {
        id: data.platform_content.length + 1,
        type,
        title,
        content,
        created_at: new Date().toISOString()
      };
      data.platform_content.push(newContent);
      saveData(data);
      return { rows: [mapDates(newContent, ['created_at'])], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  }
}

class MockPool {
  async connect() {
    return new MockClient();
  }
  async query(sql, params) {
    const client = new MockClient();
    return client.query(sql, params);
  }
  on(event, callback) {
    // No-op for event listeners
  }
}

let pool;

if (DATABASE_URL) {
  console.log('Database configuration found. Using live Neon PostgreSQL connection pool.');
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });

  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle live client:', err);
  });
} else {
  console.log('No database configuration found. Initializing local JSON database fallback (db.json).');
  pool = new MockPool();
}

export { pool };
