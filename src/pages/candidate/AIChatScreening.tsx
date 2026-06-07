import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'candidate';
  text: string;
  timestamp: string;
  voiceUrl?: string;
}

export const AIChatScreening: React.FC = () => {
  const { currentUser, candidates, jobs, submitChatScreeningAnswers } = useApp();
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
  const appliedJob = activeCandidate ? jobs.find(j => j.id === activeCandidate.appliedJobId) : null;

  const [screeningState, setScreeningState] = useState<'intro' | 'chatting' | 'completed'>('intro');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [qaLogs, setQaLogs] = useState<{ question: string; answer: string; score: number }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Generate screening questions based on matches skills or load from resume
  const screeningQuestions = React.useMemo(() => {
    if ((activeCandidate as any)?.resumeQuestions && (activeCandidate as any).resumeQuestions.length > 0) {
      return (activeCandidate as any).resumeQuestions;
    }
    const skills = activeCandidate?.skillsMatched || ['React', 'TypeScript', 'CSS'];
    
    return [
      {
        question: `Welcome to the screening. Could you detail your experience building application architectures using ${skills.slice(0, 2).join(' and ')}?`,
        skill: skills[0] || 'General'
      },
      {
        question: `How do you approach optimizing network bundle sizes, lazy-loading routes, and handling application speed constraints in production?`,
        skill: 'Optimization'
      },
      {
        question: `Tell me about a time you encountered a severe conflict in a shared team branch. How did you resolve the codebase delta?`,
        skill: 'Collaboration'
      },
      {
        question: `What strategies do you employ for state management in large applications, and when do you choose local state over global state?`,
        skill: 'State Management'
      },
      {
        question: `How do you handle error boundaries and manage exception handling gracefully across client-side web components?`,
        skill: 'Exception Handling'
      },
      {
        question: `Explain your process for writing clean, maintainable, and type-safe code, specifically leveraging features like TypeScript generics or interfaces.`,
        skill: 'Type Safety'
      },
      {
        question: `What is your approach to securing frontend applications against vulnerabilities like XSS and CSRF?`,
        skill: 'Security'
      },
      {
        question: `Describe a challenging performance issue you solved in a past project. What tools did you use and what was the outcome?`,
        skill: 'Performance Tuning'
      }
    ];
  }, [activeCandidate]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

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
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        setInputText((finalTranscript + ' ' + interimTranscript).trim());
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
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

  // Handle TTS (browser speech synthesis)
  const speakText = (text: string) => {
    if (!isSpeakingEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const cleanVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    if (cleanVoice) utterance.voice = cleanVoice;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartScreening = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn("Microphone access denied or error:", err);
      alert("Microphone permission is required for voice interaction. Please grant access in your browser settings.");
    }

    setScreeningState('chatting');
    setIsTyping(true);
    
    const introGreeting = `Hello ${activeCandidate?.name || 'Candidate'}. I am Ava, your AI recruiting screening assistant. I will guide you through a conversational technical screening today for the ${appliedJob?.title || 'Software Developer'} position. Let's start with our first question.`;
    
    setTimeout(() => {
      setMessages([
        {
          id: 'msg-init-1',
          sender: 'ai',
          text: introGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      speakText(introGreeting);
      
      setTimeout(() => {
        const firstQ = screeningQuestions[0].question;
        setMessages(prev => [
          ...prev,
          {
            id: 'msg-init-q',
            sender: 'ai',
            text: firstQ,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        speakText(firstQ);
        setIsTyping(false);
      }, 2000);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userText = inputText;
    setInputText('');
    
    const userMsg: Message = {
      id: `cand-msg-${Date.now()}`,
      sender: 'candidate',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Save Q&A logs
    const activeQuestion = screeningQuestions[currentQuestionIdx];
    const score = Math.floor(Math.random() * 16) + 80; // 80 - 95 score
    
    const newQaLogs = [
      ...qaLogs,
      {
        question: activeQuestion.question,
        answer: userText,
        score
      }
    ];
    setQaLogs(newQaLogs);

    // Process next step
    setTimeout(() => {
      setIsTyping(false);
      const nextIdx = currentQuestionIdx + 1;
      
      if (nextIdx < screeningQuestions.length) {
        setCurrentQuestionIdx(nextIdx);
        const nextQ = screeningQuestions[nextIdx].question;
        const ackText = `Understood. Thanks for sharing. Let's proceed: ${nextQ}`;
        
        setMessages(prev => [
          ...prev,
          {
            id: `ai-msg-${Date.now()}`,
            sender: 'ai',
            text: ackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        speakText(ackText);
      } else {
        // All questions completed!
        setScreeningState('completed');
        const finalScore = Math.round(newQaLogs.reduce((acc, cur) => acc + cur.score, 0) / newQaLogs.length);
        submitChatScreeningAnswers(activeCandidate.id, newQaLogs, finalScore);
      }
    }, 2000);
  };

  const toggleMic = async () => {
    if (!recognitionRef.current) {
      alert("Web Speech API is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Microphone access denied or error:", err);
        alert("Microphone permission is required for voice interaction.");
      }
    }
  };

  const toggleSpeaking = () => {
    setIsSpeakingEnabled(!isSpeakingEnabled);
    if (!isSpeakingEnabled) {
      // Immediate speak test
      const utterance = new SpeechSynthesisUtterance("Audio screening voice output enabled.");
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="anim-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Conversational AI Screening</h1>
          <p style={{ margin: 0 }}>Interact with Ava, our real-time recruiting agent.</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={isSpeakingEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            onClick={toggleSpeaking}
            title={isSpeakingEnabled ? "Mute Voice Readout" : "Enable Voice Readout"}
          >
            {isSpeakingEnabled ? 'Voice On' : 'Voice Off'}
          </Button>
          <Badge variant="ai">AI Active</Badge>
        </div>
      </div>

      {screeningState === 'intro' && (
        <Card className="p-8 text-center">
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '20px' }}>
            🤖
          </div>
          <h2>Begin Conversational Screening</h2>
          <p className="mb-6" style={{ maxWidth: '540px', margin: '0 auto 24px auto' }}>
            Ava will ask a series of conceptual questions to test your engineering approach and communication clarity. You can reply using text or use the microphone to translate speech inputs.
          </p>

          {appliedJob && (
            <div className="mb-6 p-4" style={{ backgroundColor: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'inline-block', textAlign: 'left' }}>
              <span className="font-semibold" style={{ color: 'var(--primary-700)' }}>Position: </span>{appliedJob.title}<br />
              <span className="font-semibold" style={{ color: 'var(--primary-700)' }}>Department: </span>{appliedJob.department}<br />
              <span className="font-semibold" style={{ color: 'var(--primary-700)' }}>Skills Target: </span>{activeCandidate.skillsMatched.slice(0, 4).join(', ')}
            </div>
          )}

          <Button variant="primary" size="lg" onClick={handleStartScreening} className="w-full">
            Connect with AI Screener
          </Button>
        </Card>
      )}

      {screeningState === 'chatting' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-card)' }}>
          {/* Chat header */}
          <div style={{ backgroundColor: 'var(--gray-50)', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>
              Ava
            </div>
            <div>
              <div className="font-semibold" style={{ fontSize: 'var(--fs-body-sm)' }}>Ava · AI Screener</div>
              <div style={{ fontSize: '10px', color: 'var(--success)' }}>● Active screening session</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
              Question {currentQuestionIdx + 1} of {screeningQuestions.length}
            </div>
          </div>

          {/* Messages content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'ai' ? 'flex-start' : 'flex-end',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: msg.sender === 'ai' ? 'var(--gray-100)' : 'var(--primary-600)',
                    color: msg.sender === 'ai' ? 'var(--text-primary)' : 'white',
                    border: msg.sender === 'ai' ? '1px solid var(--border-color)' : 'none',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)', lineHeight: '1.5' }}>{msg.text}</p>
                  <div
                    style={{
                      fontSize: '8px',
                      color: msg.sender === 'ai' ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)',
                      textAlign: 'right',
                      marginTop: '4px'
                    }}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--gray-100)', border: '1px solid var(--border-color)' }}>
                  <span className="anim-pulse-loading">Ava is composing...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Interactive Chat controls */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--gray-50)' }}>
            <div className="flex gap-2">
              <Button
                variant={isListening ? 'danger' : 'secondary'}
                icon={isListening ? <MicOff size={18} /> : <Mic size={18} />}
                onClick={toggleMic}
                title={isListening ? "Stop Speaking" : "Start Speaking (Voice Model)"}
                className={isListening ? 'animate-pulse' : ''}
              />
              
              <input
                type="text"
                placeholder={isListening ? "Listening to voice input..." : "Type your technical response here..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{
                  flex: 1,
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  backgroundColor: 'var(--bg-card)'
                }}
                disabled={isListening}
              />
              
              <Button
                variant="primary"
                icon={<Send size={18} />}
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
              />
            </div>
            {isListening && (
              <div className="mt-2 text-center" style={{ fontSize: 'var(--fs-caption)', color: 'var(--error)' }}>
                🎙️ Voice Input Active. Translating spoken response into technical text...
              </div>
            )}
          </div>
        </div>
      )}

      {screeningState === 'completed' && (
        <Card className="p-8 text-center">
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '20px' }}>
            ✓
          </div>
          <h2>Screening Chat Complete!</h2>
          <p className="mb-6" style={{ maxWidth: '500px', margin: '0 auto 24px auto' }}>
            Your conversational responses have been submitted to Ava. You are now progressed to the scheduling funnel for the next technical round.
          </p>

          <div style={{ backgroundColor: 'var(--gray-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'inline-block', textAlign: 'left', marginBottom: '24px', minWidth: '300px' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>Screening Scorecard</h4>
            <div className="flex justify-between py-1">
              <span>Overall Score:</span>
              <span className="font-bold" style={{ color: 'var(--success)' }}>
                {qaLogs.length > 0 ? Math.round(qaLogs.reduce((acc, cur) => acc + cur.score, 0) / qaLogs.length) : 0}%
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Questions answered:</span>
              <span>{qaLogs.length}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Status:</span>
              <Badge variant="success">Passed Screening</Badge>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Return to Hub
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
