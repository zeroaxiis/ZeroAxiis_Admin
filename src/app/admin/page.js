'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  FileText,
  Users,
  FolderKanban,
  Video,
  MessageSquareQuote,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState({
    blogs: [],
    team: [],
    projects: [],
    creatives: [],
    testimonials: [],
  });
  const [health, setHealth] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [healthLoading, setHealthLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHealthStatus = useCallback(async (force = false) => {
    const cachedData = sessionStorage.getItem('health_data');
    const cachedTime = sessionStorage.getItem('health_timestamp');
    const cooldownUntil = sessionStorage.getItem('health_cooldown_until');

    const now = Date.now();

    if (cooldownUntil && Number(cooldownUntil) > now) {
      const remainingSec = Math.ceil((Number(cooldownUntil) - now) / 1000);
      setCooldownRemaining(remainingSec);
    } else {
      setCooldownRemaining(0);
    }

    if (!force && cachedData && cachedTime) {
      try {
        setHealth(JSON.parse(cachedData));
        setLastChecked(new Date(Number(cachedTime)));
        return;
      } catch {}
    }

    setHealthLoading(true);
    try {
      const healthRes = await api.get('/quality/health');
      const timeNow = Date.now();
      setHealth(healthRes);
      setLastChecked(new Date(timeNow));

      sessionStorage.setItem('health_data', JSON.stringify(healthRes));
      sessionStorage.setItem('health_timestamp', String(timeNow));

      if (force) {
        const cooldownTime = timeNow + 120 * 1000;
        sessionStorage.setItem('health_cooldown_until', String(cooldownTime));
        setCooldownRemaining(120);
      }
    } catch {
      const fallbackHealth = { status: 'unhealthy', services: { mongodb: false, redis: false } };
      setHealth(fallbackHealth);
      setLastChecked(new Date());
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionStorage.removeItem('health_cooldown_until');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  useEffect(() => {
    async function loadAllData() {
      const endpoints = [
        { key: 'blogs', url: '/blog' },
        { key: 'team', url: '/team' },
        { key: 'projects', url: '/project' },
        { key: 'creatives', url: '/creative' },
        { key: 'testimonials', url: '/testimonial' },
      ];

      const results = {};
      await Promise.allSettled(
        endpoints.map(async ({ key, url }) => {
          try {
            const res = await api.get(url);
            results[key] = res.data || [];
          } catch {
            results[key] = [];
          }
        })
      );
      setData(results);
      await fetchHealthStatus(false);
      setLoading(false);
    }

    loadAllData();
  }, [fetchHealthStatus]);

  if (loading) return <LoadingSpinner size={28} />;

  const stats = [
    {
      title: 'Blogs',
      count: data.blogs.length,
      href: '/admin/blogs',
      icon: FileText,
      previews: data.blogs.slice(0, 3).map((b) => b.image_url).filter(Boolean),
    },
    {
      title: 'Team Members',
      count: data.team.length,
      href: '/admin/team',
      icon: Users,
      avatars: data.team.slice(0, 4).map((t) => t.image_url).filter(Boolean),
    },
    {
      title: 'Projects',
      count: data.projects.length,
      href: '/admin/projects',
      icon: FolderKanban,
      previews: data.projects.slice(0, 3).map((p) => p.image_url).filter(Boolean),
    },
    {
      title: 'Creatives',
      count: data.creatives.length,
      href: '/admin/creatives',
      icon: Video,
      previews: data.creatives.slice(0, 3).map((c) => c.thumbnail_url).filter(Boolean),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header Banner */}
      <div className="mb-8">
        <h1 className="heading-lg" style={{ marginBottom: '0.2rem' }}>
          Dashboard Overview
        </h1>
        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
          Welcome back. Manage and monitor all your ZeroAxiis content assets.
        </p>
      </div>

      {/* Top 4 Metrics Grid */}
      <div className="grid-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="stat-card block group"
            style={{ textDecoration: 'none' }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="stat-label">{stat.title}</span>
              <ArrowUpRight
                size={14}
                style={{ color: 'var(--text-muted)' }}
              />
            </div>

            <div className="stat-value mb-3">{stat.count}</div>

            {/* Media Image Stack Preview */}
            <div className="flex items-center gap-1.5" style={{ height: 28 }}>
              {stat.avatars && stat.avatars.length > 0 ? (
                <div className="flex" style={{ marginLeft: -4 }}>
                  {stat.avatars.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Team Avatar"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--bg-surface)',
                        marginLeft: i > 0 ? -8 : 0,
                      }}
                    />
                  ))}
                </div>
              ) : stat.previews && stat.previews.length > 0 ? (
                <div className="flex gap-1.5">
                  {stat.previews.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Preview"
                      style={{
                        width: 32,
                        height: 20,
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        border: '1px solid var(--border)',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  No media uploaded
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Infrastructure Status & Quick Access Grid */}
      <div className="grid-2 gap-6">
        {/* Quick Management Shortcuts */}
        <div className="glass-panel p-6">
          <h2 className="mb-4" style={{ fontSize: '1rem', fontWeight: 600 }}>
            Quick Content Sections
          </h2>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/admin/blogs"
              className="flex justify-between items-center p-3 rounded"
              style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}
            >
              <div className="flex items-center gap-3">
                <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Blogs</span>
              </div>
              <span className="badge badge-muted">{data.blogs.length} items</span>
            </Link>

            <Link
              href="/admin/team"
              className="flex justify-between items-center p-3 rounded"
              style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}
            >
              <div className="flex items-center gap-3">
                <Users size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Team Members</span>
              </div>
              <span className="badge badge-muted">{data.team.length} items</span>
            </Link>

            <Link
              href="/admin/projects"
              className="flex justify-between items-center p-3 rounded"
              style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}
            >
              <div className="flex items-center gap-3">
                <FolderKanban size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Projects</span>
              </div>
              <span className="badge badge-muted">{data.projects.length} items</span>
            </Link>

            <Link
              href="/admin/creatives"
              className="flex justify-between items-center p-3 rounded"
              style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}
            >
              <div className="flex items-center gap-3">
                <Video size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Creatives</span>
              </div>
              <span className="badge badge-muted">{data.creatives.length} items</span>
            </Link>

            <Link
              href="/admin/testimonials"
              className="flex justify-between items-center p-3 rounded"
              style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}
            >
              <div className="flex items-center gap-3">
                <MessageSquareQuote size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Testimonials</span>
              </div>
              <span className="badge badge-muted">{data.testimonials.length} items</span>
            </Link>
          </div>
        </div>

        {/* Infrastructure Status Card with Cached Timestamp & 2-Min Refresh Cooldown */}
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>
              Infrastructure Status
            </h2>
            <span
              className="badge badge-muted"
              style={{
                color: health?.status === 'healthy' ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {health?.status === 'healthy' ? '● Operational' : '● Degraded'}
            </span>
          </div>

          {/* Last Checked Timestamp & 2-Min Cooldown Button */}
          <div className="flex justify-between items-center mb-6" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>
              Last checked:{' '}
              {lastChecked ? lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
            </span>
            <button
              onClick={() => fetchHealthStatus(true)}
              disabled={cooldownRemaining > 0 || healthLoading}
              className="btn btn-outline btn-sm flex items-center gap-1.5"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              title="Ping backend health endpoint"
            >
              <RefreshCw size={11} className={healthLoading ? 'animate-spin' : ''} />
              {cooldownRemaining > 0 ? `Cooldown (${cooldownRemaining}s)` : 'Re-check'}
            </button>
          </div>

          <div className="flex flex-col gap-3" style={{ fontSize: '0.875rem' }}>
            <div className="flex justify-between items-center p-3 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">API Gateway</span>
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 size={14} /> Active
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">MongoDB Store</span>
              {health?.services?.mongodb !== false ? (
                <span className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 size={14} /> Healthy
                </span>
              ) : (
                <span className="flex items-center gap-1.5" style={{ color: 'var(--danger)' }}>
                  <XCircle size={14} /> Offline
                </span>
              )}
            </div>

            <div className="flex justify-between items-center p-3 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">Redis Cache</span>
              {health?.services?.redis !== false ? (
                <span className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 size={14} /> Healthy
                </span>
              ) : (
                <span className="flex items-center gap-1.5" style={{ color: 'var(--danger)' }}>
                  <XCircle size={14} /> Offline
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
