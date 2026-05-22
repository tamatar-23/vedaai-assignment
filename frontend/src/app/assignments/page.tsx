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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAssignments().finally(() => {
      if (active) {
        setIsInitialLoad(false);
      }
    });
    return () => {
      active = false;
    };
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

  const isEmpty = completedAssignments.length === 0;

  return (
    <div 
      className="dashboard-wrapper" 
      style={{ 
        position: 'relative', 
        paddingBottom: isEmpty ? '0px' : '100px',
        display: isEmpty ? 'flex' : 'block',
        flexDirection: isEmpty ? 'column' : undefined,
        justifyContent: isEmpty ? 'center' : undefined,
        alignItems: isEmpty ? 'center' : undefined,
        minHeight: isEmpty ? 'calc(100vh - 150px)' : undefined
      }}
    >
      
      {/* Page Title & Subtitle wrapped in card */}
      {completedAssignments.length > 0 && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', marginBottom: '24px', borderRadius: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <span className="green-dot" style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', flexShrink: 0 }}></span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Assignments</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Manage and create assignments for your classes.</p>
          </div>
        </div>
      )}

      {/* Search Header Row Wrapped in Card */}
      {completedAssignments.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', borderRadius: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '450px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="form-input"
                style={{ paddingLeft: '44px', margin: 0, height: '46px', borderRadius: '12px', width: '100%' }}
                placeholder="Search assignments by title, subject or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="filter-btn" 
                onClick={handleFilterClick}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '46px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)' }}
              >
                <Filter size={16} />
                Filter By
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
        </div>
      )}

      {/* Grid of completed assignment cards */}
      {(isInitialLoad && assignments.length === 0) || (loading && assignments.length === 0) ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', minHeight: 'calc(100vh - 180px)', alignItems: 'center' }}>
          <div className="loader-sparkle-container">🔄 Loading assignments...</div>
        </div>
      ) : completedAssignments.length === 0 ? (
        <div 
          className="no-assignments-container" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            textAlign: 'center',
            width: '100%',
            maxWidth: '540px'
          }}
        >
          <svg width="340" height="240" viewBox="0 0 340 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 24px', display: 'block' }}>
            <defs>
              <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.06" />
              </filter>
            </defs>

            {/* Background circular glow/shadow */}
            <circle cx="170" cy="120" r="90" fill="#F1F5F9" opacity="0.6" />
            
            {/* Spiral / swirl decoration (top-left) */}
            <path d="M125 100 C110 80, 100 110, 115 120 C130 130, 150 90, 135 70" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
            
            {/* Star / Sparkle decoration (bottom-left) - hollow blue outline */}
            <path d="M135 185 L137 192 L144 194 L137 196 L135 203 L133 196 L126 194 L133 192 Z" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
            
            {/* Blue dot decoration (right) */}
            <circle cx="238" cy="165" r="5" fill="#2563EB" />
            
            {/* Document (centered, slightly tilted or straight) */}
            <g transform="translate(145, 75)" filter="url(#soft-shadow)">
              {/* Document background */}
              <rect width="65" height="85" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              {/* Document lines */}
              <rect x="8" y="12" width="16" height="5" rx="1.5" fill="#1E293B" />
              <line x1="8" y1="28" x2="40" y2="28" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
              <line x1="8" y1="40" x2="57" y2="40" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
              <line x1="8" y1="52" x2="57" y2="52" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
              <line x1="8" y1="64" x2="48" y2="64" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            </g>
            
            {/* Small Card Icon (top-right decoration) */}
            <g transform="translate(210, 70)" filter="url(#soft-shadow)">
              <rect width="36" height="24" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <circle cx="10" cy="12" r="3" fill="#CBD5E1" />
              <rect x="18" y="9" width="12" height="6" rx="3" fill="#CBD5E1" />
            </g>
            
            {/* Magnifying Glass with Red X (centered, overlapping document) */}
            <g transform="translate(160, 95)" filter="url(#soft-shadow)">
              {/* Magnifying Glass Handle */}
              <line x1="40" y1="40" x2="62" y2="62" stroke="#DDDDF0" strokeWidth="10" strokeLinecap="round" />
              <line x1="40" y1="40" x2="62" y2="62" stroke="#C9C9EB" strokeWidth="4" strokeLinecap="round" />
              
              {/* Magnifying Glass Lens border (translucent white/grey fill) */}
              <circle cx="25" cy="25" r="25" fill="#FFFFFF" fillOpacity="0.2" stroke="#DDDDF0" strokeWidth="6" />
              
              {/* Thick Red Cross ✕ (no circle background) */}
              <path d="M14 14 L36 36 M36 14 L14 36" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
            </g>
          </svg>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>No assignments yet</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.5 }}>
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
          <button 
            onClick={handleCreateClick} 
            style={{ 
              backgroundColor: '#111111', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '50px', 
              padding: '14px 28px', 
              fontSize: '15px', 
              fontWeight: 600, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#222222'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111111'}
          >
            <Plus size={18} />
            Create Your First Assignment
          </button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="empty-state-card" style={{ marginTop: '24px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', padding: '40px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div className="empty-state-icon-wrapper" style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state-icon-bg" style={{ width: '80px', height: '80px', backgroundColor: '#fee2e2', borderRadius: '50%', position: 'absolute' }}></div>
            <div className="empty-state-graphic" style={{ fontSize: '32px', zIndex: 1 }}>🔍</div>
            <div className="empty-state-badge" style={{ position: 'absolute', bottom: '0', right: '0', fontSize: '18px', zIndex: 2 }}>❌</div>
          </div>
          <h2 className="empty-state-title" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>No assignments found</h2>
          <p className="empty-state-desc" style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            We couldn't find any assignments matching "{searchQuery}". Try refining your search query.
          </p>
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

      {/* Bottom fade overlay for card overflow */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '290px', /* aligned with content area starting after sidebar */
        right: 0,
        height: '80px',
        background: 'linear-gradient(to top, var(--bg-app) 20%, transparent)',
        pointerEvents: 'none',
        zIndex: 99
      }} />

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
