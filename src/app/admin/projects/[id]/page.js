'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Edit, Trash2, ExternalLink, Building2 } from 'lucide-react';

export default function ProjectDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    description: '',
    project_url: '',
    image: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await api.get('/project');
      const projectsList = res.data || [];
      const item = projectsList.find((p) => String(p.id) === String(id));
      if (!item) {
        showToast('Project not found', 'error');
        router.push('/admin/projects');
        return;
      }
      setProject(item);
    } catch {
      showToast('Failed to fetch project details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const openEditModal = () => {
    setFormData({
      title: project.title || '',
      organization: project.organization || '',
      description: project.description || '',
      project_url: project.project_url || '',
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
    data.append('organization', formData.organization);
    data.append('description', formData.description);
    data.append('project_url', formData.project_url);
    if (formData.image) data.append('image', formData.image);

    try {
      await api.patchForm(`/project/${id}`, data);
      showToast('Project updated successfully');
      setIsEditOpen(false);
      fetchProject();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/project/${id}`);
      showToast('Project deleted successfully');
      router.push('/admin/projects');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  if (loading) return <LoadingSpinner size={32} />;
  if (!project) return null;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/admin/projects"
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
          style={{ fontSize: '0.9rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> Back to Projects
        </Link>

        <div className="flex items-center gap-3">
          <button onClick={openEditModal} className="btn btn-outline flex items-center gap-2">
            <Edit size={14} /> Edit Project
          </button>
          <button onClick={handleDelete} className="btn btn-danger flex items-center gap-2">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Main Full Page Preview Card */}
      <div className="glass-panel p-8">
        {project.image_url && (
          <div className="mb-8 overflow-hidden rounded-lg" style={{ border: '1px solid var(--border)' }}>
            <img
              src={project.image_url}
              alt={project.title}
              style={{
                width: '100%',
                maxHeight: 400,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="heading-lg" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {project.title}
            </h1>
            <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.9rem' }}>
              <Building2 size={16} style={{ color: 'var(--accent)' }} />
              <span>{project.organization}</span>
            </div>
          </div>

          {project.project_url && (
            <a
              href={project.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary flex items-center gap-2"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={15} /> Visit Project
            </a>
          )}
        </div>

        <hr style={{ borderColor: 'var(--border)', margin: '1.5rem 0' }} />

        <div>
          <span className="stat-label mb-3 block" style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            PROJECT DESCRIPTION
          </span>
          <div
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-primary)',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {project.description}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Project"
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
            <label className="form-label">Organization</label>
            <input
              type="text"
              name="organization"
              className="form-input"
              value={formData.organization}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleInputChange}
              required
              style={{ minHeight: '140px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Project URL</label>
            <input
              type="url"
              name="project_url"
              className="form-input"
              value={formData.project_url}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Replace Image (Optional)</label>
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
