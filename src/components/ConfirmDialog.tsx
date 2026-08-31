interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Abbrechen",
  danger,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div
        className="dialog-box confirm-dialog card"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        <p className="subtitle">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
