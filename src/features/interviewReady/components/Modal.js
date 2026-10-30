import { useEffect,useRef,useId } from 'react';
import { X } from 'lucide-react';
export function Modal({ open, title, onClose, children, footer, maxWidth = 'max-w-lg' }) {
    const dialogRef=useRef(null),titleId=useId();
    useEffect(() => {
        if (!open)
            return;
        const previous=document.activeElement,overflow=document.body.style.overflow;
        const first=()=>dialogRef.current?.querySelector('button,input,textarea,a[href],[tabindex="0"]');
        first()?.focus();
        const onKey = (e) => {
            if(e.key==='Tab'){const items=Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')||[]);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
            if (e.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;previous?.focus();
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onClose}>
      <div ref={dialogRef} className={`card w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-slide-up`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-navy-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="btn-ghost rounded-lg p-1.5" aria-label="Close dialog">
            <X className="h-5 w-5"/>
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && <div className="border-t border-navy-100 px-5 py-4 bg-navy-50/50 rounded-b-xl">{footer}</div>}
      </div>
    </div>);
}
export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel, }) {
    return (<Modal open={open} title={title} onClose={onCancel} maxWidth="max-w-md" footer={<div className="flex justify-end gap-3">
          <button type="button" className="btn-outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={danger ? 'btn-danger' : 'btn-teal'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>}>
      <p className="text-sm text-navy-700 leading-relaxed">{message}</p>
    </Modal>);
}
