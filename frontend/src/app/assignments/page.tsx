'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search,
  CheckCircle,
  Filter
} from 'lucide-react';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import AssignmentCard from '@/components/AssignmentCard';

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

  const handleFilterClick = () => {
    triggerToast('Filters are coming soon in the Premium plan!');
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

  return (
    <div className="dashboard-wrapper" style={{ position: 'relative', paddingBottom: '80px' }}>
      
      {/* Page Title & Subtitle */}
      <div className="welcome-section" style={{ marginBottom: '24px' }}>
        <h1 className="welcome-title">Assignments</h1>
        <p className="welcome-subtitle">Manage and create assignments for your classes.</p>
      </div>

      {/* Search Header Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="filter-btn" 
            onClick={handleFilterClick}
          >
            <Filter size={16} />
            Filter
          </button>
          
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '46px', padding: '0 20px', borderRadius: '12px', fontWeight: 600 }} 
            onClick={handleCreateClick}
          >
            <Plus size={18} />
            Create Assignment
          </button>
        </div>
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
        <div className="assignments-grid">
          {filteredAssignments.map((assignment) => {
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

      {/* Floating bottom-center CTA button */}
      {filteredAssignments.length > 0 && (
        <button className="floating-create-btn" onClick={handleCreateClick}>
          <Plus size={18} />
          Create Assignment
        </button>
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
