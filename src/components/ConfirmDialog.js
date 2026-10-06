import {useEffect,useId,useRef} from "react";
import {createPortal} from "react-dom";
import {FaExclamationTriangle,FaCheckCircle} from "react-icons/fa";

function ConfirmDialog({open,title,message,confirmLabel="Confirm",danger=true,busy=false,onCancel,onConfirm,children}){
 const titleId=useId(),dialog=useRef(null),cancel=useRef(null);
 useEffect(()=>{if(!open)return;const previous=document.activeElement;cancel.current?.focus({preventScroll:true});return()=>{if(previous?.isConnected)previous.focus({preventScroll:true});};},[open]);
 if(!open)return null;
 const keyDown=event=>{if(event.key==="Escape"&&!busy){event.preventDefault();onCancel?.();}if(event.key==="Tab"){const controls=[...dialog.current.querySelectorAll("button:not(:disabled),input:not(:disabled),[tabindex='0']")];if(!controls.length){event.preventDefault();return;}const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};
 return createPortal(<div className="e2e_alias_overlay e2e_confirmation_overlay" onMouseDown={busy?undefined:onCancel} onKeyDown={keyDown}>
 <section ref={dialog} className={`e2e_remove_dialog e2e_confirmation_dialog ${danger?"is-danger":"is-positive"}`} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} onMouseDown={event=>event.stopPropagation()}>
 <div className="confirmation-symbol">{danger?<FaExclamationTriangle/>:<FaCheckCircle/>}</div><h2 id={titleId}>{title}</h2><p>{message}</p>{children}
 <footer><button ref={cancel} type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancel</button><button type="button" className={danger?"danger":"primary"} disabled={busy} onClick={onConfirm}>{busy?"Saving...":confirmLabel}</button></footer>
 </section></div>,document.body);
}
export default ConfirmDialog;
