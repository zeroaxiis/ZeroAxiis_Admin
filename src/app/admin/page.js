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
  Plus,
  PieChart,
  Activity,
  Server,
  Database,
  Zap,
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

  if (loading) return <LoadingSpinner size={32} />;

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

  const allSections = [
    { key: 'team', label: 'team', count: data.team.length, href: '/admin/team', color: '#38bdf8' },
    { key: 'creatives', label: 'creative', count: data.creatives.length, href: '/admin/creatives', color: '#f43f5e' },
    { key: 'testimonials', label: 'testimonials', count: data.testimonials.length, href: '/admin/testimonials', color: '#a855f7' },
    { key: 'blogs', label: 'blogs', count: data.blogs.length, href: '/admin/blogs', color: '#22c55e' },
    { key: 'projects', label: 'projects', count: data.projects.length, href: '/admin/projects', color: '#eab308' },
  ];

  const totalItems = allSections.reduce((acc, s) => acc + s.count, 0);
  const activeSections = allSections.filter((s) => s.count > 0);

  // Spacious SVG Donut Geometry Calculations
  const cx = 250;
  const cy = 135;
  const rOuter = 72;
  const rInner = 44;
  let currentAngle = -Math.PI / 2;

  const slices = activeSections.map((sec) => {
    const fraction = sec.count / totalItems;
    const angleLength = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleLength;
    currentAngle = endAngle;

    const midAngle = (startAngle + endAngle) / 2;

    const x1Outer = cx + rOuter * Math.cos(startAngle);
    const y1Outer = cy + rOuter * Math.sin(startAngle);
    const x2Outer = cx + rOuter * Math.cos(endAngle);
    const y2Outer = cy + rOuter * Math.sin(endAngle);

    const x1Inner = cx + rInner * Math.cos(endAngle);
    const y1Inner = cy + rInner * Math.sin(endAngle);
    const x2Inner = cx + rInner * Math.cos(startAngle);
    const y2Inner = cy + rInner * Math.sin(startAngle);

    const largeArcFlag = angleLength > Math.PI ? 1 : 0;

    let pathData;
    if (activeSections.length === 1) {
      pathData = [
        `M ${cx} ${cy - rOuter}`,
        `A ${rOuter} ${rOuter} 0 1 1 ${cx - 0.01} ${cy - rOuter}`,
        `Z`,
        `M ${cx} ${cy - rInner}`,
        `A ${rInner} ${rInner} 0 1 0 ${cx - 0.01} ${cy - rInner}`,
        `Z`,
      ].join(' ');
    } else {
      pathData = [
        `M ${x1Outer} ${y1Outer}`,
        `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
        `L ${x1Inner} ${y1Inner}`,
        `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}`,
        'Z',
      ].join(' ');
    }

    const p1X = cx + (rOuter + 3) * Math.cos(midAngle);
    const p1Y = cy + (rOuter + 3) * Math.sin(midAngle);

    const isRightSide = Math.cos(midAngle) >= 0;
    const armLen = 42;
    const p2X = cx + (rOuter + armLen) * Math.cos(midAngle);
    const p2Y = cy + (rOuter + armLen) * Math.sin(midAngle);

    const p3X = isRightSide ? p2X + 26 : p2X - 26;
    const p3Y = p2Y;

    return {
      ...sec,
      pathData,
      pointer: { p1X, p1Y, p2X, p2Y, p3X, p3Y, isRightSide },
    };
  });

  return (
    <div className="animate-fade-in pb-8">
      {/* Header Banner */}
      <div className="mb-6">
        <h1 className="heading-lg" style={{ marginBottom: '0.2rem', fontSize: '1.75rem' }}>
          Dashboard Overview
        </h1>
        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
          Manage and monitor all your ZeroAxiis content assets and infrastructure.
        </p>
      </div>

      {/* Top 4 Metrics Grid */}
      <div className="grid-4 mb-6" style={{ gap: '1rem' }}>
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="stat-card block group"
            style={{ textDecoration: 'none', padding: '1.2rem 1.25rem' }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="stat-label" style={{ fontSize: '0.8rem' }}>{stat.title}</span>
              <ArrowUpRight
                size={15}
                style={{ color: 'var(--text-muted)' }}
              />
            </div>

            <div className="stat-value mb-3" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {stat.count}
            </div>

            {/* Media Preview Stack */}
            <div className="flex items-center gap-1.5" style={{ height: 24 }}>
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

      {/* Main Grid: Spacious Content Distribution SVG & Infrastructure Status */}
      <div className="grid-2 gap-6">
        {/* Dynamic SVG Donut Chart Box */}
        <div className="glass-panel p-6 flex flex-col justify-between" style={{ minHeight: 380 }}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <PieChart size={17} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Content Distribution</h2>
            </div>
            <span className="badge badge-accent" style={{ fontSize: '0.8rem' }}>
              {totalItems} Total Assets
            </span>
          </div>

          {/* SVG Canvas */}
          <div className="relative flex items-center justify-center my-2" style={{ minHeight: 260 }}>
            <svg width="500" height="260" viewBox="0 0 500 260" style={{ overflow: 'visible' }}>
              <defs>
                {allSections.map((s) => (
                  <marker
                    key={s.key}
                    id={`arrow-${s.key}`}
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={s.color} />
                  </marker>
                ))}
              </defs>

              {/* Donut Slices */}
              {slices.length > 0 ? (
                slices.map((slice) => (
                  <path
                    key={slice.key}
                    d={slice.pathData}
                    fill={slice.color}
                    stroke="var(--bg-surface)"
                    strokeWidth="3"
                    style={{ transition: 'all 0.4s ease', cursor: 'pointer' }}
                    onClick={() => window.location.href = slice.href}
                  />
                ))
              ) : (
                <circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} fill="none" stroke="var(--border-subtle)" strokeWidth={rOuter - rInner} />
              )}

              {/* Center Circle Label */}
              <circle cx={cx} cy={cy} r={rInner - 2} fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
              <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="21" fontWeight="800">
                {totalItems}
              </text>
              <text x={cx} y={cy + 15} textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="500">
                Assets
              </text>

              {/* Midpoint Pointer Lines */}
              {slices.map((slice) => {
                const { p1X, p1Y, p2X, p2Y, p3X, p3Y, isRightSide } = slice.pointer;
                const points = `${p1X},${p1Y} ${p2X},${p2Y} ${p3X},${p3Y}`;
                const textAnchor = isRightSide ? 'start' : 'end';
                const textX = isRightSide ? p3X + 8 : p3X - 8;

                return (
                  <g key={`pointer-${slice.key}`}>
                    <polyline
                      points={points}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="1.75"
                      strokeDasharray="4 2"
                      markerEnd={`url(#arrow-${slice.key})`}
                    />
                    <g onClick={() => window.location.href = slice.href} style={{ cursor: 'pointer' }}>
                      <text
                        x={textX}
                        y={p3Y + 4}
                        textAnchor={textAnchor}
                        fill={slice.color}
                        fontSize="13"
                        fontWeight="700"
                      >
                        {slice.label} ({slice.count})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Creation Shortcut Row */}
          <div className="pt-3 flex flex-wrap justify-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            <Link href="/admin/blogs" className="btn btn-outline btn-sm flex items-center gap-1">
              <Plus size={12} /> Blog
            </Link>
            <Link href="/admin/team" className="btn btn-outline btn-sm flex items-center gap-1">
              <Plus size={12} /> Member
            </Link>
            <Link href="/admin/projects" className="btn btn-outline btn-sm flex items-center gap-1">
              <Plus size={12} /> Project
            </Link>
            <Link href="/admin/creatives" className="btn btn-outline btn-sm flex items-center gap-1">
              <Plus size={12} /> Creative
            </Link>
            <Link href="/admin/testimonials" className="btn btn-outline btn-sm flex items-center gap-1">
              <Plus size={12} /> Testimonial
            </Link>
          </div>
        </div>

        {/* Spacious Infrastructure Status Card */}
        <div className="glass-panel p-6 flex flex-col justify-between" style={{ minHeight: 380 }}>
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <Activity size={17} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Infrastructure Status</h2>
              </div>

              <button
                onClick={() => fetchHealthStatus(true)}
                disabled={cooldownRemaining > 0 || healthLoading}
                className="btn btn-outline btn-sm flex items-center gap-1.5"
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                title="Ping backend health endpoint"
              >
                <RefreshCw size={12} className={healthLoading ? 'animate-spin' : ''} />
                {cooldownRemaining > 0 ? `${cooldownRemaining}s` : 'Re-check'}
              </button>
            </div>

            <p className="text-secondary mb-5" style={{ fontSize: '0.8rem' }}>
              Last checked:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {lastChecked ? lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
              </strong>
            </p>

            {/* 3 Status Cards */}
            <div className="flex flex-col gap-3.5">
              {/* API Gateway Card */}
              <div
                className="p-4 rounded-lg flex items-center justify-between"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                    }}
                  >
                    <Server size={18} style={{ color: '#38bdf8' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      API Gateway
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ZeroAxiis Microservices API
                    </div>
                  </div>
                </div>

                <span className="badge badge-success flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Active
                </span>
              </div>

              {/* MongoDB Store Card */}
              <div
                className="p-4 rounded-lg flex items-center justify-between"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(34, 197, 94, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}
                  >
                    <Database size={18} style={{ color: '#22c55e' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      MongoDB Store
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Primary Document Database
                    </div>
                  </div>
                </div>

                <div>
                  {health?.services?.mongodb !== false ? (
                    <span className="badge badge-success flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Healthy
                    </span>
                  ) : (
                    <span className="badge badge-danger flex items-center gap-1.5">
                      <XCircle size={12} /> Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Redis Cache Card */}
              <div
                className="p-4 rounded-lg flex items-center justify-between"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(168, 85, 247, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                    }}
                  >
                    <Zap size={18} style={{ color: '#a855f7' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Redis Cache
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      In-Memory Session & Data Cache
                    </div>
                  </div>
                </div>

                <div>
                  {health?.services?.redis !== false ? (
                    <span className="badge badge-success flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Healthy
                    </span>
                  ) : (
                    <span className="badge badge-danger flex items-center gap-1.5">
                      <XCircle size={12} /> Offline
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
