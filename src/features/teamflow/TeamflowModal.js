import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {useTheme} from '../../auth/ThemeContext';
import {FaTimes} from 'react-icons/fa';
export default function TeamflowModal({title,children,onClose,busy=false}){
 const ref=useRef(null),theme=useTheme();
 useEffect(()=>{const overflow=document.body.style.overflow,previous=document.activeElement;document.body.style.overflow='hidden';ref.current?.querySelector('button')?.focus();return()=>{document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};},[]);
 return createPortal(<div className="teamflow-modal-overlay"><section ref={ref} className={'teamflow-modal'+(theme?.darkMode?' tf-dark':'')} role="dialog" aria-modal="true" aria-label={title} onKeyDown={event=>{
 if(event.key==='Escape'&&!busy)onClose();
 if(event.key==='Tab'){const nodes=[...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)')],first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 }}><header><h2>{title}</h2><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose}><FaTimes/></button></header><div className="teamflow-modal-body">{children}</div></section></div>,document.body);
}
