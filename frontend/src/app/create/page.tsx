'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Upload, 
  Clock, 
  FileText, 
  Calendar, 
  HelpCircle,
  FileUp,
  X
} from 'lucide-react';
import { useAssignmentStore } from '@/store/useAssignmentStore';

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

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [classLevel, setClassLevel] = useState('Grade 8');
  const [allowedTime, setAllowedTime] = useState(45);
  const [maxMarks, setMaxMarks] = useState(20);
  const [dueDate, setDueDate] = useState('');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['Short Answer']);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Ref to automatically scroll log box
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Set default due date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().split('T')[0]);
    resetGenerationState();
  }, [resetGenerationState]);

  // Scroll live logs console to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generationLogs]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Accept PDF or Text files
      if (file.type === "application/pdf" || file.type === "text/plain") {
        setUploadedFile(file);
      } else {
        alert("Only PDF or Text files are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const toggleQuestionType = (type: string) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter(t => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!classLevel.trim()) newErrors.classLevel = 'Class level is required';
    if (allowedTime <= 0) newErrors.allowedTime = 'Time must be a positive number';
    if (maxMarks <= 0) newErrors.maxMarks = 'Marks must be a positive number';
    if (!dueDate) newErrors.dueDate = 'Due date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Call API and get assignment ID
    const assignmentId = await createAssignment({
      title,
      subject,
      classLevel,
      allowedTime: Number(allowedTime),
      maxMarks: Number(maxMarks),
      dueDate,
      questionTypes,
      additionalInstructions: additionalInstructions || undefined
    });

    if (assignmentId) {
      // Connect WebSocket to track live worker progress
      connectWebSocket(assignmentId, () => {
        // Triggers on complete!
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

  return (
    <div className="form-card card">
      <div className="dashboard-title-area" style={{ marginBottom: '24px' }}>
        <h1 className="dashboard-title">Create New Assessment</h1>
        <p className="dashboard-subtitle">Configure your exam paper and let AI generate the questions.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        {/* Title */}
        <div className="form-group form-col-span-2">
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

        {/* Subject */}
        <div className="form-group">
          <label className="form-label">Subject</label>
          <select 
            className="form-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="Science">Science (Electrolysis / chemistry templates)</option>
            <option value="English">English (Grammar / prepositions templates)</option>
            <option value="Mathematics">Mathematics (Calculus / geometry templates)</option>
            <option value="Social Studies">Social Studies</option>
            <option value="Computers">Computers</option>
            <option value="Hindi">Hindi</option>
            <option value="General Knowledge">General Knowledge</option>
          </select>
        </div>

        {/* Class Level */}
        <div className="form-group">
          <label className="form-label">Grade / Class</label>
          <input 
            type="text" 
            className="form-input"
            placeholder="e.g. CBSE Grade 8, Class 5th"
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
          />
        </div>

        {/* Allowed Time */}
        <div className="form-group">
          <label className="form-label">Time Allowed (minutes)</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="number" 
              className="form-input"
              value={allowedTime}
              onChange={(e) => setAllowedTime(Number(e.target.value))}
            />
            <Clock size={16} style={{ position: 'absolute', right: '16px', top: '14px', color: 'var(--text-light)' }} />
          </div>
        </div>

        {/* Max Marks */}
        <div className="form-group">
          <label className="form-label">Maximum Marks</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="number" 
              className="form-input"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
            />
            <FileText size={16} style={{ position: 'absolute', right: '16px', top: '14px', color: 'var(--text-light)' }} />
          </div>
        </div>

        {/* Due Date */}
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="date" 
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Calendar size={16} style={{ position: 'absolute', right: '16px', top: '14px', color: 'var(--text-light)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Question Types Tile Select */}
        <div className="form-group">
          <label className="form-label">Question Types</label>
          <div className="checkbox-grid">
            {['MCQ', 'Short Answer', 'Long Answer', 'Very Long Answer'].map((type) => (
              <div 
                key={type}
                className={`checkbox-tile ${questionTypes.includes(type) ? 'checked' : ''}`}
                onClick={() => toggleQuestionType(type)}
              >
                {type}
              </div>
            ))}
          </div>
        </div>

        {/* File Upload drag and drop */}
        <div className="form-group form-col-span-2">
          <label className="form-label">Reference Material (Optional PDF/Text)</label>
          <div 
            className={`file-upload-area ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-picker')?.click()}
          >
            <input 
              type="file" 
              id="file-picker" 
              style={{ display: 'none' }} 
              accept=".pdf,.txt" 
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
                <div className="file-upload-subtext">Supports PDF, TXT (Max 5MB)</div>
              </>
            )}
          </div>
        </div>

        {/* Additional instructions */}
        <div className="form-group form-col-span-2">
          <label className="form-label">Additional Instructions / Topic Focus</label>
          <textarea 
            className="form-input"
            style={{ height: '100px', resize: 'vertical' }}
            placeholder="e.g. Focus on Chapter 4 NCERT chapters. Keep questions conceptual and chemistry-focused."
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
          />
        </div>

        {/* Action Button */}
        <div className="form-col-span-2" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '14px 28px' }}>
            <Sparkles size={16} />
            Generate Question Paper
          </button>
        </div>
      </form>

      {/* Real-time WebSockets Generation Progress Overlay Sheet */}
      {generating && (
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
        </div>
      )}
    </div>
  );
}
