import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, StatsCard } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { Briefcase, Mic, CheckCircle, FileText, Zap, Compass, Sparkles, AlertTriangle } from 'lucide-react';

interface CandidateDashboardProps {
  onNavigate: (tab: string) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigate }) => {
  const { candidates, jobs, currentUser } = useApp();

  const [bulletInput, setBulletInput] = useState('');
  const [targetSkill, setTargetSkill] = useState('React');
  const [enhancedResult, setEnhancedResult] = useState('');
  const [enhancing, setEnhancing] = useState(false);

  const handleEnhanceBullet = async () => {
    if (!bulletInput.trim()) return;
    setEnhancing(true);
    setEnhancedResult('');
    try {
      const res = await fetch('/api/ai/enhance-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet: bulletInput, skill: targetSkill })
      });
      const data = await res.json();
      if (res.ok) {
        setEnhancedResult(data.enhancedBullet);
      } else {
        setEnhancedResult(`Failed to enhance: ${data.error || 'Server error'}`);
      }
    } catch (e) {
      setEnhancedResult('Network error. Unable to connect to AI enhancer.');
    } finally {
      setEnhancing(false);
    }
  };

  // Find candidate profile by logged-in user email, fallback to guest object
  const candidateProfile = candidates.find(c => c.email.toLowerCase() === currentUser?.email?.toLowerCase()) || {
    id: `cand-guest`,
    name: currentUser?.name || 'Guest Candidate',
    email: currentUser?.email || 'guest@example.com',
    phone: '+91 99999 99999',
    appliedJobId: jobs[0]?.id || 'job-1',
    status: 'screening' as const,
    resumeName: 'Uploaded_Resume.pdf',
    skillsMatched: ['React', 'TypeScript', 'CSS'],
    skillsMissing: [],
    aiScore: 85,
    aiRecommendation: 'GUEST PROFILE: Generated mock assessment parameters.',
    matchBreakdown: { skills: 85, experience: 80, education: 90, cultural: 85 }
  };
  
  // Find applied job details
  const appliedJob = jobs.find(j => j.id === candidateProfile.appliedJobId);

  // Status mapping to color
  const statusConfig = {
    applied: { variant: 'info' as const, label: 'Applied' },
    screening: { variant: 'warning' as const, label: 'AI Screening' },
    interviewing: { variant: 'ai' as const, label: 'Interview Scheduled' },
    offered: { variant: 'success' as const, label: 'Offer Received' },
    rejected: { variant: 'danger' as const, label: 'Declined' }
  };

  const currentStatus = statusConfig[candidateProfile.status] || { variant: 'info' as const, label: 'Applied' };

  return (
    <div className="anim-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Welcome back, {currentUser?.name || candidateProfile?.name || 'Candidate'}</h1>
          <p style={{ margin: 0 }}>Track your applications and complete pending assessments.</p>
        </div>
        <Button variant="primary" size="md" icon={<Briefcase size={16} />} onClick={() => onNavigate('job-search')}>
          Search Job Openings
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Total Applications"
          value="1"
          icon={<FileText size={18} style={{ color: 'var(--primary-600)' }} />}
          progress={100}
        />
        <StatsCard
          title="Profile AI Score"
          value={`${candidateProfile.aiScore}%`}
          icon={<CheckCircle size={18} style={{ color: 'var(--secondary-600)' }} />}
          trend={{ value: '+5.2%', direction: 'up', label: 'vs benchmark' }}
        />
        <StatsCard
          title="Action Items"
          value={candidateProfile.status === 'interviewing' && !candidateProfile.interviewScore ? '1 Assessment' : '0 Pending'}
          icon={<Mic size={18} style={{ color: 'var(--accent-600)' }} />}
          progress={candidateProfile.status === 'interviewing' && !candidateProfile.interviewScore ? 50 : 100}
        />
      </div>

      {/* Application details */}
      <h3 className="mb-4">Active Applications</h3>
      {appliedJob ? (
        <Card hoverable className="mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 style={{ margin: 0, fontSize: 'var(--fs-h2)' }}>{appliedJob.title}</h2>
                <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
              </div>
              <p style={{ margin: '0 0 12px 0' }}>
                {appliedJob.department} · {appliedJob.location} · {appliedJob.type}
              </p>
              <div className="flex gap-2 flex-wrap">
                {appliedJob.skills.map((skill) => (
                  <span key={skill} className="tag">{skill}</span>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: '150px' }}>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Applied on May 31, 2026
              </div>
              {candidateProfile.status === 'screening' && !candidateProfile.chatScreeningScore && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => onNavigate('ai-chat-screening')}
                  className="anim-pulse-border"
                  style={{ marginBottom: '8px' }}
                >
                  Start AI Chat Screening
                </Button>
              )}
              {candidateProfile.chatScreeningScore && (
                <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: 'var(--fs-body-sm)', marginBottom: '6px' }}>
                  ✓ AI Chat Screening Complete ({candidateProfile.chatScreeningScore}%)
                </div>
              )}
              {candidateProfile.status === 'interviewing' && !candidateProfile.interviewScore && (
                <Button
                  variant="success"
                  size="sm"
                  icon={<Mic size={14} />}
                  onClick={() => onNavigate('ai-interview')}
                  className="anim-pulse-border"
                >
                  Start Voice Interview
                </Button>
              )}
              {candidateProfile.interviewScore && (
                <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: 'var(--fs-body-sm)' }}>
                  ✓ Voice Interview Complete ({candidateProfile.interviewScore}%)
                </div>
              )}
            </div>
          </div>

          {/* Screening detailed results */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--gray-50)',
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            <div className="flex items-center gap-2 mb-2 font-semibold" style={{ color: 'var(--secondary-600)' }}>
              <span>🤖</span> AI Screen Match Breakdown
            </div>
            <p style={{ fontSize: 'var(--fs-body-sm)', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
              {candidateProfile.aiRecommendation}
            </p>

            <div className="grid grid-cols-4 gap-4" style={{ fontSize: 'var(--fs-caption)' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Skill Match</div>
                <div className="font-bold" style={{ color: 'var(--primary-600)', fontSize: 'var(--fs-body-sm)' }}>
                  {candidateProfile.matchBreakdown.skills}%
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Experience Fit</div>
                <div className="font-bold" style={{ color: 'var(--primary-600)', fontSize: 'var(--fs-body-sm)' }}>
                  {candidateProfile.matchBreakdown.experience}%
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Education Match</div>
                <div className="font-bold" style={{ color: 'var(--primary-600)', fontSize: 'var(--fs-body-sm)' }}>
                  {candidateProfile.matchBreakdown.education}%
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Cultural Index</div>
                <div className="font-bold" style={{ color: 'var(--primary-600)', fontSize: 'var(--fs-body-sm)' }}>
                  {candidateProfile.matchBreakdown.cultural}%
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="text-center py-8">
          <p>You have not applied for any jobs yet.</p>
          <Button variant="primary" onClick={() => onNavigate('job-search')}>
            Browse Jobs
          </Button>
        </Card>
      )}

      {/* AI Career Copilot Toolkit */}
      <h3 className="mb-4" style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={22} style={{ color: 'var(--primary-600)' }} />
        AI Career Copilot Toolkit
      </h3>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        
        {/* WIDGET 1: ATS Scorecard & AI Resume Audit */}
        <Card style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="flex justify-between items-center">
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={18} style={{ color: 'var(--accent-600)' }} />
              ATS Scorecard & AI Resume Audit
            </h4>
            <Badge variant="ai">ATS Score: {candidateProfile.aiScore}%</Badge>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Actionable Resume Recommendations:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--fs-body-sm)', lineHeight: '1.6' }}>
              {candidateProfile.resumeSuggestions && candidateProfile.resumeSuggestions.length > 0 ? (
                candidateProfile.resumeSuggestions.map((suggestion, idx) => (
                  <li key={idx} style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>
                    {suggestion}
                  </li>
                ))
              ) : (
                <>
                  <li style={{ marginBottom: '6px' }}>Add details about state management and bundlers like Vite.</li>
                  <li style={{ marginBottom: '6px' }}>Quantify achievements (e.g., 'improved performance by 30%').</li>
                  <li style={{ marginBottom: '6px' }}>Incorporate typescript typing structures under main projects.</li>
                </>
              )}
            </ul>
          </div>
        </Card>

        {/* WIDGET 2: AI Recommended Jobs */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={18} style={{ color: 'var(--primary-600)' }} />
            AI Recommended Jobs & Skill Match
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '180px' }}>
            {jobs && jobs.filter(j => j.id !== candidateProfile.appliedJobId).map(job => {
              const matchedCount = job.skills.filter(s => (candidateProfile.skillsMatched || []).includes(s)).length;
              const matchPct = Math.round((matchedCount / (job.skills.length || 1)) * 100);
              
              return (
                <div key={job.id} className="flex justify-between items-center" style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--gray-50)'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{job.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{job.department} · {job.location}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={matchPct > 70 ? 'success' : 'info'}>{matchPct}% Match</Badge>
                    <Button variant="secondary" size="sm" onClick={() => onNavigate('job-search')}>
                      Apply
                    </Button>
                  </div>
                </div>
              );
            })}
            {(!jobs || jobs.filter(j => j.id !== candidateProfile.appliedJobId).length === 0) && (
              <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-muted)', textAlign: 'center' }}>
                No other matching roles at this time.
              </div>
            )}
          </div>
        </Card>

        {/* WIDGET 3: AI Resume Bullet Enhancer */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={18} style={{ color: 'var(--secondary-600)' }} />
            AI Resume Bullet Enhancer
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
            Turn basic achievements into high-impact, professional descriptions using Gemini AI.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={bulletInput}
              onChange={(e) => setBulletInput(e.target.value)}
              placeholder="e.g. I did coding using React and optimized the code"
              className="form-input"
              style={{ flex: 1, margin: 0 }}
            />
            
            <select
              value={targetSkill}
              onChange={(e) => setTargetSkill(e.target.value)}
              className="form-input"
              style={{
                width: '120px',
                margin: 0,
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-input)',
                borderRadius: '8px'
              }}
            >
              {Array.from(new Set([...(candidateProfile.skillsMatched || []), ...(candidateProfile.skillsMissing || []), 'React', 'TypeScript', 'Node.js', 'Python', 'FastAPI'])).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleEnhanceBullet}
            disabled={enhancing || !bulletInput.trim()}
            style={{ alignSelf: 'flex-start' }}
          >
            {enhancing ? 'Enhancing with AI...' : 'Enhance with AI'}
          </Button>

          {enhancedResult && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              borderRadius: '8px',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--primary-900)',
              lineHeight: '1.5',
              position: 'relative'
            }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary-600)', marginBottom: '4px' }}>
                Gemini Professional Suggestion:
              </div>
              "{enhancedResult}"
              <button
                onClick={() => navigator.clipboard.writeText(enhancedResult)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-600)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                Copy
              </button>
            </div>
          )}
        </Card>

        {/* WIDGET 4: AI Speech Coach Insights */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mic size={18} style={{ color: 'var(--accent-600)' }} />
            AI Speech Coach Insights
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="flex justify-between items-center" style={{ fontSize: 'var(--fs-body-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pacing Velocity:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {candidateProfile.communicationAnalysis?.pace || '128 wpm (Good)'}
              </span>
            </div>
            
            <div className="flex justify-between items-center" style={{ fontSize: 'var(--fs-body-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Filler Words:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {candidateProfile.communicationAnalysis?.fillerWords?.length ? (
                  <>
                    <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
                    {candidateProfile.communicationAnalysis.fillerWords.join(', ')}
                  </>
                ) : 'None (Excellent)'}
              </span>
            </div>

            <div className="flex justify-between items-center" style={{ fontSize: 'var(--fs-body-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Delivery Tone:</span>
              <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                {candidateProfile.communicationAnalysis?.tone || 'Confident & Professional'}
              </span>
            </div>

            <div className="flex justify-between items-center" style={{ fontSize: 'var(--fs-body-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Articulation Clarity:</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                {candidateProfile.communicationAnalysis?.clarity || 92}%
              </span>
            </div>

            <div style={{
              marginTop: '8px',
              padding: '10px 12px',
              backgroundColor: 'var(--gray-50)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: '1.5',
              color: 'var(--text-secondary)'
            }}>
              <strong>Coach Advice:</strong> Maintain your articulate structure, but try to minimize using placeholder transition terms during technical deep dives.
            </div>
          </div>
        </Card>
        
      </div>
    </div>
  );
};
