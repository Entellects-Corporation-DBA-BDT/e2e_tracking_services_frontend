import { useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { searchTechfetch } from './techfetchSearch';
const STATES='ALL AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
export default function TechfetchSearchPanel({disabled,onResults,onReset}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[keywords,setKeywords]=useState(''),[state,setState]=useState('ALL'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const active=useRef(null),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;active.current?.abort();};},[]);
 function change(setter,value){active.current?.abort();setter(value);setError('');onReset();}
 async function search(event){
  event.preventDefault();if(busy||disabled)return;
  setBusy(true);setError('');onReset();const controller=new AbortController();active.current=controller;
  const timer=setTimeout(()=>controller.abort(),25000);
  try{const result=await searchTechfetch({email,password,keywords,state},controller.signal);if(mounted.current)onResults({...result,state});}
  catch(error){if(mounted.current)setError(error.name==='AbortError'?'Search timed out or was cancelled. Please try again.':error.message);}
  finally{clearTimeout(timer);if(mounted.current){setBusy(false);setPassword('');}}
 }
 return <form onSubmit={search} className="rm-techfetch-search">
 <p>Connect your TechFetch account and refine your search by skills and location.</p>
 <label htmlFor="tf-email">TechFetch username / email<input id="tf-email" type="email" autoComplete="username" required value={email} disabled={busy||disabled} onChange={e=>change(setEmail,e.target.value)}/></label>
 <label htmlFor="tf-password">TechFetch password<input id="tf-password" type="password" autoComplete="off" required value={password} disabled={busy||disabled} onChange={e=>change(setPassword,e.target.value)}/></label>
 <label htmlFor="tf-keywords">Search keywords<input id="tf-keywords" required minLength={2} placeholder="Java, React, Python..." value={keywords} disabled={busy||disabled} onChange={e=>change(setKeywords,e.target.value)}/></label>
 <label htmlFor="tf-state">US state<select id="tf-state" value={state} disabled={busy||disabled} onChange={e=>change(setState,e.target.value)}>{STATES.map(code=><option key={code} value={code}>{code==='ALL'?'All States':code}</option>)}</select></label>
 {error&&<div className="rm-alert error" role="alert">{error}</div>}
 <button className="rm-primary rm-wide" type="submit" disabled={busy||disabled||!email.trim()||!password||keywords.trim().length<2}><FaSearch/>{busy?'Searching...':'Search resumes'}</button>
 <small className="rm-search-footnote">Your password is cleared after every search. Demo fallback results, if returned by the search service, are always labelled.</small>
 </form>;
}
