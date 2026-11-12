import {useEffect,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {FaArrowLeft,FaUsers} from 'react-icons/fa';
import {usePermissions} from '../../auth/PermissionContext';
import {useTheme} from '../../auth/ThemeContext';
import EmbeddedDiscussion from '../../components/Discussion/EmbeddedDiscussion';
import TeamflowPage from './TeamflowPage';
import TeamflowModal from './TeamflowModal';
import TeamflowFiles from './TeamflowFiles';
import {teamflowApi,teamflowMessage} from './api';
import './teamflow.css';
export default function TeamflowProjectView(){
 const {projectId}=useParams(),navigate=useNavigate(),{can}=usePermissions(),theme=useTheme(),[project,setProject]=useState(null),[error,setError]=useState(''),[assign,setAssign]=useState(false),[users,setUsers]=useState([]),[selected,setSelected]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let active=true;teamflowApi.detail('projects',projectId).then(r=>active&&setProject(r.data)).catch(e=>active&&setError(teamflowMessage(e)));return()=>{active=false;};},[projectId]);
 const open=async()=>{setError('');setSelected([]);try{const r=await teamflowApi.options('teamflow_projects');setUsers(r.data.users);setAssign(true);}catch(e){setError(teamflowMessage(e));}};
 const save=async e=>{e.preventDefault();setBusy(true);setError('');try{await teamflowApi.assign(projectId,selected);setAssign(false);setMessage('Project members assigned and notified.');window.dispatchEvent(new Event('e2e-notifications-changed'));}catch(err){setError(teamflowMessage(err));}finally{setBusy(false);}};
 return <main className={'teamflow-page tf-project-view'+(theme?.darkMode?' tf-dark':'')}><header className="tf-page-header"><div><button type="button" className="tf-secondary" onClick={()=>navigate('/dashboard/teamflow/projects')}><FaArrowLeft/>Projects</button><h1 style={{marginTop:14}}>{project?.name||'Project'}</h1><p>{project?.description}</p></div>{can('teamflow_projects','assign')&&<button type="button" onClick={open}><FaUsers/>Assign candidates</button>}</header>{error&&<p role="alert" className="tf-error">{error}</p>}{message&&<p role="status" className="tf-success">{message}</p>}{project&&<><div className="tf-summary"><article><small>Project key</small><strong>{project.projectKey||'—'}</strong></article><article><small>Project type</small><strong>{project.type||'Project'}</strong></article><article><small>Workspace</small><strong>Project team discussion</strong></article></div><EmbeddedDiscussion type="teamflow_project" recordId={project.id} title={project.name+' · Project discussion'} url={'/dashboard/teamflow/projects/'+project.id}/><section style={{marginTop:18}}><h2>Project documents</h2><TeamflowFiles files={project.files||[]} canReplace={can('teamflow_projects','edit')&&can('teamflow_projects','upload')} onChange={async()=>setProject((await teamflowApi.detail('projects',projectId)).data)}/></section>{can('teamflow_issues','view')&&<section style={{marginTop:20}}><TeamflowPage section="issues" projectId={Number(projectId)}/></section>}</>}
 {assign&&<TeamflowModal title="Assign project candidates" busy={busy} onClose={()=>setAssign(false)}><form onSubmit={save}>{error&&<p role="alert" className="tf-error">{error}</p>}<p>Assigned candidates can access this project and join its discussion.</p><div className="tf-member-list">{users.map(u=><label key={u.user_id}><input type="checkbox" checked={selected.includes(Number(u.user_id))} onChange={e=>setSelected(current=>e.target.checked?[...current,Number(u.user_id)]:current.filter(id=>id!==Number(u.user_id)))}/><span>{u.name}<small>{u.username}</small></span></label>)}</div><footer className="tf-modal-footer"><button type="button" className="tf-secondary" onClick={()=>setAssign(false)}>Cancel</button><button disabled={busy||!selected.length}>Assign & notify</button></footer></form></TeamflowModal>}
 </main>;
}
