'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ActionButtons from '@/components/ui/ActionButtons';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const initialForm = { name: '', role: '', company: '', comment: '' };

export default function ManageTestimonialsPage() {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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
    setIsPreviewOpen(false);
    setIsModalOpen(true);
  };

  const openPreviewModal = (t) => {
    setPreviewTestimonial(t);
    setIsPreviewOpen(true);
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
      setIsPreviewOpen(false);
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
          onClick={() => openPreviewModal(row)}
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
        title="Manage Testimonials"
        subtitle="Manage client testimonials and reviews"
        actionLabel="Add Testimonial"
        onAction={openCreateModal}
      />

      <DataTable columns={columns} data={testimonials} emptyMessage="No testimonials found." />

      {/* Preview Modal */}
      {previewTestimonial && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Testimonial Details"
        >
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-md">{previewTestimonial.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {previewTestimonial.role && <span className="badge badge-muted">{previewTestimonial.role}</span>}
                {previewTestimonial.company && <span className="text-muted" style={{ fontSize: '0.8rem' }}>@ {previewTestimonial.company}</span>}
              </div>
            </div>

            <div>
              <label className="form-label">Testimonial Comment</label>
              <div
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  maxHeight: 250,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  background: 'var(--bg-primary)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontStyle: 'italic',
                }}
              >
                "{previewTestimonial.comment}"
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(previewTestimonial.id)}
              >
                Delete
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openEditModal(previewTestimonial)}
              >
                Edit Testimonial
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit / Create Modal matching backend schema exactly */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Testimonial' : 'Add Testimonial'}
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
              style={{ minHeight: '120px' }}
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
