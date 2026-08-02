'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ActionButtons from '@/components/ui/ActionButtons';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ExternalLink } from 'lucide-react';

const initialForm = { title: '', organization: '', description: '', project_url: '', image: null };

export default function ManageProjectsPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewProject, setPreviewProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await api.get('/project');
      setProjects(data.data || []);
    } catch {
      showToast('Failed to fetch projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setIsEditing(true);
    setEditingId(project.id);
    setFormData({
      title: project.title,
      organization: project.organization,
      description: project.description,
      project_url: project.project_url,
      image: null,
    });
    setIsPreviewOpen(false);
    setIsModalOpen(true);
  };

  const openPreviewModal = (project) => {
    setPreviewProject(project);
    setIsPreviewOpen(true);
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
    data.append('organization', formData.organization);
    data.append('description', formData.description);
    data.append('project_url', formData.project_url);
    if (formData.image) data.append('image', formData.image);

    try {
      if (isEditing) {
        await api.patchForm(`/project/${editingId}`, data);
        showToast('Project updated successfully');
      } else {
        await api.postForm('/project', data);
        showToast('Project created successfully');
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/project/${id}`);
      showToast('Project deleted successfully');
      setIsPreviewOpen(false);
      fetchProjects();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const columns = [
    {
      header: 'Image',
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
          onClick={() => openPreviewModal(row)}
          style={{ cursor: 'pointer', fontWeight: 500 }}
          className="hover:underline"
        >
          {row.title}
        </span>
      ),
    },
    { header: 'Organization', accessor: 'organization' },
    {
      header: 'URL',
      render: (row) =>
        row.project_url ? (
          <a
            href={row.project_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5"
            style={{ color: 'var(--accent)', fontSize: '0.85rem' }}
          >
            <ExternalLink size={13} />
            Visit
          </a>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
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
        title="Manage Projects"
        subtitle="Showcase and manage your projects"
        actionLabel="Add Project"
        onAction={openCreateModal}
      />

      <DataTable columns={columns} data={projects} emptyMessage="No projects found." />

      {/* Preview Modal */}
      {previewProject && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Project Preview"
        >
          <div className="flex flex-col gap-4">
            {previewProject.image_url && (
              <img
                src={previewProject.image_url}
                alt={previewProject.title}
                style={{
                  width: '100%',
                  maxHeight: 240,
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'cover',
                  border: '1px solid var(--border)',
                }}
              />
            )}
            <div>
              <h2 className="heading-md">{previewProject.title}</h2>
              <span className="badge badge-muted">{previewProject.organization}</span>
            </div>

            {previewProject.project_url && (
              <div>
                <label className="form-label">Project URL</label>
                <a
                  href={previewProject.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                  style={{ color: 'var(--accent)', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={14} />
                  {previewProject.project_url}
                </a>
              </div>
            )}

            <div>
              <label className="form-label">Description</label>
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
                }}
              >
                {previewProject.description}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(previewProject.id)}
              >
                Delete
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openEditModal(previewProject)}
              >
                Edit Project
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Project' : 'Add Project'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input type="text" name="title" className="form-input" value={formData.title} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Organization</label>
            <input type="text" name="organization" className="form-input" value={formData.organization} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" value={formData.description} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Project URL</label>
            <input type="url" name="project_url" className="form-input" value={formData.project_url} onChange={handleInputChange} required placeholder="https://..." />
          </div>
          <div className="form-group">
            <label className="form-label">Image {!isEditing && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
            <input type="file" name="image" className="form-input" onChange={handleFileChange} accept="image/*" required={!isEditing} />
          </div>
          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
