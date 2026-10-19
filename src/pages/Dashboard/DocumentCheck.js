import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {FaArrowLeft,FaShieldAlt,FaUpload,FaSearch,FaTrash,FaCheckCircle,FaExclamationTriangle,FaEye,FaEyeSlash,FaFileAlt,FaDownload,FaTimes} from 'react-icons/fa';
import {usePermissions} from '../../auth/PermissionContext';
import {useTheme} from '../../auth/ThemeContext';
import {DOCUMENT_TYPES,validateDocumentFile,reviewDocumentText,crossDocumentFindings} from '../../features/documentCheck/documentReview';
import {createLocalOcrSession} from '../../features/documentCheck/localOcr';
import './DocumentCheck.css';
const blankFiles=()=>Object.fromEntries(DOCUMENT_TYPES.map(type=>[type.id,[]]));
export default function DocumentCheck(){
 const permissions=usePermissions(),dark=useTheme()?.darkMode;
 const route=(permissions?.getResource('recruiting')?.route||'/dashboard/recruiting').replace(/\/+$/,'');
 const [files,setFiles]=useState(blankFiles),[name,setName]=useState(''),[dob,setDob]=useState(''),[h1b,setH1b]=useState(true);
 const [results,setResults]=useState([]),[selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState(null),[error,setError]=useState(''),[reveal,setReveal]=useState(false),[reviewed,setReviewed]=useState({});
 const [mobilePanel,setMobilePanel]=useState('setup');
 const pageRef=useRef(null);
 useEffect(()=>{
  const update=()=>{if(pageRef.current)pageRef.current.style.setProperty('--dc-height',Math.max(320,window.innerHeight-pageRef.current.getBoundingClientRect().top-12)+'px');};
  update();window.addEventListener('resize',update);const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(update):null;if(pageRef.current?.parentElement)observer?.observe(pageRef.current.parentElement);
  return()=>{window.removeEventListener('resize',update);observer?.disconnect();};
 },[]);
 const mounted=useRef(true),controller=useRef(null),urls=useRef(new Set()),selection=useRef(0);
 useEffect(()=>{mounted.current=true;const resources=urls.current;return()=>{mounted.current=false;controller.current?.abort();resources.forEach(url=>URL.revokeObjectURL(url));resources.clear();};},[]);
 function clearResults(){urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current.clear();setResults([]);setSelected('');setReviewed({});setReveal(false);setError('');setProgress(null);}
 async function addFiles(type,list){
  if(busy||!list?.length)return;
  const token=++selection.current;
  try{
   if(!window.isSecureContext||!crypto.subtle)throw Error('Open E2E over HTTPS or localhost to use private document checks.');
   const chosen=Array.from(list);
   if(files[type].length+chosen.length>2)throw Error('Choose at most two files per document type. Combine additional pages into a PDF.');
   const all=Object.values(files).flat();if([...all,...chosen].reduce((sum,item)=>sum+(item.file||item).size,0)>32*1024*1024)throw Error('The total review package must be 32 MB or smaller.');
   for(const file of chosen)await validateDocumentFile(file);
   if(!mounted.current||token!==selection.current)return;
   clearResults();setFiles(current=>({...current,[type]:[...current[type],...chosen.map(file=>({id:crypto.randomUUID(),file,type}))]}));
  }catch(failure){if(mounted.current&&token===selection.current)setError(failure.message);}
 }
 function reset(){selection.current++;controller.current?.abort();clearResults();setFiles(blankFiles());setName('');setDob('');}
 async function analyze(){
  if(busy)return;const uploads=Object.values(files).flat();if(!uploads.length)return;
  selection.current++;clearResults();setBusy(true);const abort=new AbortController();controller.current=abort;
  const timer=setTimeout(()=>abort.abort(),240000);
  const session=createLocalOcrSession(value=>{if(mounted.current)setProgress(value);},abort.signal),next=[];
  try{
   for(let index=0;index<uploads.length;index++){
    if(abort.signal.aborted)throw new DOMException('Cancelled','AbortError');
    const item=uploads[index],label=DOCUMENT_TYPES.find(type=>type.id===item.type).label+' ('+(index+1)+'/'+uploads.length+')';
    try{
     const read=await session.read(item.file,label,item.type);
     if(!mounted.current||abort.signal.aborted)throw new DOMException('Cancelled','AbortError');
     const review=reviewDocumentText(read.text,item.type,{name,dob},read);
     const previewUrl=read.preview?URL.createObjectURL(read.preview):null;if(previewUrl)urls.current.add(previewUrl);
     next.push({...review,id:item.id,type:item.type,fileName:item.file.name,text:read.text,pages:read.pages,confidence:read.confidence,fingerprint:read.fingerprint,previewUrl});
    }catch(failure){if(abort.signal.aborted||failure.name==='AbortError')throw failure;next.push({id:item.id,type:item.type,fileName:item.file.name,fields:[],findings:[{level:'review',title:'File could not be processed',detail:'The file may be protected, damaged, too large or unavailable to the local OCR engine. Try a clear, unprotected PDF or image.'}],status:'Needs review',failed:true});}
   }
   if(mounted.current){setResults(next);setSelected(next[0]?.id||'');setMobilePanel('workspace');}
  }catch(failure){if(mounted.current){clearResults();setError(failure.name==='AbortError'?'Review cancelled or time limit reached. No partial result was saved. Try fewer pages.':'Review could not finish. Please try again.');}}
  finally{clearTimeout(timer);await session.close();if(mounted.current){setBusy(false);setProgress(null);}}
 }
 const active=results.find(item=>item.id===selected),cross=crossDocumentFindings(results);
 const count=Object.values(files).flat().length,issues=results.reduce((sum,item)=>sum+item.findings.filter(issue=>issue.level==='review').length,0)+cross.length;
 const visibleTypes=DOCUMENT_TYPES.filter(type=>h1b||type.id==='dl');
 function download(){
  const report={createdAt:new Date().toISOString(),scope:'Local readability and consistency checks only; authenticity and identity are unverified.',documents:results.map(item=>({type:item.type,status:item.status,pages:item.pages||0,ocrTextConfidence:item.confidence??null,reviewed:!!reviewed[item.id],findings:item.findings})),crossDocumentFindings:cross.map(({title,detail})=>({title,detail}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='document-review-summary.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <main ref={pageRef} data-panel={mobilePanel} className={'doc-check'+(dark?' dc-dark':'')}>
 <header className="dc-hero"><div><Link to={route} className="dc-back"><FaArrowLeft/> Recruiting</Link><h1><span><FaShieldAlt/></span> Document Check</h1><p>Read clearly. Compare details. Review with confidence.</p></div><div className="dc-local"><FaShieldAlt/><div><strong>Local processing</strong><small>Documents stay in this browser tab</small></div></div></header>
 <div className="dc-boundary"><FaExclamationTriangle/><p><strong>Document review, not an authenticity verdict.</strong> OCR can misread text. These checks do not prove a document is genuine, detect every alteration, or determine work eligibility. Compare originals and issuer records before making decisions.</p></div>
 <nav className="dc-mobile-panels" aria-label="Document review panels"><button aria-pressed={mobilePanel==='setup'} onClick={()=>setMobilePanel('setup')}>1. Reference & uploads</button><button aria-pressed={mobilePanel==='workspace'} onClick={()=>setMobilePanel('workspace')}>2. Review workspace {count?`(${count})`:''}</button></nav>
 <div className="dc-layout"><aside className="dc-setup">
 <section className="dc-card"><div className="dc-heading"><span>01</span><h2>Candidate reference</h2></div><p>Optional reference values help compare recognised text.</p><label htmlFor="dc-name">Candidate full name<input id="dc-name" autoComplete="off" value={name} disabled={busy} onChange={event=>{clearResults();setName(event.target.value);}} placeholder="Name as shown on the document"/></label><label htmlFor="dc-dob">Date of birth<input id="dc-dob" type="date" value={dob} disabled={busy} onChange={event=>{clearResults();setDob(event.target.value);}}/></label>
 <label className="dc-switch"><input type="checkbox" checked={h1b} disabled={busy} onChange={event=>{selection.current++;clearResults();setH1b(event.target.checked);setFiles(current=>({...blankFiles(),dl:current.dl}));}}/> Include H-1B document categories</label><small>This organises the review package; it does not prescribe documents a candidate must provide.</small></section>
 <section className="dc-card"><div className="dc-heading"><span>02</span><h2>Review package</h2></div><p>PDF, JPG or PNG | 8 MB per file | 5 PDF pages | 2 files per type</p>
 {visibleTypes.map(type=><div className="dc-upload-card" key={type.id}><label className={'dc-drop'+(busy?' dc-disabled':'')} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();addFiles(type.id,event.dataTransfer.files);}}><FaUpload/><span><strong>{type.label}</strong><small>{type.hint}</small></span><input aria-label={'Upload '+type.label} type="file" multiple accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={event=>{addFiles(type.id,event.target.files);event.target.value='';}}/></label>{files[type.id].map(item=><div className="dc-file" key={item.id}><span>{item.file.name}</span><button type="button" disabled={busy} aria-label={'Remove '+item.file.name} onClick={()=>{selection.current++;clearResults();setFiles(current=>({...current,[type.id]:current[type.id].filter(file=>file.id!==item.id)}));}}><FaTimes/></button></div>)}</div>)}
 <small>Upload only the documents available for this review. Missing uploads are not classified as fake.</small></section>
 </aside><section className="dc-workspace">
 <div className="dc-toolbar"><div><small>REVIEW WORKSPACE</small><h2>{count} file{count===1?'':'s'} selected</h2></div><div><button className="dc-button secondary" disabled={busy||(!count&&!name&&!dob&&!results.length)} onClick={reset}><FaTrash/> Clear session</button><button className="dc-button" disabled={busy||!count} onClick={analyze}><FaSearch/>{busy?'Reviewing...':'Run document checks'}</button></div></div>
 {error&&<div className="dc-error" role="alert">{error}</div>}
 {busy&&<section className="dc-card dc-progress" role="status"><FaSearch/><div><h3>{progress?.label||'Preparing local review'}</h3><p>{progress?.status||'Starting document checks...'}</p><progress aria-label="Current processing step" max="1" value={progress?.progress||0}/><small>English OCR runs locally. Large scans may take longer.</small></div><button className="dc-button secondary" onClick={()=>controller.current?.abort()}>Cancel</button></section>}
 {!results.length&&!busy&&<section className="dc-empty"><span><FaFileAlt/></span><h2>A clearer document review</h2><p>Add a document on the left, then run checks. Review extracted fields, readability flags and cross-document differences in one place.</p><div><span><FaCheckCircle/> File checks</span><span><FaSearch/> English OCR</span><span><FaShieldAlt/> No external uploads</span></div></section>}
 {!!results.length&&<><div className="dc-stats"><div><small>Documents processed</small><strong>{results.filter(item=>!item.failed).length}/{results.length}</strong></div><div><small>Review flags</small><strong>{issues}</strong></div><div><small>Marked reviewed</small><strong>{Object.values(reviewed).filter(Boolean).length}/{results.length}</strong></div><button className="dc-button secondary" onClick={download}><FaDownload/> Download summary</button></div>
 {!!cross.length&&<section className="dc-card dc-cross"><h3>Cross-document checks</h3>{cross.map((item,index)=><p key={index}><FaExclamationTriangle/> <strong>{item.title}:</strong> {item.detail}</p>)}</section>}
 <div className="dc-result-tabs" role="tablist" aria-label="Reviewed documents">{results.map((item,index)=><button key={item.id} role="tab" aria-selected={selected===item.id} onClick={()=>{setSelected(item.id);setReveal(false);}}>{DOCUMENT_TYPES.find(type=>type.id===item.type)?.label} {index+1}<small>{item.status}</small></button>)}</div>
 {active&&<section className="dc-card dc-result"><div className="dc-result-heading"><div><small>{active.fileName}</small><h2>{active.status}</h2><p>Authenticity: not verified</p></div><span className="dc-status">{active.confidence!==null&&active.confidence!==undefined?'OCR text confidence '+active.confidence+'%':active.failed?'Processing incomplete':'Embedded PDF text'}</span></div>
 <div className="dc-detail-grid"><div>{active.previewUrl?(reveal?<img className="dc-preview" src={active.previewUrl} alt="First-page document preview"/>:<div className="dc-preview-empty"><FaShieldAlt/><p>Document preview contains personal information.</p><button className="dc-button secondary" onClick={()=>setReveal(true)}><FaEye/> Show document preview</button></div>):<div className="dc-preview-empty">Preview unavailable</div>}<small>Preview is the first page only. Review every original page.</small></div><div><div className="dc-fields-heading"><h3>Recognised fields</h3><button className="dc-text-button" onClick={()=>setReveal(!reveal)}>{reveal?<FaEyeSlash/>:<FaEye/>}{reveal?'Hide sensitive values':'Show sensitive values'}</button></div>{active.fields.length?<dl className="dc-fields">{active.fields.map(field=><div key={field.key}><dt>{field.label}</dt><dd>{field.sensitive&&!reveal?'XXXXXXXX':field.value}</dd></div>)}</dl>:<p>No structured fields were recognised. Inspect the original document.</p>}
 {active.nameMethod&&<small>Name source: {active.nameMethod}. Confirm against the visible document.</small>}
 <h3>Checks and findings</h3><ul className="dc-findings">{active.findings.map((finding,index)=><li className={finding.level} key={index}>{finding.level==='review'?<FaExclamationTriangle/>:<FaCheckCircle/>}<div><strong>{finding.title}</strong><p>{finding.detail}</p></div></li>)}</ul>
 <label className="dc-switch"><input type="checkbox" checked={!!reviewed[active.id]} onChange={event=>setReviewed(current=>({...current,[active.id]:event.target.checked}))}/> I have reviewed this document</label><small>This session marker does not certify authenticity.</small></div></div>
 {active.text&&<details className="dc-extracted"><summary>View extracted text (contains sensitive information)</summary><pre>{active.text}</pre></details>}
 </section>}</>}
 <footer className="dc-footer">Files, recognised text and review marks are held only for this tab session. Clear the session when finished. The downloaded summary excludes document images, filenames and recognised personal values. <a href="https://i94.cbp.dhs.gov/" target="_blank" rel="noopener noreferrer">Open official CBP I-94 website</a></footer>
 </section></div></main>;
}
