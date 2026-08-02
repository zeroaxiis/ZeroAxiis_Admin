'use client';

export default function ActionButtons({ onView, onEdit, onDelete }) {
  return (
    <div className="flex gap-3 justify-center">
      {onView && (
        <button
          onClick={onView}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          className="hover:underline"
        >
          View
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          className="hover:underline"
        >
          Edit
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--danger)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          className="hover:underline"
        >
          Delete
        </button>
      )}
    </div>
  );
}
