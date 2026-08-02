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

  const openEditModal = (testimonial) => {
    setIsEditing(true);
    setEditingId(testimonial.id);
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      company: testimonial.company,
      comment: testimonial.comment,
    });
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
      fetchTestimonials();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Role', accessor: 'role' },
    { header: 'Company', accessor: 'company' },
    {
      header: 'Comment',
      render: (row) => (
        <span className="truncate" style={{ maxWidth: '220px', display: 'inline-block' }}>
          {row.comment}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-center',
      render: (row) => (
        <ActionButtons
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
        subtitle="Manage client testimonials"
        actionLabel="Add Testimonial"
        onAction={openCreateModal}
      />

      <DataTable columns={columns} data={testimonials} emptyMessage="No testimonials found." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Testimonial' : 'Add Testimonial'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input type="text" name="role" className="form-input" value={formData.role} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input type="text" name="company" className="form-input" value={formData.company} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Comment</label>
            <textarea name="comment" className="form-input" value={formData.comment} onChange={handleInputChange} required style={{ minHeight: '120px' }} />
          </div>
          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Testimonial'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
