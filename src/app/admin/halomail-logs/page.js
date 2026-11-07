'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable from '@/components/ui/DataTable';
import DetailDrawer from '@/components/ui/DetailDrawer';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  ScrollText,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  Code,
  Calendar,
  Clock,
  Radio,
  ExternalLink,
  Info,
  Shield,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

// Helper to pick badge style for various HaloMail event types
function getEventBadgeClass(event) {
  const ev = (event || '').toLowerCase();
  if (ev.includes('fail') || ev.includes('bounce') || ev.includes('drop') || ev.includes('error')) {
    return 'badge-danger';
  }
  if (ev.includes('deliver') || ev.includes('success') || ev.includes('complete')) {
    return 'badge-success';
  }
  if (ev.includes('open') || ev.includes('click')) {
    return 'badge-purple';
  }
  if (ev.includes('sent') || ev.includes('send') || ev.includes('queue')) {
    return 'badge-info';
  }
  if (ev.includes('warn') || ev.includes('delay') || ev.includes('retry')) {
    return 'badge-warning';
  }
  return 'badge-accent';
}

// Relative time formatter
function formatRelativeTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 5) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

// Format full date time
function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export default function HaloMailLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLogs = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const response = await api.get('/halomail/events');
        // The Go backend returns: { success: true, count: N, data: [...] }
        const eventData = response?.data || [];
        setLogs(Array.isArray(eventData) ? eventData : []);
        setLastUpdated(new Date());
        if (isManual) {
          showToast('HaloMail logs refreshed');
        }
      } catch (err) {
        if (isManual) {
          showToast(err.message || 'Failed to fetch HaloMail logs', 'error');
        }
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [showToast]
  );

  // Initial load
  useEffect(() => {
    fetchLogs(false);
  }, [fetchLogs]);

  // Auto-refresh interval (every 10 seconds when enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  // Distinct event types
  const eventTypes = useMemo(() => {
    const types = new Set();
    logs.forEach((log) => {
      if (log.event) types.add(log.event);
    });
    return Array.from(types).sort();
  }, [logs]);

  // Filtered and searched logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Event type filter
      if (selectedEventType !== 'ALL' && log.event !== selectedEventType) {
        return false;
      }

      // Search query filter (matches ID, event, timestamp, or data content)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = (log.id || '').toLowerCase().includes(q);
        const eventMatch = (log.event || '').toLowerCase().includes(q);
        const timeMatch = (log.timestamp || '').toLowerCase().includes(q);
        let dataMatch = false;
        try {
          dataMatch = JSON.stringify(log.data || {}).toLowerCase().includes(q);
        } catch {}

        return idMatch || eventMatch || timeMatch || dataMatch;
      }

      return true;
    });
  }, [logs, selectedEventType, searchQuery]);

  const handleCopy = (text, idKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (idKey === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedId(idKey);
      setTimeout(() => setCopiedId(null), 2000);
    }
    showToast('Copied to clipboard');
  };

  const handleInspect = (log) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const sampleWebhookJson = JSON.stringify(
    {
      event: 'email.delivered',
      timestamp: new Date().toISOString(),
      data: {
        recipient: 'client@example.com',
        subject: 'Project Inquiry Response',
        status: 'delivered',
        message_id: 'msg_98fbc1234567',
      },
    },
    null,
    2
  );

  const columns = [
    {
      header: 'Event',
      accessor: 'event',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="pulse-dot" style={{ width: 7, height: 7 }} />
          <span className={`badge ${getEventBadgeClass(row.event)}`}>
            {row.event || 'unnamed.event'}
          </span>
        </div>
      ),
    },
    {
      header: 'Event ID',
      accessor: 'id',
      render: (row) => {
        const fullId = row.id || 'N/A';
        const shortId = fullId.length > 12 ? `${fullId.slice(0, 8)}...` : fullId;
        return (
          <div className="flex items-center gap-1.5 font-mono text-muted" style={{ fontSize: '0.8rem' }}>
            <span title={fullId}>{shortId}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(fullId, row.id);
              }}
              className="btn btn-icon btn-outline"
              style={{ padding: '0.15rem 0.3rem', fontSize: '0.7rem' }}
              title="Copy ID"
            >
              {copiedId === row.id ? <Check size={11} className="text-success" /> : <Copy size={11} />}
            </button>
          </div>
        );
      },
    },
    {
      header: 'Payload Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            {formatRelativeTime(row.timestamp)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            {formatDateTime(row.timestamp)}
          </div>
        </div>
      ),
    },
    {
      header: 'Ingested At (Server)',
      accessor: 'received_at',
      render: (row) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            {formatRelativeTime(row.received_at)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            {formatDateTime(row.received_at)}
          </div>
        </div>
      ),
    },
    {
      header: 'Payload Preview',
      accessor: 'data',
      render: (row) => {
        const dataKeys = Object.keys(row.data || {});
        if (dataKeys.length === 0) {
          return <span className="text-muted" style={{ fontSize: '0.78rem' }}>Empty object</span>;
        }

        // Summary representation
        const preview = dataKeys
          .slice(0, 3)
          .map((k) => `${k}: ${typeof row.data[k] === 'object' ? '{...}' : String(row.data[k])}`)
          .join(', ');

        return (
          <div
            className="truncate font-mono"
            style={{
              maxWidth: '240px',
              fontSize: '0.77rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-primary)',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
            title={preview}
          >
            {preview}
          </div>
        );
      },
    },
    {
      header: 'Action',
      className: 'text-center',
      render: (row) => (
        <button
          onClick={() => handleInspect(row)}
          className="btn btn-outline btn-sm flex items-center gap-1.5"
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
        >
          <Code size={13} /> Inspect
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner size={32} />;

  return (
    <div className="animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="heading-lg" style={{ fontSize: '1.75rem', marginBottom: '0.2rem' }}>
              HaloMail Logs
            </h1>
            <span className="badge badge-accent flex items-center gap-1">
              <span className="pulse-dot" /> Live Webhook Feed
            </span>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Real-time webhook events and delivery logs ingested from HaloMail.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            style={{ padding: '0.45rem 0.85rem' }}
          >
            <Info size={14} /> Webhook Endpoint
          </button>

          <button
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`btn btn-sm flex items-center gap-1.5 ${
              autoRefresh ? 'btn-primary' : 'btn-outline'
            }`}
            style={{ padding: '0.45rem 0.85rem' }}
            title="Toggle polling every 10 seconds"
          >
            <Radio size={14} className={autoRefresh ? 'animate-pulse' : ''} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            style={{ padding: '0.45rem 0.85rem' }}
            title="Fetch latest events from backend"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid-4 mb-6" style={{ gap: '1rem' }}>
        <div className="stat-card" style={{ padding: '1.2rem 1.25rem' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="stat-label">Total Events</span>
            <ScrollText size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.75rem' }}>
            {logs.length}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Capped at latest 50 entries
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.2rem 1.25rem' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="stat-label">Unique Event Types</span>
            <Layers size={16} style={{ color: '#38bdf8' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.75rem' }}>
            {eventTypes.length}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {eventTypes.length > 0 ? eventTypes.slice(0, 2).join(', ') : 'None registered'}
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.2rem 1.25rem' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="stat-label">Latest Activity</span>
            <Clock size={16} style={{ color: '#22c55e' }} />
          </div>
          <div className="truncate" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {logs.length > 0 ? logs[0].event : 'No events'}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {logs.length > 0 ? formatRelativeTime(logs[0].received_at) : 'Waiting for incoming webhook'}
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.2rem 1.25rem' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="stat-label">Ingestion Receiver</span>
            <Shield size={16} style={{ color: '#a855f7' }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
              Active Listener
            </span>
          </div>
          <div className="text-muted truncate font-mono" style={{ fontSize: '0.725rem', marginTop: '0.35rem' }}>
            /api/v1/halomail/webhook
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1" style={{ minWidth: 260 }}>
          <div className="relative flex-1">
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by event, Mongo ID, or payload content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', height: 38 }}
            />
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="form-input"
              style={{
                width: 'auto',
                minWidth: 160,
                fontSize: '0.85rem',
                height: 38,
                padding: '0 0.85rem',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Event Types ({logs.length})</option>
              {eventTypes.map((type) => {
                const count = logs.filter((l) => l.event === type).length;
                return (
                  <option key={type} value={type}>
                    {type} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Clear Filters / Counter */}
        <div className="flex items-center gap-3">
          {(searchQuery || selectedEventType !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEventType('ALL');
              }}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Reset Filters
            </button>
          )}

          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> events
          </span>
        </div>
      </div>

      {/* Events Table */}
      {logs.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(200, 255, 0, 0.08)',
              border: '1px solid rgba(200, 255, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <ScrollText size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="heading-md" style={{ marginBottom: '0.4rem' }}>
            No HaloMail Webhook Events Logged Yet
          </h3>
          <p className="text-secondary mb-6" style={{ fontSize: '0.875rem', maxWidth: 480, margin: '0 auto 1.5rem' }}>
            When HaloMail dispatches webhooks to your backend, verified payloads will automatically be saved to MongoDB
            and displayed here.
          </p>

          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 mx-auto"
            style={{ margin: '0 auto' }}
          >
            <Info size={14} /> View Webhook Integration Details
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredLogs}
          emptyMessage="No events matched your current search or filter criteria."
        />
      )}

      {/* Detail Drawer for Inspecting Event Payload */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Event Payload Inspector"
      >
        {selectedLog && (
          <div className="flex flex-col gap-4">
            {/* Event Header Banner */}
            <div
              className="p-4 rounded-lg flex flex-col gap-2.5"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>Event Type</span>
                <span className={`badge ${getEventBadgeClass(selectedLog.event)}`}>
                  {selectedLog.event}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>Mongo Document ID</span>
                <div className="flex items-center gap-1.5 font-mono" style={{ fontSize: '0.8rem' }}>
                  <span>{selectedLog.id}</span>
                  <button
                    onClick={() => handleCopy(selectedLog.id, 'drawer-id')}
                    className="btn btn-icon btn-outline"
                    style={{ padding: '0.2rem 0.35rem' }}
                    title="Copy Mongo ID"
                  >
                    {copiedId === 'drawer-id' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>Payload Timestamp</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  {formatDateTime(selectedLog.timestamp)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>Server Ingested At</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  {formatDateTime(selectedLog.received_at)} ({formatRelativeTime(selectedLog.received_at)})
                </span>
              </div>
            </div>

            {/* Quick Key-Value Cards if data exists */}
            {selectedLog.data && Object.keys(selectedLog.data).length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Parsed Attributes
                </h4>
                <div className="grid-2 gap-2">
                  {Object.entries(selectedLog.data)
                    .filter(([_, v]) => typeof v !== 'object' && v !== null)
                    .slice(0, 6)
                    .map(([key, val]) => (
                      <div
                        key={key}
                        className="p-2.5 rounded-lg"
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div className="text-muted truncate" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                          {key}
                        </div>
                        <div className="truncate font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          {String(val)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Full Raw JSON */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Full JSON Payload
                </h4>
                <button
                  onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), 'json')}
                  className="btn btn-outline btn-sm flex items-center gap-1.5"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  {copiedJson ? (
                    <>
                      <Check size={12} className="text-success" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy JSON
                    </>
                  )}
                </button>
              </div>

              <pre className="json-pretty-box">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Webhook Endpoint Info Modal */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="HaloMail Webhook Configuration"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            The backend exposes a secure webhook receiver that validates HMAC signatures and stores verified events into
            MongoDB collection <code>halomail_events</code>.
          </p>

          {/* Endpoint URL Box */}
          <div
            className="p-3.5 rounded-lg flex items-center justify-between"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                WEBHOOK URL
              </div>
              <div className="font-mono text-primary" style={{ fontSize: '0.85rem' }}>
                {API_BASE_URL}/halomail/webhook
              </div>
            </div>
            <button
              onClick={() => handleCopy(`${API_BASE_URL}/halomail/webhook`, 'url')}
              className="btn btn-outline btn-sm"
            >
              {copiedId === 'url' ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            </button>
          </div>

          {/* Required Headers Box */}
          <div
            className="p-3.5 rounded-lg flex flex-col gap-2"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              REQUIRED HEADERS
            </div>
            <div className="font-mono" style={{ fontSize: '0.8rem' }}>
              <div>
                <strong style={{ color: 'var(--accent)' }}>X-HaloMail-Signature:</strong> &lt;HMAC-SHA256 hex signature&gt;
              </div>
              <div className="mt-1 text-muted">
                Content-Type: application/json
              </div>
            </div>
          </div>

          {/* Expected Payload Schema */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                EXAMPLE PAYLOAD STRUCTURE
              </span>
              <button
                onClick={() => handleCopy(sampleWebhookJson, 'sample')}
                className="btn btn-outline btn-sm flex items-center gap-1"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              >
                {copiedId === 'sample' ? <Check size={11} className="text-success" /> : <Copy size={11} />} Copy Sample
              </button>
            </div>
            <pre className="json-pretty-box" style={{ fontSize: '0.78rem' }}>
              {sampleWebhookJson}
            </pre>
          </div>

          <div
            className="p-3 rounded-lg text-secondary"
            style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: '0.8rem',
            }}
          >
            <strong>Replay Attack Protection:</strong> Incoming events with timestamps older than 5 minutes or in the future are automatically rejected by the Go handler.
          </div>
        </div>
      </Modal>
    </div>
  );
}

