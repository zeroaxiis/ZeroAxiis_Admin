'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ActionButtons from '@/components/ui/ActionButtons';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ExternalLink } from 'lucide-react';

const initialForm = { video_url: '', summary: '', category: '', featured: false };

export default function ManageCreativesPage() {
  const { showToast } = useToast();
  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewCreative, setPreviewCreative] = useState(null);
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
      video_url: creative.video_url || '',
      summary: creative.summary || '',
      category: creative.category || '',
      featured: !!creative.featured,
    });
    setIsPreviewOpen(false);
    setIsModalOpen(true);
  };

  const openPreviewModal = (creative) => {
    setPreviewCreative(creative);
    setIsPreviewOpen(true);
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

    const payload = {
      video_url: formData.video_url,
      summary: formData.summary,
      category: formData.category,
      featured: formData.featured,
    };

    try {
      if (isEditing) {
        await api.patch(`/creative/${editingId}`, payload);
        showToast('Creative updated successfully');
      } else {
        await api.post('/creative', payload);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this creative?')) return;
    try {
      await api.delete(`/creative/${id}`);
      showToast('Creative deleted successfully');
      setIsPreviewOpen(false);
      fetchCreatives();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const columns = [
    {
      header: 'Thumbnail',
      render: (row) =>
        row.thumbnail_url ? (
          <img
            src={row.thumbnail_url}
            alt={row.title}
            style={{
              width: 52,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              objectFit: 'cover',
              border: '1px solid var(--border)',
            }}
          />
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      header: 'Title',
      render: (row) => (
        <span
          onClick={() => openPreviewModal(row)}
          style={{ cursor: 'pointer', fontWeight: 500 }}
          className="hover:underline"
        >
          {row.title}
        </span>
      ),
    },
    { header: 'Channel', accessor: 'channel_title' },
    { header: 'Category', accessor: 'category' },
    {
      header: 'Featured',
      render: (row) =>
        row.featured ? (
          <span className="badge badge-success">Featured</span>
        ) : (
          <span className="badge badge-muted">No</span>
        ),
    },
    {
      header: 'Actions',
      className: 'text-center',
      render: (row) => (
        <ActionButtons
          onView={() => openPreviewModal(row)}
          onEdit={() => openEditModal(row)}
          onDelete={() => handleDelete(row.id)}
        />
      ),
    },
  ];

  if (loading) return <LoadingSpinner size={32} />;

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title="Manage Creatives"
        subtitle="Manage your YouTube video showcases"
        actionLabel="Add Creative"
        onAction={openCreateModal}
      />

      <DataTable columns={columns} data={creatives} emptyMessage="No creatives found." />

      {/* Full Preview Modal */}
      {previewCreative && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Creative Details & Preview"
        >
          <div className="flex flex-col gap-4">
            {previewCreative.thumbnail_url && (
              <img
                src={previewCreative.thumbnail_url}
                alt={previewCreative.title}
                style={{
                  width: '100%',
                  maxHeight: 240,
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'cover',
                  border: '1px solid var(--border)',
                }}
              />
            )}
            <div>
              <h2 className="heading-md" style={{ marginBottom: '0.2rem' }}>
                {previewCreative.title}
              </h2>
              <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>{previewCreative.channel_title || 'YouTube Channel'}</span>
                {previewCreative.category && <span>• {previewCreative.category}</span>}
                {previewCreative.featured && <span className="badge badge-success">Featured</span>}
              </div>
            </div>

            {previewCreative.video_url && (
              <div>
                <label className="form-label">YouTube URL</label>
                <a
                  href={previewCreative.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                  style={{ color: 'var(--accent)', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={14} />
                  {previewCreative.video_url}
                </a>
              </div>
            )}

            {previewCreative.summary && (
              <div>
                <label className="form-label">Summary</label>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {previewCreative.summary}
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(previewCreative.id)}
              >
                Delete
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openEditModal(previewCreative)}
              >
                Edit Creative
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Creative' : 'Add Creative'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">YouTube Video URL</label>
            <input
              type="url"
              name="video_url"
              className="form-input"
              value={formData.video_url}
              onChange={handleInputChange}
              required
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              name="category"
              className="form-input"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="e.g. Design, Tech, Showcase"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Summary</label>
            <textarea
              name="summary"
              className="form-input"
              value={formData.summary}
              onChange={handleInputChange}
              placeholder="Brief summary..."
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
              />
              <span>Featured Creative</span>
            </label>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Creative'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
