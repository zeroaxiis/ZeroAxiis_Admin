'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Edit, Trash2, Quote, Building } from 'lucide-react';

export default function TestimonialDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [testimonial, setTestimonial] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTestimonial = useCallback(async () => {
    try {
      const res = await api.get('/testimonial');
      const testimonialsList = res.data || [];
      const item = testimonialsList.find((t) => String(t.id) === String(id));
      if (!item) {
        showToast('Testimonial not found', 'error');
        router.push('/admin/testimonials');
        return;
      }
      setTestimonial(item);
    } catch {
      showToast('Failed to fetch testimonial details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchTestimonial();
  }, [fetchTestimonial]);

  const openEditModal = () => {
    setFormData({
      name: testimonial.name || '',
      role: testimonial.role || '',
      company: testimonial.company || '',
      comment: testimonial.comment || '',
    });
    setIsEditOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('role', formData.role);
    data.append('company', formData.company);
    data.append('comment', formData.comment);

    try {
      await api.patchForm(`/testimonial/${id}`, data);
      showToast('Testimonial updated successfully');
      setIsEditOpen(false);
      fetchTestimonial();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await api.delete(`/testimonial/${id}`);
      showToast('Testimonial deleted successfully');
      router.push('/admin/testimonials');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  if (loading) return <LoadingSpinner size={32} />;
  if (!testimonial) return null;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/admin/testimonials"
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
          style={{ fontSize: '0.9rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> Back to Testimonials
        </Link>

        <div className="flex items-center gap-3">
          <button onClick={openEditModal} className="btn btn-outline flex items-center gap-2">
            <Edit size={14} /> Edit Testimonial
          </button>
          <button onClick={handleDelete} className="btn btn-danger flex items-center gap-2">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Main Full Page Preview Card */}
      <div className="glass-panel p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="heading-lg" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
              {testimonial.name}
            </h1>
            <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.95rem' }}>
              {testimonial.role && <span className="badge badge-muted" style={{ fontSize: '0.85rem' }}>{testimonial.role}</span>}
              {testimonial.company && (
                <span className="flex items-center gap-1.5 text-secondary">
                  <Building size={15} /> @ {testimonial.company}
                </span>
              )}
            </div>
          </div>

          <Quote size={40} style={{ color: 'var(--accent)', opacity: 0.8 }} />
        </div>

        <hr style={{ borderColor: 'var(--border)', margin: '1.5rem 0' }} />

        <div>
          <span className="stat-label mb-3 block" style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            FULL TESTIMONIAL COMMENT
          </span>
          <div
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-primary)',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              fontStyle: 'italic',
              background: 'var(--bg-primary)',
              padding: '1.5rem 1.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            "{testimonial.comment}"
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Testimonial"
        size="lg"
      >
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Client Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input
              type="text"
              name="role"
              className="form-input"
              value={formData.role}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input
              type="text"
              name="company"
              className="form-input"
              value={formData.company}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Comment</label>
            <textarea
              name="comment"
              className="form-input"
              value={formData.comment}
              onChange={handleInputChange}
              required
              style={{ minHeight: '140px' }}
            />
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
