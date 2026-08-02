'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ActionButtons from '@/components/ui/ActionButtons';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const initialForm = { video_url: '', summary: '', category: '', featured: false };

export default function ManageCreativesPage() {
  const { showToast } = useToast();
  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCreatives = useCallback(async () => {
    try {
      const data = await api.get('/creative');
      setCreatives(data.data || []);
    } catch {
      showToast('Failed to fetch creatives', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCreatives();
  }, [fetchCreatives]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (creative) => {
    setIsEditing(true);
    setEditingId(creative.id);
    setFormData({
      video_url: creative.video_url,
      summary: creative.summary,
      category: creative.category,
      featured: creative.featured,
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append('video_url', formData.video_url);
    data.append('summary', formData.summary);
    data.append('category', formData.category);
    data.append('featured', formData.featured);

    try {
      if (isEditing) {
        await api.patchForm(`/creative/${editingId}`, data);
        showToast('Creative updated successfully');
      } else {
        await api.postForm('/creative', data);
        showToast('Creative created successfully');
      }
      setIsModalOpen(false);
      fetchCreatives();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Thumbnail',
      render: (row) =>
        row.thumbnail_url ? (
          <img src={row.thumbnail_url} alt={row.title} className="thumbnail" style={{ width: '80px', height: '45px' }} />
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      header: 'Title',
      render: (row) => (
        <span className="truncate" style={{ maxWidth: '200px', display: 'inline-block' }}>
          {row.title}
        </span>
      ),
    },
    { header: 'Category', accessor: 'category' },
    {
      header: 'Featured',
      render: (row) => (
        <span className={`badge ${row.featured ? 'badge-success' : 'badge-muted'}`}>
          {row.featured ? 'Featured' : 'No'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-center',
      render: (row) => (
        <ActionButtons onEdit={() => openEditModal(row)} />
      ),
    },
  ];

  if (loading) return <LoadingSpinner size={32} />;

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title="Manage Creatives"
        subtitle="Manage your YouTube creative content"
        actionLabel="Add Creative"
        onAction={openCreateModal}
      />

      <DataTable columns={columns} data={creatives} emptyMessage="No creatives found." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Creative' : 'Add Creative'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">YouTube Video URL</label>
            <input type="url" name="video_url" className="form-input" value={formData.video_url} onChange={handleInputChange} required placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <div className="form-group">
            <label className="form-label">Summary</label>
            <textarea name="summary" className="form-input" value={formData.summary} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input type="text" name="category" className="form-input" value={formData.category} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-checkbox">
              <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} />
              <span>Featured Creative</span>
            </label>
          </div>
          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Creative'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
