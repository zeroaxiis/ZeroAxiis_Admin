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
import { Quote, Building } from 'lucide-react';

const initialForm = { name: '', role: '', company: '', comment: '' };

export default function ManageTestimonialsPage() {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewTestimonial, setPreviewTestimonial] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    try {
      const data = await api.get('/testimonial');
      setTestimonials(data.data || []);
    } catch {
      showToast('Failed to fetch testimonials', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setIsEditing(true);
    setEditingId(t.id);
    setFormData({
      name: t.name || '',
      role: t.role || '',
      company: t.company || '',
      comment: t.comment || '',
    });
    setPreviewTestimonial(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('role', formData.role);
    data.append('company', formData.company);
    data.append('comment', formData.comment);

    try {
      if (isEditing) {
        await api.patchForm(`/testimonial/${editingId}`, data);
        showToast('Testimonial updated successfully');
      } else {
        await api.postForm('/testimonial', data);
        showToast('Testimonial created successfully');
      }
      setIsModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await api.delete(`/testimonial/${id}`);
      showToast('Testimonial deleted successfully');
      setPreviewTestimonial(null);
      fetchTestimonials();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const columns = [
    {
      header: 'Name',
      render: (row) => (
        <span
          onClick={() => setPreviewTestimonial(row)}
          style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}
          className="hover:underline"
        >
          {row.name}
        </span>
      ),
    },
    { header: 'Role', accessor: 'role' },
    { header: 'Company', accessor: 'company' },
    {
      header: 'Actions',
      className: 'text-center',
      render: (row) => (
        <ActionButtons
          onView={() => setPreviewTestimonial(row)}
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
        title="Manage Testimonials"
        subtitle="Manage client testimonials and reviews"
        actionLabel="Add Testimonial"
        onAction={openCreateModal}
      />

      <DataTable columns={columns} data={testimonials} emptyMessage="No testimonials found." />

      {/* Zero-API Slide-Over Detail Drawer */}
      <DetailDrawer
        isOpen={!!previewTestimonial}
        onClose={() => setPreviewTestimonial(null)}
        title="Testimonial Feedback Details"
        onEdit={previewTestimonial ? () => openEditModal(previewTestimonial) : null}
        onDelete={previewTestimonial ? () => handleDelete(previewTestimonial.id) : null}
      >
        {previewTestimonial && (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {previewTestimonial.name}
                </h3>
                <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.875rem' }}>
                  {previewTestimonial.role && <span className="badge badge-accent">{previewTestimonial.role}</span>}
                  {previewTestimonial.company && (
                    <span className="flex items-center gap-1.5 text-secondary">
                      <Building size={14} /> @ {previewTestimonial.company}
                    </span>
                  )}
                </div>
              </div>
              <Quote size={28} style={{ color: 'var(--accent)', opacity: 0.8 }} />
            </div>

            <div>
              <span className="stat-label mb-2 block" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                FULL TESTIMONIAL COMMENT
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  fontStyle: 'italic',
                  background: 'var(--bg-primary)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                "{previewTestimonial.comment}"
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Testimonial' : 'Add Testimonial'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Client Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g. Alex Johnson"
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
              placeholder="e.g. CTO"
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
              placeholder="e.g. Acme Corp"
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
              placeholder="Client feedback..."
              style={{ minHeight: '140px' }}
            />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Testimonial'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
