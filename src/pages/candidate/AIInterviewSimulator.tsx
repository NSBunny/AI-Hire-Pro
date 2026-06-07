import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { RadarChart } from '../../components/shared/Chart';
import { Mic, MicOff, Play, Award, Volume2, Shield, MessageSquare, CornerDownRight } from 'lucide-react';

interface AIInterviewSimulatorProps {
  onNavigate: (tab: string) => void;
}

const getQuestionsForCandidate = (cand: any, job: any) => {
  const skills = cand?.skillsMatched && cand.skillsMatched.length > 0 
    ? cand.skillsMatched 
    : (job?.skills || ['React', 'TypeScript', 'CSS']);
  
  const jobTitle = job?.title || 'Software Developer';
  
  const questionTemplates = [
    {
      skillKeyword: 'React',
      text: `Your resume lists React. How do you handle complex re-rendering scenarios and optimize component render speeds in React?`,
      defaultAnswer: "I utilize the React DevTools Profiler to identify bottle-necks. Then I implement memoization using React.memo on stateless components, cache inline handlers with useCallback, and store expensive computations with useMemo to keep the page responsive."
    },
    {
      skillKeyword: 'TypeScript',
      text: `Since you match the TypeScript requirements, what are the primary differences between interfaces and types, and when do you use Generics?`,
      defaultAnswer: "Interfaces define contract shapes for objects and support declaration merging. Types are more versatile and support unions, intersections, and primitives. I use Generics when writing reusable utilities to ensure compiler-level type safety across different models dynamically."
    },
    {
      skillKeyword: 'Python',
      text: `Your resume states Python experience. Explain how you implement asynchronous tasks and manage database session concurrency in a backend service.`,
      defaultAnswer: "I implement async routines using 'async def' and 'await' libraries to prevent blocking threads. For concurrency, I establish connection pools in SQLAlchemy with an active timeout, preventing connection leakage under concurrent request spikes."
    },
    {
      skillKeyword: 'FastAPI',
      text: `Your resume lists FastAPI. How do you manage request parsing, automatic validation, and middleware authentication configurations?`,
      defaultAnswer: "FastAPI validates inputs out-of-the-box using Pydantic typing schemas. For authentication middleware, I use Depends() wrappers to inject token validation, which automatically verifies headers and handles OAuth2 flow safely."
    },
    {
      skillKeyword: 'Vite',
      text: `Since your profile indicates Vite build tools, how do you optimize chunk sizes and handle asset compression during a build?`,
      defaultAnswer: "In vite.config.ts, I customize rollupOptions to split vendor dependencies into distinct manual chunks. I also use dynamic imports for code-splitting and load environmental keys using loadEnv to configure separate development and staging bundles."
    },
    {
      skillKeyword: 'Next.js',
      text: `As a Next.js engineer, explain the performance trade-offs of Static Site Generation, Server-Side Rendering, and Incremental Static Regeneration.`,
      defaultAnswer: "SSG builds pages statically at build-time. SSR fetches data dynamically on every request. ISR bridges the two by serving static pages initially and updating them in the background according to a revalidate window, ensuring speed and fresh data."
    },
    {
      skillKeyword: 'State Management',
      text: `Your profile highlights State Management. Contrast Zustand and Redux Toolkit, and explain when you choose one over the other.`,
      defaultAnswer: "Zustand is lightweight and uses a hook-based API with minimal boilerplate, making it perfect for UI states. Redux Toolkit is suited for massive global states that need strict middleware checks, action serialization, or developer tool inspection."
    },
    {
      skillKeyword: 'Figma',
      text: `As a UI/UX expert matching Figma, how do you translate typography variables, grid systems, and layout tokens into CSS variables?`,
      defaultAnswer: "I map Figma colors and design spacing scales to standard CSS custom properties in a root styling file. This maintains design parity, ensures responsive scaling using clamp functions, and supports smooth transitions for dark modes."
    },
    {
      skillKeyword: 'HRMS Solutions',
      text: `Your resume notes HRMS Solutions. How do you configure employee leave ledger models to handle concurrent approval updates safely?`,
      defaultAnswer: "I configure transaction isolation to serializable levels and enforce pessimistic locking on ledger records in Postgres. This guarantees balances are adjusted sequentially, protecting against duplicate approvals for the same employee."
    }
  ];

  const matchedTemplates = questionTemplates.filter(t => 
    skills.some((s: string) => s.toLowerCase().includes(t.skillKeyword.toLowerCase()))
  );

  const selectedQuestions: { text: string; defaultAnswer: string }[] = [...matchedTemplates];
  
  const generalTemplates = [
    {
      text: `As a candidate for the ${jobTitle} position, explain how you approach troubleshooting difficult production bugs under tight release windows.`,
      defaultAnswer: "I isolate the bug by reproducing it in a sandbox using automated mock logs. I analyze cloud trace telemetry, identify query bottlenecks or race conditions, write regression unit tests, and deploy a hotfix once tests pass."
    },
    {
      text: `What is your philosophy on keeping codebase technical debt low while delivering features quickly to production?`,
      defaultAnswer: "I follow standard linting configurations, document code blocks clearly, and maintain clean separation of concerns. I advocate for incremental refactoring during feature cycles, ensuring that simple enhancements don't accumulate technical debt."
    },
    {
      text: `How do you secure API communication and protect client cookies/tokens from common web security vulnerabilities?`,
      defaultAnswer: "I enforce HTTPS transport layers and store session credentials in secure HttpOnly SameSite cookies. This shields authentication payloads from Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) exploits."
    }
  ];

  let fallbackIdx = 0;
  while (selectedQuestions.length < 2 && fallbackIdx < generalTemplates.length) {
    if (!selectedQuestions.some(q => q.text === generalTemplates[fallbackIdx].text)) {
      selectedQuestions.push(generalTemplates[fallbackIdx]);
    }
    fallbackIdx++;
  }

  const firstQuestion = {
    text: "Tell me about yourself, your background, and your key achievements.",
    defaultAnswer: "I am a software engineer with extensive experience building web applications. I specialize in front-end and full-stack development, delivering high-quality user experiences, and collaborating with cross-functional teams."
  };

  const finalQuestions = [firstQuestion, ...selectedQuestions.slice(0, 2)];

  return finalQuestions.map((q, idx) => ({
    id: idx + 1,
    text: q.text,
    defaultAnswer: q.defaultAnswer
  }));
};

export const AIInterviewSimulator: React.FC<AIInterviewSimulatorProps> = ({ onNavigate }) => {
  const { currentUser, submitInterviewAnswers, candidates, jobs } = useApp();

  const activeCandidate = candidates.find(c => c.email.toLowerCase() === currentUser?.email?.toLowerCase()) || {
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
  const candidateId = activeCandidate ? activeCandidate.id : 'cand-2';
  const activeJob = activeCandidate ? jobs.find(j => j.id === activeCandidate.appliedJobId) : null;

  const questions = React.useMemo(() => {
    return getQuestionsForCandidate(activeCandidate, activeJob);
  }, [activeCandidate, activeJob]);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [interviewState, setInterviewState] = useState<'idle' | 'answering' | 'completed'>('idle');
  const [isMicOn, setIsMicOn] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [answers, setAnswers] = useState<{ question: string; answer: string; score: number; feedback: string }[]>([]);
  const recognitionRef = React.useRef<any>(null);
  const submittedTextRef = React.useRef('');

  const getDisplayTranscripts = () => {
    const totalFinal = transcription.trim();
    const prefix = submittedTextRef.current;
    
    let displayFinal = '';
    if (prefix) {
      if (totalFinal.startsWith(prefix)) {
        displayFinal = totalFinal.substring(prefix.length).trim();
      } else {
        displayFinal = '';
      }
    } else {
      displayFinal = totalFinal;
    }
    
    return {
      final: displayFinal,
      interim: interimTranscript
    };
  };

  // Setup Web Speech API for voice transcribing
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscriptText = '';
        for (let i = 0; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscriptText += transcript;
          }
        }
        setTranscription(finalTranscript.trim());
        setInterimTranscript(interimTranscriptText.trim());
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setIsMicOn(false);
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleStartInterview = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn("Microphone access denied or error:", err);
      alert("Microphone permission is required for voice interaction. Please grant access in your browser settings.");
      return; // Do not start the interview without mic permission since it's a voice assessment
    }

    setInterviewState('answering');
    setIsMicOn(true);
    setCurrentQuestionIdx(0);
    setAnswers([]);
    setTranscription('');
    setInterimTranscript('');
    submittedTextRef.current = '';

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const handleNextQuestion = () => {
    const currentQ = questions[currentQuestionIdx];
    if (!currentQ) return;
    const score = Math.floor(Math.random() * 15) + 82; // Mock AI question score (82-97)
    
    let feedback = "Strong response covering core conceptual definitions with good structured clarity.";
    if (currentQ.text.toLowerCase().includes("tell me about yourself")) {
      feedback = "Excellent self-introduction. Clearly articulated career progression, key technical strengths, and relevant project achievements.";
    } else if (currentQ.text.includes("React")) {
      feedback = "Excellent coverage of React rendering cycles, custom memoization utilities, and hook-based cache layers.";
    } else if (currentQ.text.includes("TypeScript")) {
      feedback = "Clear explanation of type shapes, structural declaration merging, and generic arguments usage.";
    } else if (currentQ.text.includes("Python") || currentQ.text.includes("FastAPI")) {
      feedback = "Solid explanation of database thread pooling configurations and non-blocking asynchronous endpoints routing.";
    } else if (currentQ.text.includes("Next.js")) {
      feedback = "Excellent description of SSR request parameters, SSG compile pipelines, and ISR invalidation intervals.";
    } else if (currentQ.text.includes("Zustand") || currentQ.text.includes("State")) {
      feedback = "Great architectural breakdown contrasting hook-based state managers with global dispatched pipelines.";
    } else if (currentQ.text.includes("Figma")) {
      feedback = "Solid translation of design system variables and layout scaling constraints to native CSS custom properties.";
    } else if (currentQ.text.includes("HRMS")) {
      feedback = "Strong description of database transaction locking, conflict resolution, and ledger consistency checks.";
    }

    // Calculate the current question's answer by subtracting the already submitted text prefix
    const totalText = (transcription + ' ' + interimTranscript).trim();
    let currentAnswer = totalText;
    const prefix = submittedTextRef.current;
    if (prefix && totalText.startsWith(prefix)) {
      currentAnswer = totalText.substring(prefix.length).trim();
    }
    const spokenAnswer = currentAnswer || "Simulated spoken answer.";

    setAnswers(prev => [
      ...prev,
      {
        question: currentQ.text,
        answer: spokenAnswer,
        score,
        feedback
      }
    ]);

    submittedTextRef.current = totalText;

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      const finalAnswers = [
        ...answers,
        {
          question: currentQ.text,
          answer: spokenAnswer,
          score,
          feedback
        }
      ];
      
      const overallScore = Math.round(finalAnswers.reduce((acc, curr) => acc + curr.score, 0) / finalAnswers.length);
      
      submitInterviewAnswers(candidateId, finalAnswers, overallScore);
      setInterviewState('completed');
      setIsMicOn(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleToggleMic = async () => {
    if (!recognitionRef.current) {
      alert("Web Speech API is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    if (isMicOn) {
      recognitionRef.current.stop();
      setIsMicOn(false);
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicOn(true);
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Microphone access denied or error:", err);
        alert("Microphone permission is required for voice interaction.");
      }
    }
  };

  return (
    <div className="anim-slide-up">
      <div className="mb-6">
        <h1 style={{ fontSize: 'var(--fs-lg-display)', marginBottom: '8px' }}>AI Interview Assistant</h1>
        <p style={{ margin: 0 }}>Engage in a voice-based assessment module monitored and evaluated in real-time by AIHire Pro.</p>
      </div>

      {interviewState === 'idle' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <Card className="p-8">
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--secondary-50)',
                color: 'var(--secondary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                fontSize: '2rem'
              }}
            >
              🎤
            </div>
            <h2>Technical Interview Session</h2>
            <p className="mb-6">
              You will be asked 3 technical questions. Ensure your microphone is active.
              The AI engine evaluates:
              <br />
              <strong>1. Technical Competence</strong> · <strong>2. Speaking Pace & Flow</strong> · <strong>3. Structural Clarity</strong>
            </p>

            <div style={{ backgroundColor: 'var(--gray-50)', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left', border: '1px solid var(--border-color)', fontSize: 'var(--fs-body-sm)' }}>
              <div className="flex items-center gap-2 font-semibold mb-2" style={{ color: 'var(--primary-600)' }}>
                <Shield size={16} /> Device Verification
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Microphone Status:</span>
                <span className="font-semibold" style={{ color: 'var(--success)' }}>✓ Ready</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Connection Quality:</span>
                <span className="font-semibold" style={{ color: 'var(--success)' }}>✓ Excellent (Latency: 28ms)</span>
              </div>
            </div>

            <Button variant="primary" size="lg" icon={<Play size={18} />} onClick={handleStartInterview} className="w-full">
              Begin Voice Assessment
            </Button>
          </Card>
        </div>
      )}

      {interviewState === 'answering' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          {/* Active Question Panel */}
          <div className="flex-col gap-6" style={{ display: 'flex' }}>
            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px' }}>
              <div>
                <div style={{ fontSize: 'var(--fs-caption)', fontWeight: 'bold', color: 'var(--secondary-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Question {currentQuestionIdx + 1} of {questions.length}
                </div>
                <h2 style={{ fontSize: '1.35rem', lineHeight: '1.4', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  "{questions[currentQuestionIdx].text}"
                </h2>
              </div>

              {/* Sound visualizer wave */}
              <div
                style={{
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '12px',
                  padding: '24px',
                  margin: '32px 0',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div className={`waveform-container ${isMicOn ? 'waveform-active' : ''}`}>
                  <div className="waveform-bar" style={{ height: '30%' }} />
                  <div className="waveform-bar" style={{ height: '60%' }} />
                  <div className="waveform-bar" style={{ height: '40%' }} />
                  <div className="waveform-bar" style={{ height: '80%' }} />
                  <div className="waveform-bar" style={{ height: '95%' }} />
                  <div className="waveform-bar" style={{ height: '50%' }} />
                  <div className="waveform-bar" style={{ height: '70%' }} />
                  <div className="waveform-bar" style={{ height: '40%' }} />
                  <div className="waveform-bar" style={{ height: '85%' }} />
                  <div className="waveform-bar" style={{ height: '20%' }} />
                </div>
                <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                  {isMicOn ? 'Listening to speech input...' : 'Microphone muted. Click below to unmute.'}
                </span>
              </div>

              <div className="flex gap-4">
                <Button
                  variant={isMicOn ? 'secondary' : 'danger'}
                  icon={isMicOn ? <MicOff size={16} /> : <Mic size={16} />}
                  onClick={handleToggleMic}
                  style={{ width: '130px' }}
                >
                  {isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNextQuestion}
                  className="flex-1 animate-pulse"
                >
                  {currentQuestionIdx === questions.length - 1 ? 'Complete Assessment' : 'Submit & Next Question'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Live transcript feedback */}
          <Card className="flex-col" style={{ display: 'flex', maxHeight: '420px', overflowY: 'hidden' }}>
            <h3 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <Volume2 size={18} style={{ color: 'var(--secondary-600)' }} /> Live STT Transcription
            </h3>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                backgroundColor: 'var(--gray-50)',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-body-sm)',
                lineHeight: '1.6',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {(() => {
                const { final, interim } = getDisplayTranscripts();
                if (final || interim) {
                  return (
                    <>
                      <span style={{ color: 'var(--secondary-600)', fontWeight: 'bold' }}>[You]: </span>
                      <span>{final}</span>
                      {interim && (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          {final ? ' ' : ''}{interim}
                        </span>
                      )}
                      <span className="anim-pulse-loading" style={{ color: 'var(--secondary-500)' }}>_</span>
                    </>
                  );
                }
                return (
                  <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Speak your answer clearly. Live transcripts will populate here...
                  </span>
                );
              })()}
            </div>
          </Card>
        </div>
      )}

      {interviewState === 'completed' && (
        <div className="anim-fade-in">
          <Card className="p-8 mb-6" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                fontSize: '1.75rem'
              }}
            >
              ✓
            </div>
            <h2>Assessment Complete!</h2>
            <p style={{ maxWidth: '500px', margin: '0 auto 24px auto' }}>
              Thank you for completing your voice interview. AIHire Pro has analyzed your answers, speech metrics, and pacing.
            </p>
            <Button variant="primary" onClick={() => onNavigate('dashboard')}>
              Back to Dashboard
            </Button>
          </Card>

          {/* Results grid */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <h3 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--secondary-600)' }} /> AI Interview Radar Matrix
              </h3>
              {activeCandidate.interviewScore && (
                <RadarChart
                  scores={{
                    technical: 93,
                    communication: 95,
                    cultural: 89,
                    experience: 90,
                    problemSolving: 94
                  }}
                  size={260}
                />
              )}
            </Card>

            <Card className="flex-col" style={{ display: 'flex' }}>
              <h3 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} style={{ color: 'var(--secondary-600)' }} /> Communication Pacing Metrics
              </h3>
              
              <div className="flex-col gap-4" style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
                <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--gray-50)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>Speaking Pace</div>
                  <div className="font-semibold" style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }}>
                    {activeCandidate.communicationAnalysis?.pace || 'Good (128 wpm)'}
                  </div>
                </div>

                <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--gray-50)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>Filler Words Flagged</div>
                  <div className="font-semibold" style={{ fontSize: '1.25rem', color: 'var(--error)' }}>
                    {activeCandidate.communicationAnalysis?.fillerWords.join(', ') || 'None flagged'}
                  </div>
                </div>

                <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--gray-50)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>Overall Speech Tone</div>
                  <div className="font-semibold" style={{ fontSize: '1.25rem', color: 'var(--success)' }}>
                    {activeCandidate.communicationAnalysis?.tone || 'Professional & Articulate'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Answers review */}
          <h3 className="mt-8 mb-4">Detailed Question Reviews</h3>
          <div className="flex-col gap-4" style={{ display: 'flex' }}>
            {activeCandidate.interviewAnswers?.map((ans, idx) => (
              <Card key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <h4 style={{ margin: 0, color: 'var(--primary-700)' }}>Question {idx + 1}</h4>
                  <Badge variant={ans.score >= 90 ? 'success' : 'info'}>Score: {ans.score}%</Badge>
                </div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 'var(--fs-body-sm)' }}>
                  "{ans.question}"
                </p>
                <div className="flex gap-2 items-start mb-2" style={{ fontSize: 'var(--fs-body-sm)' }}>
                  <CornerDownRight size={14} style={{ color: 'var(--text-muted)', marginTop: '4px' }} />
                  <p style={{ margin: 0, fontStyle: 'italic' }}>
                    "{ans.answer}"
                  </p>
                </div>
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                  <span className="font-semibold" style={{ color: 'var(--secondary-600)' }}>AI Evaluator:</span> {ans.feedback}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
