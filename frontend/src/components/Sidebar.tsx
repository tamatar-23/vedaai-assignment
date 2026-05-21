'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  FileText, 
  Sparkles, 
  Library, 
  Settings,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useAssignmentStore } from '@/store/useAssignmentStore';


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Profile Store
  const { user, fetchProfile, updateProfile, mobileSidebarOpen, setMobileSidebarOpen } = useUserStore();
  const { assignments, fetchAssignments } = useAssignmentStore();
  const [showSchoolModal, setShowSchoolModal] = useState(false);

  const [editSchoolName, setEditSchoolName] = useState('');
  const [editSchoolBranch, setEditSchoolBranch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile().then((profile) => {
      if (profile) {
        setEditSchoolName(profile.schoolName);
        setEditSchoolBranch(profile.schoolBranch);
      }
    });
    fetchAssignments();
  }, [fetchProfile, fetchAssignments]);


  useEffect(() => {
    if (user) {
      setEditSchoolName(user.schoolName);
      setEditSchoolBranch(user.schoolBranch);
    }
  }, [user]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUnderConstruction = (e: React.MouseEvent, feature: string) => {
    e.preventDefault();
    triggerToast(`${feature} is coming soon in the Premium plan!`);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSchoolName.trim() || !editSchoolBranch.trim()) {
      alert('All school fields are required.');
      return;
    }

    setIsSaving(true);
    const success = await updateProfile({
      schoolName: editSchoolName,
      schoolBranch: editSchoolBranch
    });
    setIsSaving(false);

    if (success) {
      setShowSchoolModal(false);
      triggerToast('School details updated successfully!');
    } else {
      alert('Failed to update school details.');
    }
  };

  const menuItems = [
    { name: 'Home', icon: Home, path: '/', action: null },
    { name: 'My Groups', icon: Users, path: '#', action: (e: any) => handleUnderConstruction(e, 'My Groups') },
    { name: 'Assignments', icon: FileText, path: '/assignments', action: null },
    { name: 'Create Assignment', icon: Sparkles, path: '/create', action: null },
    { name: 'My Library', icon: Library, path: '#', action: (e: any) => handleUnderConstruction(e, 'My Library') },
  ];

  const displaySchoolName = user ? user.schoolName : 'Loading...';
  const displaySchoolBranch = user ? user.schoolBranch : '...';

  return (
    <>
      {mobileSidebarOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar-container ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        {/* VedaAI Brand Logo */}
        <Link 
          href="/" 
          className="sidebar-logo-link"
          style={{ textDecoration: 'none', color: 'inherit' }}
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div className="sidebar-logo" style={{ cursor: 'pointer' }}>
            <div className="logo-icon">V</div>
            <span className="logo-text">VedaAI</span>
          </div>
        </Link>
 
        {/* Main Action: Create Assignment Button */}
        <div className="sidebar-action">
          <button 
            className="create-btn" 
            onClick={() => {
              router.push('/create');
              setMobileSidebarOpen(false);
            }}
          >
            <Sparkles size={16} className="sparkle-icon" style={{ color: '#ffffff' }} />
            <span className="btn-text">Create Assignment</span>
          </button>
        </div>
 
        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => {
              // Active states
              let isActive = false;
              if (item.name === 'Home') {
                isActive = pathname === '/';
              } else if (item.name === 'Assignments') {
                isActive = pathname === '/assignments' || pathname.startsWith('/assignment/');
              } else if (item.name === 'Create Assignment') {
                isActive = pathname === '/create';
              }
 
              return (
                <li key={item.name} className="nav-item">
                  <Link 
                    href={item.path} 
                    onClick={(e) => {
                      if (item.action) {
                        item.action(e);
                      } else {
                        setMobileSidebarOpen(false);
                      }
                    }}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={18} className="nav-icon" />
                    <span className="sidebar-text">{item.name}</span>
                    {item.name === 'Assignments' && (
                      <span className="badge-count" style={{ backgroundColor: 'var(--primary)', color: '#ffffff' }}>
                        {assignments.length}
                      </span>
                    )}
 
                  </Link>
                </li>
              );
            })}
          </ul>
 
          {/* Settings & Profile Area at Bottom */}
          <div className="sidebar-footer">
            <Link 
              href="#" 
              onClick={(e) => handleUnderConstruction(e, 'Settings')}
              className="nav-link settings-link"
            >
              <Settings size={18} className="nav-icon" />
              <span className="sidebar-text">Settings</span>
            </Link>
            
            <div 
              className="school-card" 
              style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
              onClick={() => {
                setShowSchoolModal(true);
                setMobileSidebarOpen(false);
              }}
              title="Click to edit school details"
            >
              <div className="school-avatar" style={{ backgroundColor: '#e2fbe8', border: '1px solid #c2f0d0' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="school-info sidebar-school-info">
                <h4 className="school-name">{displaySchoolName}</h4>
                <p className="school-branch">{displaySchoolBranch}</p>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* School Information / Settings Modal */}
      {showSchoolModal && (
        <div className="modal-overlay" onClick={() => setShowSchoolModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Edit School Information</h3>
              <button className="modal-close-btn" onClick={() => setShowSchoolModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveSchool} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">School Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editSchoolName}
                  onChange={(e) => setEditSchoolName(e.target.value)}
                  placeholder="e.g. Delhi Public School"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">School Branch</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editSchoolBranch}
                  onChange={(e) => setEditSchoolBranch(e.target.value)}
                  placeholder="e.g. Bokaro Steel City"
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSchoolModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Toast */}
      {toastMessage && (
        <div className="toast-message" style={{ zIndex: 1100 }}>
          <AlertCircle size={16} style={{ color: 'var(--primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
