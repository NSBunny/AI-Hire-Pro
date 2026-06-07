import React, { useState } from 'react';
import { useApp, type UserRole } from '../../context/AppContext';
import { Card, StatsCard } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { Input, Select } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { 
  Users, Briefcase, FileCheck, Bell, Server, Star, Trash2, Edit, Sparkles, ShieldCheck, Clock, Search
} from 'lucide-react';

interface AdminDashboardProps {
  activeTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  const { 
    jobs, 
    candidates, 
    adminUsers,
    activityLogs,
    adminAnalytics,
    platformContent,
    updateUserStatus,
    deleteUser,
    updateJobStatusByAdmin,
    updateJobFeatured,
    deleteJobByAdmin,
    sendBroadcastNotification,
    createContentItem,
    leaveRequests,
    attendance
  } = useApp();

  // Search filter states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dashboard Sub-tabs
  const [subTab, setSubTab] = useState<'system' | 'individual' | 'company'>('system');
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<number | null>(null);
  
  // Broadcast alert state
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Content posting state
  const [contentType, setContentType] = useState<'faq' | 'blog'>('faq');
  const [contentTitle, setContentTitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentSuccess, setContentSuccess] = useState(false);

  // Edit user modal states
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('candidate');
  const [isEditing, setIsEditing] = useState(false);

  // Verified candidate emails state (mock verified indicator)
  const [verifiedEmails, setVerifiedEmails] = useState<string[]>(['rohan.sharma@example.com']);

  const handleToggleVerify = (email: string) => {
    setVerifiedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleEditOpen = (user: any) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setIsEditing(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail, role: editRole })
      });
      if (res.ok) {
        setIsEditing(false);
        setEditingUser(null);
        alert('User details updated successfully.');
        window.location.reload();
      } else {
        alert('Failed to update user details.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating user.');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    await sendBroadcastNotification(broadcastText);
    setBroadcastText('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTitle.trim() || !contentBody.trim()) return;
    await createContentItem(contentType, contentTitle, contentBody);
    setContentTitle('');
    setContentBody('');
    setContentSuccess(true);
    setTimeout(() => setContentSuccess(false), 3000);
  };

  // Analytics counts calculation (fallback if adminAnalytics is loading/null)
  const totalEmployers = adminUsers.filter(u => u.role === 'recruiter' || u.role === 'manager').length;
  const totalJobSeekers = adminUsers.filter(u => u.role === 'candidate').length;
  const activeJobsCount = jobs.filter(j => j.status === 'active').length;
  const totalApplications = candidates.length;
  const pendingUsers = adminUsers.filter(u => u.status === 'pending').length;

  const getFilteredUsers = (roleType: 'employer' | 'seeker') => {
    return adminUsers.filter(u => {
      const matchesRole = roleType === 'employer' 
        ? (u.role === 'recruiter' || u.role === 'manager') 
        : u.role === 'candidate';
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  };

  const getFilteredJobs = () => {
    return jobs.filter(j => 
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // ==========================================
  // TAB 1: ADMIN CENTRAL DASHBOARD
  // ==========================================
  if (activeTab === 'dashboard') {
    // Find active user for Individual Dashboard drilldown
    const activeSelectedUser = adminUsers.find(u => u.id === (selectedAdminUserId ?? (adminUsers[0]?.id || 0))) || adminUsers[0];

    // Compute Company-wise Aggregates
    const deptStats = {
      'Engineering': { employees: 22, jobs: jobs.filter(j => j.department === 'Engineering').length, avgAi: 88, leaves: 4 },
      'Human Resources': { employees: 7, jobs: jobs.filter(j => j.department === 'Human Resources').length, avgAi: 82, leaves: 1 },
      'AI & Data Science': { employees: 14, jobs: jobs.filter(j => j.department === 'AI & Data Science').length, avgAi: 91, leaves: 2 },
      'Product Design': { employees: 6, jobs: jobs.filter(j => j.department === 'Product Design').length, avgAi: 84, leaves: 0 }
    };

    return (
      <div className="anim-slide-up">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>System Administrator Console</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Observe platform operations, user accounts metrics, and recent activity logs.</p>
          </div>
          
          {/* Sub-tab navigation selector */}
          <div className="flex gap-1" style={{ backgroundColor: 'var(--gray-100)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setSubTab('system')}
              className={`btn btn-sm ${subTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', height: 'auto', border: 'none', background: subTab === 'system' ? undefined : 'transparent' }}
            >
              System Dashboard
            </button>
            <button
              onClick={() => setSubTab('individual')}
              className={`btn btn-sm ${subTab === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', height: 'auto', border: 'none', background: subTab === 'individual' ? undefined : 'transparent' }}
            >
              Individual Dashboard
            </button>
            <button
              onClick={() => setSubTab('company')}
              className={`btn btn-sm ${subTab === 'company' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', height: 'auto', border: 'none', background: subTab === 'company' ? undefined : 'transparent' }}
            >
              Company-wise Dashboard
            </button>
          </div>
        </div>

        {subTab === 'system' && (
          <>
            {/* Stats widgets */}
            <div className="grid grid-cols-5 gap-6 mb-6">
              <StatsCard
                title="Total Employers"
                value={totalEmployers}
                icon={<Users size={18} style={{ color: 'var(--primary-600)' }} />}
                trend={pendingUsers > 0 ? { value: `${pendingUsers} pending`, direction: 'up', label: 'approvals' } : undefined}
              />
              <StatsCard
                title="Total Job Seekers"
                value={totalJobSeekers}
                icon={<Users size={18} style={{ color: 'var(--secondary-600)' }} />}
                progress={70}
              />
              <StatsCard
                title="Active Job Listings"
                value={activeJobsCount}
                icon={<Briefcase size={18} style={{ color: 'var(--success)' }} />}
                trend={{ value: 'Normal', direction: 'up', label: 'listings' }}
              />
              <StatsCard
                title="Total Applications"
                value={totalApplications}
                icon={<FileCheck size={18} style={{ color: 'var(--accent-600)' }} />}
                progress={90}
              />
              <StatsCard
                title="Total Events Logged"
                value={adminAnalytics?.activityTotal || activityLogs.length}
                icon={<Server size={18} style={{ color: 'var(--warning)' }} />}
                progress={100}
              />
            </div>

            {/* Charts & Activity columns */}
            <div className="grid grid-cols-12 gap-6 mb-6">
              {/* User growth chart card */}
              <Card className="col-span-8" style={{ gridColumn: 'span 8' }}>
                <h3 className="mb-4">Hiring & User Growth Trends</h3>
                <div style={{ height: '220px', padding: '10px 0' }}>
                  <svg viewBox="0 0 400 150" width="100%" height="100%">
                    <line x1="40" y1="20" x2="380" y2="20" stroke="var(--border-color)" strokeDasharray="4" />
                    <line x1="40" y1="70" x2="380" y2="70" stroke="var(--border-color)" strokeDasharray="4" />
                    <line x1="40" y1="120" x2="380" y2="120" stroke="var(--border-color)" />
                    
                    {/* Employers Polyline */}
                    <polyline
                      fill="none"
                      stroke="var(--primary-500)"
                      strokeWidth="3"
                      points="40,110 100,105 160,90 220,80 280,60 340,40"
                    />
                    
                    {/* Seekers Polyline */}
                    <polyline
                      fill="none"
                      stroke="var(--secondary-500)"
                      strokeWidth="3"
                      points="40,100 100,85 160,75 220,55 280,35 340,15"
                    />

                    <circle cx="40" cy="110" r="4" fill="var(--primary-600)" />
                    <circle cx="100" cy="105" r="4" fill="var(--primary-600)" />
                    <circle cx="160" cy="90" r="4" fill="var(--primary-600)" />
                    <circle cx="220" cy="80" r="4" fill="var(--primary-600)" />
                    <circle cx="280" cy="60" r="4" fill="var(--primary-600)" />
                    <circle cx="340" cy="40" r="4" fill="var(--primary-600)" />

                    <circle cx="40" cy="100" r="4" fill="var(--secondary-600)" />
                    <circle cx="100" cy="85" r="4" fill="var(--secondary-600)" />
                    <circle cx="160" cy="75" r="4" fill="var(--secondary-600)" />
                    <circle cx="220" cy="55" r="4" fill="var(--secondary-600)" />
                    <circle cx="280" cy="35" r="4" fill="var(--secondary-600)" />
                    <circle cx="340" cy="15" r="4" fill="var(--secondary-600)" />

                    <text x="40" y="140" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">Jan</text>
                    <text x="100" y="140" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">Feb</text>
                    <text x="160" y="140" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">Mar</text>
                    <text x="220" y="140" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">Apr</text>
                    <text x="280" y="140" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">May</text>
                    <text x="340" y="140" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">Jun</text>
                  </svg>
                </div>
                <div className="flex gap-4 justify-center" style={{ fontSize: 'var(--fs-caption)' }}>
                  <span className="flex items-center gap-1"><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-500)', display: 'inline-block' }} /> Employers</span>
                  <span className="flex items-center gap-1"><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--secondary-500)', display: 'inline-block' }} /> Job Seekers</span>
                </div>
              </Card>

              {/* Recent audits sidebar card */}
              <Card className="col-span-4" style={{ gridColumn: 'span 4' }}>
                <h3 className="mb-4">Recent Activities</h3>
                <div className="flex-col gap-4" style={{ display: 'flex', maxHeight: '220px', overflowY: 'auto' }}>
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <div style={{ fontSize: 'var(--fs-caption)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>{log.user_email}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: 'var(--fs-body-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{log.action}</p>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <div className="text-center p-4 text-muted">No activity logs recorded yet.</div>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}

        {subTab === 'individual' && (
          <div className="grid grid-cols-12 gap-6">
            {/* User Dropdown Selector */}
            <Card className="col-span-4" style={{ gridColumn: 'span 4' }}>
              <h3 className="mb-4">Select Employee / Seeker</h3>
              <div className="form-group">
                <label className="form-label">Employee / Seeker Account</label>
                <select
                  value={activeSelectedUser?.id || ''}
                  onChange={(e) => setSelectedAdminUserId(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  {adminUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {activeSelectedUser && (
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <h4 className="mb-2" style={{ color: 'var(--primary-600)' }}>Account Status</h4>
                  <div className="flex justify-between py-1" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                    <Badge variant={activeSelectedUser.status === 'active' ? 'success' : activeSelectedUser.status === 'suspended' ? 'danger' : 'warning'}>
                      {activeSelectedUser.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>System Role:</span>
                    <span className="font-semibold">{activeSelectedUser.role}</span>
                  </div>
                  <div className="flex justify-between py-1" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Registered:</span>
                    <span>{new Date(activeSelectedUser.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Drilldown Profile View */}
            <Card className="col-span-8" style={{ gridColumn: 'span 8' }}>
              {activeSelectedUser ? (
                <div>
                  <h3 className="mb-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    Drilldown Profile: {activeSelectedUser.name}
                  </h3>
                  
                  {/* Seeker / Candidate Details */}
                  {activeSelectedUser.role === 'candidate' && (() => {
                    const candObj = candidates.find(c => c.email === activeSelectedUser.email);
                    if (!candObj) return <p>No applied job record linked to this seeker email.</p>;
                    const appliedJobObj = jobs.find(j => j.id === candObj.appliedJobId);
                    return (
                      <div className="flex-col gap-4" style={{ display: 'flex' }}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-semibold" style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>APPLIED POSITION</span>
                            <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{appliedJobObj ? appliedJobObj.title : 'General Requisition'}</p>
                          </div>
                          <div>
                            <span className="font-semibold" style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>AI MATCH SCORE</span>
                            <p style={{ margin: '2px 0 0 0' }}>
                              <Badge variant="success">{candObj.aiScore}% Fit Score</Badge>
                            </p>
                          </div>
                        </div>

                        {candObj.chatScreeningScore && (
                          <div style={{ backgroundColor: 'var(--gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: 'var(--secondary-600)' }}>🤖 Conversational AI Chat Score: {candObj.chatScreeningScore}%</h4>
                            <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)' }}>
                              Candidate completed chat screening matching <strong>{candObj.skillsMatched.slice(0, 3).join(', ')}</strong>.
                            </p>
                          </div>
                        )}

                        {candObj.interviewScore && (
                          <div style={{ backgroundColor: 'var(--gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: 'var(--secondary-600)' }}>🎙️ AI Voice Interview Score: {candObj.interviewScore}%</h4>
                            <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)' }}>
                              Speaking pace is {candObj.communicationAnalysis?.pace} with {candObj.communicationAnalysis?.tone} tone.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Employee Leave & Attendance Details */}
                  {activeSelectedUser.role === 'employee' && (
                    <div className="flex-col gap-6" style={{ display: 'flex' }}>
                      {/* Attendance logs */}
                      <div>
                        <h4 className="mb-2">Portal Check-In History</h4>
                        <div className="table-container" style={{ maxHeight: '150px' }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Duration</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendance.map((att) => (
                                <tr key={att.id}>
                                  <td>{att.date}</td>
                                  <td>{att.checkIn}</td>
                                  <td>{att.checkOut || 'Active'}</td>
                                  <td>{att.durationHours ? `${att.durationHours} hrs` : '--'}</td>
                                  <td><Badge variant={att.status === 'Present' ? 'success' : 'warning'}>{att.status}</Badge></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Leaves requested */}
                      <div>
                        <h4 className="mb-2">Employee Leave Requests</h4>
                        <div className="table-container" style={{ maxHeight: '150px' }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Leave Type</th>
                                <th>Dates</th>
                                <th>Reason</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaveRequests.filter(l => l.employeeId === 'emp-101' || l.employeeId.includes(String(activeSelectedUser.id))).map((req) => (
                                <tr key={req.id}>
                                  <td>{req.type}</td>
                                  <td>{req.startDate} to {req.endDate}</td>
                                  <td>{req.reason}</td>
                                  <td><Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'}>{req.status}</Badge></td>
                                </tr>
                              ))}
                              {leaveRequests.filter(l => l.employeeId === 'emp-101' || l.employeeId.includes(String(activeSelectedUser.id))).length === 0 && (
                                <tr>
                                  <td colSpan={4} className="text-center p-2 text-muted">No leave requests filed yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSelectedUser.role !== 'candidate' && activeSelectedUser.role !== 'employee' && (
                    <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                      This profile is an admin or recruiter dashboard user. Select a Candidate or Staff Employee from the dropdown selector to see their attendance logs and leave ledgers.
                    </p>
                  )}

                  {/* Audit logs specific to this user email */}
                  <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <h4 className="mb-2">Recent User Audit Trails</h4>
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {activityLogs.filter(l => l.user_email === activeSelectedUser.email).map((log) => (
                        <div key={log.id} style={{ borderBottom: '1px solid var(--border-color)', padding: '6px 0', fontSize: 'var(--fs-body-sm)' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                          <p style={{ margin: '2px 0 0 0', fontWeight: 500 }}>{log.action}</p>
                        </div>
                      ))}
                      {activityLogs.filter(l => l.user_email === activeSelectedUser.email).length === 0 && (
                        <p style={{ fontStyle: 'italic', fontSize: 'var(--fs-body-sm)', color: 'var(--text-muted)' }}>No audit actions logged for this email address.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-muted">No profile selected. Use the selector on the left.</div>
              )}
            </Card>
          </div>
        )}

        {subTab === 'company' && (
          <div className="flex-col gap-6" style={{ display: 'flex' }}>
            {/* Department headcount & stats widgets */}
            <div className="grid grid-cols-4 gap-6">
              {Object.entries(deptStats).map(([name, data]) => (
                <Card key={name}>
                  <h4 style={{ color: 'var(--primary-600)', margin: '0 0 8px 0' }}>{name}</h4>
                  <div className="flex justify-between py-1" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Headcount:</span>
                    <span className="font-semibold">{data.employees} Staff</span>
                  </div>
                  <div className="flex justify-between py-1" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Open Roles:</span>
                    <span className="font-semibold">{data.jobs} Listings</span>
                  </div>
                  <div className="flex justify-between py-1" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg AI Score:</span>
                    <span className="font-semibold" style={{ color: 'var(--success)' }}>{data.avgAi}%</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Department Headcount ratio & AI score SVG Charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* Headcount Ratio Chart */}
              <Card>
                <h3 className="mb-4">Department Headcount Ratio</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
                  <svg viewBox="0 0 200 200" width="100%" height="100%">
                    {/* Ring pieces */}
                    <circle cx="100" cy="100" r="70" fill="none" stroke="var(--primary-600)" strokeWidth="20" strokeDasharray="220 220" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="var(--secondary-500)" strokeWidth="20" strokeDasharray="140 300" strokeDashoffset="-220" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="var(--accent-500)" strokeWidth="20" strokeDasharray="80 360" strokeDashoffset="-360" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="var(--warning)" strokeWidth="20" strokeDasharray="40 400" strokeDashoffset="-440" />
                    
                    <text x="100" y="105" textAnchor="middle" fontSize="12" fontWeight="bold" fill="var(--text-primary)">
                      57 Total
                    </text>
                  </svg>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center" style={{ fontSize: '10px' }}>
                  <span><span style={{ width: '8px', height: '8px', backgroundColor: 'var(--primary-600)', display: 'inline-block', marginRight: '4px' }} /> Eng (39%)</span>
                  <span><span style={{ width: '8px', height: '8px', backgroundColor: 'var(--secondary-500)', display: 'inline-block', marginRight: '4px' }} /> AI/DS (25%)</span>
                  <span><span style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent-500)', display: 'inline-block', marginRight: '4px' }} /> HR (24%)</span>
                  <span><span style={{ width: '8px', height: '8px', backgroundColor: 'var(--warning)', display: 'inline-block', marginRight: '4px' }} /> Design (12%)</span>
                </div>
              </Card>

              {/* Department Avg Candidate AI score Chart */}
              <Card>
                <h3 className="mb-4">Average Screening Fit by Dept</h3>
                <div style={{ height: '220px', padding: '10px 0' }}>
                  <svg viewBox="0 0 300 150" width="100%" height="100%">
                    <line x1="40" y1="120" x2="280" y2="120" stroke="var(--border-color)" />
                    {/* Y scale guide */}
                    <line x1="40" y1="20" x2="280" y2="20" stroke="var(--border-color)" strokeDasharray="3" />
                    <line x1="40" y1="70" x2="280" y2="70" stroke="var(--border-color)" strokeDasharray="3" />

                    {/* Eng Bar */}
                    <rect x="60" y="32" width="24" height="88" fill="var(--primary-500)" rx="4" />
                    <text x="72" y="132" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">Eng</text>
                    <text x="72" y="26" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">88%</text>

                    {/* HR Bar */}
                    <rect x="120" y="38" width="24" height="82" fill="var(--secondary-400)" rx="4" />
                    <text x="132" y="132" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">HR</text>
                    <text x="132" y="32" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">82%</text>

                    {/* AI/DS Bar */}
                    <rect x="180" y="29" width="24" height="91" fill="var(--accent-500)" rx="4" />
                    <text x="192" y="132" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">AI/DS</text>
                    <text x="192" y="23" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">91%</text>

                    {/* Design Bar */}
                    <rect x="240" y="36" width="24" height="84" fill="var(--warning)" rx="4" />
                    <text x="252" y="132" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">Design</text>
                    <text x="252" y="30" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">84%</text>
                  </svg>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TAB 2: EMPLOYERS USER MANAGEMENT
  // ==========================================
  if (activeTab === 'employers') {
    const employersList = getFilteredUsers('employer');
    return (
      <div className="anim-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Employers Directory</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage recruiters, hiring managers, approve pending accounts, or suspend user access.</p>
          </div>
          <div className="flex items-center gap-2" style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search employers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', margin: 0 }}
            />
          </div>
        </div>

        <div className="table-container mb-6">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registration Date</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {employersList.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="font-semibold">{user.name}</div>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{user.email}</div>
                  </td>
                  <td>
                    <Badge variant={user.role === 'manager' ? 'ai' : 'info'}>{user.role}</Badge>
                  </td>
                  <td>
                    <Badge variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'danger' : 'warning'}>
                      {user.status || 'active'}
                    </Badge>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      {user.status === 'pending' && (
                        <>
                          <Button variant="success" size="sm" onClick={() => updateUserStatus(user.id, 'active')}>Approve</Button>
                          <Button variant="danger" size="sm" onClick={() => updateUserStatus(user.id, 'suspended')}>Reject</Button>
                        </>
                      )}
                      {user.status === 'active' && (
                        <Button variant="secondary" size="sm" style={{ color: 'var(--error)' }} onClick={() => updateUserStatus(user.id, 'suspended')}>Suspend</Button>
                      )}
                      {user.status === 'suspended' && (
                        <Button variant="success" size="sm" onClick={() => updateUserStatus(user.id, 'active')}>Activate</Button>
                      )}
                      <Button variant="ghost" size="sm" icon={<Edit size={12} />} onClick={() => handleEditOpen(user)}>Edit</Button>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} icon={<Trash2 size={12} />} onClick={() => { if(confirm('Delete account?')) deleteUser(user.id); }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {employersList.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>No employers found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* User Edit Modal */}
        <Modal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          title="Modify User Details"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleEditSubmit}>Save Changes</Button>
            </div>
          }
        >
          <form onSubmit={handleEditSubmit}>
            <Input label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <Input label="Email Address" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            <Select
              label="System Workspace Role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
              options={[
                { value: 'candidate', label: 'Candidate' },
                { value: 'recruiter', label: 'Recruiter' },
                { value: 'manager', label: 'Hiring Manager' },
                { value: 'employee', label: 'Employee' },
                { value: 'admin', label: 'Administrator' }
              ]}
            />
          </form>
        </Modal>
      </div>
    );
  }

  // ==========================================
  // TAB 3: JOB SEEKERS MANAGEMENT
  // ==========================================
  if (activeTab === 'job-seekers') {
    const seekersList = getFilteredUsers('seeker');
    return (
      <div className="anim-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Job Seekers Directory</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Review candidate credentials, verify profiles, edit user details, or suspend accounts.</p>
          </div>
          <div className="flex items-center gap-2" style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search job seekers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', margin: 0 }}
            />
          </div>
        </div>

        <div className="table-container mb-6">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Seeker Contact</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {seekersList.map((user) => {
                const isVerified = verifiedEmails.includes(user.email);
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="font-semibold">{user.name}</div>
                      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{user.email}</div>
                    </td>
                    <td>
                      <span 
                        onClick={() => handleToggleVerify(user.email)} 
                        style={{ cursor: 'pointer' }}
                        title="Click to toggle verification status"
                      >
                        <Badge variant={isVerified ? 'success' : 'warning'} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {isVerified ? <ShieldCheck size={12} /> : null}
                          {isVerified ? 'Verified Profile' : 'Pending Verification'}
                        </Badge>
                      </span>
                    </td>
                    <td>
                      <Badge variant={user.status === 'suspended' ? 'danger' : 'success'}>
                        {user.status || 'active'}
                      </Badge>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        {user.status === 'suspended' ? (
                          <Button variant="success" size="sm" onClick={() => updateUserStatus(user.id, 'active')}>Activate</Button>
                        ) : (
                          <Button variant="secondary" size="sm" style={{ color: 'var(--error)' }} onClick={() => updateUserStatus(user.id, 'suspended')}>Suspend</Button>
                        )}
                        <Button variant="ghost" size="sm" icon={<Edit size={12} />} onClick={() => handleEditOpen(user)}>Edit</Button>
                        <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} icon={<Trash2 size={12} />} onClick={() => { if(confirm('Delete account?')) deleteUser(user.id); }}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {seekersList.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>No job seekers found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB 4: JOB POSTINGS MANAGEMENT
  // ==========================================
  if (activeTab === 'jobs') {
    const jobsList = getFilteredJobs();
    return (
      <div className="anim-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Job Postings Manager</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage active listings, toggle featured statuses, or remove inappropriate posts.</p>
          </div>
          <div className="flex items-center gap-2" style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', margin: 0 }}
            />
          </div>
        </div>

        <div className="table-container mb-6">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Type / Location</th>
                <th>Featured</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobsList.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div className="font-semibold">{job.title}</div>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>ID: {job.id}</div>
                  </td>
                  <td>{job.department}</td>
                  <td>
                    <div>{job.type}</div>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{job.location}</div>
                  </td>
                  <td>
                    <button 
                      onClick={() => updateJobFeatured(job.id, !job.featured)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Click to toggle featured state"
                    >
                      <Badge variant={job.featured ? 'ai' : 'info'} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={12} fill={job.featured ? 'var(--secondary-600)' : 'transparent'} />
                        {job.featured ? 'Featured' : 'Standard'}
                      </Badge>
                    </button>
                  </td>
                  <td>
                    <Badge variant={job.status === 'active' ? 'success' : job.status === 'closed' ? 'danger' : 'warning'}>
                      {job.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {job.status === 'active' ? (
                        <Button variant="secondary" size="sm" onClick={() => updateJobStatusByAdmin(job.id, 'closed')}>Close</Button>
                      ) : (
                        <Button variant="success" size="sm" onClick={() => updateJobStatusByAdmin(job.id, 'active')}>Activate</Button>
                      )}
                      <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} icon={<Trash2 size={12} />} onClick={() => { if(confirm('Delete job posting?')) deleteJobByAdmin(job.id); }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobsList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>No jobs found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB 5: APPLICATIONS PIPELINE
  // ==========================================
  if (activeTab === 'applications') {
    return (
      <div className="anim-slide-up">
        <div className="mb-6">
          <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Global Applications Pipeline</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Observe all candidate applications, AI Match Scores, and final screening decisions.</p>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-6">
          <StatsCard title="Applied" value={candidates.filter(c => c.status === 'applied').length} icon={<Clock size={16} />} />
          <StatsCard title="AI Screening" value={candidates.filter(c => c.status === 'screening').length} icon={<Sparkles size={16} />} />
          <StatsCard title="Interviewing" value={candidates.filter(c => c.status === 'interviewing').length} icon={<Bell size={16} />} />
          <StatsCard title="Final Offered" value={candidates.filter(c => c.status === 'offered').length} icon={<ShieldCheck size={16} />} />
        </div>

        <div className="table-container mb-6">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Applied Job</th>
                <th>AI Match Score</th>
                <th>Interview Status</th>
                <th>Final Outcome</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand) => {
                const job = jobs.find(j => j.id === cand.appliedJobId);
                return (
                  <tr key={cand.id}>
                    <td>
                      <div className="font-semibold">{cand.name}</div>
                      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{cand.email}</div>
                    </td>
                    <td>{job ? job.title : 'General Requisition'}</td>
                    <td>
                      <Badge variant={cand.aiScore >= 85 ? 'success' : cand.aiScore >= 70 ? 'ai' : 'warning'}>
                        {cand.aiScore}% Match
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={cand.interviewScore ? 'success' : 'info'}>
                        {cand.interviewScore ? `${cand.interviewScore}% Score` : 'Awaiting Review'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={cand.status === 'offered' ? 'success' : cand.status === 'rejected' ? 'danger' : 'info'}>
                        {cand.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>No applications on platform yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB 6: CONTENT & FAQ/BLOG MANAGER
  // ==========================================
  if (activeTab === 'content-mgmt') {
    return (
      <div className="anim-slide-up grid grid-cols-12 gap-6">
        {/* Post New Content Form */}
        <Card className="col-span-5" style={{ gridColumn: 'span 5' }}>
          <h3 className="mb-4">Publish FAQ / Blog Article</h3>
          {contentSuccess && (
            <div className="mb-4 p-2 bg-success text-white rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '8px', fontSize: 'var(--fs-body-sm)' }}>
              ✅ Content published successfully and cataloged.
            </div>
          )}
          <form onSubmit={handleCreateContent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Select
              label="Content Classification"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as 'faq' | 'blog')}
              options={[
                { value: 'faq', label: 'FAQ (Frequently Asked Questions)' },
                { value: 'blog', label: 'Blog / Article Insights' }
              ]}
            />
            <Input
              label="Headline / Title"
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              placeholder="e.g. How does vector ingestion work?"
              required
            />
            <div className="form-group">
              <label className="form-label">Article / Answer Content Body</label>
              <textarea
                value={contentBody}
                onChange={(e) => setContentBody(e.target.value)}
                rows={6}
                required
                className="form-input"
                style={{ width: '100%', resize: 'vertical', minHeight: '120px' }}
                placeholder="Write clear, comprehensive markdown-aligned content here..."
              />
            </div>
            <Button type="submit" variant="primary" style={{ width: '100%' }}>Publish to Portal</Button>
          </form>
        </Card>

        {/* Existing Content List */}
        <Card className="col-span-7" style={{ gridColumn: 'span 7' }}>
          <h3 className="mb-4">Content Directory</h3>
          <div className="flex-col gap-4" style={{ display: 'flex', maxHeight: '420px', overflowY: 'auto' }}>
            {platformContent.map((item) => (
              <div key={item.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div className="flex justify-between items-start">
                  <Badge variant={item.type === 'faq' ? 'info' : 'ai'} style={{ textTransform: 'uppercase' }}>{item.type}</Badge>
                  <span style={{ fontSize: 'var(--fs-overline)', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <h4 style={{ margin: '8px 0 4px 0', fontSize: 'var(--fs-body)' }}>{item.title}</h4>
                <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.content}</p>
              </div>
            ))}
            {platformContent.length === 0 && (
              <div className="text-center p-4 text-muted">No content published yet.</div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // TAB 7: BROADCAST ANNOUNCEMENTS
  // ==========================================
  if (activeTab === 'notifications') {
    return (
      <div className="anim-slide-up grid grid-cols-12 gap-6">
        <Card className="col-span-6" style={{ gridColumn: 'span 6' }}>
          <h3 className="mb-4">Broadcast System Alerts</h3>
          <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '20px' }}>
            Push announcements directly to all user notifications trays. Broadcasts are dispatched instantly.
          </p>

          {broadcastSuccess && (
            <div className="mb-4 p-2 bg-success text-white rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '8px', fontSize: 'var(--fs-body-sm)' }}>
              ✅ Announcement broadcasted to all logged-in client notification bells!
            </div>
          )}

          <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Alert Message</label>
              <textarea
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                rows={4}
                required
                className="form-input"
                style={{ width: '100%', resize: 'none' }}
                placeholder="e.g. Main system maintenance is scheduled on June 5th, 2026 at 2:00 AM UTC."
              />
            </div>
            <Button type="submit" variant="primary" icon={<Bell size={16} />}>Dispatch Broadcast</Button>
          </form>
        </Card>

        {/* Dispatch Log */}
        <Card className="col-span-6" style={{ gridColumn: 'span 6' }}>
          <h3 className="mb-4">Recent Alerts Log</h3>
          <div className="flex-col gap-3" style={{ display: 'flex', maxHeight: '350px', overflowY: 'auto' }}>
            {activityLogs.filter(l => l.action.includes('Broadcast Alert') || l.action.includes('notification')).map((log) => (
              <div key={log.id} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--gray-50)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                  <span>Sender: Admin</span>
                  <span>{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: 'var(--fs-body-sm)', color: 'var(--text-primary)' }}>{log.action}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // TAB 8: AUDIT TRAILS / SYSTEM LOGS
  // ==========================================
  if (activeTab === 'logs') {
    return (
      <div className="anim-slide-up">
        <div className="mb-6">
          <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>System Audit Logs</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Chronological record of database actions, user log-in telemetry, and administrative transactions.</p>
        </div>

        <div className="table-container mb-6">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Responsible User</th>
                <th>Event Action</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td><strong>{log.user_email}</strong></td>
                  <td>{log.action}</td>
                </tr>
              ))}
              {activityLogs.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>No audit events logged in DB.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};
