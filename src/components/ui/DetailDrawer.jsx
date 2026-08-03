'use client';

import { useEffect, useCallback } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';

export default function DetailDrawer({ isOpen, onClose, title, onEdit, onDelete, children }) {
  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel animate-slide-left" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <h2 className="heading-md" style={{ fontSize: '1.1rem' }}>{title}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="btn btn-outline btn-sm flex items-center gap-1.5"
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="btn btn-danger btn-sm flex items-center gap-1.5"
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
            <button
              type="button"
              className="btn btn-icon btn-outline"
              onClick={onClose}
              style={{ padding: '0.35rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
}
