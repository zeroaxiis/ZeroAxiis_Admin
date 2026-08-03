'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'lg' }) {
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

  const sizeClass = size === 'xl' ? 'max-w-xl-modal' : size === 'sm' ? 'max-w-sm-modal' : 'max-w-lg-modal';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${sizeClass} animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="heading-md" style={{ fontSize: '1.15rem' }}>{title}</h2>
          <button className="btn btn-icon btn-outline" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
