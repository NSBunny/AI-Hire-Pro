import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, StatsCard } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { Input, Textarea, Select } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { Calendar, Clock, Award, FileText, CheckCircle2, DollarSign } from 'lucide-react';

interface EmployeeDashboardProps {
  activeTab: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ activeTab }) => {
  const {
    attendance,
    clockIn,
    clockOut,
    leaveBalances,
    leaveRequests,
    submitLeaveRequest,
    payslips
  } = useApp();

  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  
  // Leave Request Form state
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'Sick' | 'Casual' | 'Annual'>('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Performance Form State
  const [selfScore, setSelfScore] = useState('85');
  const [selfRemarks, setSelfRemarks] = useState('');
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.date === todayStr);
  const isClockedIn = todayRecord && todayRecord.checkOut === null;
  const isClockedOut = todayRecord && todayRecord.checkOut !== null;

  const handleClockAction = () => {
    if (!isClockedIn && !isClockedOut) {
      clockIn();
      alert('Clocked In successfully! Logged check-in time.');
    } else if (isClockedIn) {
      clockOut();
      alert('Clocked Out successfully! Duration calculated.');
    }
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !leaveReason) {
      alert('Please fill out dates and reasons.');
      return;
    }
    submitLeaveRequest({
      type: leaveType,
      startDate,
      endDate,
      reason: leaveReason
    });
    setLeaveModalOpen(false);
    setStartDate('');
    setEndDate('');
    setLeaveReason('');
    alert('Leave request submitted. Status set to Pending approval.');
  };

  // ==========================================
  // TAB 1: EMPLOYEE HUB (DASHBOARD)
  // ==========================================
  if (activeTab === 'dashboard') {
    return (
      <div className="anim-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Employee Workspace</h1>
            <p style={{ margin: 0 }}>Log daily hours, request leaves, and download payslips.</p>
          </div>
          {/* Check-In clock controls */}
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
              {todayRecord ? `Today: Clocked In at ${todayRecord.checkIn}` : 'Not clocked in today'}
            </span>
            <Button
              variant={isClockedIn ? 'danger' : 'primary'}
              icon={<Clock size={16} />}
              onClick={handleClockAction}
              disabled={isClockedOut}
            >
              {isClockedOut ? 'Shift Completed' : isClockedIn ? 'Clock Out' : 'Clock In'}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <StatsCard
            title="Leave Balances"
            value={`${leaveBalances.Annual + leaveBalances.Casual + leaveBalances.Sick} Days`}
            icon={<Calendar size={18} style={{ color: 'var(--primary-600)' }} />}
            progress={Math.round(((leaveBalances.Annual + leaveBalances.Casual + leaveBalances.Sick) / 28) * 100)}
          />
          <StatsCard
            title="Shift Hours (This month)"
            value="164.5 Hours"
            icon={<Clock size={18} style={{ color: 'var(--accent-600)' }} />}
            trend={{ value: '+4.2%', direction: 'up', label: 'vs baseline' }}
          />
          <StatsCard
            title="Self KPI Review"
            value="P0 Pending"
            icon={<Award size={18} style={{ color: 'var(--secondary-600)' }} />}
            progress={25}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Leave requests summary */}
          <Card className="col-span-2" style={{ gridColumn: 'span 2' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ margin: 0 }}>Leave Tracking</h3>
              <Button variant="secondary" size="sm" onClick={() => setLeaveModalOpen(true)}>
                File Leave Request
              </Button>
            </div>
            
            {leaveRequests.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No leave records on file.</p>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((req) => (
                      <tr key={req.id}>
                        <td><strong>{req.type}</strong></td>
                        <td>{req.startDate} to {req.endDate}</td>
                        <td>{req.reason}</td>
                        <td>
                          <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'}>
                            {req.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Quick tasks */}
          <Card className="col-span-1" style={{ gridColumn: 'span 1' }}>
            <h3 className="mb-4">Upcoming Reminders</h3>
            <div className="flex-col gap-3" style={{ display: 'flex', fontSize: 'var(--fs-body-sm)' }}>
              <div className="flex gap-2 items-start">
                <CheckCircle2 size={16} style={{ color: 'var(--success)', marginTop: '2px' }} />
                <div>
                  <div className="font-semibold">Submit Q2 performance review</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>Due by June 10, 2026</div>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 size={16} style={{ color: 'var(--primary-300)', marginTop: '2px' }} />
                <div>
                  <div className="font-semibold">Verify payslip allowances</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>Released on May 31</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Leave application Modal */}
        <Modal
          isOpen={isLeaveModalOpen}
          onClose={() => setLeaveModalOpen(false)}
          title="Apply for Leave"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="ghost" onClick={() => setLeaveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleApplyLeave}>
                Submit Request
              </Button>
            </div>
          }
        >
          <form onSubmit={handleApplyLeave}>
            <Select
              label="Leave Type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              options={[
                { value: 'Annual', label: `Annual Leave (${leaveBalances.Annual} remaining)` },
                { value: 'Casual', label: `Casual Leave (${leaveBalances.Casual} remaining)` },
                { value: 'Sick', label: `Sick Leave (${leaveBalances.Sick} remaining)` }
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <Textarea
              label="Reason for Leave"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g. Personal travel or medical checkup"
              required
            />
          </form>
        </Modal>
      </div>
    );
  }

  // ==========================================
  // TAB 2: ATTENDANCE HISTORY LOGS
  // ==========================================
  if (activeTab === 'attendance') {
    return (
      <div className="anim-slide-up">
        <h2 className="mb-4">Attendance logs</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration (hrs)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((rec) => (
                <tr key={rec.id}>
                  <td>{rec.date}</td>
                  <td>{rec.checkIn}</td>
                  <td>{rec.checkOut || 'Active Shift'}</td>
                  <td>{rec.durationHours !== null ? `${rec.durationHours} hrs` : '-'}</td>
                  <td>
                    <Badge variant={rec.status === 'Present' ? 'success' : 'warning'}>
                      {rec.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB 3: PAYROLL / PAYSLIP LISTING
  // ==========================================
  if (activeTab === 'payslips') {
    return (
      <div className="anim-slide-up">
        <h2 className="mb-4">My Payroll</h2>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <StatsCard
            title="Monthly Basic Pay"
            value="₹85,000"
            icon={<DollarSign size={18} style={{ color: 'var(--primary-600)' }} />}
            progress={100}
          />
          <StatsCard
            title="Total Allowances"
            value="₹25,000"
            icon={<DollarSign size={18} style={{ color: 'var(--success)' }} />}
            progress={100}
          />
          <StatsCard
            title="Deductions / Taxes"
            value="₹12,000"
            icon={<DollarSign size={18} style={{ color: 'var(--error)' }} />}
            progress={100}
          />
        </div>

        <div className="table-container mb-6">
          <table className="data-table">
            <thead>
              <tr>
                <th>Billing Cycle</th>
                <th>Issued Date</th>
                <th>Net Salary paid</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((slip) => (
                <tr key={slip.id}>
                  <td><strong>{slip.month} {slip.year}</strong></td>
                  <td>{slip.issuedDate}</td>
                  <td>₹{slip.net.toLocaleString()}</td>
                  <td>
                    <Badge variant="success">{slip.status}</Badge>
                  </td>
                  <td>
                    <Button variant="secondary" size="sm" icon={<FileText size={14} />} onClick={() => setSelectedPayslip(slip)}>
                      View Payslip Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payslip PDF mockup Modal */}
        {selectedPayslip && (
          <Modal
            isOpen={selectedPayslip !== null}
            onClose={() => setSelectedPayslip(null)}
            title={`Payslip: ${selectedPayslip.month} ${selectedPayslip.year}`}
            size="lg"
            footer={
              <Button variant="primary" onClick={() => { alert('Downloading payslip PDF...'); setSelectedPayslip(null); }}>
                Download PDF Document
              </Button>
            }
          >
            <div style={{ padding: '20px', fontFamily: 'monospace', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
                <h2 style={{ color: 'var(--primary-600)', margin: 0 }}>AIHIRE PRO ENTERPRISES</h2>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Bangalore Industrial Area, KA, IN</div>
                <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 'bold', marginTop: '6px' }}>SALARY DISBURSEMENT STATEMENT</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6" style={{ fontSize: 'var(--fs-body-sm)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <strong>Employee ID:</strong> EMP-101
                  <br />
                  <strong>Name:</strong> Jane Doe
                  <br />
                  <strong>Department:</strong> Engineering
                </div>
                <div>
                  <strong>Payment Cycle:</strong> {selectedPayslip.month} {selectedPayslip.year}
                  <br />
                  <strong>Disbursement Date:</strong> {selectedPayslip.issuedDate}
                  <br />
                  <strong>Payment Channel:</strong> Direct Bank Deposit
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6" style={{ fontSize: 'var(--fs-body-sm)' }}>
                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>EARNINGS</h4>
                  <div className="flex justify-between py-1">
                    <span>Basic Pay:</span>
                    <span>₹{selectedPayslip.basic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>House Rent Allowance:</span>
                    <span>₹15,000</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Medical Reimbursements:</span>
                    <span>₹10,000</span>
                  </div>
                  <div className="flex justify-between py-1" style={{ borderTop: '1px solid var(--border-color)', fontWeight: 'bold' }}>
                    <span>Gross Salary:</span>
                    <span>₹{(selectedPayslip.basic + selectedPayslip.allowances).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>DEDUCTIONS</h4>
                  <div className="flex justify-between py-1">
                    <span>Provident Fund (PF):</span>
                    <span>₹8,000</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Income Tax (TDS):</span>
                    <span>₹4,000</span>
                  </div>
                  <div className="flex justify-between py-1" style={{ borderTop: '1px solid var(--border-color)', fontWeight: 'bold' }}>
                    <span>Total Deductions:</span>
                    <span>₹{selectedPayslip.deductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '32px',
                  padding: '16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary-50)',
                  border: '1px solid var(--primary-100)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: 'var(--fs-body-sm)',
                  color: 'var(--primary-700)'
                }}
              >
                <span>NET PAYOUT DISBURSED:</span>
                <span>₹{selectedPayslip.net.toLocaleString()}</span>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ==========================================
  // TAB 4: PERFORMANCE EVALUATIONS
  // ==========================================
  if (activeTab === 'performance') {
    return (
      <div className="anim-slide-up" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h2 className="mb-4">Self Appraisal & AI Insights</h2>
        <Card className="mb-6">
          <h3 className="mb-3">Q2 Self Assessment Requisition</h3>
          
          {isReviewSubmitted ? (
            <div className="text-center py-6">
              <span style={{ fontSize: '2rem' }}>✓</span>
              <h3 style={{ color: 'var(--success)' }}>Appraisal Submitted!</h3>
              <p>Your self-performance report has been submitted to your manager. Review metrics below.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setIsReviewSubmitted(true); }}>
              <Select
                label="Select Self Rating Indicator *"
                value={selfScore}
                onChange={(e) => setSelfScore(e.target.value)}
                options={[
                  { value: '95', label: 'Outstanding (95%)' },
                  { value: '85', label: 'Strong contributor (85%)' },
                  { value: '75', label: 'Satisfactory (75%)' },
                  { value: '60', label: 'Requires improvement (60%)' }
                ]}
              />
              <Textarea
                label="Self Assessment Remarks *"
                value={selfRemarks}
                onChange={(e) => setSelfRemarks(e.target.value)}
                placeholder="Detail key achievements, completed milestones, and feedback regarding Q2 goals..."
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="submit" variant="primary">Submit Review</Button>
              </div>
            </form>
          )}
        </Card>

        {/* AI performance projection cards */}
        <Card style={{ backgroundColor: 'var(--secondary-50)', border: '1px solid var(--secondary-100)' }}>
          <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary-700)' }}>
            <span>🤖</span> AI Performance Projection
          </h3>
          <p style={{ fontSize: 'var(--fs-body-sm)', margin: '0 0 16px 0', color: 'var(--text-primary)', lineHeight: '1.6' }}>
            Based on attendance metrics (99% promptness), leave utilization indices, and team project velocity trackers, the XGBoost engine calculates a <strong>High Promotion Fit</strong> with an estimated efficiency multiplier of 1.14x for Q3 cycles.
          </p>
          <div className="flex justify-between items-center font-semibold" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--secondary-600)' }}>
            <span>Promotion Recommendation Score:</span>
            <span>91% (Excellent)</span>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};
