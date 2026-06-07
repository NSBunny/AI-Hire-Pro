import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, StatsCard } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { Users, Briefcase, Calendar, Award, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ManagerDashboardProps {
  onNavigate: (tab: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate }) => {
  const { candidates, jobs, leaveRequests, updateLeaveStatus, updateCandidateStatus } = useApp();

  // Stats calculation
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').length;
  const teamInterviews = candidates.filter(c => c.status === 'interviewing').length;
  const deptJobs = jobs.filter(j => j.status === 'active' && j.department === 'Engineering').length;

  const handleLeaveAction = (id: string, status: 'Approved' | 'Rejected') => {
    updateLeaveStatus(id, status);
  };

  const handleCandidateOffer = (id: string, accept: boolean) => {
    updateCandidateStatus(id, accept ? 'offered' : 'rejected');
  };

  return (
    <div className="anim-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Manager Control Hub</h1>
          <p style={{ margin: 0 }}>Oversee team leave workflows, review candidate interview scores, and issue final hiring verdicts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => window.location.reload()}>
            Refresh Portal
          </Button>
          <Button variant="primary" icon={<Calendar size={16} />} onClick={() => onNavigate('leave-approvals')}>
            Manage Leaves
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Dept Open Positions"
          value={deptJobs}
          icon={<Briefcase size={18} style={{ color: 'var(--primary-600)' }} />}
          progress={60}
        />
        <StatsCard
          title="Team Interviews"
          value={teamInterviews}
          icon={<Users size={18} style={{ color: 'var(--secondary-600)' }} />}
          trend={{ value: 'Active', direction: 'up', label: 'this week' }}
        />
        <StatsCard
          title="Pending Leave Reviews"
          value={pendingLeaves}
          icon={<Calendar size={18} style={{ color: 'var(--warning)' }} />}
          trend={pendingLeaves > 0 ? { value: `${pendingLeaves} action`, direction: 'down', label: 'items pending' } : undefined}
        />
        <StatsCard
          title="Appraisals Completed"
          value="2 / 2"
          icon={<Award size={18} style={{ color: 'var(--success)' }} />}
          progress={100}
        />
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Candidates Awaiting Decision */}
        <Card className="col-span-8" style={{ gridColumn: 'span 8' }}>
          <h3 className="mb-4">Interview Decision Queue</h3>
          <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '16px' }}>
            Candidates that completed voice interviews. Review scores and extend job offers.
          </p>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>AI Score</th>
                  <th>Interview Score</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {candidates.filter(c => c.status === 'interviewing').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>
                      No candidate decisions pending.
                    </td>
                  </tr>
                ) : (
                  candidates.filter(c => c.status === 'interviewing').map(cand => {
                    const job = jobs.find(j => j.id === cand.appliedJobId);
                    return (
                      <tr key={cand.id}>
                        <td>
                          <div className="font-semibold">{cand.name}</div>
                          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{cand.email}</div>
                        </td>
                        <td>{job ? job.title : 'Unknown Role'}</td>
                        <td>
                          <Badge variant="ai">{cand.aiScore}% Match</Badge>
                        </td>
                        <td>
                          <Badge variant={cand.interviewScore && cand.interviewScore >= 80 ? 'success' : 'warning'}>
                            {cand.interviewScore ? `${cand.interviewScore}%` : 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Button variant="success" size="sm" icon={<CheckCircle size={12} />} onClick={() => handleCandidateOffer(cand.id, true)}>
                              Offer
                            </Button>
                            <Button variant="danger" size="sm" icon={<XCircle size={12} />} onClick={() => handleCandidateOffer(cand.id, false)}>
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Insight Box */}
        <Card className="col-span-4" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary-700)' }}>
              <span>🤖</span> Hiring AI Insights
            </h3>
            <div style={{
              backgroundColor: 'var(--secondary-50)',
              border: '1px solid var(--secondary-100)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--text-primary)',
              lineHeight: '1.6'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Candidate Rohan Sharma</strong> matches 96% of the <em>Senior Frontend Developer</em> opening.
              </p>
              <p style={{ margin: 0 }}>
                Recommendation: <strong>Extend offer</strong>. Candidate answered react optimization questions with high clarity (92% interview score).
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" style={{ width: '100%', marginTop: '16px' }} onClick={() => onNavigate('performance-eval')}>
            View Appraisal Insights
          </Button>
        </Card>
      </div>

      {/* Hiring Decision History Box */}
      <Card className="mb-6">
        <h3 className="mb-4">Resolved Hiring Decisions</h3>
        <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '16px' }}>
          Finalized candidate reviews. Decisions are archived and cannot be changed.
        </p>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Applied Role</th>
                <th>AI Score</th>
                <th>Interview Score</th>
                <th>Final Outcome</th>
              </tr>
            </thead>
            <tbody>
              {candidates.filter(c => c.status === 'offered' || c.status === 'rejected').length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>
                    No finalized decisions yet.
                  </td>
                </tr>
              ) : (
                candidates.filter(c => c.status === 'offered' || c.status === 'rejected').map(cand => {
                  const job = jobs.find(j => j.id === cand.appliedJobId);
                  return (
                    <tr key={cand.id}>
                      <td>
                        <div className="font-semibold">{cand.name}</div>
                        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{cand.email}</div>
                      </td>
                      <td>{job ? job.title : 'Unknown Role'}</td>
                      <td>
                        <Badge variant="ai">{cand.aiScore}% Match</Badge>
                      </td>
                      <td>
                        <Badge variant={cand.interviewScore && cand.interviewScore >= 80 ? 'success' : 'warning'}>
                          {cand.interviewScore ? `${cand.interviewScore}%` : 'N/A'}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={cand.status === 'offered' ? 'success' : 'danger'}>
                          {cand.status === 'offered' ? 'Offered' : 'Rejected'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Leave Requests Review Box */}
      <Card className="mb-6">
        <h3 className="mb-4">Pending Leave Approvals</h3>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.filter(l => l.status === 'Pending').length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>
                    No pending leave approvals.
                  </td>
                </tr>
              ) : (
                leaveRequests.filter(l => l.status === 'Pending').map(req => (
                  <tr key={req.id}>
                    <td><strong>{req.employeeName}</strong></td>
                    <td>{req.type}</td>
                    <td>{req.startDate} to {req.endDate}</td>
                    <td>{req.reason}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" onClick={() => handleLeaveAction(req.id, 'Approved')}>
                          Approve
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleLeaveAction(req.id, 'Rejected')}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
