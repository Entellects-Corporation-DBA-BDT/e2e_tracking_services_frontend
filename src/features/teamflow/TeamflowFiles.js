import {useState} from 'react';
import {FaDownload,FaUpload} from 'react-icons/fa';
import {saveTeamflowBlob,teamflowApi,teamflowMessage} from './api';
export default function TeamflowFiles({files=[],canReplace=false,onChange}){
 const [busy,setBusy]=useState(null),[error,setError]=useState('');
 const download=async file=>{setBusy(file.id);setError('');try{saveTeamflowBlob(await teamflowApi.file(file.id),file.original_name);}catch(e){setError(teamflowMessage(e));}finally{setBusy(null);}};
 const replace=async(file,event)=>{const upload=event.target.files?.[0];event.target.value='';if(!upload)return;setBusy(file.id);setError('');try{await teamflowApi.replaceFile(file.id,upload);await onChange?.();}catch(e){setError(teamflowMessage(e));}finally{setBusy(null);}};
 return <div className="tf-files">{error&&<p role="alert">{error}</p>}{!files.length&&<p className="tf-muted">No attachments.</p>}{files.map(file=><article key={file.id}><div><strong>{file.original_name}</strong><small>{Number(file.missing)?'Awaiting upload':file.file_size?`${(file.file_size/1024).toFixed(0)} KB`:'Attachment'}</small></div>{!Number(file.missing)&&<button type="button" disabled={busy!==null} onClick={()=>download(file)}><FaDownload/>Download</button>}{canReplace&&<label className="tf-upload-button"><FaUpload/>{Number(file.missing)?'Upload file':'Replace file'}<input type="file" disabled={busy!==null} aria-label={`Upload ${file.original_name}`} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.sql,.csv,.mp4,.png,.jpg,.jpeg,.webp" onChange={event=>replace(file,event)}/></label>}</article>)}</div>;
}
