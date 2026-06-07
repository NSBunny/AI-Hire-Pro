import React, { useState } from 'react';
import { useApp, type Candidate } from '../../context/AppContext';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { RadarChart } from '../../components/shared/Chart';
import { FileText, Calendar, Check, X, Mail, Phone, Play, Pause, MessageSquare } from 'lucide-react';

export const ResumeScreening: React.FC = () => {
  const { candidates, jobs, updateCandidateStatus } = useApp();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || '');

  const activeCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];
  const appliedJob = activeCandidate ? jobs.find(j => j.id === activeCandidate.appliedJobId) : null;

  const [playingTranscriptIndex, setPlayingTranscriptIndex] = useState<number | null>(null);

  const handlePlayVoice = (text: string, idx: number) => {
    if (playingTranscriptIndex === idx) {
      window.speechSynthesis.cancel();
      setPlayingTranscriptIndex(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setPlayingTranscriptIndex(null);
      };
      utterance.onerror = () => {
        setPlayingTranscriptIndex(null);
      };
      setPlayingTranscriptIndex(idx);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStatusChange = (status: Candidate['status']) => {
    if (activeCandidate) {
      updateCandidateStatus(activeCandidate.id, status);
    }
  };

  if (!activeCandidate) {
    return (
      <Card className="text-center py-8">
        <p>No candidate records available for screening.</p>
      </Card>
    );
  }

  // Calculate circular SVG progress values
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activeCandidate.aiScore / 100) * circumference;

  return (
    <div className="anim-slide-up" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
      {/* Candidates Sidebar List */}
      <div className="flex-col gap-4" style={{ display: 'flex' }}>
        <h3 style={{ margin: 0 }}>Applicants ({candidates.length})</h3>
        <div
          className="flex-col gap-2"
          style={{
            display: 'flex',
            maxHeight: 'calc(100vh - 180px)',
            overflowY: 'auto',
            borderRight: '1px solid var(--border-color)',
            paddingRight: '12px'
          }}
        >
          {candidates.map((c) => {
            const job = jobs.find(j => j.id === c.appliedJobId);
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCandidateId(c.id)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${selectedCandidateId === c.id ? 'var(--primary-300)' : 'var(--border-color)'}`,
                  backgroundColor: selectedCandidateId === c.id ? 'var(--primary-50)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)'
                }}
              >
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job ? job.title : 'General Requisition'}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span style={{ fontSize: 'var(--fs-overline)', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {c.status}
                  </span>
                  <Badge variant={c.aiScore >= 85 ? 'success' : 'ai'}>{c.aiScore}%</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Review Section */}
      <div className="flex-col gap-6" style={{ display: 'flex' }}>
        {/* Profile General Summary Card */}
        <Card>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeCandidate.name}
              </h1>
              <p style={{ margin: '4px 0 12px 0' }}>
                Applied for <strong>{appliedJob ? appliedJob.title : 'Unknown'}</strong> · Department of {appliedJob ? appliedJob.department : 'General'}
              </p>
              
              <div className="flex gap-4 flex-wrap" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1"><Mail size={14} /> {activeCandidate.email}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {activeCandidate.phone}</span>
                <span className="flex items-center gap-1"><FileText size={14} /> {activeCandidate.resumeName}</span>
              </div>
            </div>

            {/* Circular AI score display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--gray-200)" strokeWidth={strokeWidth} />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="var(--secondary-500)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}
                >
                  <div className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--secondary-600)', lineHeight: '1' }}>
                    {activeCandidate.aiScore}%
                  </div>
                  <div style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 'bold' }}>
                    AI Fit
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <Button
              variant="success"
              size="sm"
              icon={<Check size={16} />}
              onClick={() => handleStatusChange('offered')}
              disabled={activeCandidate.status === 'offered' || activeCandidate.status === 'rejected'}
            >
              Extend Offer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Calendar size={16} />}
              onClick={() => handleStatusChange('interviewing')}
              disabled={activeCandidate.status === 'interviewing' || activeCandidate.status === 'offered' || activeCandidate.status === 'rejected'}
            >
              Schedule Interview
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange('screening')}
              disabled={activeCandidate.status === 'screening' || activeCandidate.status === 'interviewing' || activeCandidate.status === 'offered' || activeCandidate.status === 'rejected'}
            >
              Request AI Screening
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<X size={16} />}
              onClick={() => handleStatusChange('rejected')}
              disabled={activeCandidate.status === 'rejected' || activeCandidate.status === 'offered'}
            >
              Reject Candidate
            </Button>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
              Current: <Badge variant={activeCandidate.status === 'offered' ? 'success' : activeCandidate.status === 'rejected' ? 'danger' : activeCandidate.status === 'screening' ? 'warning' : 'info'}>{activeCandidate.status}</Badge>
            </span>
          </div>
        </Card>

        {/* AI Recommendations Panel */}
        <Card style={{ backgroundColor: 'var(--secondary-50)', border: '1px solid var(--secondary-100)' }}>
          <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary-700)' }}>
            <span>🤖</span> AI Screen Ingestion Analysis
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-body-sm)', color: 'var(--text-primary)', lineHeight: '1.6' }}>
            {activeCandidate.aiRecommendation}
          </p>

          <div className="grid grid-cols-4 gap-4" style={{ borderTop: '1px dashed var(--secondary-200)', paddingTop: '16px' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>Skills Index</div>
              <div className="font-bold" style={{ fontSize: '1.15rem', color: 'var(--secondary-700)' }}>
                {activeCandidate.matchBreakdown.skills}%
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>Experience Fit</div>
              <div className="font-bold" style={{ fontSize: '1.15rem', color: 'var(--secondary-700)' }}>
                {activeCandidate.matchBreakdown.experience}%
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>Education Match</div>
              <div className="font-bold" style={{ fontSize: '1.15rem', color: 'var(--secondary-700)' }}>
                {activeCandidate.matchBreakdown.education}%
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>Cultural Index</div>
              <div className="font-bold" style={{ fontSize: '1.15rem', color: 'var(--secondary-700)' }}>
                {activeCandidate.matchBreakdown.cultural}%
              </div>
            </div>
          </div>
        </Card>

        {/* Skills Matches & Misses Card */}
        <Card>
          <h3 className="mb-4">Ingestion Skill Taxonomy Mapping</h3>
          <div className="flex-col gap-4" style={{ display: 'flex' }}>
            <div>
              <h4 style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> Matched Requirements ({activeCandidate.skillsMatched.length})
              </h4>
              <div className="flex gap-2 flex-wrap">
                {activeCandidate.skillsMatched.map(s => (
                  <Badge key={s} variant="success">{s}</Badge>
                ))}
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--error)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <X size={16} /> Unmatched / Missing Requirements ({activeCandidate.skillsMissing.length})
              </h4>
              <div className="flex gap-2 flex-wrap">
                {activeCandidate.skillsMissing.length === 0 ? (
                  <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Perfect Skill Match. No requirements missing.
                  </span>
                ) : (
                  activeCandidate.skillsMissing.map(s => (
                    <Badge key={s} variant="danger">{s}</Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Voice Interview Results (Show if completed) */}
        {activeCandidate.interviewScore ? (
          <Card>
            <h3 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎙️</span> AI Voice Interview Evaluation (Score: {activeCandidate.interviewScore}%)
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '24px' }}>
                <h4 className="mb-3">Speech Pacing & Communication</h4>
                <div className="flex-col gap-3" style={{ display: 'flex' }}>
                  <div className="flex justify-between py-1" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Speaking Pace:</span>
                    <span className="font-semibold">{activeCandidate.communicationAnalysis?.pace}</span>
                  </div>
                  <div className="flex justify-between py-1" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Filler Words:</span>
                    <span className="font-semibold" style={{ color: 'var(--error)' }}>
                      {activeCandidate.communicationAnalysis?.fillerWords.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Evaluated Tone:</span>
                    <span className="font-semibold" style={{ color: 'var(--success)' }}>
                      {activeCandidate.communicationAnalysis?.tone}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3">Technical Capability Grid</h4>
                <RadarChart
                  scores={{
                    technical: 93,
                    communication: 95,
                    cultural: 89,
                    experience: 90,
                    problemSolving: 94
                  }}
                  size={200}
                />
              </div>
            </div>

            <style>{`
              @keyframes waveform-pulse {
                0%, 100% { height: 4px; }
                50% { height: 18px; }
              }
              .mini-wave-bar {
                width: 2px;
                background-color: var(--secondary-500);
                display: inline-block;
                margin: 0 1px;
                border-radius: 1px;
              }
              .mini-wave-bar.anim {
                animation: waveform-pulse 1s ease-in-out infinite;
              }
            `}</style>
            <h4 className="mb-3">Question-by-Question Transcript Logs</h4>
            <div className="flex-col gap-3" style={{ display: 'flex' }}>
              {activeCandidate.interviewAnswers?.map((ans, idx) => {
                const isPlaying = playingTranscriptIndex === idx;
                return (
                  <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--gray-50)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold" style={{ fontSize: 'var(--fs-body-sm)' }}>Question {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={isPlaying ? <Pause size={12} /> : <Play size={12} />}
                          onClick={() => handlePlayVoice(ans.answer, idx)}
                          style={{ padding: '2px 8px', height: '24px', fontSize: 'var(--fs-caption)' }}
                        >
                          {isPlaying ? 'Stop' : 'Play Answer'}
                        </Button>
                        <Badge variant="success">Answer score: {ans.score}%</Badge>
                      </div>
                    </div>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-primary)', fontWeight: 'bold' }}>"{ans.question}"</div>
                    
                    <div className="flex gap-3 items-center" style={{ margin: '6px 0' }}>
                      <div style={{ flex: 1, fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)', paddingLeft: '8px', borderLeft: '2px solid var(--primary-300)' }}>
                        "{ans.answer}"
                      </div>
                      {isPlaying && (
                        <div style={{ display: 'flex', alignItems: 'center', height: '20px', paddingRight: '8px' }}>
                          <span className="mini-wave-bar anim" style={{ height: '14px', animationDelay: '0.1s' }} />
                          <span className="mini-wave-bar anim" style={{ height: '8px', animationDelay: '0.3s' }} />
                          <span className="mini-wave-bar anim" style={{ height: '18px', animationDelay: '0.5s' }} />
                          <span className="mini-wave-bar anim" style={{ height: '10px', animationDelay: '0.2s' }} />
                          <span className="mini-wave-bar anim" style={{ height: '15px', animationDelay: '0.4s' }} />
                        </div>
                      )}
                    </div>
                    
                    <div style={{ fontSize: 'var(--fs-overline)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <span className="font-semibold" style={{ color: 'var(--secondary-600)' }}>AI feedback:</span> {ans.feedback}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-6">
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <h4 style={{ margin: '8px 0 4px 0' }}>AI Voice Interview Pending</h4>
            <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)' }}>
              Candidate has not submitted the voice assessment. You will see scores and radar coordinates here upon submission.
            </p>
          </Card>
        )}

        {/* AI Chat Screening Section */}
        {activeCandidate.chatScreeningScore ? (
          <Card>
            <h3 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} style={{ color: 'var(--secondary-600)' }} /> AI Chat Screening Dialogue (Score: {activeCandidate.chatScreeningScore}%)
            </h3>
            <div className="flex-col gap-3" style={{ display: 'flex' }}>
              {activeCandidate.chatScreeningAnswers?.map((ans, idx) => (
                <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--gray-50)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold" style={{ fontSize: 'var(--fs-body-sm)' }}>Screener Q {idx + 1}</span>
                    <Badge variant="success">Match: {ans.score}%</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-primary)', fontWeight: 'bold' }}>"{ans.question}"</div>
                  <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)', margin: '6px 0', paddingLeft: '8px', borderLeft: '2px solid var(--primary-300)' }}>
                    "{ans.answer}"
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-6">
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <h4 style={{ margin: '8px 0 4px 0' }}>AI Voice Interview Pending</h4>
            <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)' }}>
              Candidate has not submitted the voice assessment. You will see scores and radar coordinates here upon submission.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
