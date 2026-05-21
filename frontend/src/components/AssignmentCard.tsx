'use client';

import React from 'react';
import { MoreVertical, Eye, Trash2 } from 'lucide-react';

interface AssignmentCardProps {
  /** Unique identifier for the assignment (either `id` or `_id` from the API). */
  id: string;
  /** Display title of the assignment. */
  title: string;
  /** ISO date string for when the assignment was created. */
  createdAt: string;
  /** ISO date string for the assignment due date. */
  dueDate: string;
  /** Current generation status — only 'completed' cards are clickable. */
  status: string;
  /** Whether this card's context menu is currently open. */
  isDropdownOpen: boolean;
  /** Toggle the three-dot context menu for this card. */
  onToggleDropdown: (e: React.MouseEvent, id: string) => void;
  /** Navigate to the assignment detail/output page. */
  onView: (id: string) => void;
  /** Delete this assignment after confirmation. */
  onDelete: (e: React.MouseEvent, id: string) => void;
  /** Handle card body click — navigates if status is 'completed'. */
  onClick: (id: string, status: string) => void;
}

/**
 * Reusable assignment card rendered on both the Dashboard (recent)
 * and Assignments listing pages. Shows the title, created/due dates,
 * and a three-dot context menu with View / Delete actions.
 */
export default function AssignmentCard({
  id,
  title,
  createdAt,
  dueDate,
  status,
  isDropdownOpen,
  onToggleDropdown,
  onView,
  onDelete,
  onClick,
}: AssignmentCardProps) {
  /** Format an ISO date string to DD/MM/YYYY for consistent display. */
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr || Date.now()).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div
      className="assignment-card"
      onClick={() => onClick(id, status)}
      style={{ cursor: status === 'completed' ? 'pointer' : 'default' }}
    >
      {/* Header: Title + Context Menu */}
      <div className="card-header-row">
        <h3 className="card-title">{title}</h3>
        <div style={{ position: 'relative' }}>
          <button
            className="card-menu-btn"
            onClick={(e) => onToggleDropdown(e, id)}
            aria-label="Assignment options"
          >
            <MoreVertical size={18} />
          </button>

          {isDropdownOpen && (
            <div
              className="card-menu-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="dropdown-item"
                onClick={() => onView(id)}
              >
                <Eye size={14} />
                View Assignment
              </button>
              <button
                className="dropdown-item delete"
                onClick={(e) => onDelete(e, id)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Created & Due Dates */}
      <div className="card-footer">
        <div>
          <span className="card-date-label">Assigned on : </span>
          <span className="card-date-value">{formatDate(createdAt)}</span>
        </div>
        <div>
          <span className="card-date-label">Due : </span>
          <span className="card-date-value">{formatDate(dueDate)}</span>
        </div>
      </div>
    </div>
  );
}
