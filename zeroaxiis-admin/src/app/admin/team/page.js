'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ActionButtons from '@/components/ui/ActionButtons';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const initialForm = { name: '', role: '', description: '', image: null };

export default function ManageTeamPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      fetchTeam();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const columns = [
    {
      header: 'Member',
      render: (row) => (
        <div className="flex items-center gap-4">
          <img src={row.image_url} alt={row.name} className="avatar" />
          <span>{row.name}</span>
        </div>
      ),
    },
    { header: 'Role', accessor: 'role' },
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
        title="Manage Team"
        subtitle="View and manage your team members"
        actionLabel="Add Member"
        onAction={openCreateModal}
      />

      <DataTable columns={columns} data={members} emptyMessage="No team members found." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Team Member' : 'Add Team Member'}
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
            <textarea name="description" className="form-input" value={formData.description} onChange={handleInputChange} required />
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
