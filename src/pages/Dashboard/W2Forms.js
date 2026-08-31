import {useCallback,useEffect,useMemo,useState} from 'react';
import {deleteW2Form,getW2Form,getW2Forms} from '../../api/w2Api';
import {usePermissions} from '../../auth/PermissionContext';
import W2Form,{downloadInteractiveW2} from '../../forms/W2Form';
import {FaChevronLeft,FaChevronRight,FaDownload,FaFileInvoice,FaTimes} from 'react-icons/fa';
import ConfirmDialog from '../../components/ConfirmDialog';
import '../../styles/w2.css';

const pageItems=(current,total)=>{if(total<=7)return Array.from({length:total},(_,i)=>i+1);if(current<=4)return[1,2,3,4,5,'gap-right',total];if(current>=total-3)return[1,'gap-left',total-4,total-3,total-2,total-1,total];return[1,'gap-left',current-1,current,current+1,'gap-right',total]};

export default function W2Forms(){
 const {can}=usePermissions(),[rows,setRows]=useState([]),[search,setSearch]=useState(''),[page,setPage]=useState(1),[total,setTotal]=useState(0),[selected,setSelected]=useState(null),[editing,setEditing]=useState(false),[removing,setRemoving]=useState(null),[error,setError]=useState(''),[opening,setOpening]=useState(false);
 const pageCount=Math.max(1,Math.ceil(total/20)),pages=useMemo(()=>pageItems(page,pageCount),[page,pageCount]);
 const load=useCallback(async()=>{try{const response=await getW2Forms({page,limit:20,search});setRows(response.data||[]);setTotal(response.total||0);setError('')}catch(e){setError(e.response?.data?.message||'Unable to load W-2 forms.')}},[page,search]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{if(page>pageCount)setPage(pageCount)},[page,pageCount]);
 const open=async(row,edit=false)=>{setOpening(true);setError('');try{setSelected(await getW2Form(row.id));setEditing(edit)}catch(e){setError(e.response?.data?.message||'Unable to open this W-2 form.')}finally{setOpening(false)}};
 const close=()=>{setSelected(null);setEditing(false)};
 const download=async row=>downloadInteractiveW2(await getW2Form(row.id));
 return <main className="w2-admin">
  <header><div><h2>Data Forms</h2><p>Consultant project, client and invoicing forms.</p></div><a href="/w2-form" target="_blank" rel="noreferrer">Open public form</a></header>
  <div className="w2-tools"><input placeholder="Search consultant, manager, client or company..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/><button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/w2-form`)}>Copy public link</button></div>
  {error&&<p className="w2-error">{error}</p>}
  <div className="w2-table"><table><thead><tr><th>Consultant</th><th>Manager</th><th>End Client</th><th>Project</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.consultant_name}</td><td>{row.manager_name}</td><td>{row.end_client_name}</td><td>{row.project_name}</td><td>{new Date(row.created_at).toLocaleString()}</td><td><div><button disabled={opening} onClick={()=>open(row)}>View</button>{can('w2_forms','edit')&&<button disabled={opening} onClick={()=>open(row,true)}>Edit</button>}{can('w2_forms','download')&&<button onClick={()=>download(row)}>Download interactive</button>}{can('w2_forms','delete')&&<button className="danger" onClick={()=>setRemoving(row)}>Delete</button>}</div></td></tr>)}</tbody></table>{!rows.length&&!error&&<div className="w2-empty-state"><span><FaFileInvoice/></span><h3>No Data Forms found</h3><p>{search?'No forms match your current search. Try a different consultant, manager, client, or company name.':'Submitted Data Consultant forms will appear here.'}</p></div>}</div>
  {total>20&&<nav className="w2-pages" aria-label="Data form pages"><button className="w2-page-arrow" aria-label="Previous page" disabled={page===1} onClick={()=>setPage(value=>value-1)}><FaChevronLeft/></button>{pages.map(item=>typeof item==='string'?<span className="w2-page-gap" key={item}>…</span>:<button key={item} className={page===item?'active':''} aria-current={page===item?'page':undefined} onClick={()=>setPage(item)}>{item}</button>)}<button className="w2-page-arrow" aria-label="Next page" disabled={page===pageCount} onClick={()=>setPage(value=>value+1)}><FaChevronRight/></button></nav>}
  {selected&&<div className="w2-modal" role="dialog" aria-modal="true" aria-label={`${editing?'Edit':'View'} Data Form`} onMouseDown={close}><section className="w2-modal-panel" onMouseDown={event=>event.stopPropagation()}><header className="w2-modal-header"><div><small>{editing?'EDIT FORM':'FORM DETAILS'}</small><strong>{selected.consultant_name||'Data Consultant Form'}</strong></div><button className="w2-close" aria-label="Close Data Form" onClick={close}><FaTimes/></button></header><div className="w2-modal-content"><W2Form initialData={selected} recordId={editing?selected.id:null} readOnly={!editing} onSaved={()=>{close();load()}}/></div><footer className="w2-modal-actions">{!editing&&can('w2_forms','download')&&<button className="w2-download-action" onClick={()=>downloadInteractiveW2(selected)}><FaDownload/> Download interactive form</button>}<button className="w2-secondary-action" onClick={close}>Close</button></footer></section></div>}
  <ConfirmDialog open={!!removing} title="Delete W-2 form?" message={`Permanently delete the form for ${removing?.consultant_name||'this consultant'}?`} confirmLabel="Delete" onCancel={()=>setRemoving(null)} onConfirm={async()=>{await deleteW2Form(removing.id);setRemoving(null);load()}}/>
 </main>
}