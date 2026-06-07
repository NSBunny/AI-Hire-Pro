import React, { useRef, useState } from 'react';

// ==========================================
// STANDARD TEXT INPUT
// ==========================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random()}`;
  return (
    <div className="form-group">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <input
        id={inputId}
        className={`form-input ${errorText ? 'border-error' : ''} ${className}`}
        {...props}
      />
      {errorText && <span className="form-error">{errorText}</span>}
      {!errorText && helperText && <span className="form-helper">{helperText}</span>}
    </div>
  );
};

// ==========================================
// TEXTAREA
// ==========================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  helperText,
  errorText,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random()}`;
  return (
    <div className="form-group">
      {label && <label htmlFor={textareaId} className="form-label">{label}</label>}
      <textarea
        id={textareaId}
        className={`form-textarea ${errorText ? 'border-error' : ''} ${className}`}
        {...props}
      />
      {errorText && <span className="form-error">{errorText}</span>}
      {!errorText && helperText && <span className="form-helper">{helperText}</span>}
    </div>
  );
};

// ==========================================
// SELECT SELECTOR
// ==========================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  helperText?: string;
  errorText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  helperText,
  errorText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random()}`;
  return (
    <div className="form-group">
      {label && <label htmlFor={selectId} className="form-label">{label}</label>}
      <select
        id={selectId}
        className={`form-select ${errorText ? 'border-error' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorText && <span className="form-error">{errorText}</span>}
      {!errorText && helperText && <span className="form-helper">{helperText}</span>}
    </div>
  );
};

// ==========================================
// DRAG-AND-DROP FILE UPLOAD ZONE
// ==========================================
interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '.pdf,.docx',
  maxSizeMB = 10,
  onFileSelect,
  isLoading = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const triggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateAndProcessFile = (file: File) => {
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const acceptedExtensions = accept.split(',');
    
    if (!acceptedExtensions.includes(fileExtension)) {
      alert(`Invalid file type. Only ${accept} files are supported.`);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File is too large. Max size is ${maxSizeMB}MB.`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
    
    // Simulate UI progress bar load
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((old) => {
        if (old >= 100) {
          clearInterval(interval);
          return 100;
        }
        return old + 20;
      });
    }, 200);
  };

  return (
    <div className="form-group w-full">
      {label && <label className="form-label">{label}</label>}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: 'none' }}
      />
      <div
        className={`file-upload-zone ${isDragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerBrowse}
      >
        <span style={{ fontSize: '2rem' }}>📄</span>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {selectedFile ? selectedFile.name : 'Drag & drop your resume here'}
        </span>
        <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
          {selectedFile
            ? `Size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
            : `Supported: ${accept} · Max: ${maxSizeMB}MB`}
        </span>
        
        {!selectedFile && (
          <button type="button" className="btn btn-secondary btn-sm mt-2">
            Browse Files
          </button>
        )}

        {(selectedFile || isLoading) && (
          <div className="w-full mt-4" style={{ padding: '0 20px' }}>
            <div style={{
              height: '4px',
              backgroundColor: 'var(--gray-200)',
              borderRadius: '2px',
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                backgroundColor: 'var(--primary-600)',
                transition: 'width 0.2s ease'
              }} />
            </div>
            <div className="flex justify-between items-center mt-1" style={{ fontSize: 'var(--fs-caption)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {uploadProgress < 100 ? 'Uploading...' : 'Upload complete'}
              </span>
              <span className="font-semibold" style={{ color: 'var(--primary-600)' }}>
                {uploadProgress}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
