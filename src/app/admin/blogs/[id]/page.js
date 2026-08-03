'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Edit2, Trash2, Calendar, User } from 'lucide-react';

export default function BlogDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', author: '', content: '', image: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchBlog = useCallback(async () => {
    try {
      const res = await api.get('/blog');
      const blogsList = res.data || [];
      const item = blogsList.find((b) => String(b.id) === String(id));
      if (!item) {
        showToast('Blog post not found', 'error');
        router.push('/admin/blogs');
        return;
      }
      setBlog(item);
    } catch {
      showToast('Failed to fetch blog details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  const openEditModal = () => {
    setFormData({
      title: blog.title || '',
      author: blog.author || '',
      content: blog.content || '',
      image: null,
    });
    setIsEditOpen(true);
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('author', formData.author);
    data.append('content', formData.content);
    if (formData.image) data.append('image', formData.image);

    try {
      await api.patchForm(`/blog/${id}`, data);
      showToast('Blog updated successfully');
      setIsEditOpen(false);
      fetchBlog();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await api.delete(`/blog/${id}`);
      showToast('Blog deleted successfully');
      router.push('/admin/blogs');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  if (loading) return <LoadingSpinner size={32} />;
  if (!blog) return null;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Sleek Header Bar */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/admin/blogs"
          className="btn btn-outline btn-sm flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={15} /> All Blogs
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openEditModal}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Edit2 size={14} /> Edit Post
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-danger btn-sm flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Main Premium Card */}
      <div className="preview-card p-8">
        {blog.image_url && (
          <div className="preview-hero-container mb-8">
            <img
              src={blog.image_url}
              alt={blog.title}
              className="preview-hero-image"
            />
          </div>
        )}

        <div className="mb-6">
          <span className="badge badge-accent mb-3 inline-block">Blog Article</span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: '0.75rem' }}>
            {blog.title}
          </h1>

          <div className="preview-meta-row">
            <span className="flex items-center gap-1.5">
              <User size={15} style={{ color: 'var(--accent)' }} />
              <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{blog.author}</strong>
            </span>
            {blog.created_at && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(blog.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '1.5rem 0' }} />

        {/* Content Box */}
        <div className="preview-content-box">
          {blog.content}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Blog Post"
        size="lg"
      >
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Author</label>
            <input
              type="text"
              name="author"
              className="form-input"
              value={formData.author}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              name="content"
              className="form-input"
              value={formData.content}
              onChange={handleInputChange}
              required
              style={{ minHeight: '180px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Replace Cover Image (Optional)</label>
            <input
              type="file"
              name="image"
              className="form-input"
              onChange={handleFileChange}
              accept="image/*"
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
