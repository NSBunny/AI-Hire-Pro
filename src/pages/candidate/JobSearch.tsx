import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input, FileUpload } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { MapPin, DollarSign, Calendar, Search } from 'lucide-react';

export const JobSearch: React.FC = () => {
  const { jobs, uploadResume } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Application Wizard state
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isApplyModalOpen, setApplyModalOpen] = useState(false);
  const [applyStep, setApplyStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('Rohan Sharma');
  const [email, setEmail] = useState('rohan.sharma@example.com');
  const [phone, setPhone] = useState('+91 87654 32109');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Filter departments list
  const departments = ['All', ...Array.from(new Set(jobs.map(j => j.department)))];

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          j.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = selectedDept === 'All' || j.department === selectedDept;
    return matchesSearch && matchesDept && j.status === 'active';
  });

  const handleOpenApply = (job: any) => {
    setSelectedJob(job);
    setApplyModalOpen(true);
    setApplyStep(1);
  };

  const handleFileUploaded = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert('Resume file size exceeds the 2MB limit. Please upload a smaller file.');
      return;
    }
    setResumeFile(file);
  };

  const handleNextStep = () => {
    if (applyStep === 1 && (!name || !email || !phone)) {
      alert('Please fill out all contact fields.');
      return;
    }
    if (applyStep === 2 && !resumeFile) {
      alert('Please upload a resume file.');
      return;
    }
    setApplyStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setApplyStep(prev => prev - 1);
  };

  const handleSubmitApplication = async () => {
    if (!selectedJob || !resumeFile) return;
    setIsSubmitting(true);
    
    // Trigger parsing simulation from context
    await uploadResume(resumeFile, selectedJob.id, { name, email, phone });
    
    setIsSubmitting(false);
    setApplyModalOpen(false);
    alert('Application submitted successfully! Our RAG AI Screening module has parsed your profile. Check the Candidate Dashboard for results.');
  };

  return (
    <div className="anim-slide-up">
      <div className="mb-6">
        <h1 style={{ fontSize: 'var(--fs-lg-display)', marginBottom: '8px' }}>Explore Open Opportunities</h1>
        <p style={{ margin: 0 }}>Discover career listings tailored to your skill set and experience profile.</p>
      </div>

      {/* Filter Header Toolbar */}
      <div className="flex justify-between items-center gap-4 mb-6 flex-wrap" style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 flex-1" style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search roles or skills (e.g. React, Python)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              border: '1px solid var(--border-input)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border-input)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)'
            }}
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Job Postings Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filteredJobs.length === 0 ? (
          <Card className="text-center py-8" style={{ gridColumn: 'span 2' }}>
            <p>No job postings match your search queries.</p>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} hoverable className="job-card flex-col justify-between" style={{ display: 'flex', minHeight: '260px' }}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 style={{ margin: 0, fontSize: 'var(--fs-h2)', color: 'var(--text-primary)' }}>{job.title}</h2>
                  <span className="tag" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                    {job.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4" style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign size={12} /> {job.salary}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {job.experience}</span>
                </div>
                <p style={{ fontSize: 'var(--fs-body-sm)', margin: '0 0 16px 0', lineClamp: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {job.description}
                </p>
              </div>

              <div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {job.skills.map((skill) => (
                    <span key={skill} className="tag">{skill}</span>
                  ))}
                </div>
                <Button variant="primary" size="sm" onClick={() => handleOpenApply(job)} className="w-full">
                  Apply for Position
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Application Stepper Modal */}
      {selectedJob && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          title={`Apply: ${selectedJob.title}`}
          footer={
            <div className="flex justify-between w-full">
              {applyStep > 1 ? (
                <Button variant="secondary" onClick={handlePrevStep} disabled={isSubmitting}>
                  Back
                </Button>
              ) : (
                <div />
              )}
              {applyStep < 3 ? (
                <Button variant="primary" onClick={handleNextStep}>
                  Next Step
                </Button>
              ) : (
                <Button variant="success" onClick={handleSubmitApplication} loading={isSubmitting}>
                  Submit Application
                </Button>
              )}
            </div>
          }
        >
          {/* Stepper Node header */}
          <div className="stepper">
            <div className="stepper-line">
              <div className="stepper-line-progress" style={{ width: `${((applyStep - 1) / 2) * 100}%` }} />
            </div>
            <div className={`step-node ${applyStep >= 1 ? 'active' : ''} ${applyStep > 1 ? 'completed' : ''}`}>
              <div className="step-circle">1</div>
              <div className="step-label">Details</div>
            </div>
            <div className={`step-node ${applyStep >= 2 ? 'active' : ''} ${applyStep > 2 ? 'completed' : ''}`}>
              <div className="step-circle">2</div>
              <div className="step-label">Resume</div>
            </div>
            <div className={`step-node ${applyStep >= 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <div className="step-label">Review</div>
            </div>
          </div>

          {/* Stepper Panels */}
          {applyStep === 1 && (
            <div className="anim-fade-in">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
              <Input
                label="Contact Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter contact number"
                required
              />
            </div>
          )}

          {applyStep === 2 && (
            <div className="anim-fade-in">
              <FileUpload
                label="Upload Resume Document"
                accept=".pdf,.docx"
                maxSizeMB={10}
                onFileSelect={handleFileUploaded}
                isLoading={isSubmitting}
              />
            </div>
          )}

          {applyStep === 3 && (
            <div className="anim-fade-in">
              <div style={{ backgroundColor: 'var(--gray-50)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Applicant Summary</h4>
                <div className="grid grid-cols-2 gap-4" style={{ fontSize: 'var(--fs-body-sm)' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
                    <div className="font-semibold">{name}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                    <div className="font-semibold">{email}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Phone:</span>
                    <div className="font-semibold">{phone}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Resume File:</span>
                    <div className="font-semibold" style={{ color: 'var(--primary-600)' }}>
                      {resumeFile?.name}
                    </div>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 'var(--fs-body-sm)', margin: 0 }}>
                By submitting, our machine-learning model will extract your work metrics, map them against target keywords, and rank your score within our dashboard.
              </p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
