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

const initialForm = { name: '', role: '', description: '', image: null };

export default function ManageTeamPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewMember, setPreviewMember] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const data = await api.get('/team');
      setMembers(data.data || []);
    } catch {
      showToast('Failed to fetch team members', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setIsEditing(true);
    setEditingId(member.id);
    setFormData({ name: member.name, role: member.role, description: member.description, image: null });
    setPreviewMember(null);
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
    data.append('name', formData.name);
    data.append('role', formData.role);
    data.append('description', formData.description);
    if (formData.image) data.append('image', formData.image);

    try {
      if (isEditing) {
        await api.patchForm(`/team/${editingId}`, data);
        showToast('Team member updated successfully');
      } else {
        await api.postForm('/team', data);
        showToast('Team member created successfully');
      }
      setIsModalOpen(false);
      fetchTeam();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    try {
      await api.delete(`/team/${id}`);
      showToast('Team member deleted successfully');
      setPreviewMember(null);
      fetchTeam();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const columns = [
    {
      header: 'Member',
      render: (row) => (
        <div
          className="flex items-center gap-3"
          onClick={() => setPreviewMember(row)}
          style={{ cursor: 'pointer' }}
        >
          <img
            src={row.image_url}
            alt={row.name}
            style={{
              width: 38,
              height: 38,
              minWidth: 38,
              minHeight: 38,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid var(--border)',
            }}
          />
          <div className="flex flex-col">
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="hover:underline">
              {row.name}
            </span>
          </div>
        </div>
      ),
    },
    { header: 'Role', accessor: 'role' },
    {
      header: 'Actions',
      className: 'text-center',
      render: (row) => (
        <ActionButtons
          onView={() => setPreviewMember(row)}
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
        title="Manage Team"
        subtitle="View and manage your team members"
        actionLabel="Add Member"
        onAction={openCreateModal}
      />

      <DataTable columns={columns} data={members} emptyMessage="No team members found." />

      {/* Zero-API Slide-Over Detail Drawer */}
      <DetailDrawer
        isOpen={!!previewMember}
        onClose={() => setPreviewMember(null)}
        title="Member Details"
        onEdit={previewMember ? () => openEditModal(previewMember) : null}
        onDelete={previewMember ? () => handleDelete(previewMember.id) : null}
      >
        {previewMember && (
          <div className="flex flex-col gap-6">
            {/* Header Profile Section */}
            <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <img
                src={previewMember.image_url}
                alt={previewMember.name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border)',
                }}
              />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {previewMember.name}
                </h3>
                <span className="badge badge-accent" style={{ fontSize: '0.825rem' }}>
                  {previewMember.role}
                </span>
              </div>
            </div>

            {/* Description / Bio Section */}
            <div>
              <span className="stat-label mb-2 block" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                BIOGRAPHY & DESCRIPTION
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
                {previewMember.description}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Team Member' : 'Add Team Member'}
        size="lg"
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
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" value={formData.description} onChange={handleInputChange} required style={{ minHeight: '130px' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Image {!isEditing && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
            <input type="file" name="image" className="form-input" onChange={handleFileChange} accept="image/*" required={!isEditing} />
          </div>
          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
