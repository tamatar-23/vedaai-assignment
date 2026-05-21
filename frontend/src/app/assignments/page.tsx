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
  Search,
  CheckCircle,
  PlusCircle
} from 'lucide-react';
import { useAssignmentStore, IAssignment } from '@/store/useAssignmentStore';

export default function AssignmentsPage() {
  const router = useRouter();
  
  // Stores
  const { assignments, loading, fetchAssignments, deleteAssignment } = useAssignmentStore();

  // Local States
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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

  // Filter based on search query
  const filteredAssignments = completedAssignments.filter((assignment) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      assignment.title.toLowerCase().includes(query) ||
      assignment.subject.toLowerCase().includes(query) ||
      assignment.classLevel.toLowerCase().includes(query)
    );
  });

  // Submission metrics map
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

  return (
    <div className="dashboard-wrapper" style={{ position: 'relative' }}>
      
      {/* Search Header Row */}
      <div className="recent-header" style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="form-input"
            style={{ paddingLeft: '44px', margin: 0, height: '46px', borderRadius: '12px' }}
            placeholder="Search assignments by title, subject or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '46px', padding: '0 20px', borderRadius: '12px', fontWeight: 600 }} onClick={handleCreateClick}>
          <Plus size={18} />
          Create Assignment
        </button>
      </div>

      {/* Grid of completed assignment cards */}
      {loading && assignments.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="loader-sparkle-container">🔄 Loading assignments...</div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="empty-state-card" style={{ marginTop: '24px' }}>
          <div className="empty-state-icon-wrapper">
            <div className="empty-state-icon-bg"></div>
            <div className="empty-state-graphic">🔍</div>
            <div className="empty-state-badge">❌</div>
          </div>
          <h2 className="empty-state-title">No assignments found</h2>
          <p className="empty-state-desc">
            {searchQuery.trim() 
              ? `We couldn't find any assignments matching "${searchQuery}". Try refining your search query.` 
              : "Use our AI Teacher's Toolkit to generate customizable question papers. Once completed, they will appear right here."}
          </p>
          {!searchQuery.trim() && (
            <button className="empty-state-btn" onClick={handleCreateClick}>
              <Plus size={18} />
              Create Your First Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="assignments-grid" style={{ marginTop: '24px' }}>
          {filteredAssignments.map((assignment) => {
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
