/**
 * AetherGIS — SessionManager panel
 * Features:
 *   - Checkbox multi-select (click checkbox or Shift-click card for range)
 *   - Select All / Deselect All header toggle
 *   - Bulk delete with custom in-UI confirmation dialog
 *   - Single delete via card ✕ button (same dialog flow)
 *   - Inline rename on double-click or ✏ button
 *   - New Session with custom confirmation if active data exists
 */
import { useRef, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import type { PipelineResult } from '../store/useStore';

// ─── Custom confirmation dialog (consistent with app UI) ─────────────────────
interface ConfirmDialogProps {
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warn' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const variantColor = {
    danger: 'var(--red)',
    warn:   'var(--orange)',
    info:   'var(--blue)',
  }[variant];

  const variantBg = {
    danger: 'var(--red-bg)',
    warn:   'var(--orng-bg)',
    info:   'var(--blue-bg)',
  }[variant];

  const icon = {
    danger: '⚠',
    warn:   '⚠',
    info:   'ℹ',
  }[variant];

  return (
    <div className="cdlg-backdrop" onClick={onCancel}>
      <div className="cdlg-box" onClick={e => e.stopPropagation()}>
        <div className="cdlg-header" style={{ borderLeft: `3px solid ${variantColor}`, background: variantBg }}>
          <span className="cdlg-icon" style={{ color: variantColor }}>{icon}</span>
          <span className="cdlg-title">{title}</span>
        </div>
        <div className="cdlg-body">{message}</div>
        <div className="cdlg-footer">
          <button className="cdlg-btn cancel" onClick={onCancel}>{cancelLabel}</button>
          <button
            className="cdlg-btn confirm"
            style={{ background: variantColor, borderColor: variantColor }}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function frameCount(r: PipelineResult) {
  const obs = r.metrics?.observed_frames ?? r.frames.filter(f => !f.is_interpolated).length;
  const ai  = r.metrics?.interpolated_frames ?? r.frames.filter(f => f.is_interpolated).length;
  return `${obs} obs + ${ai} AI = ${r.frames.length} total`;
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({
  session,
  isActive,
  isSelected,
  onToggleSelect,
  onLoad,
  onDelete,
  onRename,
  onShiftClick,
}: {
  session: PipelineResult;
  isActive: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onLoad: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onShiftClick: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.session_name ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    setEditing(false);
  };

  const statusColor: Record<string, string> = {
    COMPLETED: 'var(--green)',
    FAILED:    'var(--red)',
    RUNNING:   'var(--blue)',
    QUEUED:    'var(--orange)',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (editing) return;
    if (e.shiftKey) { onShiftClick(); return; }
    // Click on card body loads session; checkbox handles selection only
    onLoad();
  };

  return (
    <div
      className={[
        'session-card',
        isActive    ? 'active'   : '',
        isSelected  ? 'selected' : '',
      ].filter(Boolean).join(' ')}
      onClick={handleCardClick}
      title={isActive ? 'Current session (click to reload)' : 'Click to load · Shift-click to range-select'}
    >
      {/* Checkbox column */}
      <div
        className="sc-check-col"
        onClick={e => { e.stopPropagation(); onToggleSelect(); }}
        title="Select session"
      >
        <div className={`sc-checkbox${isSelected ? ' checked' : ''}`}>
          {isSelected && <span className="sc-checkmark">✓</span>}
        </div>
      </div>

      {/* Card content */}
      <div className="sc-content">
        <div className="sc-header">
          {editing ? (
            <input
              ref={inputRef}
              className="sc-rename-input"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditing(false);
              }}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div
              className="sc-name"
              title="Double-click to rename"
              onDoubleClick={e => {
                e.stopPropagation();
                setEditing(true);
                setDraft(session.session_name ?? '');
              }}
            >
              {session.session_name ?? session.job_id.slice(0, 8)}
            </div>
          )}

          <div className="sc-actions">
            {!editing && (
              <button
                className="sc-btn rename"
                title="Rename session"
                onClick={e => {
                  e.stopPropagation();
                  setEditing(true);
                  setDraft(session.session_name ?? '');
                }}
              >✏</button>
            )}
            <button
              className="sc-btn delete"
              title="Delete session"
              onClick={e => { e.stopPropagation(); onDelete(); }}
            >✕</button>
          </div>
        </div>

        <div className="sc-meta">
          <span style={{ color: statusColor[session.status] ?? 'var(--t3)' }}>
            ● {session.status}
          </span>
          {' · '}
          <span style={{ color: 'var(--t3)' }}>{formatDate(session.time_start)}</span>
          {isActive && <span className="sc-active-badge">ACTIVE</span>}
        </div>

        {session.frames.length > 0 && (
          <div className="sc-frames">{frameCount(session)}</div>
        )}

        <div className="sc-layer">{session.layer_id.split('_').slice(0, 3).join(' ')}</div>

        {session.bbox && (
          <div className="sc-bbox">
            AOI: [{session.bbox.map(v => v.toFixed(1)).join(', ')}]
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main SessionManager ──────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

type DialogConfig = {
  title: string;
  message: string | React.ReactNode;
  confirmLabel: string;
  variant: 'danger' | 'warn' | 'info';
  onConfirm: () => void;
};

export default function SessionManager({ onClose }: Props) {
  const {
    jobHistory,
    pipelineResult,
    loadSession,
    deleteSession,
    renameSession,
    clearSession,
  } = useStore();

  // ─ Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<number | null>(null);

  // ─ Confirmation dialog state
  const [dialog, setDialog] = useState<DialogConfig | null>(null);

  const closeDialog = useCallback(() => setDialog(null), []);

  const showDialog = useCallback((cfg: DialogConfig) => setDialog(cfg), []);

  // ─ Selection helpers
  const allIds = jobHistory.map(j => j.job_id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const toggleSelect = (jobId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
    const idx = allIds.indexOf(jobId);
    lastClickedRef.current = idx;
  };

  const handleShiftClick = (jobId: string) => {
    const idx = allIds.indexOf(jobId);
    const anchor = lastClickedRef.current ?? idx;
    const lo = Math.min(anchor, idx);
    const hi = Math.max(anchor, idx);
    setSelected(prev => {
      const next = new Set(prev);
      for (let i = lo; i <= hi; i++) next.add(allIds[i]);
      return next;
    });
    lastClickedRef.current = idx;
  };

  // ─ New session
  const handleNew = () => {
    if (!pipelineResult) {
      clearSession();
      onClose();
      return;
    }
    showDialog({
      title: 'New Session',
      message: 'Start a new empty session? Your current session will remain in history and can be reloaded.',
      confirmLabel: 'New Session',
      variant: 'info',
      onConfirm: () => { closeDialog(); clearSession(); onClose(); },
    });
  };

  // ─ Single delete
  const handleSingleDelete = (session: PipelineResult) => {
    showDialog({
      title: 'Delete Session',
      message: (
        <>
          Delete <strong>"{session.session_name ?? session.job_id.slice(0, 8)}"</strong>?
          <br />
          <span style={{ color: 'var(--t4)', fontSize: 10 }}>
            {session.frames.length > 0
              ? `${session.frames.length} frames · ${formatDate(session.time_start)}`
              : 'No frames loaded'}
          </span>
          <br />
          This cannot be undone.
        </>
      ),
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        deleteSession(session.job_id);
        setSelected(prev => { const n = new Set(prev); n.delete(session.job_id); return n; });
        closeDialog();
      },
    });
  };

  // ─ Bulk delete
  const handleBulkDelete = () => {
    const count = selected.size;
    const hasActive = selected.has(pipelineResult?.job_id ?? '');
    showDialog({
      title: `Delete ${count} Session${count !== 1 ? 's' : ''}`,
      message: (
        <>
          Permanently delete <strong>{count} selected session{count !== 1 ? 's' : ''}</strong>?
          {hasActive && (
            <div style={{
              marginTop: 8, padding: '6px 8px',
              background: 'var(--orng-bg)', border: '1px solid var(--orng-lt)',
              color: 'var(--orange)', fontSize: 10, fontFamily: 'var(--mono)',
            }}>
              ⚠ The currently active session is included in this selection.
            </div>
          )}
          <br />
          <span style={{ color: 'var(--t4)', fontSize: 10 }}>This cannot be undone.</span>
        </>
      ),
      confirmLabel: `Delete ${count}`,
      variant: 'danger',
      onConfirm: () => {
        selected.forEach(id => deleteSession(id));
        setSelected(new Set());
        closeDialog();
      },
    });
  };

  return (
    <>
      <div className="sm-overlay" onClick={onClose}>
        <div className="sm-panel" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="sm-header">
            <div className="sm-title">Session Manager</div>
            <div className="sm-subtitle">One AOI per session · Up to 20 sessions stored locally</div>
            <button className="sm-close" onClick={onClose} title="Close">✕</button>
          </div>

          {/* Action bar */}
          <div className="sm-actions">
            <button className="btn btn-primary" onClick={handleNew}>
              + New Session
            </button>

            {/* Bulk delete — only shows when something is selected */}
            {selected.size > 0 && (
              <button className="btn sm-bulk-delete-btn" onClick={handleBulkDelete}>
                🗑 Delete {selected.size}
              </button>
            )}

            <span style={{ flex: 1 }} />

            <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
              {jobHistory.length} / 20
            </span>
          </div>

          {/* Selection toolbar — only when items exist */}
          {jobHistory.length > 0 && (
            <div className="sm-sel-bar">
              {/* Select-all checkbox */}
              <div
                className={`sc-checkbox sm-sel-all${allSelected ? ' checked' : someSelected ? ' indeterminate' : ''}`}
                onClick={toggleSelectAll}
                title={allSelected ? 'Deselect all' : 'Select all'}
              >
                {allSelected && <span className="sc-checkmark">✓</span>}
                {someSelected && !allSelected && <span className="sc-checkmark" style={{ opacity: 0.5 }}>−</span>}
              </div>

              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>
                {selected.size === 0
                  ? `${jobHistory.length} session${jobHistory.length !== 1 ? 's' : ''}`
                  : `${selected.size} of ${jobHistory.length} selected`}
              </span>

              {selected.size > 0 && (
                <button
                  className="sm-clear-sel"
                  onClick={() => setSelected(new Set())}
                  title="Clear selection"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Session cards */}
          <div className="sm-list">
            {jobHistory.length === 0 ? (
              <div className="sm-empty">
                No saved sessions yet. Run a pipeline to create your first session.
              </div>
            ) : (
              jobHistory.map((session, idx) => (
                <SessionCard
                  key={session.job_id}
                  session={session}
                  isActive={session.job_id === pipelineResult?.job_id}
                  isSelected={selected.has(session.job_id)}
                  onToggleSelect={() => {
                    toggleSelect(session.job_id);
                    lastClickedRef.current = idx;
                  }}
                  onShiftClick={() => handleShiftClick(session.job_id)}
                  onLoad={() => { loadSession(session); onClose(); }}
                  onDelete={() => handleSingleDelete(session)}
                  onRename={name => renameSession(session.job_id, name)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="sm-footer">
            Click to load · Checkbox or Shift-click to multi-select · Double-click name to rename
          </div>
        </div>
      </div>

      {/* Custom confirmation dialog */}
      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          variant={dialog.variant}
          onConfirm={dialog.onConfirm}
          onCancel={closeDialog}
        />
      )}
    </>
  );
}
