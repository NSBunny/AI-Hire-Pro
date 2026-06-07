import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Shared / Chatbot components
import { HRChatbot } from './components/chatbot/HRChatbot';

// Candidate pages
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { JobSearch } from './pages/candidate/JobSearch';
import { AIInterviewSimulator } from './pages/candidate/AIInterviewSimulator';
import { AIChatScreening } from './pages/candidate/AIChatScreening';

// HR / Recruiter pages
import { HRDashboard } from './pages/hr/HRDashboard';
import { JobPosting } from './pages/hr/JobPosting';
import { ResumeScreening } from './pages/hr/ResumeScreening';
import { ManagerDashboard } from './pages/hr/ManagerDashboard';

// Employee pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Auth page
import { Login } from './pages/auth/Login';

// Custom icons
import { Card } from './components/shared/Card';
import { Badge } from './components/shared/Badge';
import { Button } from './components/shared/Button';

// Main App Router content hook
const AppContent: React.FC = () => {
  const { currentRole, isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sync tab navigation on role changes
  useEffect(() => {
    setActiveTab('dashboard');
  }, [currentRole]);

  if (!isAuthenticated) {
    return <Login />;
  }

  // Render appropriate view based on role & active tab ID
  const renderPage = () => {
    switch (currentRole) {
      case 'candidate':
        if (activeTab === 'dashboard') return <CandidateDashboard onNavigate={setActiveTab} />;
        if (activeTab === 'job-search') return <JobSearch />;
        if (activeTab === 'ai-chat-screening') return <AIChatScreening />;
        if (activeTab === 'ai-interview') return <AIInterviewSimulator onNavigate={setActiveTab} />;
        return <CandidateDashboard onNavigate={setActiveTab} />;

      case 'recruiter':
        if (activeTab === 'dashboard') return <HRDashboard onNavigate={setActiveTab} />;
        if (activeTab === 'job-postings') return <JobPosting onNavigate={setActiveTab} />;
        if (activeTab === 'ai-screening') return <ResumeScreening />;
        if (activeTab === 'candidates-list') return <HRDashboard onNavigate={setActiveTab} />;
        return <HRDashboard onNavigate={setActiveTab} />;

      case 'manager':
        // Scoped views for the Hiring Manager
        if (activeTab === 'dashboard') {
          return <ManagerDashboard onNavigate={setActiveTab} />;
        }
        if (activeTab === 'leave-approvals') {
          return <ManagerLeaveApprovals />;
        }
        if (activeTab === 'performance-eval') {
          return <ManagerPerformanceEvaluations />;
        }
        return <ManagerDashboard onNavigate={setActiveTab} />;

      case 'employee':
        return <EmployeeDashboard activeTab={activeTab} />;

      case 'admin':
        return <AdminDashboard activeTab={activeTab} />;

      default:
        return (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>System Workspace Mismatched</h2>
            <p>Please select a valid role indicator from the header panel.</p>
          </div>
        );
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderPage()}
      <HRChatbot />
    </AppLayout>
  );
};

// ==========================================
// MANAGER ONLY PORTAL SUB-VIEWS
// ==========================================
const ManagerLeaveApprovals: React.FC = () => {
  const { leaveRequests, updateLeaveStatus } = useApp();

  const handleLeaveAction = (id: string, status: 'Approved' | 'Rejected') => {
    updateLeaveStatus(id, status);
    alert(`Leave request set to ${status}.`);
  };

  return (
    <div className="anim-slide-up">
      <h2 className="mb-4">Leave Requests Review Panel</h2>
      <div className="table-container">
        {leaveRequests.length === 0 ? (
          <div className="p-4 text-center">No leave requests.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Requested Date Range</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((req) => (
                <tr key={req.id}>
                  <td><strong>{req.employeeName}</strong></td>
                  <td>{req.type}</td>
                  <td>{req.startDate} to {req.endDate}</td>
                  <td>{req.reason}</td>
                  <td>
                    <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'}>
                      {req.status}
                    </Badge>
                  </td>
                  <td>
                    {req.status === 'Pending' ? (
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" onClick={() => handleLeaveAction(req.id, 'Approved')}>
                          Approve
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleLeaveAction(req.id, 'Rejected')}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                        Resolved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const ManagerPerformanceEvaluations: React.FC = () => {
  return (
    <div className="anim-slide-up" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h2 className="mb-4">Team Appraisals Review</h2>
      <Card className="mb-6">
        <h3 className="mb-4">Direct Report Metrics</h3>
        <div className="flex-col gap-4" style={{ display: 'flex' }}>
          <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--gray-50)' }}>
            <div className="flex justify-between items-center mb-1">
              <strong>Jane Doe (Staff Engineer)</strong>
              <Badge variant="success">91% Score</Badge>
            </div>
            <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)' }}>
              Excellent technical contributions in Q2 design system integrations. Recommended for promotion by the XGBoost engine.
            </p>
          </div>
          <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--gray-50)' }}>
            <div className="flex justify-between items-center mb-1">
              <strong>Rahul Kumar (HR Lead)</strong>
              <Badge variant="info">85% Score</Badge>
            </div>
            <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)' }}>
              Strong leadership during team hiring campaigns. Automated onboarding guidelines.
            </p>
          </div>
        </div>
      </Card>

      <Card style={{ backgroundColor: 'var(--secondary-50)', border: '1px solid var(--secondary-100)' }}>
        <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary-700)' }}>
          <span>🤖</span> AI Team Insights
        </h3>
        <p style={{ fontSize: 'var(--fs-body-sm)', margin: 0, color: 'var(--text-primary)', lineHeight: '1.6' }}>
          Based on sprint velocity trackers and KPI inputs, the model projects overall department productivity is operating at 1.08x baseline. Suggested focus: Cross-train engineers on RAG architectures during Q3 cycles.
        </p>
      </Card>
    </div>
  );
};

// Top Wrapper to hook Provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
