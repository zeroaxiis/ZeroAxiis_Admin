'use client';

import { Edit, Trash2 } from 'lucide-react';

export default function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2 justify-center">
      {onEdit && (
        <button className="btn btn-icon btn-outline" onClick={onEdit} title="Edit">
          <Edit size={15} />
        </button>
      )}
      {onDelete && (
        <button className="btn btn-icon btn-danger" onClick={onDelete} title="Delete">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
