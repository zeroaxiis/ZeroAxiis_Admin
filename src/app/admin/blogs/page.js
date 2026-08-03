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

const initialForm = { title: '', author: '', content: '', image: null };

export default function ManageBlogsPage() {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewBlog, setPreviewBlog] = useState(null);
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
    setPreviewBlog(null);
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
      setPreviewBlog(null);
      fetchBlogs();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const columns = [
    {
      header: 'Cover',
      render: (row) =>
        row.image_url ? (
          <img
            src={row.image_url}
            alt={row.title}
            style={{
              width: 48,
              height: 32,
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
          onClick={() => setPreviewBlog(row)}
          style={{ cursor: 'pointer', fontWeight: 500 }}
          className="hover:underline"
        >
          {row.title}
        </span>
      ),
    },
    { header: 'Author', accessor: 'author' },
    {
      header: 'Actions',
      className: 'text-center',
      render: (row) => (
        <ActionButtons
          onView={() => setPreviewBlog(row)}
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

      {/* Zero-API Slide-Over Detail Drawer */}
      <DetailDrawer
        isOpen={!!previewBlog}
        onClose={() => setPreviewBlog(null)}
        title="Blog Article Details"
        onEdit={previewBlog ? () => openEditModal(previewBlog) : null}
        onDelete={previewBlog ? () => handleDelete(previewBlog.id) : null}
      >
        {previewBlog && (
          <div className="flex flex-col gap-6">
            {previewBlog.image_url && (
              <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--border)' }}>
                <img
                  src={previewBlog.image_url}
                  alt={previewBlog.title}
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
              <span className="badge badge-accent mb-2 inline-block">Blog Article</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '0.4rem' }}>
                {previewBlog.title}
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                By <strong style={{ color: 'var(--text-primary)' }}>{previewBlog.author}</strong>
              </span>
            </div>

            <div>
              <span className="stat-label mb-2 block" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                FULL ARTICLE CONTENT
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
                {previewBlog.content}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Blog' : 'Add Blog'}
        size="lg"
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
