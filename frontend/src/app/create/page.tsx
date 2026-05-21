'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Upload, 
  Clock, 
  FileText, 
  Calendar, 
  FileUp,
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAssignmentStore } from '@/store/useAssignmentStore';

interface QuestionTypeRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export default function CreateAssignment() {
  const router = useRouter();
  
  // Zustand store properties
  const { 
    createAssignment, 
    connectWebSocket, 
    generating, 
    generationProgress, 
    generationLogs,
    resetGenerationState
  } = useAssignmentStore();

  // Wizard Step State
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [classLevel, setClassLevel] = useState('Grade 8');
  const [allowedTime, setAllowedTime] = useState(45);
  const [maxMarks, setMaxMarks] = useState(20);
  const [dueDate, setDueDate] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  // Question Type Table Rows State
  const [questionTypeRows, setQuestionTypeRows] = useState<QuestionTypeRow[]>([
    { id: '1', type: 'Short Answer', count: 5, marks: 3 }
  ]);

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Ref to automatically scroll log box
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Set default due date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().split('T')[0]);
    resetGenerationState();
    setMounted(true);
  }, [resetGenerationState]);

  // Scroll live logs console to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generationLogs]);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop Events
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ["image/jpeg", "image/png", "application/pdf", "text/plain"];
      if (validTypes.includes(file.type)) {
        setUploadedFile(file);
      } else {
        alert("Only JPEG, PNG, PDF, or Text files are supported.");
      }
    }
  };

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Question Type Table Operations
  const handleAddRow = () => {
    const newId = Date.now().toString();
    setQuestionTypeRows([
      ...questionTypeRows,
      { id: newId, type: 'MCQ', count: 5, marks: 1 }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (questionTypeRows.length > 1) {
      setQuestionTypeRows(questionTypeRows.filter(row => row.id !== id));
    } else {
      alert("At least one question type is required.");
    }
  };

  const handleRowChange = (id: string, field: keyof QuestionTypeRow, value: any) => {
    setQuestionTypeRows(questionTypeRows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // Stepper Handlers
  const adjustCount = (id: string, delta: number) => {
    const row = questionTypeRows.find(r => r.id === id);
    if (!row) return;
    const nextVal = Math.max(1, row.count + delta);
    handleRowChange(id, 'count', nextVal);
  };

  const adjustMarks = (id: string, delta: number) => {
    const row = questionTypeRows.find(r => r.id === id);
    if (!row) return;
    const nextVal = Math.max(1, row.marks + delta);
    handleRowChange(id, 'marks', nextVal);
  };

  // Dynamic calculations
  const totalQuestions = questionTypeRows.reduce((sum, r) => sum + r.count, 0);
  const totalMarks = questionTypeRows.reduce((sum, r) => sum + r.count * r.marks, 0);

  // Sync total marks to maxMarks in step 2 automatically
  useEffect(() => {
    setMaxMarks(totalMarks);
  }, [totalMarks]);

  // Validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Assignment title is required';
    if (!dueDate) newErrors.dueDate = 'Due date is required';
    
    // Check for duplicate question types in table
    const typesSeen = new Set<string>();
    let hasDuplicates = false;
    questionTypeRows.forEach(row => {
      if (typesSeen.has(row.type)) {
        hasDuplicates = true;
      }
      typesSeen.add(row.type);
    });

    if (hasDuplicates) {
      newErrors.questionTypes = 'Duplicate question types are not allowed. Please merge them.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!classLevel.trim()) newErrors.classLevel = 'Class level is required';
    if (allowedTime <= 0) newErrors.allowedTime = 'Time allowed must be greater than 0';
    if (maxMarks <= 0) newErrors.maxMarks = 'Max marks must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setErrors({});
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setErrors({});
  };

  // Submit Generation Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      handleNextStep();
      return;
    }

    if (!validateStep2()) return;

    // Build specialized prompt instructions incorporating the table configuration
    const typeInstructions = questionTypeRows
      .map(r => `- Generate exactly ${r.count} ${r.type} questions, each valued at ${r.marks} marks.`)
      .join('\n');

    const finalInstructions = `
[Strict UI Table Configuration - Respect Count & Marks]:
${typeInstructions}

[Additional Details]:
${additionalInstructions || 'None'}
`.trim();

    // Call Zustand create assignment action
    const assignmentId = await createAssignment({
      title,
      subject,
      classLevel,
      allowedTime: Number(allowedTime),
      maxMarks: Number(maxMarks),
      dueDate,
      questionTypes: questionTypeRows.map(r => r.type),
      additionalInstructions: finalInstructions
    });

    if (assignmentId) {
      // Connect WebSocket to track live worker progress
      connectWebSocket(assignmentId, () => {
        // Run confetti celebration!
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        });
        
        // Wait 1.5 seconds and redirect to output page
        setTimeout(() => {
          router.push(`/assignment/${assignmentId}`);
        }, 1500);
      });
    }
  };

  const availableSubjects = [
    'Science', 'Mathematics', 'English', 'Social Studies', 
    'Computers', 'Hindi', 'General Knowledge', 'Physics', 
    'Chemistry', 'Biology'
  ];

  return (
    <div className="form-card card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Step Progress Tracker */}
      <div className="step-indicator">
        <div 
          className="step-indicator-progress" 
          style={{ width: step === 1 ? '0%' : '100%' }}
        ></div>
        <div className={`step-dot ${step >= 1 ? 'completed' : ''}`}>1</div>
        <div className={`step-dot ${step === 2 ? 'completed' : 'active'}`}>2</div>
      </div>

      <div className="dashboard-title-area" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 className="dashboard-title">
          {step === 1 ? 'Assignment Details' : 'Assignment Configuration'}
        </h1>
        <p className="dashboard-subtitle">
          {step === 1 
            ? 'Define assignment name, upload reference files, and build the question table.' 
            : 'Review the metadata and set the duration of the examination paper.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Assignment Title</label>
              <input 
                type="text" 
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Quiz on Electricity, Chapter 4 Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.title}</span>}
            </div>

            {/* Row with Due Date & File Upload label */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Due Date */}
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date" 
                    className={`form-input ${errors.dueDate ? 'error' : ''}`}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <Calendar size={16} style={{ position: 'absolute', right: '16px', top: '14px', color: 'var(--text-light)', pointerEvents: 'none' }} />
                </div>
                {errors.dueDate && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.dueDate}</span>}
              </div>

              {/* Empty placeholder to align layout nicely */}
              <div></div>
            </div>

            {/* Reference Material File Upload */}
            <div className="form-group">
              <label className="form-label">Reference Material (Optional PDF, JPEG, PNG, TXT)</label>
              <div 
                className={`file-upload-area ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-picker')?.click()}
                style={{ padding: '24px' }}
              >
                <input 
                  type="file" 
                  id="file-picker" 
                  style={{ display: 'none' }} 
                  accept=".pdf,.txt,.jpeg,.jpg,.png" 
                  onChange={handleFileChange}
                />
                
                {uploadedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
                    <FileUp size={24} style={{ color: 'var(--primary)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div className="file-upload-text">{uploadedFile.name}</div>
                      <div className="file-upload-subtext">{(uploadedFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '12px' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="file-upload-icon" />
                    <div className="file-upload-text">Drag & drop files or click to upload</div>
                    <div className="file-upload-subtext">Supports PDF, TXT, JPEG, PNG (Max 10MB)</div>
                  </>
                )}
              </div>
            </div>

            {/* Question Type Table */}
            <div className="form-group">
              <label className="form-label">Configure Question Types</label>
              {errors.questionTypes && (
                <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  ⚠️ {errors.questionTypes}
                </div>
              )}
              <table className="question-type-table">
                <thead>
                  <tr>
                    <th>Question Type</th>
                    <th>No. of Questions</th>
                    <th>Marks per Question</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {questionTypeRows.map((row) => (
                    <tr key={row.id} className="question-type-row">
                      <td>
                        <select 
                          className="question-type-select"
                          value={row.type}
                          onChange={(e) => handleRowChange(row.id, 'type', e.target.value)}
                        >
                          <option value="MCQ">MCQ (Multiple Choice)</option>
                          <option value="Short Answer">Short Answer</option>
                          <option value="Long Answer">Long Answer</option>
                          <option value="Very Long Answer">Very Long Answer</option>
                        </select>
                      </td>
                      <td>
                        <div className="stepper-control">
                          <button 
                            type="button" 
                            className="stepper-btn"
                            onClick={() => adjustCount(row.id, -1)}
                          >
                            -
                          </button>
                          <input 
                            type="text" 
                            className="stepper-input" 
                            value={row.count} 
                            readOnly
                          />
                          <button 
                            type="button" 
                            className="stepper-btn"
                            onClick={() => adjustCount(row.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="stepper-control">
                          <button 
                            type="button" 
                            className="stepper-btn"
                            onClick={() => adjustMarks(row.id, -1)}
                          >
                            -
                          </button>
                          <input 
                            type="text" 
                            className="stepper-input" 
                            value={row.marks} 
                            readOnly
                          />
                          <button 
                            type="button" 
                            className="stepper-btn"
                            onClick={() => adjustMarks(row.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="remove-row-btn"
                          onClick={() => handleRemoveRow(row.id)}
                          title="Remove Question Type"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button 
                type="button" 
                className="add-type-btn"
                onClick={handleAddRow}
              >
                <Plus size={16} />
                Add Question Type
              </button>

              {/* Running Totals Summary */}
              <div className="totals-summary">
                <span>Total Questions: {totalQuestions}</span>
                <span>Total Calculated Marks: {totalMarks}</span>
              </div>
            </div>

            {/* Additional instructions */}
            <div className="form-group">
              <label className="form-label">Additional Instructions / Topic Focus</label>
              <textarea 
                className="form-input"
                style={{ height: '100px', resize: 'vertical' }}
                placeholder="e.g. Focus on Chapter 4 NCERT chapters. Keep questions conceptual and chemistry-focused."
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
              />
            </div>

            {/* Navigation (Next Only) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                onClick={handleNextStep}
              >
                Next Step
                <ChevronRight size={16} />
              </button>
            </div>

          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Subject */}
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select 
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Class Level */}
            <div className="form-group">
              <label className="form-label">Grade / Class</label>
              <input 
                type="text" 
                className={`form-input ${errors.classLevel ? 'error' : ''}`}
                placeholder="e.g. CBSE Grade 8, Class 5th"
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
              />
              {errors.classLevel && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.classLevel}</span>}
            </div>

            {/* Allowed Time */}
            <div className="form-group">
              <label className="form-label">Time Allowed (minutes)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className={`form-input ${errors.allowedTime ? 'error' : ''}`}
                  value={allowedTime}
                  onChange={(e) => setAllowedTime(Number(e.target.value))}
                />
                <Clock size={16} style={{ position: 'absolute', right: '16px', top: '14px', color: 'var(--text-light)' }} />
              </div>
              {errors.allowedTime && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.allowedTime}</span>}
            </div>

            {/* Max Marks */}
            <div className="form-group">
              <label className="form-label">Maximum Marks</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className={`form-input ${errors.maxMarks ? 'error' : ''}`}
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                />
                <FileText size={16} style={{ position: 'absolute', right: '16px', top: '14px', color: 'var(--text-light)' }} />
              </div>
              {errors.maxMarks && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.maxMarks}</span>}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                💡 Automatically pre-filled with the calculated total marks: <strong>{totalMarks}</strong>
              </span>
            </div>

            {/* Navigation (Previous & Generate) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                onClick={handlePrevStep}
              >
                <ChevronLeft size={16} />
                Previous Step
              </button>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                <Sparkles size={16} />
                Generate Assignment
              </button>
            </div>

          </div>
        )}
      </form>

      {/* Real-time WebSockets Generation Progress Overlay Sheet */}
      {generating && mounted && createPortal(
        <div className="overlay-loader-backdrop">
          <div className="overlay-loader-card">
            <div className="loader-sparkle-container">
              ✨
            </div>
            <h3 className="loader-title">AI is Creating Your Assessment...</h3>
            <p className="loader-desc">
              We are connecting to the queue worker and generating your structured question paper.
            </p>
            
            <div className="progress-track">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <div className="progress-percent-label">{generationProgress}%</div>

            {/* Terminal Live WebSocket Logger */}
            <div className="loader-log-box">
              {generationLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`loader-log-line ${idx === generationLogs.length - 1 ? 'latest' : ''}`}
                >
                  &gt; {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
