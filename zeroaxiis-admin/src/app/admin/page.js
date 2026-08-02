'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  FileText,
  Users,
  FolderKanban,
  Video,
  MessageSquareQuote,
} from 'lucide-react';

const statConfigs = [
  { key: 'blogs', label: 'Blogs', endpoint: '/blog', icon: FileText, color: '#3b82f6' },
  { key: 'team', label: 'Team Members', endpoint: '/team', icon: Users, color: '#10b981' },
  { key: 'projects', label: 'Projects', endpoint: '/project', icon: FolderKanban, color: '#f59e0b' },
  { key: 'creatives', label: 'Creatives', endpoint: '/creative', icon: Video, color: '#ef4444' },
  { key: 'testimonials', label: 'Testimonials', endpoint: '/testimonial', icon: MessageSquareQuote, color: '#8b5cf6' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const results = {};
      await Promise.allSettled(
        statConfigs.map(async (config) => {
          try {
            const data = await api.get(config.endpoint);
            results[config.key] = data.data?.length || 0;
          } catch (err) {
            results[config.key] = 0;
          }
        })
      );
      setStats(results);
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner size={32} />;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="heading-lg" style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
        <p className="text-muted">Overview of your content</p>
      </div>

      <div className="grid-stats">
        {statConfigs.map((config) => (
          <div key={config.key} className="stat-card">
            <div className="flex items-center gap-4">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: `${config.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <config.icon size={22} style={{ color: config.color }} />
              </div>
              <div>
                <div className="stat-value">{stats[config.key] ?? 0}</div>
                <div className="stat-label">{config.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
