'use client';

import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No data found.' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" style={{ gap: '0.75rem' }}>
      <Inbox size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
      <p className="text-muted">{message}</p>
    </div>
  );
}
