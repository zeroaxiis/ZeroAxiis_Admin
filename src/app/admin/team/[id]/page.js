'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Edit, Trash2, Shield } from 'lucide-react';

export default function TeamDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', description: '', image: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchMember = useCallback(async () => {
    try {
      const res = await api.get('/team');
      const teamList = res.data || [];
      const item = teamList.find((m) => String(m.id) === String(id));
      if (!item) {
        showToast('Team member not found', 'error');
        router.push('/admin/team');
        return;
      }
      setMember(item);
    } catch {
      showToast('Failed to fetch team member details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const openEditModal = () => {
    setFormData({
      name: member.name || '',
      role: member.role || '',
      description: member.description || '',
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
    data.append('name', formData.name);
    data.append('role', formData.role);
    data.append('description', formData.description);
    if (formData.image) data.append('image', formData.image);

    try {
      await api.patchForm(`/team/${id}`, data);
      showToast('Team member updated successfully');
      setIsEditOpen(false);
      fetchMember();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    try {
      await api.delete(`/team/${id}`);
      showToast('Team member deleted successfully');
      router.push('/admin/team');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  if (loading) return <LoadingSpinner size={32} />;
  if (!member) return null;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Navigation & Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/admin/team"
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
          style={{ fontSize: '0.9rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> Back to Team
        </Link>

        <div className="flex items-center gap-3">
          <button onClick={openEditModal} className="btn btn-outline flex items-center gap-2">
            <Edit size={14} /> Edit Member
          </button>
          <button onClick={handleDelete} className="btn btn-danger flex items-center gap-2">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Main Full Page Preview Card */}
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
          <img
            src={member.image_url}
            alt={member.name}
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          />

          <div className="flex flex-col gap-2 text-center md:text-left">
            <h1 className="heading-lg" style={{ fontSize: '2rem' }}>
              {member.name}
            </h1>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Shield size={16} style={{ color: 'var(--accent)' }} />
              <span className="badge badge-muted" style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}>
                {member.role}
              </span>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border)', margin: '1.5rem 0' }} />

        <div>
          <span className="stat-label mb-3 block" style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            BIOGRAPHY & DESCRIPTION
          </span>
          <div
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-primary)',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {member.description}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Team Member"
        size="lg"
      >
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              required
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
            <label className="form-label">Replace Avatar (Optional)</label>
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
