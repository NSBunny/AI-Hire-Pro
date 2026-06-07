import React, { useState } from 'react';
import { useApp, type UserRole } from '../../context/AppContext';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { User, Users, Briefcase, Calendar, ShieldAlert, Lock, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, jobs, uploadResume } = useApp();
  const [activeMode, setActiveMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sign In inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up inputs
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('candidate');

  // Candidate Additional fields
  const [signupPhone, setSignupPhone] = useState('');
  const [signupResume, setSignupResume] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');

  // Initialize selectedJobId once jobs are loaded
  React.useEffect(() => {
    if (jobs && jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const mockCredentials: Record<UserRole, { email: string; label: string; icon: React.ReactNode }> = {
    candidate: { email: 'rohan.sharma@example.com', label: 'Candidate', icon: <User size={18} /> },
    recruiter: { email: 'recruiter@aihirepro.com', label: 'Recruiter', icon: <Users size={18} /> },
    manager: { email: 'manager@aihirepro.com', label: 'Hiring Manager', icon: <Briefcase size={18} /> },
    employee: { email: 'jane.doe@company.com', label: 'Employee', icon: <Calendar size={18} /> },
    admin: { email: 'admin@aihirepro.com', label: 'Administrator', icon: <ShieldAlert size={18} /> },
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      setSuccess('Signed in successfully! Accessing portal...');
      setTimeout(() => {
        login(data.user.role, data.user);
        setIsLoading(false);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Connecting to backend failed.');
      setIsLoading(false);
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!signupName || !signupEmail || !signupPassword) {
      setError('All registration fields are required.');
      setIsLoading(false);
      return;
    }

    if (signupRole === 'candidate' && (!signupPhone || !signupResume || !selectedJobId)) {
      setError('Phone number, target job, and resume file upload are required for candidates.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create User account
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: signupRole
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // 2. If role is candidate, parse and ingest resume with Gemini
      if (signupRole === 'candidate' && signupResume) {
        setSuccess('User created! Analyzing resume with Gemini AI (this may take a few seconds)...');
        try {
          const parsedCand = await uploadResume(signupResume, selectedJobId, {
            name: signupName,
            email: signupEmail,
            phone: signupPhone
          });
          setSuccess('Resume analyzed successfully! Logging in...');
          setTimeout(() => {
            login('candidate', {
              id: parseInt(parsedCand.id.replace('cand-', '')) || Date.now(),
              name: signupName,
              email: signupEmail,
              role: 'candidate'
            });
            setIsLoading(false);
          }, 1500);
        } catch (uploadErr) {
          console.error('Gemini upload error during signup:', uploadErr);
          setError('User registered, but AI resume analysis failed. Logging in with fallback profile.');
          setTimeout(() => {
            login('candidate', {
              id: Date.now(),
              name: signupName,
              email: signupEmail,
              role: 'candidate'
            });
            setIsLoading(false);
          }, 2000);
        }
      } else {
        setSuccess('Account created successfully! Switching to login...');
        
        // Auto-prefill Sign In
        setEmail(signupEmail);
        setPassword(signupPassword);

        setTimeout(() => {
          setActiveMode('signin');
          setSuccess('');
          setIsLoading(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Connecting to backend failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* LEFT BRAND PANEL */}
      <div className="login-left-panel" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        padding: '48px 64px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Logo Watermark */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-12deg)',
          width: '560px',
          height: '560px',
          opacity: 0.07,
          pointerEvents: 'none',
          zIndex: 1,
          backgroundImage: 'url(/logo.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} />

        <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
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
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>AIHire Pro</span>
          </div>
          
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-1px', lineHeight: '1.2' }}>
            Next-Gen AI HRMS
          </h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 24px 0', lineHeight: '1.6' }}>
            A unified workspace for AI screening, voice interviewing, leave approvals, payroll tracking, and RAG policy lookups.
          </p>

          {/* LOGO CONTAINER */}
          <div className="glass-panel anim-slide-up" style={{
            width: '100%',
            height: '290px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25), inset 0 0 40px rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backdropFilter: 'blur(16px)',
            position: 'relative'
          }}>
            {/* Glowing background circles */}
            <div style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(124, 58, 237, 0.12) 50%, transparent 70%)',
              filter: 'blur(24px)',
              zIndex: 1
            }} />
            <div style={{
              position: 'absolute',
              width: '140px',
              height: '140px',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
              filter: 'blur(18px)',
              zIndex: 1,
              top: '30px',
              left: '40px'
            }} />
            
            <img 
              src="/logo.png" 
              alt="AIHire Pro Logo" 
              style={{
                maxHeight: '250px',
                maxWidth: '92%',
                objectFit: 'contain',
                zIndex: 2,
                opacity: 0.8,
                filter: 'drop-shadow(0 12px 30px rgba(99, 102, 241, 0.35))',
                animation: 'pulseGlow 4s ease-in-out infinite alternate'
              }} 
            />
            <style>{`
              @keyframes pulseGlow {
                0% {
                  transform: scale(1.06, 1.01);
                  filter: drop-shadow(0 12px 30px rgba(99, 102, 241, 0.35));
                }
                100% {
                  transform: scale(1.10, 1.03);
                  filter: drop-shadow(0 16px 45px rgba(124, 58, 237, 0.55));
                }
              }
            `}</style>
          </div>
        </div>
        
        {/* Footer telemetry */}
        <div style={{ fontSize: 'var(--fs-caption)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '24px' }}>
          <ShieldCheck size={14} /> Powered by Gemini Flash · Enterprise Grade Secure
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="login-right-panel">
        <Card
          className="glass-panel anim-slide-up"
          style={{
            width: '100%',
            maxWidth: '440px',
            padding: '28px 24px',
            color: 'var(--text-primary)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Sign In / Sign Up Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--gray-100)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => { setActiveMode('signin'); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: activeMode === 'signin' ? 'var(--bg-card)' : 'transparent',
                color: activeMode === 'signin' ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: activeMode === 'signin' ? 600 : 500,
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('signup'); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: activeMode === 'signup' ? 'var(--bg-card)' : 'transparent',
                color: activeMode === 'signup' ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: activeMode === 'signup' ? 600 : 500,
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Banner Messages */}
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: 'var(--error)',
              fontSize: 'var(--fs-body-sm)',
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              color: 'var(--success)',
              fontSize: 'var(--fs-body-sm)',
              fontWeight: 500
            }}>
              ✅ {success}
            </div>
          )}

          {/* TAB 1: SIGN IN VIEW */}
          {activeMode === 'signin' && (
            <>
              <div>
                <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                  Welcome Back
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--fs-body-sm)' }}>
                  Sign in using your registered email and password
                </p>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '38px', width: '100%' }}
                      placeholder="••••••••"
                    />
                    <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                      }}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isLoading}
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  Sign In to Portal
                </Button>
              </form>
            </>
          )}

          {/* TAB 2: CREATE ACCOUNT VIEW */}
          {activeMode === 'signup' && (
            <>
              <div>
                <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                  Register Account
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--fs-body-sm)' }}>
                  Create your profile in our live Neon-backed database
                </p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="form-input"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="form-input"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="form-input"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                {/* Role select */}
                <div>
                  <span style={{ fontSize: 'var(--fs-overline)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                    Select Registering Role
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(Object.keys(mockCredentials) as UserRole[]).map((role) => {
                      const active = signupRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSignupRole(role)}
                          style={{
                            flex: '1 1 calc(33.333% - 4px)',
                            minWidth: '76px',
                            height: '46px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: active ? 'var(--primary-400)' : 'var(--border-input)',
                            backgroundColor: active ? 'var(--primary-50)' : 'var(--bg-card)',
                            color: active ? 'var(--primary-600)' : 'var(--text-secondary)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            gap: '2px',
                            outline: 'none',
                            boxShadow: active ? '0 4px 12px rgba(79, 70, 229, 0.08)' : 'none'
                          }}
                        >
                          <span style={{ transform: 'scale(0.85)', color: active ? 'var(--primary-600)' : 'var(--text-muted)' }}>
                            {mockCredentials[role].icon}
                          </span>
                          <span style={{ fontSize: '8px', textTransform: 'capitalize', fontWeight: active ? 600 : 500 }}>
                            {role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {signupRole === 'candidate' && (
                  <>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        className="form-input"
                        placeholder="+91 99999 88888"
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Target Job</label>
                      <select
                        required
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="form-input"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-input)',
                          borderRadius: '8px',
                          height: '40px',
                          padding: '0 12px'
                        }}
                      >
                        {jobs && jobs.map(job => (
                          <option key={job.id} value={job.id}>
                            {job.title} ({job.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Upload Resume (PDF/DOCX)</label>
                      <input
                        type="file"
                        required
                        accept=".pdf,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Resume file size exceeds the 2MB limit. Please upload a smaller file.');
                              e.target.value = ''; // Reset the input selection
                              setSignupResume(null);
                              return;
                            }
                            setSignupResume(file);
                          }
                        }}
                        className="form-input"
                        style={{ padding: '8px' }}
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isLoading}
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  Create New Profile
                </Button>
              </form>
            </>
          )}

          {/* Policy */}
          <p style={{ textAlign: 'center', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
            By signing in, you agree to our{' '}
            <span style={{ color: 'var(--primary-600)', cursor: 'pointer', fontWeight: 500 }}>Terms</span> and{' '}
            <span style={{ color: 'var(--primary-600)', cursor: 'pointer', fontWeight: 500 }}>Privacy Policy</span>
          </p>
        </Card>
      </div>
    </div>
  );
};