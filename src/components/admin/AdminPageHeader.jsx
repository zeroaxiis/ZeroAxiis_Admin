'use client';

export default function AdminPageHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="heading-lg">
          {title}
        </h1>
        {subtitle && <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          + {actionLabel}
        </button>
      )}
    </div>
  );
}
