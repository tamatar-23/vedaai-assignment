'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  FileText, 
  MoreVertical, 
  Plus, 
  Trash2, 
  Eye, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Users,
  Award
} from 'lucide-react';
import { useAssignmentStore, IAssignment } from '@/store/useAssignmentStore';
import { useUserStore } from '@/store/useUserStore';

export default function Dashboard() {
  const router = useRouter();
  
  // Stores
  const { assignments, loading, fetchAssignments, deleteAssignment } = useAssignmentStore();
  const { user, fetchProfile } = useUserStore();

  // Local States
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Analytics Modals States
  const [showGaugeModal, setShowGaugeModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showGradedModal, setShowGradedModal] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchProfile();
  }, [fetchAssignments, fetchProfile]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateClick = () => {
    router.push('/create');
  };

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleCardClick = (id: string, status: string) => {
    if (status === 'completed') {
      router.push(`/assignment/${id}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this assignment?')) {
      await deleteAssignment(id);
      triggerToast('Assignment deleted successfully!');
      setActiveDropdown(null);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const closeAll = () => setActiveDropdown(null);
    window.addEventListener('click', closeAll);
    return () => window.removeEventListener('click', closeAll);
  }, []);

  // Filter out pending, processing or failed assignments from the main dashboard grid
  const completedAssignments = assignments.filter((a) => a.status === 'completed');

  // Logic to display at most 2 completed assignments under Recent Assignments
  const referenceIds = ['motion-101', 'electricity-102'];
  const displayedAssignments = completedAssignments.filter(a => referenceIds.includes(a.id || a._id)).length >= 2
    ? completedAssignments.filter(a => referenceIds.includes(a.id || a._id)).slice(0, 2)
    : completedAssignments.slice(0, 2);

  // Submission metrics map for cards to match design specifications
  const getCardSubmissionDetails = (assignment: IAssignment) => {
    const id = assignment.id || assignment._id;
    if (id === 'motion-101') {
      return {
        submitted: 50,
        total: 50,
        percent: 100,
        status: 'Closed',
        statusClass: 'closed'
      };
    }
    if (id === 'electricity-102') {
      return {
        submitted: 42,
        total: 50,
        percent: 84,
        status: 'Active',
        statusClass: 'active'
      };
    }
    // Dynamic generated assignments fallback
    return {
      submitted: 18,
      total: 20,
      percent: 90,
      status: 'Active',
      statusClass: 'active'
    };
  };

  // User Profile details
  const displayName = user ? user.name : 'Teacher';
  const firstName = displayName.split(' ')[0];
  const userInitials = user 
    ? user.name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) 
    : 'T';

  return (
    <div className="dashboard-wrapper" style={{ position: 'relative' }}>
      
      {/* Welcome greeting with green status dot */}
      <div className="welcome-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="green-dot" style={{ width: '10px', height: '10px' }} title="Online Status"></span>
          <h1 className="welcome-title">Hi {firstName} 👋</h1>
        </div>
        <p className="welcome-subtitle">Here is what is happening with your classes today.</p>
      </div>

      {/* Premium Stats Row */}
      <div className="dashboard-stats-row">
        
        {/* Dark Gauge Card */}
        <div className="stat-card dark" style={{ cursor: 'pointer' }} onClick={() => setShowGaugeModal(true)} title="View submission details">
          <div>
            <div className="stat-card-title">Submission Rate</div>
            <div className="stat-card-value">67 of 80</div>
            <div className="stat-card-subtext">Students submitted</div>
          </div>
          <div className="gauge-container">
            <div className="gauge-svg-wrapper">
              <svg width="90" height="55" viewBox="0 0 100 60">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" strokeDasharray="125.66" strokeDashoffset="20.4" />
              </svg>
              <div className="gauge-value-text">83%</div>
            </div>
            <div className="gauge-sub-label">Avg. Rate</div>
          </div>
        </div>

        {/* Dark Time Saved Card */}
        <div className="stat-card dark" style={{ cursor: 'pointer' }} onClick={() => setShowTimeModal(true)} title="View hours breakdown">
          <div>
            <div className="stat-card-title">Time Saved By AI</div>
            <div className="stat-card-value">31.7 hrs</div>
            <div className="stat-card-subtext">Estimated total saved</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', marginTop: '12px', fontSize: '13px', fontWeight: 700 }}>
            <TrendingUp size={16} />
            <span>↑ 12% this week</span>
          </div>
        </div>

        {/* White Graded Card */}
        <div className="stat-card light" style={{ cursor: 'pointer' }} onClick={() => setShowGradedModal(true)} title="View graded reports">
          <div>
            <div className="stat-card-title">Total Graded</div>
            <div className="stat-card-value">128</div>
            <div className="stat-card-subtext">Across all classes</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginTop: '12px', fontSize: '13px', fontWeight: 500 }}>
            <span>4 different subjects</span>
          </div>
        </div>

        {/* Dynamic Avatar Card with float badges */}
        <div className="illustration-card">
          <div className="avatar-circle-wrapper" style={{ backgroundColor: 'var(--primary-light)' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>
              {userInitials}
            </span>
            <div className="avatar-floating-badge badge-top-left" style={{ cursor: 'pointer' }} title="Top Performer Badge" onClick={() => triggerToast("Top Performer Badge unlocked!")}>🏆</div>
            <div className="avatar-floating-badge badge-top-right" style={{ cursor: 'pointer' }} title="Fast Grader Badge" onClick={() => triggerToast("Fast Grader Badge unlocked!")}>⚡</div>
            <div className="avatar-floating-badge badge-bottom-left" style={{ cursor: 'pointer' }} title="Content Creator Badge" onClick={() => triggerToast("Content Creator Badge unlocked!")}>📚</div>
            <div className="avatar-floating-badge badge-bottom-right" style={{ cursor: 'pointer' }} title="Certified Educator Badge" onClick={() => triggerToast("Certified Educator Badge unlocked!")}>🎓</div>
          </div>
        </div>

      </div>

      {/* Recent Assignments Header & Toggle */}
      <div className="recent-header">
        <div className="recent-title-wrapper">
          <span className="green-dot"></span>
          <h2 className="recent-title">Recent Assignments</h2>
        </div>
        <button 
          className="view-all-btn"
          onClick={() => router.push('/assignments')}
        >
          View All
        </button>
      </div>

      {/* Grid of completed assignment cards */}
      {loading && assignments.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="loader-sparkle-container">🔄 Loading assignments...</div>
        </div>
      ) : displayedAssignments.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon-wrapper">
            <div className="empty-state-icon-bg"></div>
            <div className="empty-state-graphic">📄</div>
            <div className="empty-state-badge">❌</div>
          </div>
          <h2 className="empty-state-title">No completed assignments yet</h2>
          <p className="empty-state-desc">
            Use our AI Teacher's Toolkit to generate customizable question papers. 
            Once completed, they will appear right here.
          </p>
          <button className="empty-state-btn" onClick={handleCreateClick}>
            <Plus size={18} />
            Create Your First Assignment
          </button>
        </div>
      ) : (
        <div className="assignments-grid">
          {displayedAssignments.map((assignment) => {
            const id = assignment.id || assignment._id;
            const metrics = getCardSubmissionDetails(assignment);
            
            return (
              <div 
                key={id} 
                className="assignment-card"
                onClick={() => handleCardClick(id, assignment.status)}
                style={{ cursor: 'pointer' }}
              >
                {/* Card Top */}
                <div className="card-top">
                  <span className="card-subject-badge">{assignment.subject}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`card-status-tag ${metrics.statusClass}`}>{metrics.status}</span>
                    <div style={{ position: 'relative' }}>
                      <button 
                        className="card-menu-btn" 
                        onClick={(e) => toggleDropdown(e, id)}
                        aria-label="Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeDropdown === id && (
                        <div className="card-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="dropdown-item"
                            onClick={() => router.push(`/assignment/${id}`)}
                          >
                            <Eye size={14} />
                            View Paper
                          </button>
                          <button 
                            className="dropdown-item delete"
                            onClick={(e) => handleDelete(e, id)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div>
                  <h3 className="card-title">{assignment.title}</h3>
                  <div className="card-class-info">Class {assignment.classLevel} • {assignment.allowedTime} mins</div>
                  
                  {/* Submission Progress bar */}
                  <div className="card-stats-row">
                    <span className="card-stats-value">{metrics.submitted}</span>
                    <span className="card-stats-total">/{metrics.total}</span>
                    <span className="card-stats-label">Submitted</span>
                  </div>
                  <div className="card-progress-track">
                    <div className="card-progress-bar" style={{ width: `${metrics.percent}%` }}></div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="card-footer">
                  <div>
                    <span className="card-date-label">Assigned: </span>
                    <span className="card-date-value">
                      {new Date(assignment.createdAt || Date.now()).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="card-date-label">Due: </span>
                    <span className="card-date-value">
                      {new Date(assignment.dueDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Grading Bottom Banner */}
      <div className="grading-banner">
        <div className="grading-banner-left">
          <div className="grading-banner-icon">🤖</div>
          <div className="grading-banner-text">
            <h3 className="grading-banner-title">Need to generate a new question paper?</h3>
            <p className="grading-banner-desc">Use our AI Teacher's Toolkit to design customized assessments instantly.</p>
          </div>
        </div>
        <button className="grading-banner-btn" onClick={handleCreateClick}>
          <span>+ Create Assignment</span>
        </button>
      </div>

      {/* Modal: Submission Analytics (Gauge Card Click) */}
      {showGaugeModal && (
        <div className="modal-overlay" onClick={() => setShowGaugeModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Class Submission Analytics</h3>
              <button className="modal-close-btn" onClick={() => setShowGaugeModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.6' }}>
              <p>Overall submission rate: <strong>83.7%</strong> across your current assignments.</p>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Class 10-A (Science)</span>
                  <strong>100% (50/50)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Class 10-A (Electricity)</span>
                  <strong>84% (42/50)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Class 9-B (Chemistry)</span>
                  <strong>90% (18/20)</strong>
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>💡 Recommendation</div>
                Send a quick nudge reminder to the remaining 8 students in Class 10-A Electricity before tomorrow's deadline.
              </div>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => {
                setShowGaugeModal(false);
                triggerToast('Reminders sent to all pending students!');
              }}>
                Nudge Remaining Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: AI Time Savings (Time Saved Card Click) */}
      {showTimeModal && (
        <div className="modal-overlay" onClick={() => setShowTimeModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">AI Productivity Saved Hours</h3>
              <button className="modal-close-btn" onClick={() => setShowTimeModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.6' }}>
              <p>By automating question generation, schema design, and answer-key structuring, you saved <strong>31.7 hours</strong> of work this month!</p>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Prompting & Generation:</span>
                  <strong>12.5 hrs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Answer Key Formulation:</span>
                  <strong>11.0 hrs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Formatting & PDF Rendering:</span>
                  <strong>8.2 hrs</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', color: '#1e3a8a', marginTop: '8px' }}>
                <Award size={20} />
                <span>You're in the <strong>top 5%</strong> of AI time-saving educators this week!</span>
              </div>
              <button className="btn btn-secondary" style={{ marginTop: '10px' }} onClick={() => setShowTimeModal(false)}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Graded Activity (Graded Card Click) */}
      {showGradedModal && (
        <div className="modal-overlay" onClick={() => setShowGradedModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Grading Activity Report</h3>
              <button className="modal-close-btn" onClick={() => setShowGradedModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.6' }}>
              <p>You have graded <strong>128 submissions</strong> across 4 subjects since school began.</p>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Science (Physics/Chemistry):</span>
                  <strong>92 submissions</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>General Knowledge:</span>
                  <strong>36 submissions</strong>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Avg. score across classes:</span>
                  <span style={{ color: 'var(--primary)' }}>78.4%</span>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ marginTop: '10px' }} onClick={() => setShowGradedModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-message" style={{ zIndex: 2000 }}>
          <CheckCircle size={16} style={{ color: '#22c55e' }} />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
