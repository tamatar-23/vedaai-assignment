'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  TrendingUp, 
  CheckCircle,
  FileText,
  Award
} from 'lucide-react';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useUserStore } from '@/store/useUserStore';
import AssignmentCard from '@/components/AssignmentCard';

export default function Dashboard() {
  const router = useRouter();
  
  // Stores
  const { assignments, loading, fetchAssignments, deleteAssignment } = useAssignmentStore();
  const { user, fetchProfile } = useUserStore();

  // Local States
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Analytics Modals States
  const [showTotalModal, setShowTotalModal] = useState(false);
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

  // Filter completed assignments
  const completedAssignments = assignments.filter((a) => a.status === 'completed');

  // Display at most 2 completed assignments under Recent Assignments
  const displayedAssignments = completedAssignments.slice(0, 2);

  // User Profile details
  const displayName = user ? user.name : 'Teacher';
  const firstName = displayName.split(' ')[0];
  const userInitials = user 
    ? user.name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) 
    : 'T';

  // Group assignments by class for modal analytics
  const classBreakdown = assignments.reduce((acc, curr) => {
    const cls = curr.classLevel || 'Unassigned';
    acc[cls] = (acc[cls] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="dashboard-wrapper" style={{ position: 'relative' }}>
      
      {/* Welcome greeting with status dot */}
      <div className="welcome-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="green-dot" style={{ width: '10px', height: '10px' }} title="Online Status"></span>
          <h1 className="welcome-title">Hi {firstName} 👋</h1>
        </div>
        <p className="welcome-subtitle">Here is what is happening with your classes today.</p>
      </div>

      {/* Premium Stats Row */}
      <div className="dashboard-stats-row">
        
        {/* Total Assignments Card (Real data from Zustand) */}
        <div 
          className="stat-card dark" 
          style={{ cursor: 'pointer' }} 
          onClick={() => setShowTotalModal(true)} 
          title="View assignments breakdown"
        >
          <div>
            <div className="stat-card-title">Total Assignments</div>
            <div className="stat-card-value">{assignments.length}</div>
            <div className="stat-card-subtext">Active & completed papers</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', marginTop: '12px', fontSize: '13px', fontWeight: 600 }}>
            <FileText size={16} />
            <span>Click to see breakdown</span>
          </div>
        </div>

        {/* Dark Time Saved Card */}
        <div className="stat-card dark" style={{ cursor: 'pointer' }} onClick={() => setShowTimeModal(true)} title="View hours breakdown">
          <div>
            <div className="stat-card-title">Time Saved By AI</div>
            <div className="stat-card-value">12.4 hrs</div>
            <div className="stat-card-subtext">Estimated total saved</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', marginTop: '12px', fontSize: '13px', fontWeight: 700 }}>
            <TrendingUp size={16} />
            <span>↑ 8% this week</span>
          </div>
        </div>

        {/* White Graded Card */}
        <div className="stat-card light" style={{ cursor: 'pointer' }} onClick={() => setShowGradedModal(true)} title="View graded reports">
          <div>
            <div className="stat-card-title">Total Graded</div>
            <div className="stat-card-value">38</div>
            <div className="stat-card-subtext">Across all classes</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginTop: '12px', fontSize: '13px', fontWeight: 500 }}>
            <span>2 different subjects</span>
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

      {/* Recent Assignments Header & View All */}
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
            Use our Create Assignment tool to generate customizable question papers. 
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
            return (
              <AssignmentCard
                key={id}
                id={id}
                title={assignment.title}
                createdAt={assignment.createdAt}
                dueDate={assignment.dueDate}
                status={assignment.status}
                isDropdownOpen={activeDropdown === id}
                onToggleDropdown={toggleDropdown}
                onView={() => router.push(`/assignment/${id}`)}
                onDelete={handleDelete}
                onClick={handleCardClick}
              />
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
            <p className="grading-banner-desc">Use Create Assignment to design customized assessments instantly.</p>
          </div>
        </div>
        <button className="grading-banner-btn" onClick={handleCreateClick}>
          <span>+ Create Assignment</span>
        </button>
      </div>

      {/* Modal: Total Assignments Breakdown */}
      {showTotalModal && (
        <div className="modal-overlay" onClick={() => setShowTotalModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Assignment Breakdown</h3>
              <button className="modal-close-btn" onClick={() => setShowTotalModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.6' }}>
              <p>You have created a total of <strong>{assignments.length} assignments</strong>.</p>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                {Object.keys(classBreakdown).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No assignments recorded yet.</p>
                ) : (
                  Object.entries(classBreakdown).map(([cls, count]) => (
                    <div key={cls} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Class Level: {cls}</span>
                      <strong>{count} {count === 1 ? 'assignment' : 'assignments'}</strong>
                    </div>
                  ))
                )}
              </div>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => setShowTotalModal(false)}>
                Done
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
              <p>By automating question generation, schema design, and answer-key structuring, you saved <strong>12.4 hours</strong> of work this month!</p>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Prompting & Generation:</span>
                  <strong>4.5 hrs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Answer Key Formulation:</span>
                  <strong>4.2 hrs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Formatting & PDF Rendering:</span>
                  <strong>3.7 hrs</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--primary-light)', padding: '12px', borderRadius: '8px', border: '1px solid var(--primary)', color: 'var(--primary)', marginTop: '8px' }}>
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
              <p>You have graded <strong>38 submissions</strong> across 2 subjects since school began.</p>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Science (Physics/Chemistry):</span>
                  <strong>22 submissions</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>General Knowledge:</span>
                  <strong>16 submissions</strong>
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
