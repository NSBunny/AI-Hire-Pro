import React, { createContext, useContext, useState, useEffect } from 'react';

// ==========================================
// INTERFACES & TYPES
// ==========================================
export type UserRole = 'candidate' | 'recruiter' | 'manager' | 'employee' | 'admin';
export type Theme = 'light' | 'dark';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string; // "Full-time" | "Remote" | "Contract"
  salary: string;
  experience: string;
  skills: string[];
  description: string;
  status: 'active' | 'draft' | 'closed';
  postedDate: string;
  featured?: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  appliedJobId: string;
  status: 'applied' | 'screening' | 'interviewing' | 'offered' | 'rejected';
  resumeName: string;
  skillsMatched: string[];
  skillsMissing: string[];
  aiScore: number;
  aiRecommendation: string;
  matchBreakdown: {
    skills: number;
    experience: number;
    education: number;
    cultural: number;
  };
  communicationAnalysis?: {
    pace: string; // "Good (130 wpm)"
    fillerWords: string[]; // ["um", "like"]
    tone: string; // "Professional & Collaborative"
    clarity: number; // 0-100
  };
  interviewScore?: number;
  interviewAnswers?: { question: string; answer: string; score: number; feedback: string }[];
  chatScreeningScore?: number;
  chatScreeningAnswers?: { question: string; answer: string; score: number }[];
  resumeQuestions?: { question: string; skill: string }[];
  resumeSuggestions?: string[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Sick' | 'Casual' | 'Annual' | 'Maternity/Paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedDate: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  durationHours: number | null;
  status: 'Present' | 'Late' | 'Absent' | 'Half-day';
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  basic: number;
  allowances: number;
  deductions: number;
  net: number;
  status: 'Paid' | 'Processing' | 'Hold';
  issuedDate: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  citations?: string[];
}

interface AppContextProps {
  currentUser: { id: number; name: string; email: string; role: UserRole } | null;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  login: (role: UserRole, userDetails?: { id: number; name: string; email: string; role: UserRole }) => void;
  logout: () => void;
  theme: Theme;
  toggleTheme: () => void;
  
  // Data lists
  jobs: Job[];
  candidates: Candidate[];
  leaveRequests: LeaveRequest[];
  attendance: AttendanceRecord[];
  payslips: Payslip[];
  chatHistory: ChatMessage[];
  
  // Stats
  leaveBalances: { Sick: number; Casual: number; Annual: number };
  notifications: { id: string; text: string; time: string; read: boolean }[];
  
  // Mutators / Simulators
  addJob: (job: Omit<Job, 'id' | 'postedDate' | 'status'> & { status?: 'active' | 'draft' | 'closed' }) => void;
  uploadResume: (file: File, jobId: string, metadata?: { name: string; email: string; phone: string }) => Promise<Candidate>;
  applyForJob: (candidateData: Omit<Candidate, 'id' | 'aiScore' | 'aiRecommendation' | 'matchBreakdown' | 'status' | 'skillsMatched' | 'skillsMissing'>) => void;
  updateCandidateStatus: (id: string, status: Candidate['status']) => void;
  submitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'status' | 'requestedDate'>) => void;
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected') => void;
  clockIn: () => void;
  clockOut: () => void;
  sendChatMessage: (text: string) => void;
  clearChat: () => void;
  submitInterviewAnswers: (candidateId: string, answers: { question: string; answer: string; score: number; feedback: string }[], score: number) => void;
  submitChatScreeningAnswers: (candidateId: string, answers: { question: string; answer: string; score: number }[], score: number) => void;
  markNotificationsAsRead: () => void;

  // Admin properties
  adminUsers: { id: number; name: string; email: string; role: UserRole; status: string; created_at: string }[];
  activityLogs: { id: number; user_email: string; action: string; created_at: string }[];
  adminAnalytics: any;
  platformContent: { id: number; type: string; title: string; content: string; created_at: string }[];
  updateUserStatus: (id: number, status: string) => Promise<void>;
  updateUserRole: (id: number, role: UserRole) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  updateJobStatusByAdmin: (id: string, status: 'active' | 'draft' | 'closed') => Promise<void>;
  updateJobFeatured: (id: string, featured: boolean) => Promise<void>;
  deleteJobByAdmin: (id: string) => Promise<void>;
  sendBroadcastNotification: (text: string) => Promise<void>;
  createContentItem: (type: string, title: string, content: string) => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// ==========================================
// SEED MOCK DATA
// ==========================================
const initialJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Bangalore, India',
    type: 'Full-time',
    salary: '₹18 - ₹25 LPA',
    experience: '3-5 years',
    skills: ['React', 'TypeScript', 'CSS Flexbox/Grid', 'Vite', 'Next.js', 'State Management'],
    description: 'We are looking for a Senior Frontend Developer to lead our client-side development. You will build highly responsive UI components, maintain our custom design system, and implement state management policies.',
    status: 'active',
    postedDate: '2026-05-30'
  },
  {
    id: 'job-2',
    title: 'Senior HR Tech Consultant',
    department: 'Human Resources',
    location: 'Remote',
    type: 'Full-time',
    salary: '₹15 - ₹22 LPA',
    experience: '5+ years',
    skills: ['HRMS Solutions', 'Workday Integrations', 'Stakeholder Management', 'Payroll Architecture'],
    description: 'Lead client integrations and configure enterprise human resource management modules. You will analyze recruitment pipeline metrics, leave approvals, and employee performance workflows.',
    status: 'active',
    postedDate: '2026-06-01'
  },
  {
    id: 'job-3',
    title: 'Python Backend & AI Engineer',
    department: 'AI & Data Science',
    location: 'Bangalore, India',
    type: 'Full-time',
    salary: '₹22 - ₹30 LPA',
    experience: '4-7 years',
    skills: ['Python', 'FastAPI', 'Gemini Flash SDK', 'Pinecone Vector DB', 'RAG Implementations'],
    description: 'Build core AI pipelines for resume ingestion, semantic profile matching, and audio transcripts parsing. You will help construct high-performance backend microservices.',
    status: 'active',
    postedDate: '2026-05-28'
  },
  {
    id: 'job-4',
    title: 'UI/UX Interface Designer',
    department: 'Product Design',
    location: 'Remote',
    type: 'Contract',
    salary: '₹12 - ₹16 LPA equivalent',
    experience: '2-4 years',
    skills: ['Figma', 'Typography Scale', 'Glassmorphism Design', 'Design Systems', 'Micro-interactions'],
    description: 'Shape the next generation visual experience of AIHire Pro. You will collaborate on layouts, typography tokens, animations, and high-fidelity screen specifications.',
    status: 'draft',
    postedDate: '2026-06-02'
  }
];

const initialCandidates: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Aishwarya Sen',
    email: 'aishwarya.sen@example.com',
    phone: '+91 98765 43210',
    appliedJobId: 'job-1',
    status: 'screening',
    resumeName: 'Aishwarya_Resume_Frontend.pdf',
    skillsMatched: ['React', 'TypeScript', 'CSS Flexbox/Grid', 'Next.js'],
    skillsMissing: ['Vite', 'State Management'],
    aiScore: 84,
    aiRecommendation: 'STRONG FIT: Candidate exhibits solid React and TypeScript skills, with active contributions to modern frontend projects. Spacing systems and CSS styling capability align nicely with the design system lead.',
    matchBreakdown: { skills: 85, experience: 80, education: 90, cultural: 85 },
    communicationAnalysis: {
      pace: 'Good (125 wpm)',
      fillerWords: ['uh', 'like'],
      tone: 'Confident & Structural',
      clarity: 88
    }
  },
  {
    id: 'cand-2',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@example.com',
    phone: '+91 87654 32109',
    appliedJobId: 'job-1',
    status: 'interviewing',
    resumeName: 'Rohan_Senior_Frontend.pdf',
    skillsMatched: ['React', 'TypeScript', 'Vite', 'Next.js', 'State Management', 'CSS Flexbox/Grid'],
    skillsMissing: [],
    aiScore: 96,
    aiRecommendation: 'EXCEPTIONAL FIT: Fits all required technical profiles perfectly. Deep familiarity with Vite bundlers and Redux/Zustand state managers. Highly recommended for immediate interview phase.',
    matchBreakdown: { skills: 100, experience: 95, education: 90, cultural: 98 },
    communicationAnalysis: {
      pace: 'Excellent (135 wpm)',
      fillerWords: ['so'],
      tone: 'Collaborative & Articulate',
      clarity: 95
    },
    interviewScore: 92,
    interviewAnswers: [
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
    ]
  },
  {
    id: 'cand-3',
    name: 'Vikram Mehta',
    email: 'vikram.mehta@example.com',
    phone: '+91 76543 21098',
    appliedJobId: 'job-3',
    status: 'applied',
    resumeName: 'Vikram_AI_Engineer.docx',
    skillsMatched: ['Python', 'FastAPI', 'Gemini Flash SDK'],
    skillsMissing: ['Pinecone Vector DB', 'RAG Implementations'],
    aiScore: 68,
    aiRecommendation: 'BORDERLINE FIT: Moderate Python capability but lacks direct experience in vector databases or advanced Retrieval-Augmented Generation integrations. Suggest code challenge prior to interviews.',
    matchBreakdown: { skills: 60, experience: 70, education: 80, cultural: 72 }
  }
];

const initialLeaves: LeaveRequest[] = [
  {
    id: 'leave-1',
    employeeId: 'emp-101',
    employeeName: 'Jane Doe (Current User)',
    type: 'Annual',
    startDate: '2026-06-15',
    endDate: '2026-06-18',
    reason: 'Family vacation trip',
    status: 'Pending',
    requestedDate: '2026-06-01'
  },
  {
    id: 'leave-2',
    employeeId: 'emp-102',
    employeeName: 'Rahul Kumar',
    type: 'Sick',
    startDate: '2026-05-25',
    endDate: '2026-05-26',
    reason: 'Severe seasonal flu',
    status: 'Approved',
    requestedDate: '2026-05-24'
  }
];

const initialAttendance: AttendanceRecord[] = [
  { id: 'att-1', date: '2026-06-02', checkIn: '09:12 AM', checkOut: null, durationHours: null, status: 'Present' },
  { id: 'att-2', date: '2026-06-01', checkIn: '08:58 AM', checkOut: '05:30 PM', durationHours: 8.53, status: 'Present' },
  { id: 'att-3', date: '2026-05-29', checkIn: '09:35 AM', checkOut: '05:00 PM', durationHours: 7.42, status: 'Late' },
  { id: 'att-4', date: '2026-05-28', checkIn: '09:05 AM', checkOut: '06:05 PM', durationHours: 9.00, status: 'Present' }
];

const initialPayslips: Payslip[] = [
  { id: 'pay-1', month: 'May', year: 2026, basic: 85000, allowances: 25000, deductions: 12000, net: 98000, status: 'Paid', issuedDate: '2026-05-31' },
  { id: 'pay-2', month: 'April', year: 2026, basic: 85000, allowances: 25000, deductions: 12000, net: 98000, status: 'Paid', issuedDate: '2026-04-30' },
  { id: 'pay-3', month: 'March', year: 2026, basic: 85000, allowances: 25000, deductions: 12000, net: 98000, status: 'Paid', issuedDate: '2026-03-31' }
];

const initialChat: ChatMessage[] = [
  { id: 'c-1', sender: 'bot', text: 'Hello! I am your AI HR Assistant. How can I help you today? You can ask me questions about company policies, leave benefits, or payslip structures.', timestamp: '1:00 PM' }
];

const initialNotifications = [
  { id: 'n-1', text: 'New candidate Rohan Sharma applied for Senior Frontend Developer.', time: '2 hours ago', read: false },
  { id: 'n-2', text: 'Your leave request for June 15th is currently pending manager approval.', time: '1 day ago', read: false },
  { id: 'n-3', text: 'AI screening report generated for candidate Aishwarya Sen.', time: '1 day ago', read: true }
];

// ==========================================
// CONTEXT PROVIDER IMPLEMENTATION
// ==========================================
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; email: string; role: UserRole } | null>(() => {
    const saved = localStorage.getItem('aihire-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentRole, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('aihire-role') as UserRole) || 'recruiter';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('aihire-auth') === 'true';
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('aihire-theme') as Theme) || 'light';
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('aihire-jobs');
    return saved ? JSON.parse(saved) : initialJobs;
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('aihire-candidates');
    return saved ? JSON.parse(saved) : initialCandidates;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('aihire-leaves');
    return saved ? JSON.parse(saved) : initialLeaves;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('aihire-attendance');
    return saved ? JSON.parse(saved) : initialAttendance;
  });

  const [payslips] = useState<Payslip[]>(initialPayslips);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('aihire-chat');
    return saved ? JSON.parse(saved) : initialChat;
  });

  const [notifications, setNotifications] = useState(initialNotifications);

  const [leaveBalances, setLeaveBalances] = useState({
    Sick: 8,
    Casual: 6,
    Annual: 14
  });

  const [adminUsers, setAdminUsers] = useState<{ id: number; name: string; email: string; role: UserRole; status: string; created_at: string }[]>([]);
  const [activityLogs, setActivityLogs] = useState<{ id: number; user_email: string; action: string; created_at: string }[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);
  const [platformContent, setPlatformContent] = useState<{ id: number; type: string; title: string; content: string; created_at: string }[]>([]);

  // Sync theme to body class
  useEffect(() => {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
    localStorage.setItem('aihire-theme', theme);
  }, [theme]);

  // Load data from live Express backend on authentication
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const [jobsRes, candidatesRes, leavesRes, attendanceRes, notificationsRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/candidates'),
          fetch('/api/leaves'),
          fetch('/api/attendance'),
          fetch('/api/notifications')
        ]);

        if (jobsRes.ok) setJobs(await jobsRes.json());
        if (candidatesRes.ok) setCandidates(await candidatesRes.json());
        if (leavesRes.ok) setLeaveRequests(await leavesRes.json());
        if (attendanceRes.ok) setAttendance(await attendanceRes.json());
        if (notificationsRes.ok) setNotifications(await notificationsRes.json());
      } catch (err) {
        console.error('Error fetching live data from Neon DB:', err);
      }
    };

    const loadAdminData = async () => {
      if (currentUser?.role !== 'admin' && currentRole !== 'admin') return;
      try {
        const [usersRes, logsRes, analyticsRes, contentRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/logs'),
          fetch('/api/admin/analytics'),
          fetch('/api/admin/content')
        ]);
        if (usersRes.ok) setAdminUsers(await usersRes.json());
        if (logsRes.ok) setActivityLogs(await logsRes.json());
        if (analyticsRes.ok) setAdminAnalytics(await analyticsRes.json());
        if (contentRes.ok) setPlatformContent(await contentRes.json());
      } catch (err) {
        console.error('Error fetching admin data from Neon DB:', err);
      }
    };

    loadData();
    loadAdminData();
  }, [isAuthenticated, currentUser?.role, currentRole]);

  useEffect(() => {
    localStorage.setItem('aihire-chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const setRole = (role: UserRole) => {
    setRoleState(role);
    localStorage.setItem('aihire-role', role);
  };

  const login = (role: UserRole, userDetails?: { id: number; name: string; email: string; role: UserRole }) => {
    setRole(role);
    setIsAuthenticated(true);
    localStorage.setItem('aihire-auth', 'true');
    if (userDetails) {
      setCurrentUser(userDetails);
      localStorage.setItem('aihire-user', JSON.stringify(userDetails));
    } else {
      const mockUsers: Record<UserRole, { id: number; name: string; email: string; role: UserRole }> = {
        candidate: { id: 1, name: 'Rohan Sharma', email: 'rohan.sharma@example.com', role: 'candidate' },
        recruiter: { id: 2, name: 'Sarah Jenkins', email: 'recruiter@aihirepro.com', role: 'recruiter' },
        manager: { id: 3, name: 'Alex Rivera', email: 'manager@aihirepro.com', role: 'manager' },
        employee: { id: 4, name: 'Jane Doe', email: 'jane.doe@company.com', role: 'employee' },
        admin: { id: 5, name: 'Admin User', email: 'admin@aihirepro.com', role: 'admin' }
      };
      setCurrentUser(mockUsers[role]);
      localStorage.setItem('aihire-user', JSON.stringify(mockUsers[role]));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('aihire-auth');
    localStorage.removeItem('aihire-user');
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const addJob = async (jobData: Omit<Job, 'id' | 'postedDate' | 'status'> & { status?: 'active' | 'draft' | 'closed' }) => {
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      status: jobData.status || 'active'
    };
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      });
      if (res.ok) {
        const savedJob = await res.json();
        setJobs(prev => [savedJob, ...prev]);
        
        const notif = {
          id: `notif-${Date.now()}`,
          text: `New job role "${newJob.title}" posted successfully.`,
          time: 'Just now'
        };
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notif)
        });
        setNotifications(prev => [
          { ...notif, read: false },
          ...prev
        ]);
      }
    } catch (e) {
      console.error('Failed to post job to DB:', e);
    }
  };

  const uploadResume = async (
    file: File,
    jobId: string,
    metadata?: { name: string; email: string; phone: string }
  ): Promise<Candidate> => {
    const name = metadata?.name || currentUser?.name || file.name.replace(/_Resume|_resume|\.pdf|\.docx/gi, ' ').trim();
    const email = metadata?.email || currentUser?.email || `${file.name.toLowerCase().replace(/[^a-z]/g, '') || 'candidate'}@example.com`;
    const phone = metadata?.phone || '+91 99999 88888';

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileBase64 = reader.result as string;
        try {
          const response = await fetch('/api/candidates/parse-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email,
              phone,
              appliedJobId: jobId,
              fileName: file.name,
              fileBase64
            })
          });

          if (!response.ok) {
            throw new Error('Failed to parse resume via backend.');
          }

          const newCandidate: Candidate = await response.json();

          const notif = {
            id: `notif-${Date.now()}`,
            text: `Resume ${file.name} screened with AI Score: ${newCandidate.aiScore}%.`,
            time: 'Just now'
          };
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notif)
          });

          setCandidates(prev => [newCandidate, ...prev]);
          setNotifications(prev => [
            { ...notif, read: false },
            ...prev
          ]);
          resolve(newCandidate);
        } catch (e) {
          console.error('Failed to upload and parse candidate:', e);
          reject(e);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const applyForJob = async (candidateData: Omit<Candidate, 'id' | 'aiScore' | 'aiRecommendation' | 'matchBreakdown' | 'status' | 'skillsMatched' | 'skillsMissing'>) => {
    const newCand: Candidate = {
      ...candidateData,
      id: `cand-${Date.now()}`,
      status: 'applied',
      skillsMatched: ['React', 'TypeScript'],
      skillsMissing: ['Vite'],
      aiScore: 78,
      aiRecommendation: 'PROJECTION: Capable candidate. Demonstrated familiarity with frontend tools. Matches basic requirements.',
      matchBreakdown: { skills: 75, experience: 80, education: 85, cultural: 75 }
    };
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCand)
      });
      if (res.ok) {
        setCandidates(prev => [newCand, ...prev]);
      }
    } catch (e) {
      console.error('Apply for job error:', e);
    }
  };

  const updateCandidateStatus = async (id: string, status: Candidate['status']) => {
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setCandidates(prev =>
          prev.map(c => (c.id === id ? { ...c, status } : c))
        );
      }
    } catch (e) {
      console.error('Update status error:', e);
    }
  };

  const submitLeaveRequest = async (req: Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'status' | 'requestedDate'>) => {
    const newRequest: LeaveRequest = {
      ...req,
      id: `leave-${Date.now()}`,
      employeeId: currentUser ? `emp-${currentUser.id}` : 'emp-101',
      employeeName: currentUser ? `${currentUser.name} (Current User)` : 'Jane Doe (Current User)',
      status: 'Pending',
      requestedDate: new Date().toISOString().split('T')[0]
    };
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });
      if (res.ok) {
        setLeaveRequests(prev => [newRequest, ...prev]);
        
        const notif = {
          id: `notif-${Date.now()}`,
          text: `Leave request for ${req.startDate} has been submitted.`,
          time: 'Just now'
        };
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notif)
        });
        setNotifications(prev => [
          { ...notif, read: false },
          ...prev
        ]);
      }
    } catch (e) {
      console.error('Submit leave error:', e);
    }
  };

  const updateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setLeaveRequests(prev =>
          prev.map(l => {
            if (l.id === id) {
              if (status === 'Approved' && (l.employeeId === 'emp-101' || l.employeeId.startsWith('emp-'))) {
                const duration = Math.ceil(
                  (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 3600 * 24)
                ) + 1;
                const leaveType = l.type as keyof typeof leaveBalances;
                setLeaveBalances(bal => ({
                  ...bal,
                  [leaveType]: Math.max(0, bal[leaveType] - duration)
                }));
              }
              return { ...l, status };
            }
            return l;
          })
        );
      }
    } catch (e) {
      console.error('Update leave error:', e);
    }
  };

  const clockIn = async () => {
    const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toISOString().split('T')[0];
    
    const exists = attendance.some(a => a.date === todayStr);
    if (exists) return;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      date: todayStr,
      checkIn: checkInTime,
      checkOut: null,
      durationHours: null,
      status: 'Present'
    };

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      if (res.ok) {
        setAttendance(prev => [newRecord, ...prev]);
      }
    } catch (e) {
      console.error('Clock in error:', e);
    }
  };

  const clockOut = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayStr,
          checkOut: checkOutTime,
          durationHours: 8.5
        })
      });
      if (res.ok) {
        setAttendance(prev =>
          prev.map(a => {
            if (a.date === todayStr && a.checkOut === null) {
              return {
                ...a,
                checkOut: checkOutTime,
                durationHours: 8.5
              };
            }
            return a;
          })
        );
      }
    } catch (e) {
      console.error('Clock out error:', e);
    }
  };

  const submitInterviewAnswers = async (
    candidateId: string,
    answers: { question: string; answer: string; score: number; feedback: string }[],
    score: number
  ) => {
    const comm = {
      pace: 'Good (128 wpm)',
      fillerWords: ['uh', 'like', 'actually'],
      tone: 'Analytical & Calm',
      clarity: score - 2
    };

    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'interviewing',
          interviewScore: score,
          interviewAnswers: answers,
          communicationAnalysis: comm
        })
      });
      if (res.ok) {
        setCandidates(prev =>
          prev.map(c =>
            c.id === candidateId
              ? {
                  ...c,
                  status: 'interviewing',
                  interviewScore: score,
                  interviewAnswers: answers,
                  communicationAnalysis: comm
                }
              : c
          )
        );
      }
    } catch (e) {
      console.error('Submit interview error:', e);
    }
  };

  const submitChatScreeningAnswers = async (
    candidateId: string,
    answers: { question: string; answer: string; score: number }[],
    score: number
  ) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'interviewing',
          chatScreeningScore: score,
          chatScreeningAnswers: answers
        })
      });
      if (res.ok) {
        setCandidates(prev =>
          prev.map(c =>
            c.id === candidateId
              ? {
                  ...c,
                  status: 'interviewing',
                  chatScreeningScore: score,
                  chatScreeningAnswers: answers
                }
              : c
          )
        );
      }
    } catch (e) {
      console.error('Submit chat screening error:', e);
    }
  };


  // Simple RAG-based Chatbot Q&A
  const sendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);

    try {
      // Send the last few messages as history
      const historyContext = chatHistory.slice(-6).map(m => ({ sender: m.sender, text: m.text }));
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, chatHistory: historyContext })
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: ChatMessage = {
          id: `chat-${Date.now()}-bot`,
          sender: 'bot',
          text: data.responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: data.citations && data.citations.length > 0 ? data.citations : undefined
        };
        setChatHistory(prev => [...prev, botMsg]);
      } else {
        throw new Error('Chatbot response error');
      }
    } catch (e) {
      console.error('Chatbot error:', e);
      const errorMsg: ChatMessage = {
        id: `chat-${Date.now()}-bot`,
        sender: 'bot',
        text: "I'm sorry, I encountered an error connecting to the AI policy advisor. Please try again in a few moments.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    }
  };

  const clearChat = () => {
    setChatHistory(initialChat);
  };

  const markNotificationsAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'PUT'
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error('Mark read notifications error:', e);
    }
  };

  const updateUserStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
        const logsRes = await fetch('/api/admin/logs');
        if (logsRes.ok) setActivityLogs(await logsRes.json());
        const analRes = await fetch('/api/admin/analytics');
        if (analRes.ok) setAdminAnalytics(await analRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateUserRole = async (id: number, role: UserRole) => {
    try {
      const u = adminUsers.find(x => x.id === id);
      if (!u) return;
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: u.name, email: u.email, role })
      });
      if (res.ok) {
        setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAdminUsers(prev => prev.filter(u => u.id !== id));
        const logsRes = await fetch('/api/admin/logs');
        if (logsRes.ok) setActivityLogs(await logsRes.json());
        const analRes = await fetch('/api/admin/analytics');
        if (analRes.ok) setAdminAnalytics(await analRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateJobStatusByAdmin = async (id: string, status: 'active' | 'draft' | 'closed') => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateJobFeatured = async (id: string, featured: boolean) => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured })
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, featured } : j));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteJobByAdmin = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendBroadcastNotification = async (text: string) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      text: `[Broadcast Alert] ${text}`,
      time: 'Just now'
    };
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif)
      });
      if (res.ok) {
        setNotifications(prev => [{ ...newNotif, read: false }, ...prev]);
        const logsRes = await fetch('/api/admin/logs');
        if (logsRes.ok) setActivityLogs(await logsRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createContentItem = async (type: string, title: string, content: string) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, content })
      });
      if (res.ok) {
        const item = await res.json();
        setPlatformContent(prev => [item, ...prev]);
        const logsRes = await fetch('/api/admin/logs');
        if (logsRes.ok) setActivityLogs(await logsRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      currentRole,
      setRole,
      isAuthenticated,
      login,
      logout,
      theme,
      toggleTheme,
      jobs,
      candidates,
      leaveRequests,
      attendance,
      payslips,
      chatHistory,
      leaveBalances,
      notifications,
      addJob,
      uploadResume,
      applyForJob,
      updateCandidateStatus,
      submitLeaveRequest,
      updateLeaveStatus,
      clockIn,
      clockOut,
      sendChatMessage,
      clearChat,
      submitInterviewAnswers,
      submitChatScreeningAnswers,
      markNotificationsAsRead,
      adminUsers,
      activityLogs,
      adminAnalytics,
      platformContent,
      updateUserStatus,
      updateUserRole,
      deleteUser,
      updateJobStatusByAdmin,
      updateJobFeatured,
      deleteJobByAdmin,
      sendBroadcastNotification,
      createContentItem
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
