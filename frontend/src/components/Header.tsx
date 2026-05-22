'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ArrowLeft, ChevronDown, HelpCircle, User, LogOut, Shield, CheckCircle, Edit3, Sun, Moon, Menu, Grid, Sparkles } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, fetchProfile, updateProfile, mobileSidebarOpen, setMobileSidebarOpen } = useUserStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editSchoolBranch, setEditSchoolBranch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = systemDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const isHome = pathname === '/';
  
  // Dynamic header titles based on route
  const getHeaderTitle = () => {
    if (pathname === '/') return 'Home';
    if (pathname === '/create') return 'Create New';
    if (pathname === '/assignments') return 'Assignments';
    if (pathname.startsWith('/assignment/')) return 'Assignment Output';
    return 'Home';
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetchProfile().then((profile) => {
      if (profile) {
        setEditName(profile.name);
        setEditSchoolName(profile.schoolName);
        setEditSchoolBranch(profile.schoolBranch);
      }
    });
  }, [fetchProfile]);

  // Close menus on click outside
  useEffect(() => {
    const closeMenus = () => {
      setShowNotifications(false);
      setShowProfileMenu(false);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  const handleNotificationsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editSchoolName.trim() || !editSchoolBranch.trim()) {
      alert('All profile fields are required.');
      return;
    }
    
    setIsSaving(true);
    const success = await updateProfile({
      name: editName,
      schoolName: editSchoolName,
      schoolBranch: editSchoolBranch
    });
    setIsSaving(false);

    if (success) {
      setShowEditProfileModal(false);
      triggerToast('Profile updated successfully!');
    } else {
      alert('Failed to update profile.');
    }
  };

  const handleOpenEditModal = () => {
    if (user) {
      setEditName(user.name);
      setEditSchoolName(user.schoolName);
      setEditSchoolBranch(user.schoolBranch);
    }
    setShowEditProfileModal(true);
    setShowProfileMenu(false);
  };

  const displayName = user ? user.name : 'Loading...';
  const displayInitials = user ? getInitials(user.name) : '...';

  return (
    <>
      <header className="header-container" style={{ position: 'relative' }}>
        <div className="header-left">
          <button 
            className="mobile-menu-toggle-btn" 
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-label="Toggle Menu"
          >
            <Menu size={20} />
          </button>
          <button className="back-btn" onClick={() => {
            if (pathname === '/assignments') {
              router.push('/home');
            } else {
              router.push('/assignments');
            }
          }} aria-label="Go Back">
            <ArrowLeft size={18} />
          </button>
          <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {pathname === '/home' ? (
              <span className="breadcrumb-main" style={{ fontWeight: 600 }}>Home</span>
            ) : pathname === '/assignments' || pathname === '/create' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Grid size={18} style={{ color: 'var(--text-muted)' }} />
                <span className="breadcrumb-current" style={{ fontWeight: 600 }}>Assignment</span>
              </div>
            ) : pathname.startsWith('/assignment/') ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Sparkles size={18} style={{ color: 'var(--text-muted)' }} />
                <span className="breadcrumb-current" style={{ fontWeight: 600 }}>Create New</span>
              </div>
            ) : (
              <span className="breadcrumb-main" style={{ fontWeight: 600 }}>Home</span>
            )}
          </div>
        </div>

        <div className="header-right">
          {/* Notification Bell Container */}
          <div className="header-dropdown-container">
            <button 
              className="icon-badge-btn" 
              aria-label="Notifications" 
              onClick={handleNotificationsClick}
            >
              <Bell size={20} />
              <span className="badge-dot"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="header-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-header">Notifications</div>
                <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>✨ Real AI Engine Connected</div>
                  Your Gemini API Key is active. All future generations will use live AI.
                </div>
                <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>🎓 Welcome back {displayName.split(' ')[0]}</div>
                  Ready to review student performance and generate papers.
                </div>
              </div>
            )}
          </div>

          {/* User Profile Container */}
          <div className="header-dropdown-container">
            <div className="user-profile" onClick={handleProfileClick}>
              <div className="user-avatar" style={{ overflow: 'hidden', borderRadius: '50%', backgroundColor: 'transparent', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/avatar.png" alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span className="user-name">{displayName}</span>
              <ChevronDown size={14} className="chevron-icon" />
            </div>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div className="header-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-header">Account Details</div>
                <button className="dropdown-action-item" onClick={handleOpenEditModal}>
                  <User size={14} />
                  My Profile
                </button>
                <button className="dropdown-action-item" onClick={() => triggerToast("Security settings are locked by Admin.")}>
                  <Shield size={14} />
                  Admin Console
                </button>
                <button className="dropdown-action-item danger" onClick={() => triggerToast("Logout action is simulated.")}>
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Welcome to VedaAI Help Center</h3>
              <button className="modal-close-btn" onClick={() => setShowHelpModal(false)}>
                ✕
              </button>
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main)' }}>
              <p style={{ marginBottom: '16px' }}>
                VedaAI is an automated <strong>AI Assessment Creator</strong> helping teachers generate question papers in seconds.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>1.</div>
                  <div>Click the <strong>Create Assignment</strong> button in the sidebar or banner to open the Creator Form.</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>2.</div>
                  <div>Fill in details (Subject, Class, Allowed Time, Max Marks) and choose question types. Option to upload a reference PDF/text.</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>3.</div>
                  <div>Click <strong>Generate Assessment</strong>. Watch live WebSocket logs streaming. On completion, download the formatted PDF or view the Toggleable Answer Keys!</div>
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '24px' }}
                onClick={() => {
                  setShowHelpModal(false);
                  router.push('/create');
                }}
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Edit User Profile</h3>
              <button className="modal-close-btn" onClick={() => setShowEditProfileModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Gourav Mishra"
                  required
                />
              </div>
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfileModal(false)}>
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-message">
          <CheckCircle size={16} style={{ color: '#22c55e' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
