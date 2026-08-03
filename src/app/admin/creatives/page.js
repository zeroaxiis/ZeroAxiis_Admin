'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import DetailDrawer from '@/components/ui/DetailDrawer';
import ActionButtons from '@/components/ui/ActionButtons';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ExternalLink, Video } from 'lucide-react';

const initialForm = { video_url: '', summary: '', category: '', featured: false };

export default function ManageCreativesPage() {
  const { showToast } = useToast();
  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setPreviewCreative(null);
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
      setPreviewCreative(null);
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
          onClick={() => setPreviewCreative(row)}
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
          onView={() => setPreviewCreative(row)}
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

      {/* Zero-API Slide-Over Detail Drawer */}
      <DetailDrawer
        isOpen={!!previewCreative}
        onClose={() => setPreviewCreative(null)}
        title="Creative Showcase Details"
        onEdit={previewCreative ? () => openEditModal(previewCreative) : null}
        onDelete={previewCreative ? () => handleDelete(previewCreative.id) : null}
      >
        {previewCreative && (
          <div className="flex flex-col gap-6">
            {previewCreative.thumbnail_url && (
              <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--border)' }}>
                <img
                  src={previewCreative.thumbnail_url}
                  alt={previewCreative.title}
                  style={{
                    width: '100%',
                    maxHeight: 260,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                {previewCreative.category && <span className="badge badge-accent">{previewCreative.category}</span>}
                {previewCreative.featured && <span className="badge badge-success">Featured</span>}
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                {previewCreative.title}
              </h3>
              <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.875rem' }}>
                <Video size={15} style={{ color: 'var(--accent)' }} />
                <span>{previewCreative.channel_title || 'YouTube Channel'}</span>
              </div>
            </div>

            {previewCreative.video_url && (
              <div>
                <span className="stat-label mb-1.5 block" style={{ fontSize: '0.78rem' }}>YOUTUBE URL</span>
                <a
                  href={previewCreative.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                  style={{ color: 'var(--accent)', fontSize: '0.9rem', wordBreak: 'break-all' }}
                >
                  <ExternalLink size={15} />
                  {previewCreative.video_url}
                </a>
              </div>
            )}

            {previewCreative.summary && (
              <div>
                <span className="stat-label mb-2 block" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                  SUMMARY
                </span>
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    background: 'var(--bg-primary)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {previewCreative.summary}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      {/* Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Creative' : 'Add Creative'}
        size="lg"
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
