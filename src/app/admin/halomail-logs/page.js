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
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  Code,
  Info,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

function formatDateTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function HaloMailLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const fetchLogs = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const response = await api.get('/halomail/events');
        const eventData = response?.data || [];
        setLogs(Array.isArray(eventData) ? eventData : []);
        if (isManual) {
          showToast('Logs refreshed');
        }
      } catch (err) {
        if (isManual) {
          showToast(err.message || 'Failed to fetch logs', 'error');
        }
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchLogs(false);
  }, [fetchLogs]);

  const eventTypes = useMemo(() => {
    const types = new Set();
    logs.forEach((log) => {
      if (log.event) types.add(log.event);
    });
    return Array.from(types).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedEventType !== 'ALL' && log.event !== selectedEventType) {
        return false;
      }

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

  const samplePayload = JSON.stringify(
    {
      event: 'email.sent',
      timestamp: new Date().toISOString(),
      data: {
        to: 'client@example.com',
        subject: 'Contact Form',
        status: 'queued',
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
        <span className="badge badge-accent font-mono" style={{ fontSize: '0.75rem' }}>
          {row.event || 'unnamed'}
        </span>
      ),
    },
    {
      header: 'Event ID',
      accessor: 'id',
      render: (row) => {
        const fullId = row.id || '—';
        const shortId = fullId.length > 14 ? `${fullId.slice(0, 10)}...` : fullId;
        return (
          <div className="flex items-center gap-1.5 font-mono text-muted" style={{ fontSize: '0.8rem' }}>
            <span title={fullId}>{shortId}</span>
            <button
              type="button"
              onClick={() => handleCopy(fullId, row.id)}
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
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
          {formatDateTime(row.timestamp)}
        </span>
      ),
    },
    {
      header: 'Received At',
      accessor: 'received_at',
      render: (row) => (
        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
          {formatDateTime(row.received_at)}
        </span>
      ),
    },
    {
      header: 'Payload Summary',
      accessor: 'data',
      render: (row) => {
        const keys = Object.keys(row.data || {});
        if (keys.length === 0) {
          return <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>;
        }
        const snippet = keys
          .slice(0, 3)
          .map((k) => `${k}: ${typeof row.data[k] === 'object' ? '{...}' : String(row.data[k])}`)
          .join(', ');
        return (
          <div
            className="truncate font-mono text-muted"
            style={{ maxWidth: 260, fontSize: '0.78rem' }}
            title={snippet}
          >
            {snippet}
          </div>
        );
      },
    },
    {
      header: 'Action',
      className: 'text-center',
      render: (row) => (
        <button
          type="button"
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
    <div className="animate-fade-in">
      {/* Header matching standard AdminPageHeader style */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="heading-lg">HaloMail Logs</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Inbound webhook events and delivery logs from HaloMail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsInfoModalOpen(true)}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
          >
            <Info size={14} /> Webhook Info
          </button>

          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1" style={{ minWidth: 260 }}>
          <div className="relative flex-1" style={{ maxWidth: 360 }}>
            <Search
              size={14}
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
              placeholder="Search events, IDs, or payloads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', height: 38 }}
            />
          </div>

          {eventTypes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
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
                <option value="ALL">All Events ({logs.length})</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(searchQuery || selectedEventType !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedEventType('ALL');
              }}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Clear
            </button>
          )}
        </div>

        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
          {filteredLogs.length} event{filteredLogs.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        emptyMessage="No HaloMail webhook events logged yet."
      />

      {/* Slide-Over Drawer for Payload Inspection */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Webhook Event Payload"
      >
        {selectedLog && (
          <div className="flex flex-col gap-4">
            <div
              className="p-3.5 rounded-lg flex flex-col gap-2"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Event</span>
                <span className="badge badge-accent font-mono">{selectedLog.event}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>ID</span>
                <div className="flex items-center gap-1 font-mono" style={{ fontSize: '0.8rem' }}>
                  <span>{selectedLog.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedLog.id, 'drawer-id')}
                    className="btn btn-icon btn-outline"
                    style={{ padding: '0.15rem 0.3rem' }}
                  >
                    {copiedId === 'drawer-id' ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Payload Timestamp</span>
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {formatDateTime(selectedLog.timestamp)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Ingested At</span>
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {formatDateTime(selectedLog.received_at)}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="stat-label" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                  RAW JSON
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), 'json')}
                  className="btn btn-outline btn-sm flex items-center gap-1.5"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
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
        title="Webhook Configuration"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            Inbound webhooks dispatched from HaloMail are validated against HMAC signatures and saved to MongoDB.
          </p>

          <div
            className="p-3 rounded-lg flex items-center justify-between"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                ENDPOINT URL
              </div>
              <div className="font-mono text-secondary" style={{ fontSize: '0.85rem' }}>
                {API_BASE_URL}/halomail/webhook
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`${API_BASE_URL}/halomail/webhook`, 'url')}
              className="btn btn-outline btn-sm"
            >
              {copiedId === 'url' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            </button>
          </div>

          <div
            className="p-3 rounded-lg flex flex-col gap-1.5"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              HEADERS
            </div>
            <div className="font-mono text-secondary" style={{ fontSize: '0.8rem' }}>
              <div>X-HaloMail-Signature: &lt;hmac-sha256-hex&gt;</div>
              <div>Content-Type: application/json</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                SAMPLE PAYLOAD
              </span>
              <button
                type="button"
                onClick={() => handleCopy(samplePayload, 'sample')}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
              >
                {copiedId === 'sample' ? <Check size={11} className="text-success" /> : <Copy size={11} />} Copy
              </button>
            </div>
            <pre className="json-pretty-box" style={{ fontSize: '0.78rem' }}>
              {samplePayload}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
}
