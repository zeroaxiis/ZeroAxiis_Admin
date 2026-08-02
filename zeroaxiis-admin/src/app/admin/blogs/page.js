'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ActionButtons from '@/components/ui/ActionButtons';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const initialForm = { title: '', author: '', content: '', image: null };

export default function ManageBlogsPage() {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchBlogs = useCallback(async () => {
    try {
      const data = await api.get('/blog');
      setBlogs(data.data || []);
    } catch {
      showToast('Failed to fetch blogs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (blog) => {
    setIsEditing(true);
    setEditingId(blog.id);
    setFormData({ title: blog.title, author: blog.author, content: blog.content, image: null });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('author', formData.author);
    data.append('content', formData.content);
    if (formData.image) data.append('image', formData.image);

    try {
      if (isEditing) {
        await api.patchForm(`/blog/${editingId}`, data);
        showToast('Blog updated successfully');
      } else {
        await api.postForm('/blog', data);
        showToast('Blog created successfully');
      }
      setIsModalOpen(false);
      fetchBlogs();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await api.delete(`/blog/${id}`);
      showToast('Blog deleted successfully');
      fetchBlogs();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const columns = [
    {
      header: 'Image',
      render: (row) =>
        row.image_url ? (
          <img src={row.image_url} alt={row.title} className="thumbnail" />
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { header: 'Title', accessor: 'title' },
    { header: 'Author', accessor: 'author' },
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
        title="Manage Blogs"
        subtitle="Create and manage your blog posts"
        actionLabel="Add Blog"
        onAction={openCreateModal}
      />

      <DataTable columns={columns} data={blogs} emptyMessage="No blogs found." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Blog' : 'Add Blog'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input type="text" name="title" className="form-input" value={formData.title} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Author</label>
            <input type="text" name="author" className="form-input" value={formData.author} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea name="content" className="form-input" value={formData.content} onChange={handleInputChange} required style={{ minHeight: '160px' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Thumbnail {!isEditing && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
            <input type="file" name="image" className="form-input" onChange={handleFileChange} accept="image/*" required={!isEditing} />
          </div>
          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Blog'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
