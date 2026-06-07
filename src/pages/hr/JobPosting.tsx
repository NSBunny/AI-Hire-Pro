import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input, Textarea, Select } from '../../components/shared/Input';
import { Sparkles, ArrowLeft, Check } from 'lucide-react';

interface JobPostingProps {
  onNavigate: (tab: string) => void;
}

export const JobPosting: React.FC<JobPostingProps> = ({ onNavigate }) => {
  const { addJob } = useApp();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Full-time');
  const [salary, setSalary] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [description, setDescription] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const deptOptions = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'AI & Data Science', label: 'AI & Data Science' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Product Design', label: 'Product Design' },
    { value: 'Finance', label: 'Finance' }
  ];

  const typeOptions = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Remote', label: 'Remote' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Part-time', label: 'Part-time' }
  ];

  // Mock AI Job Description writing
  const handleAutoGenerateJD = () => {
    if (!title) {
      alert('Please enter a Job Title first.');
      return;
    }
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
      const primarySkills = skillsList.length > 0 ? skillsList : ['React', 'TypeScript', 'Rest APIs'];

      const generatedText = `### Role Overview
We are looking for a highly motivated and qualified ${title} to join our growing ${department} team. In this position, you will be responsible for creating, styling, and implementing client/server architectures, ensuring high availability, security, and scalability metrics.

### Key Responsibilities
- Architect, implement, and maintain responsive web modules.
- Collaborate with Senior Architects, Product Managers, and AI engineers.
- Audit layout structures for accessibility (WCAG compliance) and page performance.
- Optimize network assets and code bundling systems.

### Technical Requirements
- 2+ years of production experience working in similar roles.
- Expert command over: ${primarySkills.join(', ')}.
- Exceptional problem-solving and communication capability.`;

      setDescription(generatedText);
      setIsGenerating(false);
    }, 1500); // 1.5 second simulated wait
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !salary || !experience || !skills || !description) {
      alert('Please fill out all required fields.');
      return;
    }

    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);

    addJob({
      title,
      department,
      location,
      type,
      salary,
      experience,
      skills: skillsArray,
      description,
      status: 'active'
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onNavigate('dashboard');
    }, 1500);
  };

  return (
    <div className="anim-slide-up" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => onNavigate('dashboard')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '50%'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="m-0" style={{ fontSize: 'var(--fs-lg-display)' }}>Create Job Posting</h1>
          <p style={{ margin: 0 }}>Publish a new requisition to the AIHire Pro portal.</p>
        </div>
      </div>

      <Card>
        {isSuccess ? (
          <div className="text-center py-12">
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <Check size={24} />
            </div>
            <h2>Job Posted Successfully!</h2>
            <p>Requisition published to active vacancy feeds. Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Job Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                required
              />
              <Select
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={deptOptions}
              />
              <Input
                label="Location *"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore, India (or Remote)"
                required
              />
              <Select
                label="Job Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={typeOptions}
              />
              <Input
                label="Salary Range *"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. ₹18 - ₹25 LPA"
                required
              />
              <Input
                label="Required Experience *"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 3-5 years"
                required
              />
            </div>

            <Input
              label="Keywords / Tech Skills (Comma separated) *"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, TypeScript, CSS, Git"
              helperText="Separate multiple skills with commas."
              required
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="form-label" style={{ margin: 0 }}>Job Description *</span>
              <button
                type="button"
                onClick={handleAutoGenerateJD}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--secondary-600)', border: '1px solid var(--secondary-200)' }}
                disabled={isGenerating}
              >
                <Sparkles size={14} style={{ marginRight: '4px' }} />
                {isGenerating ? 'AI writing...' : 'AI Auto-Generate JD'}
              </button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed overview of the role, responsibilities, and qualifications required..."
              style={{ minHeight: '180px' }}
              required
            />

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => onNavigate('dashboard')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Publish Requisition
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
