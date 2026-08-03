'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Edit, Trash2, ExternalLink, Video } from 'lucide-react';

export default function CreativeDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [creative, setCreative] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    video_url: '',
    summary: '',
    category: '',
    featured: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCreative = useCallback(async () => {
    try {
      const res = await api.get('/creative');
      const creativesList = res.data || [];
      const item = creativesList.find((c) => String(c.id) === String(id));
      if (!item) {
        showToast('Creative not found', 'error');
        router.push('/admin/creatives');
        return;
      }
      setCreative(item);
    } catch {
      showToast('Failed to fetch creative details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchCreative();
  }, [fetchCreative]);

  const openEditModal = () => {
    setFormData({
      video_url: creative.video_url || '',
      summary: creative.summary || '',
      category: creative.category || '',
      featured: !!creative.featured,
    });
    setIsEditOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      video_url: formData.video_url,
      summary: formData.summary,
      category: formData.category,
      featured: formData.featured,
    };

    try {
      await api.patch(`/creative/${id}`, payload);
      showToast('Creative updated successfully');
      setIsEditOpen(false);
      fetchCreative();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this creative?')) return;
    try {
      await api.delete(`/creative/${id}`);
      showToast('Creative deleted successfully');
      router.push('/admin/creatives');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  if (loading) return <LoadingSpinner size={32} />;
  if (!creative) return null;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/admin/creatives"
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
          style={{ fontSize: '0.9rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> Back to Creatives
        </Link>

        <div className="flex items-center gap-3">
          <button onClick={openEditModal} className="btn btn-outline flex items-center gap-2">
            <Edit size={14} /> Edit Creative
          </button>
          <button onClick={handleDelete} className="btn btn-danger flex items-center gap-2">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Main Full Page Preview Card */}
      <div className="glass-panel p-8">
        {creative.thumbnail_url && (
          <div className="mb-8 overflow-hidden rounded-lg" style={{ border: '1px solid var(--border)' }}>
            <img
              src={creative.thumbnail_url}
              alt={creative.title}
              style={{
                width: '100%',
                maxHeight: 420,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {creative.category && <span className="badge badge-muted">{creative.category}</span>}
              {creative.featured && <span className="badge badge-success">Featured</span>}
            </div>
            <h1 className="heading-lg" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
              {creative.title}
            </h1>
            <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.9rem' }}>
              <Video size={16} style={{ color: 'var(--accent)' }} />
              <span>{creative.channel_title || 'YouTube Channel'}</span>
            </div>
          </div>

          {creative.video_url && (
            <a
              href={creative.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary flex items-center gap-2"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={15} /> Watch on YouTube
            </a>
          )}
        </div>

        {creative.summary && (
          <>
            <hr style={{ borderColor: 'var(--border)', margin: '1.5rem 0' }} />
            <div>
              <span className="stat-label mb-3 block" style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}>
                CREATIVE SUMMARY
              </span>
              <div
                style={{
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {creative.summary}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Creative"
        size="lg"
      >
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">YouTube Video URL</label>
            <input
              type="url"
              name="video_url"
              className="form-input"
              value={formData.video_url}
              onChange={handleInputChange}
              required
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
            />
          </div>
          <div className="form-group">
            <label className="form-label">Summary</label>
            <textarea
              name="summary"
              className="form-input"
              value={formData.summary}
              onChange={handleInputChange}
              style={{ minHeight: '100px' }}
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
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
