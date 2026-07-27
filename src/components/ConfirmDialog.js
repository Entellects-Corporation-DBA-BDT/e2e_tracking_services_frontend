import { FaExclamationTriangle } from "react-icons/fa";

function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = true, busy = false, onCancel, onConfirm }) {
  if (!open) return null;
  return <div className="e2e_alias_overlay" onMouseDown={busy ? undefined : onCancel}>
    <section className="e2e_remove_dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onMouseDown={event=>event.stopPropagation()}>
      <div><FaExclamationTriangle /></div>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p>{message}</p>
      <footer><button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancel</button>
        <button type="button" className={danger ? "danger" : "primary"} disabled={busy} onClick={onConfirm}>{busy ? "Please wait..." : confirmLabel}</button></footer>
    </section>
  </div>;
}
export default ConfirmDialog;
