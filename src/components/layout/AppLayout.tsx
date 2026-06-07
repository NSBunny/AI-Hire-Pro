import React, { useState } from 'react';
import { useApp, type UserRole } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { Sun, Moon, Bell, Search, LogOut, ChevronDown, User } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  setActiveTab
}) => {
  const {
    currentUser,
    currentRole,
    theme,
    toggleTheme,
    notifications,
    markNotificationsAsRead,
    logout
  } = useApp();

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);



  const roleUserInfo: Record<UserRole, { name: string; email: string; initials: string }> = {
    candidate: { name: 'Rohan Sharma', email: 'rohan.sharma@example.com', initials: 'RS' },
    recruiter: { name: 'Sarah Jenkins', email: 'recruiter@aihirepro.com', initials: 'SJ' },
    manager: { name: 'Alex Rivera', email: 'manager@aihirepro.com', initials: 'AR' },
    employee: { name: 'Jane Doe', email: 'jane.doe@company.com', initials: 'JD' },
    admin: { name: 'Admin User', email: 'admin@aihirepro.com', initials: 'AD' }
  };

  const displayName = currentUser ? currentUser.name : roleUserInfo[currentRole].name;
  const displayEmail = currentUser ? currentUser.email : roleUserInfo[currentRole].email;
  const displayInitials = currentUser 
    ? currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : roleUserInfo[currentRole].initials;



  const handleNotifClick = () => {
    setNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
      markNotificationsAsRead();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-wrapper flex">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="content-container">
        {/* Header Topbar */}
        <div className="topbar">
          {/* Left search */}
          <div className="flex items-center gap-2" style={{ position: 'relative', width: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search anything..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid var(--border-input)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-body-sm)'
              }}
            />
          </div>

          {/* Right section items */}
          <div className="topbar-right">


            {/* Light / Dark Mode */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
                borderRadius: '6px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Notifications Bell */}
            <div className="notification-bell" onClick={handleNotifClick}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  borderRadius: '6px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Bell size={20} className={unreadCount > 0 ? 'anim-pulse-border' : ''} style={{ borderRadius: '50%' }} />
              </button>
              {unreadCount > 0 && <span className="notification-badge" />}
              
              {/* Notifications Dropdown */}
              {isNotifOpen && (
                <div className="notification-dropdown">
                  <div className="flex justify-between items-center p-3" style={{ borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>
                    <span>Notifications</span>
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--primary-600)' }}>
                      {unreadCount} unread
                    </span>
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                          <div style={{ color: 'var(--text-primary)' }}>{notif.text}</div>
                          <div style={{ fontSize: 'var(--fs-overline)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {notif.time}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="profile-dropdown-container" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
              <div
                className="profile-avatar-trigger"
                onClick={() => setProfileOpen(!isProfileOpen)}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-100)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 'var(--fs-body-sm)'
                  }}
                >
                  {displayInitials}
                </div>
                <span className="hide-mobile font-semibold" style={{ fontSize: 'var(--fs-body-sm)' }}>
                  {displayName}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>

              {isProfileOpen && (
                <div className="profile-menu-dropdown">
                  <div className="profile-menu-header">
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--fs-body)' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {displayEmail}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 600,
                        backgroundColor: 'var(--primary-50)',
                        color: 'var(--primary-600)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {currentRole}
                    </div>
                  </div>
                  <div
                    className="profile-menu-item"
                    onClick={() => {
                      setProfileOpen(false);
                      setActiveTab('dashboard');
                    }}
                  >
                    <User size={16} />
                    <span>My Dashboard</span>
                  </div>
                  <div
                    className="profile-menu-item logout"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Render Area */}
        <div className="main-content anim-fade-in">{children}</div>
      </div>
    </div>
  );
};
