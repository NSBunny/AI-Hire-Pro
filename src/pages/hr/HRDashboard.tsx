import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, StatsCard } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { BarChart } from '../../components/shared/Chart';
import { Users, Briefcase, FileCheck, Mic, RefreshCw, ChevronRight, Sparkles, FileText, MessageSquare, Send } from 'lucide-react';

interface HRDashboardProps {
  onNavigate: (tab: string) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ onNavigate }) => {
  const { candidates, jobs, updateCandidateStatus } = useApp();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'applied' | 'screening' | 'interviewing'>('All');

  // AI JD Generator State
  const [jdTitle, setJdTitle] = useState('');
  const [jdDept, setJdDept] = useState('');
  const [jdSkills, setJdSkills] = useState('');
  const [jdResult, setJdResult] = useState('');
  const [generatingJd, setGeneratingJd] = useState(false);

  // AI Candidate Comparison State
  const [compareCandId1, setCompareCandId1] = useState('');
  const [compareCandId2, setCompareCandId2] = useState('');
  const [compareResult, setCompareResult] = useState('');
  const [comparing, setComparing] = useState(false);

  // AI Probe Generator State
  const [probeCandId, setProbeCandId] = useState('');
  const [probeResult, setProbeResult] = useState('');
  const [generatingProbes, setGeneratingProbes] = useState(false);

  // AI Policy Chat State
  const [policyChatQuery, setPolicyChatQuery] = useState('');
  const [policyChatHistory, setPolicyChatHistory] = useState<{ sender: 'user' | 'bot'; text: string; citations?: string[] }[]>([
    { sender: 'bot', text: 'Hi Sarah, I am Ava, your AI HR Policy Advisor. Ask me anything about leave policies, payroll distributions, or company regulations.' }
  ]);
  const [sendingPolicyQuery, setSendingPolicyQuery] = useState(false);

  // Initialize selected values
  useEffect(() => {
    if (candidates && candidates.length > 0) {
      if (!compareCandId1) setCompareCandId1(candidates[0].id);
      if (!compareCandId2 && candidates.length > 1) setCompareCandId2(candidates[1].id);
      if (!probeCandId) setProbeCandId(candidates[0].id);
    }
  }, [candidates]);

  const handleGenerateJD = async () => {
    if (!jdTitle || !jdDept) return;
    setGeneratingJd(true);
    setJdResult('');
    try {
      const res = await fetch('/api/ai/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jdTitle,
          department: jdDept,
          skills: jdSkills.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setJdResult(data.descriptionMarkdown);
      } else {
        setJdResult(`Error: ${data.error || 'Failed to generate job description.'}`);
      }
    } catch (e) {
      setJdResult('Network error. Unable to connect to AI server.');
    } finally {
      setGeneratingJd(false);
    }
  };

  const handleCompareCandidates = async () => {
    const c1 = candidates.find(c => c.id === compareCandId1);
    const c2 = candidates.find(c => c.id === compareCandId2);
    if (!c1 || !c2) return;
    setComparing(true);
    setCompareResult('');
    try {
      const res = await fetch('/api/ai/compare-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate1: c1, candidate2: c2 })
      });
      const data = await res.json();
      if (res.ok) {
        setCompareResult(data.comparisonMarkdown);
      } else {
        setCompareResult(`Error: ${data.error || 'Failed to compare candidates.'}`);
      }
    } catch (e) {
      setCompareResult('Network error. Unable to compare profiles.');
    } finally {
      setComparing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    const cand = candidates.find(c => c.id === probeCandId);
    if (!cand) return;
    setGeneratingProbes(true);
    setProbeResult('');
    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateProfile: cand })
      });
      const data = await res.json();
      if (res.ok) {
        setProbeResult(data.questionsMarkdown);
      } else {
        setProbeResult(`Error: ${data.error || 'Failed to generate technical probes.'}`);
      }
    } catch (e) {
      setProbeResult('Network error. Unable to generate interview questions.');
    } finally {
      setGeneratingProbes(false);
    }
  };

  const handleSendPolicyQuery = async () => {
    if (!policyChatQuery.trim()) return;
    const userMsg = { sender: 'user' as const, text: policyChatQuery };
    setPolicyChatHistory(prev => [...prev, userMsg]);
    const query = policyChatQuery;
    setPolicyChatQuery('');
    setSendingPolicyQuery(true);
    try {
      const historyContext = policyChatHistory.slice(-6).map(m => ({ sender: m.sender, text: m.text }));
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query, chatHistory: historyContext })
      });
      const data = await res.json();
      if (res.ok) {
        setPolicyChatHistory(prev => [...prev, {
          sender: 'bot' as const,
          text: data.responseText,
          citations: data.citations
        }]);
      } else {
        setPolicyChatHistory(prev => [...prev, {
          sender: 'bot' as const,
          text: "I'm sorry, I'm having trouble retrieving policy documentation right now. Please try again."
        }]);
      }
    } catch (e) {
      setPolicyChatHistory(prev => [...prev, {
        sender: 'bot' as const,
        text: "Connection to policy advisor server offline."
      }]);
    } finally {
      setSendingPolicyQuery(false);
    }
  };

  const stats = {
    openJobs: jobs.filter(j => j.status === 'active').length,
    totalApplied: candidates.length,
    pendingScreen: candidates.filter(c => c.status === 'applied').length,
    interviews: candidates.filter(c => c.status === 'interviewing').length
  };

  const statusConfig = {
    applied: { variant: 'info' as const, label: 'Applied' },
    screening: { variant: 'warning' as const, label: 'AI Screening' },
    interviewing: { variant: 'ai' as const, label: 'Interview Scheduled' },
    offered: { variant: 'success' as const, label: 'Offered' },
    rejected: { variant: 'danger' as const, label: 'Rejected' }
  };

  const filteredCandidates = candidates.filter(c => {
    return selectedStatusFilter === 'All' || c.status === selectedStatusFilter;
  });

  const handleUpdateStatus = (id: string, newStatus: any) => {
    updateCandidateStatus(id, newStatus);
  };

  // Funnel coordinates (Applied: 100, Screening: 80, Interviewing: 50, Offered: 20)
  // Let's draw horizontal blocks forming a downward pyramid
  return (
    <div className="anim-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Recruitment Control Center</h1>
          <p style={{ margin: 0 }}>Oversee active campaigns, review AI scoring, and schedule interview panels.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => window.location.reload()}>
            Sync Data
          </Button>
          <Button variant="primary" icon={<Briefcase size={16} />} onClick={() => onNavigate('job-postings')}>
            Post New Role
          </Button>
        </div>
      </div>

      {/* Recruiter Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Active Positions"
          value={stats.openJobs}
          icon={<Briefcase size={18} style={{ color: 'var(--primary-600)' }} />}
          progress={75}
        />
        <StatsCard
          title="Total Candidates"
          value={stats.totalApplied}
          icon={<Users size={18} style={{ color: 'var(--secondary-600)' }} />}
          trend={{ value: '+14%', direction: 'up', label: 'vs last week' }}
        />
        <StatsCard
          title="Screening Backlog"
          value={stats.pendingScreen}
          icon={<FileCheck size={18} style={{ color: 'var(--warning)' }} />}
          progress={50}
        />
        <StatsCard
          title="Assigned Interviews"
          value={stats.interviews}
          icon={<Mic size={18} style={{ color: 'var(--accent-600)' }} />}
          trend={{ value: '+5', direction: 'up', label: 'scheduled' }}
        />
      </div>

      {/* Funnel & Bar Chart row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Recruitment Funnel Chart Card */}
        <Card className="col-span-1" style={{ gridColumn: 'span 1' }}>
          <h3 className="mb-4">Hiring Funnel (conversion)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
            <svg viewBox="0 0 200 200" width="100%" height="100%">
              {/* Stage 1: Applied */}
              <polygon points="20,10 180,10 160,50 40,50" fill="var(--primary-600)" opacity="0.9" />
              <text x="100" y="32" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                1. Applied ({candidates.length})
              </text>

              {/* Stage 2: Screened */}
              <polygon points="42,53 158,53 140,93 60,93" fill="var(--secondary-500)" opacity="0.9" />
              <text x="100" y="75" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                2. Screened ({candidates.filter(c => c.aiScore > 75).length})
              </text>

              {/* Stage 3: Interviewing */}
              <polygon points="62,96 138,96 120,136 80,136" fill="var(--accent-500)" opacity="0.9" />
              <text x="100" y="118" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                3. Interviewing ({stats.interviews})
              </text>

              {/* Stage 4: Offered */}
              <polygon points="82,139 118,139 105,179 95,179" fill="var(--success)" opacity="0.9" />
              <text x="100" y="161" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                4. Offered ({candidates.filter(c => c.status === 'offered').length})
              </text>
            </svg>
          </div>
        </Card>

        {/* Headcount Comparisons Chart */}
        <Card className="col-span-2" style={{ gridColumn: 'span 2' }}>
          <h3 className="mb-4">Applications by Position</h3>
          <BarChart
            data={jobs.map(j => ({
              label: j.title.substring(0, 15) + '...',
              value: candidates.filter(c => c.appliedJobId === j.id && (c.status === 'offered' || c.status === 'interviewing')).length,
              valueAlt: candidates.filter(c => c.appliedJobId === j.id).length
            }))}
            height={200}
          />
        </Card>
      </div>

      {/* Candidates List with AI Screen Scores */}
      <div className="flex justify-between items-center mb-4">
        <h3 style={{ margin: 0 }}>Active Candidates Feed</h3>
        <div className="flex gap-2">
          {['All', 'applied', 'screening', 'interviewing'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedStatusFilter(f as any)}
              className={`btn btn-sm ${selectedStatusFilter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', height: 'auto' }}
            >
              {f === 'All' ? 'All' : statusConfig[f as keyof typeof statusConfig]?.label || f}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container mb-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>Applicant Name</th>
              <th>Applied Role</th>
              <th>AI Score</th>
              <th>Recruiter Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((cand) => {
              const job = jobs.find(j => j.id === cand.appliedJobId);

              return (
                <tr key={cand.id}>
                  <td>
                    <div className="font-semibold">{cand.name}</div>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{cand.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{job ? job.title : 'Unknown Job'}</div>
                  </td>
                  <td>
                    <Badge variant={cand.aiScore >= 85 ? 'success' : cand.aiScore >= 70 ? 'ai' : 'warning'}>
                      {cand.aiScore}% Match
                    </Badge>
                  </td>
                  <td>
                    {cand.status === 'offered' || cand.status === 'rejected' ? (
                      <Badge variant={statusConfig[cand.status].variant}>
                        {statusConfig[cand.status].label}
                      </Badge>
                    ) : (
                      <select
                        value={cand.status}
                        onChange={(e) => handleUpdateStatus(cand.id, e.target.value as any)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-input)',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          fontSize: 'var(--fs-body-sm)'
                        }}
                      >
                        <option value="applied">Applied</option>
                        <option value="screening">AI Screening</option>
                        <option value="interviewing">Interview Scheduled</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />} onClick={() => onNavigate('ai-screening')}>
                      Screen Profile
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI Recruiter Copilot Toolkit */}
      <h3 className="mb-4" style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={22} style={{ color: 'var(--primary-600)' }} />
        AI Recruiter Copilot Toolkit
      </h3>

      <div className="grid grid-cols-2 gap-6 mb-8">
        
        {/* PANEL 1: AI Job Description Generator */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={18} style={{ color: 'var(--primary-600)' }} />
            AI Job Description Generator
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
            Instantly write comprehensive, search-optimized JDs for open positions.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Job Title (e.g. Node Backend Engineer)"
              value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
              className="form-input"
              style={{ flex: 1, margin: 0 }}
            />
            <input
              type="text"
              placeholder="Department (e.g. Engineering)"
              value={jdDept}
              onChange={(e) => setJdDept(e.target.value)}
              className="form-input"
              style={{ flex: 1, margin: 0 }}
            />
          </div>

          <input
            type="text"
            placeholder="Required Skills (e.g. Node.js, Express, Postgres)"
            value={jdSkills}
            onChange={(e) => setJdSkills(e.target.value)}
            className="form-input"
            style={{ margin: 0 }}
          />

          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateJD}
            disabled={generatingJd || !jdTitle || !jdDept}
            style={{ alignSelf: 'flex-start' }}
          >
            {generatingJd ? 'Generating JD...' : 'Generate Description'}
          </Button>

          {jdResult && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--gray-50)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: '1.6',
              maxHeight: '180px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-primary)'
            }}>
              {jdResult}
            </div>
          )}
        </Card>

        {/* PANEL 2: AI Candidate Benchmark & Comparison */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={18} style={{ color: 'var(--secondary-600)' }} />
            AI Candidate Comparison Benchmark
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
            Compare candidate profiles, experience levels, and communication reports side-by-side.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Candidate 1</label>
              <select
                value={compareCandId1}
                onChange={(e) => setCompareCandId1(e.target.value)}
                className="form-input"
                style={{ width: '100%', margin: 0, backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-input)', borderRadius: '8px' }}
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.aiScore}%)</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Candidate 2</label>
              <select
                value={compareCandId2}
                onChange={(e) => setCompareCandId2(e.target.value)}
                className="form-input"
                style={{ width: '100%', margin: 0, backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-input)', borderRadius: '8px' }}
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.aiScore}%)</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCompareCandidates}
            disabled={comparing || !compareCandId1 || !compareCandId2 || compareCandId1 === compareCandId2}
            style={{ alignSelf: 'flex-start' }}
          >
            {comparing ? 'Comparing Profiles...' : 'Run Comparative Analysis'}
          </Button>

          {compareResult && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--gray-50)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: '1.6',
              maxHeight: '180px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-primary)'
            }}>
              {compareResult}
            </div>
          )}
        </Card>

        {/* PANEL 3: AI Interview Technical Probes Generator */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mic size={18} style={{ color: 'var(--accent-600)' }} />
            AI Technical Probes & Question Generator
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
            Generate 5 deep-probe interview questions custom-tailored to a candidate's specific resume.
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Select Candidate</label>
              <select
                value={probeCandId}
                onChange={(e) => setProbeCandId(e.target.value)}
                className="form-input"
                style={{ width: '100%', margin: 0, backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-input)', borderRadius: '8px' }}
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - Applied to {jobs.find(j => j.id === c.appliedJobId)?.title || 'Role'}</option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateQuestions}
              disabled={generatingProbes || !probeCandId}
            >
              {generatingProbes ? 'Generating Questions...' : 'Generate Probes'}
            </Button>
          </div>

          {probeResult && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--gray-50)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: '1.6',
              maxHeight: '180px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-primary)'
            }}>
              {probeResult}
            </div>
          )}
        </Card>

        {/* PANEL 4: AI Policy Advisor Chatbot */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={18} style={{ color: 'var(--success)' }} />
            AI HR Policy Advisor (Ava)
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
            Ask Ava about employee handbook guidelines, leaves allocation, or platform audits.
          </p>

          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px',
            height: '160px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: 'var(--bg-card)'
          }}>
            {policyChatHistory.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? 'var(--primary-600)' : 'var(--gray-100)',
                color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: '8px',
                maxWidth: '85%',
                fontSize: '11px',
                lineHeight: '1.4'
              }}>
                <div>{msg.text}</div>
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ fontSize: '9px', opacity: 0.75, borderTop: '1px solid rgba(0,0,0,0.1)', marginTop: '4px', paddingTop: '2px' }}>
                    Sources: {msg.citations.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. What is our annual leave policy details?"
              value={policyChatQuery}
              onChange={(e) => setPolicyChatQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPolicyQuery()}
              className="form-input"
              style={{ flex: 1, margin: 0 }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendPolicyQuery}
              disabled={sendingPolicyQuery || !policyChatQuery.trim()}
              icon={<Send size={12} />}
            />
          </div>
        </Card>

      </div>
    </div>
  );
};
