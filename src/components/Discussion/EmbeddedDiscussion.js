import React,{useCallback,useEffect,useRef,useState} from 'react';
import {FaChevronDown,FaChevronUp,FaComments,FaExternalLinkAlt,FaPaperPlane,FaPlus,FaTimes,FaUsers} from 'react-icons/fa';
import {addConversationMembers,createConversation,deleteEmptyDiscussion,getConversationMembers,getMessages,markRead,searchChatUsers,sendMessage} from '../../api/chatApi';
import {useNavigate} from 'react-router-dom';
import {usePermissions} from "../../auth/PermissionContext";

export default function EmbeddedDiscussion({type,recordId,title,url}){
 const navigate=useNavigate(),{user,can}=usePermissions(),[open,setOpen]=useState(false),[conversation,setConversation]=useState(null),[messages,setMessages]=useState([]),[members,setMembers]=useState([]),[text,setText]=useState(''),[error,setError]=useState(''),[adding,setAdding]=useState(false),[q,setQ]=useState(''),[users,setUsers]=useState([]),end=useRef(null);
 const load=useCallback(async id=>{try{const [items,people]=await Promise.all([getMessages(id),getConversationMembers(id)]);setMessages(items);setMembers(people);await markRead(id)}catch(e){setError(e?.response?.data?.message||'Discussion could not be loaded.')}},[]);
 useEffect(()=>{if(!open)return undefined;let active=true;createConversation({type:'contextual',name:title,member_ids:[],context:{type,id:String(recordId),title,url}}).then(result=>{if(!active)return;setConversation(result);load(result.id)}).catch(e=>setError(e?.response?.data?.message||'Discussion could not be opened.'));return()=>{active=false}},[open,type,recordId,title,url,load]);
 useEffect(()=>{if(!adding||q.trim().length<2){setUsers([]);return undefined}const timer=setTimeout(()=>searchChatUsers(q).then(setUsers).catch(()=>setUsers([])),250);return()=>clearTimeout(timer)},[adding,q]);
 useEffect(()=>{if(open)end.current?.scrollIntoView({behavior:'smooth'});return undefined},[messages,open]);
 const send=async e=>{e.preventDefault();const body=text.trim();if(!body||!conversation)return;setText('');try{await sendMessage(conversation.id,{body,client_id:crypto.randomUUID()});load(conversation.id)}catch(e){setText(body);setError(e?.response?.data?.message||'Message could not be sent.')}};
 const add=async selectedUser=>{try{await addConversationMembers(conversation.id,[selectedUser.id]);setAdding(false);setQ('');load(conversation.id)}catch(e){setError(e?.response?.data?.message||'You do not have permission to add participants.')}};
 const toggle=async()=>{if(open&&conversation&&!messages.length){await deleteEmptyDiscussion(conversation.id).catch(()=>{});setConversation(null);setMembers([])}setOpen(value=>!value)};
 const canAdd=['owner','admin'].includes(members.find(x=>Number(x.user_id)===Number(user?.id))?.role);
 if(!can('chat','create'))return null;
 return <section className={`embedded-discussion ${open?'is-open':'is-collapsed'}`}>
  <header className="embedded-discussion-toggle">
   <div><small>RECORD DISCUSSION</small><h2><FaComments/> {title}</h2><p>{open&&members.length?`${members.length} participant${members.length===1?'':'s'} · `:''}Discuss this record with its related workflow team.</p></div>
   <button type="button" className="discussion-start-button" onClick={toggle}>{open?<><FaChevronUp/> Hide discussion</>:<><FaChevronDown/> Start discussion</>}</button>
  </header>
  {open&&<div className="embedded-discussion-body">
   <div className="embedded-discussion-tools">{canAdd&&<button type="button" onClick={()=>setAdding(true)}><FaPlus/> Add people</button>}{conversation&&<button type="button" onClick={()=>navigate(`/dashboard/chat?conversation=${conversation.id}`)}><FaExternalLinkAlt/> Full chat</button>}</div>
   {error&&<p className="chat-error">{error}</p>}
   <div className="embedded-discussion-members"><FaUsers/>{members.map(x=><span key={x.user_id}>{x.nick_name}<small>{x.role}</small></span>)}</div>
   <div className="embedded-discussion-messages">{messages.length?messages.slice(-20).map(m=><article key={m.id}><strong>{m.sender_name}</strong><p>{m.status==='active'?m.body:'This message was deleted.'}</p><time>{new Date(m.created_at.replace(' ','T')).toLocaleString()}</time></article>):<p className="chat-empty">{conversation?'No messages yet. Start the record discussion.':'Opening discussion...'}</p>}<div ref={end}/></div>
   <form onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Write in this discussion..."/><button disabled={!text.trim()||!conversation}><FaPaperPlane/></button></form>
   {adding&&<div className="embedded-add"><header><strong>Add discussion participant</strong><button type="button" onClick={()=>setAdding(false)}><FaTimes/></button></header><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search employees"/>{users.map(u=><button type="button" key={u.id} onClick={()=>add(u)}><span>{u.nick_name}</span><small>{u.position_name||u.email}</small></button>)}</div>}
  </div>}
 </section>
}