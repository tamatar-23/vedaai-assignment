'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw
} from 'lucide-react';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useUserStore } from '@/store/useUserStore';

const getTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

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

  const { user, fetchProfile } = useUserStore();
  const firstName = user ? user.name.split(' ')[0] : 'Teacher';

  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Load user profile on mount if not loaded
  useEffect(() => {
    if (!user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Helper to extract and display only the actual additional instructions/focus notes
  const getDisplayInstructions = (instructions?: string): string => {
    if (!instructions) return '';
    const detailsMarker = '[Additional Details]:';
    const index = instructions.indexOf(detailsMarker);
    if (index !== -1) {
      const details = instructions.substring(index + detailsMarker.length).trim();
      return details === 'None' ? '' : details;
    }
    return instructions;
  };

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
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    window.open(`${apiBase}/assignments/${id}/pdf`, '_blank');
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
      <div className="action-bar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start', marginBottom: '32px' }}>
        <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: 500, lineHeight: 1.5, margin: 0, maxWidth: '750px' }}>
          Certainly, {firstName}! Here is the customized Question Paper for your CBSE {activeAssignment.classLevel} {activeAssignment.subject} classes:
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleDownloadPDF}
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#1e293b', 
              border: 'none', 
              borderRadius: '9999px', 
              padding: '10px 24px', 
              fontWeight: 600, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer' 
            }}
          >
            <Download size={16} /> Download as PDF
          </button>
          <button 
            onClick={handleBack}
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.08)', 
              color: '#ffffff', 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '9999px', 
              padding: '10px 24px', 
              fontWeight: 600, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer' 
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button 
            onClick={handleRegenerate}
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.08)', 
              color: '#ffffff', 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '9999px', 
              padding: '10px 24px', 
              fontWeight: 600, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer' 
            }}
          >
            <RefreshCw size={16} /> Regenerate AI
          </button>
        </div>
      </div>

      {/* Main Exam Paper Card */}
      <div className="exam-paper-container">
        {/* Header */}
        <div className="exam-paper-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="exam-school-title" style={{ textAlign: 'center' }}>
            {getTitleCase([activeAssignment?.schoolName || user?.schoolName || 'DELHI PUBLIC SCHOOL', user?.schoolBranch || 'BOKARO BRANCH'].filter(Boolean).join(', '))}
          </h1>
          <p className="exam-subject-sub" style={{ textAlign: 'center', fontSize: '15px', fontWeight: 600, color: '#475569', margin: '4px 0' }}>
            Subject: {getTitleCase(activeAssignment.subject)}, Class: {activeAssignment.classLevel}
          </p>
        </div>

        {/* Metadata Box */}
        <div className="exam-meta-box">
          <span>TIME ALLOWED: {activeAssignment.allowedTime} MINUTES</span>
          <span>MAXIMUM MARKS: {activeAssignment.maxMarks}</span>
        </div>

        {/* Instructions */}
        <div className="exam-general-instructions">
          <strong>General Instructions:</strong>
          <ol style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <li>All questions are compulsory.</li>
            <li>This question paper contains {sections.length} sections.</li>
            <li>Marks are indicated against each question.</li>
            {getDisplayInstructions(activeAssignment.additionalInstructions) && (
              <li>Focus notes: {getDisplayInstructions(activeAssignment.additionalInstructions)}</li>
            )}
          </ol>
        </div>

        {/* Student Form */}
        <div className="exam-student-form">
          <div className="student-input-group">
            <span>NAME:</span>
            <input type="text" className="student-input-line" disabled />
          </div>
          <div className="student-input-group">
            <span>ROLL NO:</span>
            <input type="text" className="student-input-line" disabled />
          </div>
          <div className="student-input-group">
            <span>SECTION:</span>
            <input type="text" className="student-input-line" disabled />
          </div>
        </div>

        {/* Sections and Questions */}
        {sections.map((section, secIdx) => (
          <div key={secIdx} className="exam-section-block">
            <h3 className="exam-section-title" style={{ textAlign: 'center' }}>{section.title}</h3>
            <p className="exam-section-instruction" style={{ textAlign: 'center' }}>{section.instruction}</p>

            <div className="exam-questions-list">
              {section.questions.map((q, qIdx) => (
                <div key={qIdx} className="exam-question-item" style={{ marginBottom: '16px' }}>
                  <div className="exam-question-text-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', lineHeight: '1.6' }}>
                    <span className="exam-question-num" style={{ fontWeight: 'normal' }}>{qIdx + 1}.</span>
                    <span className="exam-question-text">
                      <span style={{ fontWeight: 'bold', marginRight: '6px' }}>
                        [{q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}]
                      </span>
                      {q.questionText}
                      <span style={{ fontWeight: 'bold', marginLeft: '6px', whiteSpace: 'nowrap' }}>
                        [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                      </span>
                    </span>
                  </div>

                  {/* MCQ Options if present */}
                  {q.options && q.options.length > 0 && (
                    <div className="exam-mcq-options" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingLeft: '20px', marginTop: '8px' }}>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="exam-mcq-option" style={{ fontSize: '13px' }}>
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

        {/* End of Question Paper Footer */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '40px 0', fontSize: '14px', color: '#475569' }}>
          — End of Question Paper —
        </div>

        {/* Flat Answer Key Section */}
        <div className="answer-key-section" style={{ marginTop: '40px', borderTop: '2px dashed #cbd5e1', paddingTop: '30px' }}>
          <h4 className="answer-key-title" style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#0f172a' }}>
            Answer Key
          </h4>
          <div className="answer-key-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sections.map((section, secIdx) => (
              <div key={secIdx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  {section.title}
                </h5>
                {section.questions.map((q, qIdx) => (
                  <div key={qIdx} className="answer-key-item" style={{ borderLeft: '3px solid #cbd5e1', paddingLeft: '12px' }}>
                    <div className="answer-key-q-title" style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Question {qIdx + 1} Answer:
                    </div>
                    <div className="answer-key-text" style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>
                      {q.answer}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
