'use client';

import { Plus } from 'lucide-react';

export default function AdminPageHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="heading-lg" style={{ marginBottom: '0.25rem' }}>
          {title}
        </h1>
        {subtitle && <p className="text-muted" style={{ fontSize: '0.9rem' }}>{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          <Plus size={18} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
