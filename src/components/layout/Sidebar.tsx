import React from 'react';
import { useApp, type UserRole } from '../../context/AppContext';
import {
  LayoutDashboard,
  Briefcase,
  Mic,
  FileCheck,
  Users,
  Calendar,
  DollarSign,
  Award,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Bell,
  Server,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setCollapsed,
  activeTab,
  setActiveTab
}) => {
  const { currentRole, logout } = useApp();

  // Define sidebar menu options by user role
  const menuItems: Record<UserRole, { id: string; label: string; icon: React.ReactNode }[]> = {
    candidate: [
      { id: 'dashboard', label: 'Candidate Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'job-search', label: 'Explore Jobs', icon: <Briefcase size={20} /> },
      { id: 'ai-chat-screening', label: 'AI Chat Screen', icon: <MessageSquare size={20} /> },
      { id: 'ai-interview', label: 'AI Voice Interview', icon: <Mic size={20} /> }
    ],
    recruiter: [
      { id: 'dashboard', label: 'Recruiter Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'job-postings', label: 'Manage Jobs', icon: <Briefcase size={20} /> },
      { id: 'ai-screening', label: 'AI Resume Screen', icon: <FileCheck size={20} /> },
      { id: 'candidates-list', label: 'Candidate Funnel', icon: <Users size={20} /> }
    ],
    manager: [
      { id: 'dashboard', label: 'Manager Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'leave-approvals', label: 'Leave Reviews', icon: <Calendar size={20} /> },
      { id: 'performance-eval', label: 'Team Appraisals', icon: <Award size={20} /> }
    ],
    employee: [
      { id: 'dashboard', label: 'Employee Hub', icon: <LayoutDashboard size={20} /> },
      { id: 'attendance', label: 'Attendance logs', icon: <Calendar size={20} /> },
      { id: 'payslips', label: 'My Payroll', icon: <DollarSign size={20} /> },
      { id: 'performance', label: 'Self Appraisals', icon: <Award size={20} /> }
    ],
    admin: [
      { id: 'dashboard', label: 'Admin Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'employers', label: 'Employers', icon: <Users size={20} /> },
      { id: 'job-seekers', label: 'Job Seekers', icon: <Users size={20} /> },
      { id: 'jobs', label: 'Manage Jobs', icon: <Briefcase size={20} /> },
      { id: 'applications', label: 'Applications', icon: <FileCheck size={20} /> },
      { id: 'content-mgmt', label: 'FAQ / Blog Manager', icon: <FileText size={20} /> },
      { id: 'notifications', label: 'Broadcast Alerts', icon: <Bell size={20} /> },
      { id: 'logs', label: 'System Audit Logs', icon: <Server size={20} /> }
    ]
  };

  const activeItems = menuItems[currentRole] || [];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: '140%',
              height: '140%',
              objectFit: 'contain',
              transform: 'translateY(-14%)',
              maxWidth: 'none',
              maxHeight: 'none'
            }}
          />
        </div>
        {!isCollapsed && <span style={{ letterSpacing: '-0.5px', fontSize: '1.25rem' }}>AIHire Pro</span>}
      </div>

      {/* Navigation lists */}
      <div className="sidebar-menu">
        {!isCollapsed && (
          <div className="sidebar-section-title">
            {currentRole} Workspace
          </div>
        )}
        {activeItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </div>
        ))}
      </div>

      {/* Logout button */}
      <div
        className="sidebar-item"
        style={{
          borderTop: '1px solid var(--border-color)',
          marginTop: 'auto',
          color: 'var(--error)'
        }}
        onClick={() => logout()}
        title={isCollapsed ? "Logout" : undefined}
      >
        <LogOut size={20} />
        {!isCollapsed && <span>Logout</span>}
      </div>

      {/* Collapse Toggle Footer */}
      <div
        className="sidebar-item"
        style={{
          height: '44px',
          justifyContent: isCollapsed ? 'center' : 'flex-end',
          padding: isCollapsed ? '0' : '0 var(--space-6)',
          borderTop: 'none'
        }}
        onClick={() => setCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </div>
    </div>
  );
};
