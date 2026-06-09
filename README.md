# AIHire Pro — AI-Powered HRMS Platform

> **Hire Smarter. Manage Better. Grow Faster.**
> Built for FWC Hackathon 2.0 by Amritdeep Kaur & G. Banidhar

---

## 🧠 What is AIHire Pro?

AIHire Pro is a full-stack, AI-native Human Resource Management System that automates the entire HR pipeline — from job posting to employee management — powered by Google Gemini AI.

It supports **5 user roles** on a single platform: Candidate, HR Recruiter, Manager, Employee, and Admin — each with a fully personalised dashboard.

---

## ✨ Key Features

### AI-Powered
- **Resume Screening** — Gemini AI scores resumes 0–100 across Skills, Experience, Education & Cultural Fit with a natural language recommendation
- **Ava — AI Chat Screener** — structured multi-turn interviews with dynamically generated questions per job; supports real-time voice input via Web Speech API
- **Voice Interview Simulator** — candidate answers verbally; live transcription, filler word detection, speech pace analysis, and Clarity Score (0–100)
- **JD Generator** — auto-generate complete job descriptions from a title and skill set
- **Candidate Comparison** — side-by-side AI analysis of two candidates with a final recommendation
- **HR Assistant Chatbot** — role-aware floating chatbot on every page; supports session history and fallback responses

### Platform
- **Multi-Role Dashboards** — one login, five role-specific experiences
- **HR Recruiter** — Kanban pipeline (Applied → Screening → Interviewing → Offered/Rejected), AI scores, transcripts, re-screening
- **Manager** — leave approvals, team performance scoring, AI appraisal recommendations
- **Employee Portal** — attendance clock-in/out, monthly payslips, leave requests with real-time balance
- **Admin Control Center** — user management, job moderation, activity logs, broadcast notifications, platform analytics

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon Cloud) |
| AI | Google Gemini AI API |
| Auth | Email/Password + Google OAuth 2.0 |
| Voice | Web Speech API |
| State | React Context API |

---

## 🗄️ Database Schema

8 tables: `users` · `jobs` · `candidates` · `leave_requests` · `attendance` · `notifications` · `platform_content` · `activity_logs`

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL database (or a [Neon](https://neon.tech) cloud instance)
- Google Gemini API key
- Google OAuth credentials (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/aihire-pro.git
cd aihire-pro

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see below)

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=your_neon_postgresql_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
SESSION_SECRET=your_session_secret
PORT=3000
```

### Running the App

```bash
# Run frontend + backend together
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app runs on `http://localhost:3000` by default.

---

## 👥 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@aihirepro.com | admin123 |
| HR Recruiter | hr@aihirepro.com | hr123 |
| Manager | manager@aihirepro.com | manager123 |
| Employee | employee@aihirepro.com | employee123 |
| Candidate | candidate@aihirepro.com | candidate123 |

---

## 📁 Project Structure

```
aihire-pro/
├── server.js                  # Express backend — all API routes
├── stress_test.js             # Concurrent load testing (5000+ users)
├── src/
│   ├── context/
│   │   └── AppContext.tsx     # Global state for all 5 roles
│   ├── components/
│   │   ├── shared/            # Button, Badge, Card, Input, Modal, Chart
│   │   ├── layout/            # AppLayout, Sidebar
│   │   └── chatbot/           # HRChatbot
│   └── pages/
│       ├── auth/              # Login
│       ├── candidate/         # Dashboard, JobSearch, AIChatScreening, AIInterviewSimulator
│       ├── hr/                # HRDashboard, ResumeScreening, JobPosting, ManagerDashboard
│       ├── employee/          # EmployeeDashboard
│       └── admin/             # AdminDashboard
└── dist/                      # Production build output
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/signup` | User registration |
| GET | `/api/auth/google` | Google OAuth |

### AI (Gemini)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/candidates/parse-resume` | Resume parsing + Fit Score |
| POST | `/api/ai/generate-jd` | Job description generation |
| POST | `/api/ai/compare-candidates` | Side-by-side candidate comparison |
| POST | `/api/ai/generate-questions` | Interview question generation |
| POST | `/api/ai/enhance-bullet` | Resume bullet enhancement |
| POST | `/api/ai/chat` | HR Assistant chatbot |

### Core
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/jobs` | Job listings |
| GET/POST/PUT | `/api/candidates` | Candidate management |
| GET/POST/PUT | `/api/leaves` | Leave requests |
| GET/POST | `/api/attendance` | Attendance records |
| GET/POST/PUT | `/api/notifications` | Notifications |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET/PUT/DELETE | `/api/admin/users` | User management |
| PUT/DELETE | `/api/admin/jobs/:id` | Job moderation |
| GET | `/api/admin/logs` | Activity logs |
| GET | `/api/admin/analytics` | Platform analytics |

---

## 👩‍💻 Team

| Member | Role | Contributions |
|---|---|---|
| **Amritdeep Kaur** | Frontend Developer | React UI/UX, AppContext, Candidate modules, Ava AI Chat, Voice Interview Simulator, Web Speech API, Shared component library, Dark/Light theming |
| **G. Banidhar** | Backend Developer | Express.js server, 30+ REST APIs, 6 Gemini AI integrations, PostgreSQL schema, Google OAuth, Admin Dashboard, Stress testing |

---

## 📄 License

This project was built for FWC Hackathon 2.0. All rights reserved by the authors.
