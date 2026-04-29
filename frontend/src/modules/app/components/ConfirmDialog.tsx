import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  title: string;
  message: string;
  details?: string[];
  warning?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  details,
  warning,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false
}: ConfirmDialogProps) {
  // Render via a React Portal directly on document.body.
  // This escapes any ancestor stacking context (modals, panels, overlays)
  // so the dialog is always rendered above everything on the page.
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,             // above everything — portals still respect z-index
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 500,
          width: '90vw',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          borderTop: danger ? '3px solid var(--red)' : '3px solid var(--blue)',
          background: 'var(--b1)',
          border: '1px solid var(--b3)',
          borderRadius: 8,
          padding: '20px 24px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="modal-title"
          id="confirm-dialog-title"
          style={{ paddingBottom: 0, borderBottom: 'none', fontSize: 18, color: 'var(--t1)', fontWeight: 600 }}
        >
          {title}
        </div>

        <div className="modal-body" style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--t2)', paddingBottom: 0 }}>
          <p style={{ margin: 0 }}>{message}</p>

          {details && details.length > 0 && (
            <div style={{ background: 'var(--b2)', border: '1px solid var(--b3)', padding: '10px 12px', marginTop: 12, borderRadius: 4 }}>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--t3)', fontFamily: 'var(--mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {details.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}

          {warning && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-lt)', color: 'var(--red)', padding: '8px 10px', marginTop: 12, borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }}>
              <strong>WARNING:</strong> {warning}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            className="btn-secondary"
            onClick={onCancel}
            style={{ padding: '6px 14px', borderRadius: 4, cursor: 'pointer', background: 'transparent', border: '1px solid var(--t4)', color: 'var(--t2)', fontFamily: 'var(--cond)', fontSize: 13, fontWeight: 600 }}
          >
            {cancelLabel}
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            autoFocus
            style={{ padding: '6px 14px', borderRadius: 4, cursor: 'pointer', background: danger ? 'var(--red)' : 'var(--blue)', border: 'none', color: '#fff', fontFamily: 'var(--cond)', fontSize: 13, fontWeight: 600 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
