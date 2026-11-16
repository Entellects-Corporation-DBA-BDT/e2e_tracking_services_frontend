import {useEffect,useState} from 'react';
import {useLocation,useNavigate,useParams} from 'react-router-dom';
import {FaArrowLeft,FaExternalLinkAlt} from 'react-icons/fa';
import {useTheme} from '../../auth/ThemeContext';
import IssueDetails from './IssueDetails';
import {TEAMFLOW_CONFIG} from './config';
import {teamflowApi,teamflowMessage} from './api';
import './teamflow.css';
import './workspace-collections.css';
import './workplace.css';
import './issue-view.css';

export default function TeamflowIssueView(){
 const {issueId}=useParams(),navigate=useNavigate(),location=useLocation(),theme=useTheme();
 const [issue,setIssue]=useState(null),[options,setOptions]=useState({projects:[],users:[]}),[error,setError]=useState(''),[message,setMessage]=useState(''),[editor,setEditor]=useState(null),[attachment,setAttachment]=useState(null),[busy,setBusy]=useState(false),[version,setVersion]=useState(0);
 useEffect(()=>{let active=true;setIssue(null);setEditor(null);setError('');setMessage('');
 Promise.all([teamflowApi.detail('issues',issueId),teamflowApi.options('teamflow_issues').catch(()=>({data:{projects:[],users:[]}}))]).then(([result,choices])=>{if(active){setIssue(result.data);setOptions(choices.data);}}).catch(e=>active&&setError(teamflowMessage(e)));
 return()=>{active=false;};},[issueId,version]);
 const permission=issue?.permissions||{},canEdit=Boolean(permission.can_edit),canUpload=Boolean(permission.can_upload);
 const refresh=async()=>{try{setIssue((await teamflowApi.detail('issues',issueId)).data);}catch(e){setError(teamflowMessage(e));}};
 const save=async event=>{event.preventDefault();setBusy(true);setError('');try{await teamflowApi.save('issues',issueId,editor,attachment);await refresh();setEditor(null);setMessage('Issue updated.');}catch(e){setError(teamflowMessage(e));}finally{setBusy(false);}};
 const back=()=>navigate(location.state?.projectId?`/dashboard/teamflow/projects/${location.state.projectId}`:'/dashboard/teamflow/issues');
 return <main className={'teamflow-page tf-issue-view'+(theme?.darkMode?' tf-dark':'')}>
  <header className="tf-page-header"><div><button type="button" className="tf-secondary" onClick={back}><FaArrowLeft/>{location.state?.projectId?'Back to project':'All issues'}</button><p className="tf-detail-eyebrow">TEAMFLOW · ISSUE WORKSPACE</p><h1>Issue #{issueId}</h1><p>Description, ownership, files and team conversation in one place.</p></div>{issue?.project&&<button type="button" className="tf-secondary" onClick={()=>navigate(`/dashboard/teamflow/projects/${issue.project}`)}><FaExternalLinkAlt/>Open project</button>}</header>
  {error&&<div role="alert" className="tf-error">{error}{!issue&&<button type="button" onClick={()=>setVersion(n=>n+1)}>Try again</button>}</div>}{message&&<p role="status" className="tf-success">{message}</p>}
  {!issue&&!error&&<section className="tf-issue-page-loading" role="status">Loading issue workspace…</section>}
  {issue&&(editor?<section className="tf-issue-page-card"><h2>Edit issue #{issue.id}</h2><p className="tf-muted">Keep the summary clear and add the details your team needs.</p><form onSubmit={save}><div className="tf-form-grid">{TEAMFLOW_CONFIG.issues.fields.filter(([key])=>permission.data_scope==='ALL'||key!=='assignee_user_id').map(([key,label,type='text',required=false])=><label key={key} className={type==='textarea'?'tf-wide':''}>{label}{required?' *':''}{['projects','users'].includes(type)?<select required={required} value={editor[key]??''} onChange={e=>setEditor({...editor,[key]:e.target.value})}><option value="">Select…</option>{(type==='projects'?options.projects:options.users).map(row=><option key={row.id||row.user_id} value={type==='projects'?row.id:row.user_id}>{row.name||row.username}</option>)}{editor[key]&&!(type==='projects'?options.projects:options.users).some(row=>String(type==='projects'?row.id:row.user_id)===String(editor[key]))&&<option value={editor[key]}>{editor[key]}</option>}</select>:type==='textarea'?<textarea required={required} rows={8} maxLength={16000} value={editor[key]??''} onChange={e=>setEditor({...editor,[key]:e.target.value})}/>:<input required={required} maxLength={1000} value={editor[key]??''} onChange={e=>setEditor({...editor,[key]:e.target.value})}/>}</label>)}</div>{canUpload&&<label className="tf-file-field">Supporting file (up to 15 MB)<input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.csv,.xlsx" onChange={e=>setAttachment(e.target.files?.[0]||null)}/></label>}<footer className="tf-modal-footer"><button type="button" className="tf-secondary" disabled={busy} onClick={()=>setEditor(null)}>Cancel</button><button disabled={busy}>{busy?'Saving…':'Save issue'}</button></footer></form></section>:<section className="tf-issue-page-card"><IssueDetails issue={issue} projects={options.projects||[]} users={options.users||[]} canEdit={canEdit} canReplace={canEdit&&canUpload} onEdit={()=>{setEditor({...issue});setAttachment(null);setError('');setMessage('');}} onReload={refresh}/></section>)}
 </main>;
}
