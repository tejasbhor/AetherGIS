/**
 * AetherGIS — Hierarchical Session Manager
 * Structure: Session (Parent) -> Runs (Children)
 */
import { useRef, useState, useMemo, useCallback } from 'react';
import { useStore } from '@app/store/useStore';
import type { PipelineResult } from '@app/store/useStore';

// ─── Custom confirmation dialog ──────────────────────────────────────────────
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

// ─── Run Item (Child) ─────────────────────────────────────────────────────────
function RunItem({
  run,
  isActive,
  onLoad,
  onDelete,
}: {
  run: PipelineResult;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const statusColor: Record<string, string> = {
    COMPLETED: 'var(--green)',
    FAILED:    'var(--red)',
    RUNNING:   'var(--blue)',
    QUEUED:    'var(--orange)',
  };

  return (
    <div 
      className={`run-item ${isActive ? 'active' : ''}`}
      onClick={onLoad}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderBottom: '1px solid var(--b3)',
        cursor: 'pointer',
        fontSize: '10px',
        fontFamily: 'var(--mono)',
        background: isActive ? 'var(--blue-light-bg)' : 'transparent',
        transition: 'background 0.1s'
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[run.status] ?? 'var(--t4)', flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? 'var(--blue)' : 'var(--t2)', fontWeight: isActive ? 600 : 400 }}>
        {run.layer_id.split('_').slice(0, 2).join(' ')} · {run.frames.length}F
      </div>
      <div style={{ color: 'var(--t4)', fontSize: '8px' }}>
        {run.job_id.slice(0, 6)}
      </div>
      <button 
        className="run-delete-btn"
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--t4)',
          cursor: 'pointer',
          padding: '0 4px',
          fontSize: '12px'
        }}
        title="Delete run"
      >✕</button>
    </div>
  );
}

// ─── Session Group (Parent) ──────────────────────────────────────────────────
function SessionGroup({
  name,
  runs,
  activeRunId,
  onLoadRun,
  onDeleteRun,
  onDeleteSession,
  onRenameSession,
}: {
  name: string;
  runs: PipelineResult[];
  activeRunId?: string;
  onLoadRun: (run: PipelineResult) => void;
  onDeleteRun: (run: PipelineResult) => void;
  onDeleteSession: () => void;
  onRenameSession: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [expanded, setExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRenameSession(trimmed);
    setEditing(false);
  };

  const latestRunDate = runs.length > 0 
    ? formatDate(runs[0].time_start) 
    : 'Unknown';

  return (
    <div className="session-group" style={{ 
      border: '1px solid var(--b2)', 
      background: 'var(--panel)', 
      marginBottom: 8,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      {/* Session Header */}
      <div className="sg-header" style={{ 
        padding: '8px 12px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        background: 'var(--bg)',
        borderBottom: expanded ? '1px solid var(--b2)' : 'none',
        cursor: 'pointer'
      }} onClick={() => setExpanded(!expanded)}>
        
        <div style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', fontSize: '10px', color: 'var(--t4)' }}>▶</div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
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
              style={{ fontSize: '13px', fontWeight: 700 }}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
            >
              {name}
            </div>
          )}
          <div style={{ fontSize: '9px', color: 'var(--t4)', fontFamily: 'var(--mono)', marginTop: 2 }}>
            {latestRunDate} · {runs.length} RUNS
          </div>
        </div>

        <div className="sg-actions" style={{ display: 'flex', gap: 4 }}>
          {!editing && (
            <button 
              className="sc-btn rename" 
              onClick={e => { e.stopPropagation(); setEditing(true); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t4)' }}
            >✏</button>
          )}
          <button 
            className="sc-btn delete" 
            onClick={e => { e.stopPropagation(); onDeleteSession(); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t4)' }}
          >🗑</button>
        </div>
      </div>

      {/* Runs List */}
      {expanded && (
        <div className="sg-runs">
          {runs.map(run => (
            <RunItem
              key={run.job_id}
              run={run}
              isActive={run.job_id === activeRunId}
              onLoad={() => onLoadRun(run)}
              onDelete={() => onDeleteRun(run)}
            />
          ))}
          {runs.length === 0 && (
            <div style={{ padding: '12px', fontSize: '10px', color: 'var(--t4)', fontStyle: 'italic', textAlign: 'center' }}>
              No runs in this session.
            </div>
          )}
        </div>
      )}
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
    deleteRun,
    deleteSession,
    renameSession,
    clearSession,
  } = useStore();

  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const closeDialog = useCallback(() => setDialog(null), []);
  const showDialog = useCallback((cfg: DialogConfig) => setDialog(cfg), []);

  // Group runs by session_id
  const groupedSessions = useMemo(() => {
    const map = new Map<string, { id: string, name: string, runs: PipelineResult[] }>();
    
    jobHistory.forEach(run => {
      const sid = run.session_id || 'unassigned';
      if (!map.has(sid)) {
        map.set(sid, { id: sid, name: run.session_name || 'Unnamed Session', runs: [] });
      }
      map.get(sid)!.runs.push(run);
    });

    return Array.from(map.values());
  }, [jobHistory]);

  const handleNew = () => {
    if (!pipelineResult) {
      clearSession();
      onClose();
      return;
    }
    showDialog({
      title: 'New Session',
      message: 'Start a new empty session? Your current runs will remain in history.',
      confirmLabel: 'New Session',
      variant: 'info',
      onConfirm: () => { closeDialog(); clearSession(); onClose(); },
    });
  };

  const handleRunDelete = (run: PipelineResult) => {
    showDialog({
      title: 'Delete Run',
      message: (
        <>
          Delete run <strong>{run.job_id.slice(0, 8)}</strong> from <strong>"{run.session_name}"</strong>?
          <br />
          <span style={{ color: 'var(--t4)', fontSize: 10 }}>{frameCount(run)}</span>
        </>
      ),
      confirmLabel: 'Delete Run',
      variant: 'danger',
      onConfirm: () => {
        deleteRun(run.job_id);
        closeDialog();
      },
    });
  };

  const handleSessionDelete = (id: string, name: string) => {
    showDialog({
      title: 'Archive Session',
      message: (
        <>
          Permanently archive session <strong>"{name}"</strong> and all its associated runs?
          <br />
          <span style={{ color: 'var(--red)', fontSize: 10, fontWeight: 600 }}>This cannot be undone.</span>
        </>
      ),
      confirmLabel: 'Archive All',
      variant: 'danger',
      onConfirm: () => {
        deleteSession(id);
        closeDialog();
      },
    });
  };

  return (
    <>
      <div className="sm-overlay" onClick={onClose}>
        <div className="sm-panel" onClick={e => e.stopPropagation()}>

          <div className="sm-header">
            <div className="sm-title">Session Manager</div>
            <div className="sm-subtitle">Hierarchical project management · {groupedSessions.length} Sessions</div>
            <button className="sm-close" onClick={onClose}>✕</button>
          </div>

          <div className="sm-actions">
            <button className="btn-primary" onClick={handleNew}>+ New Session</button>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
              {jobHistory.length} Total Runs
            </span>
          </div>

          <div className="sm-list">
            {groupedSessions.length === 0 ? (
              <div className="sm-empty">No active sessions. Start a run to begin.</div>
            ) : (
              groupedSessions.map(sg => (
                <SessionGroup
                  key={sg.id}
                  name={sg.name}
                  runs={sg.runs}
                  activeRunId={pipelineResult?.job_id}
                  onLoadRun={(run) => { loadSession(run); onClose(); }}
                  onDeleteRun={handleRunDelete}
                  onDeleteSession={() => handleSessionDelete(sg.id, sg.name)}
                  onRenameSession={(name) => renameSession(sg.id, name)}
                />
              ))
            )}
          </div>

          <div className="sm-footer">
            Sessions group multiple satellite runs. Double-click a session name to rename.
          </div>
        </div>
      </div>

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
