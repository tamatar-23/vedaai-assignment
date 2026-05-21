'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Sparkles,
  Printer,
  FileText,
  Clock,
  Award
} from 'lucide-react';
import { useAssignmentStore, IAssignment } from '@/store/useAssignmentStore';

export default function AssignmentOutput() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { 
    activeAssignment, 
    loading, 
    fetchAssignmentDetails, 
    regenerateAssignment,
    connectWebSocket,
    generating,
    generationProgress,
    generationLogs,
    resetGenerationState
  } = useAssignmentStore();

  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Load details on mount
  useEffect(() => {
    if (id) {
      fetchAssignmentDetails(id).then((assignment) => {
        // If it's not completed, connect websocket to track it
        if (assignment && assignment.status !== 'completed' && assignment.status !== 'failed') {
          connectWebSocket(id, () => {
            // Trigger confetti
            import('canvas-confetti').then((confetti) => {
              confetti.default({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });
            });
            // Reload assignment details
            fetchAssignmentDetails(id);
          });
        }
      });
    }
    return () => {
      resetGenerationState();
    };
  }, [id, fetchAssignmentDetails, connectWebSocket, resetGenerationState]);

  // Scroll live logs console to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generationLogs]);

  const handleBack = () => {
    router.push('/');
  };

  const handleDownloadPDF = () => {
    if (!id) return;
    window.open(`http://localhost:5000/api/assignments/${id}/pdf`, '_blank');
  };

  const handleRegenerate = async () => {
    if (!id) return;
    if (confirm('Are you sure you want to regenerate all questions using AI? This will replace the current questions.')) {
      await regenerateAssignment(id);
      // Connect WebSocket to track live worker progress
      connectWebSocket(id, () => {
        // Triggers on complete!
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        });
        // Reload details
        fetchAssignmentDetails(id);
      });
    }
  };

  if (loading && !activeAssignment && !generating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div style={{ fontSize: '32px', animation: 'spin 2s linear infinite' }}>🔄</div>
        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading assignment details...</div>
      </div>
    );
  }

  // If generating/processing (and not loading details), show progress page
  if ((generating || (activeAssignment && activeAssignment.status !== 'completed' && activeAssignment.status !== 'failed'))) {
    return (
      <div className="overlay-loader-backdrop" style={{ position: 'relative', minHeight: '70vh', background: 'transparent', backdropFilter: 'none' }}>
        <div className="overlay-loader-card" style={{ boxShadow: 'var(--shadow-md)', margin: '40px auto' }}>
          <div className="loader-sparkle-container">
            ✨
          </div>
          <h3 className="loader-title">AI is Creating Your Assessment...</h3>
          <p className="loader-desc">
            We are generating your structured question paper.
          </p>
          
          <div className="progress-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${generationProgress || activeAssignment?.progress || 0}%` }}
            ></div>
          </div>
          <div className="progress-percent-label">{generationProgress || activeAssignment?.progress || 0}%</div>

          {/* Terminal Live WebSocket Logger */}
          <div className="loader-log-box">
            {(generationLogs.length > 0 ? generationLogs : [activeAssignment?.stepLog || 'Queuing AI worker...']).map((log, idx, arr) => (
              <div 
                key={idx} 
                className={`loader-log-line ${idx === arr.length - 1 ? 'latest' : ''}`}
              >
                &gt; {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    );
  }

  if (!activeAssignment) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Assignment Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>The assignment you are looking for does not exist or has been deleted.</p>
        <button className="btn btn-primary" onClick={handleBack}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (activeAssignment.status === 'failed') {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#ef4444' }}>Generation Failed</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          An error occurred while generating the question paper. Please try again.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={handleBack}>
            <ArrowLeft size={16} />
            Dashboard
          </button>
          <button className="btn btn-primary" onClick={handleRegenerate}>
            <RefreshCw size={16} />
            Regenerate Paper
          </button>
        </div>
      </div>
    );
  }

  // Group sections from activeAssignment
  const sections = activeAssignment.sections || [];

  return (
    <div className="output-layout-wrapper">
      {/* Top Navigation & Action Bar */}
      <div className="action-bar">
        <div>
          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#cbd5e1', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              fontSize: '13px',
              padding: 0,
              marginBottom: '4px'
            }}
            onClick={handleBack}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            {activeAssignment.title}
          </h2>
        </div>

        <div className="action-bar-buttons">
          <button className="btn btn-secondary" onClick={handleRegenerate} style={{ border: '1px solid #475569', backgroundColor: '#334155', color: '#ffffff' }}>
            <RefreshCw size={16} />
            Regenerate AI
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPDF}>
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Main Exam Paper Card */}
      <div className="exam-paper-container">
        {/* Exam Header */}
        <div className="exam-paper-header">
          <h1 className="exam-school-title">DEMO PUBLIC SCHOOL</h1>
          <p className="exam-subject-sub">{activeAssignment.subject.toUpperCase()} ASSESSMENT</p>
          <p className="exam-class-sub">Class: {activeAssignment.classLevel} &bull; Term Assessment</p>
        </div>

        {/* Exam Metadata (Marks / Time) */}
        <div className="exam-meta-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>TIME ALLOWED: {activeAssignment.allowedTime} MINUTES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} />
            <span>MAXIMUM MARKS: {activeAssignment.maxMarks}</span>
          </div>
        </div>

        {/* General Instructions */}
        <div className="exam-general-instructions">
          <strong>General Instructions:</strong>
          <ol style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <li>All questions are compulsory.</li>
            <li>This question paper contains {sections.length} sections.</li>
            <li>Marks are indicated against each question.</li>
            {activeAssignment.additionalInstructions && (
              <li>Focus notes: {activeAssignment.additionalInstructions}</li>
            )}
          </ol>
        </div>

        {/* Student Details Blank Lines */}
        <div className="exam-student-form">
          <div className="student-input-group">
            <span>NAME:</span>
            <input type="text" className="student-input-line" disabled placeholder="__________________________" />
          </div>
          <div className="student-input-group">
            <span>ROLL NO:</span>
            <input type="text" className="student-input-line" disabled placeholder="___________" />
          </div>
          <div className="student-input-group">
            <span>SECTION:</span>
            <input type="text" className="student-input-line" disabled placeholder="___________" />
          </div>
        </div>

        {/* Sections and Questions */}
        {sections.map((section, secIdx) => (
          <div key={secIdx} className="exam-section-block">
            <h3 className="exam-section-title">{section.title}</h3>
            <p className="exam-section-instruction">{section.instruction}</p>

            <div className="exam-questions-list">
              {section.questions.map((q, qIdx) => (
                <div key={qIdx} className="exam-question-item">
                  <div className="exam-question-text-row">
                    <span className="exam-question-num">Q{qIdx + 1}.</span>
                    <span className="exam-question-text">
                      {q.questionText}
                      <span className={`exam-difficulty-tag ${q.difficulty}`}>
                        {q.difficulty}
                      </span>
                    </span>
                    <span className="exam-question-marks">[{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]</span>
                  </div>

                  {/* MCQ Options if present */}
                  {q.options && q.options.length > 0 && (
                    <div className="exam-mcq-options">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="exam-mcq-option">
                          <strong>{String.fromCharCode(65 + optIdx)})</strong> {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Toggleable Answer Key Section */}
        <div className="answer-key-section">
          <div 
            className="answer-key-header"
            onClick={() => setShowAnswerKey(!showAnswerKey)}
          >
            <h4 className="answer-key-title">Teacher Answer Key</h4>
            <div className="answer-key-toggle-indicator">
              {showAnswerKey ? (
                <>
                  <EyeOff size={14} /> Hide Answer Key
                </>
              ) : (
                <>
                  <Eye size={14} /> Show Answer Key
                </>
              )}
            </div>
          </div>

          {showAnswerKey && (
            <div className="answer-key-content">
              {sections.map((section, secIdx) => (
                <div key={secIdx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                    {section.title}
                  </h5>
                  {section.questions.map((q, qIdx) => (
                    <div key={qIdx} className="answer-key-item">
                      <div className="answer-key-q-title">Question {qIdx + 1} Answer:</div>
                      <div className="answer-key-text">{q.answer}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
