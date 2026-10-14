import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaFileAlt, FaSearch, FaUpload, FaHistory, FaCheckCircle, FaTimes, FaTrophy } from 'react-icons/fa';
import { usePermissions } from '../../auth/PermissionContext';
import { useTheme } from '../../auth/ThemeContext';
import { rankCandidatesAsync } from '../../features/resumeMatch/matchingClient';
import DEMO_CANDIDATES from '../../features/resumeMatch/demoCandidates';
import { parseFile, candidateFromText } from '../../features/resumeMatch/fileParser';
import { getResumeMatchStatus, getResumeMatchHistory, saveResumeMatchHistory } from '../../api/resumeMatchApi';
import './ResumeMatch.css';

const STATES='ALL AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const errorMessage=error=>error?.response?.data?.message||error?.message||'Something went wrong. Please try again.';
export default function ResumeMatch(){
 const permissions=usePermissions();
 const darkMode=useTheme()?.darkMode;
 const recruitingRoute=(permissions?.getResource('recruiting')?.route||'/dashboard/recruiting').replace(/\/+$/,'');
 const [jd,setJd]=useState(''),[source,setSource]=useState('upload'),[state,setState]=useState('ALL'),[keywords,setKeywords]=useState('');
 const [uploads,setUploads]=useState([]),[demo,setDemo]=useState([]),[results,setResults]=useState([]),[expanded,setExpanded]=useState(null);
 const [busy,setBusy]=useState(false),[scoring,setScoring]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [history,setHistory]=useState([]),[historyReady,setHistoryReady]=useState(false),[historyOpen,setHistoryOpen]=useState(false),[historyBusy,setHistoryBusy]=useState(false);
 const mounted=useRef(true),revision=useRef(0),analysisController=useRef(null);
 useEffect(()=>{mounted.current=true;let cancelled=false;
  getResumeMatchStatus().then(status=>{if(!cancelled)setHistoryReady(Boolean(status.history_ready))}).catch(e=>{if(!cancelled)setNotice('Matching is available. History could not connect: '+errorMessage(e))});
  return()=>{cancelled=true;mounted.current=false;analysisController.current?.abort()};
 },[]);
 const candidates=source==='upload'?uploads:demo;
 function invalidate(){analysisController.current?.abort();revision.current++;setResults([]);setExpanded(null);setNotice('')}
 function changeJd(value){invalidate();setJd(value)}
 async function loadHistory(){
  setHistoryBusy(true);try{const rows=await getResumeMatchHistory();if(mounted.current){setHistory(rows);setHistoryReady(true)}}
  catch(e){if(mounted.current)setError(errorMessage(e))}
  finally{if(mounted.current)setHistoryBusy(false)}
 }
 async function upload(files,job=false){
  if(!files?.length)return;
  if(!job&&uploads.length+files.length>50){setError('You can compare up to 50 resumes at a time.');return}
  invalidate();setError('');setBusy(true);
  const parsed=[],failures=[];
  try{
   for(const file of Array.from(files)){
    try{
     const text=await parseFile(file);
     if(job){if(text.length>50000)throw new Error('Job descriptions must be 50,000 characters or fewer.');if(mounted.current)changeJd(text)}
     else parsed.push(candidateFromText(text,file.name));
    }catch(e){failures.push(file.name+': '+errorMessage(e))}
   }
   if(mounted.current){if(parsed.length){setUploads(old=>[...old,...parsed]);setSource('upload')}setError(failures.join(' '))}
  }finally{if(mounted.current)setBusy(false)}
 }
 function searchDemo(){
  invalidate();setError('');
  const terms=keywords.toLowerCase().split(/[\s,]+/).filter(term=>term.length>1);
  if(!terms.length){setError('Enter at least two characters to search the sample dataset.');return}
  const matches=DEMO_CANDIDATES.filter(candidate=>(state==='ALL'||candidate.state===state)&&terms.some(term=>(candidate.title+' '+candidate.skills.join(' ')+' '+candidate.resumeText).toLowerCase().includes(term)));
  setDemo(matches);setNotice(matches.length?matches.length+' sample candidates found. These are demonstration profiles, not live TechFetch results.':'No sample candidates found. Try other keywords or All States.');
 }
 async function analyze(){
  if(busy||scoring||jd.trim().length<50||!candidates.length)return;
  const currentRevision=revision.current;
  setScoring(true);setError('');setNotice('');
  try{
   // Yield to the browser so it can paint the busy state before scoring.
   await new Promise(resolve=>window.setTimeout(resolve,0));
   if(!mounted.current)return;
   analysisController.current=new AbortController();
   const ranked=await rankCandidatesAsync(candidates,jd,analysisController.current.signal);
   if(revision.current!==currentRevision)return;
   setResults(ranked);
   if(!ranked.some(item=>item.categoryScores.some(category=>category.total>0)))setNotice('No recognised skills were found in the job description. Add specific skills to get meaningful scores.');
   if(historyReady){
    try{await saveResumeMatchHistory({job_description:Array.from(jd).slice(0,5000).join(''),state_filter:state,source,candidate_count:candidates.length,top_score:ranked[0]?.score||0});if(mounted.current&&historyOpen)await loadHistory()}
    catch(e){if(mounted.current)setNotice('Ranking is ready. History could not be saved: '+errorMessage(e))}
   }else setNotice('Ranking is ready. Saved history is unavailable; check the Resume Match database migration.');
  }catch(e){if(mounted.current&&e.name!=='AbortError')setError(errorMessage(e))}
  finally{if(mounted.current)setScoring(false)}
 }
 return <main className={'resume-match-page'+(darkMode?' rm-dark':'')}>
  <header className="rm-hero"><div><Link className="rm-back" to={recruitingRoute}><FaArrowLeft/> Recruiting</Link><h1><FaFileAlt/> Resume Match</h1><p>Compare resumes against your job description with weighted skill matching.</p></div><button className="rm-secondary" onClick={()=>{setHistoryOpen(!historyOpen);if(!historyOpen)loadHistory()}}><FaHistory/> My history</button></header>
  <div className="rm-steps"><span><b>1</b> Add a job description</span><span><b>2</b> Upload or explore samples</span><span><b>3</b> Score and compare</span></div>
  {error&&<div className="rm-alert error" role="alert">{error}</div>}{notice&&<div className="rm-alert" role="status">{notice}</div>}
  {historyOpen&&<section className="rm-panel rm-history"><div className="rm-panel-heading"><h2>My matching history</h2><button className="rm-icon" aria-label="Close history" onClick={()=>setHistoryOpen(false)}><FaTimes/></button></div><p>History belongs to your E2E account. Resume files are processed locally and are not stored in history.</p>{historyBusy?<p role="status">Loading history...</p>:history.length?<div className="rm-history-grid">{history.map(row=><article key={row.id}><small>{new Date(row.created_at.replace(' ','T')+'Z').toLocaleString()}  |  {row.source==='demo'?'Demo samples':'Uploads'}</small><p>{row.job_description.slice(0,180)}</p><span>{row.candidate_count} candidates  |  Top match {row.top_score}%</span><button className="rm-secondary" onClick={()=>{changeJd(row.job_description);setHistoryOpen(false);setNotice('Job description restored. Upload resumes or select sample candidates to compare again.')}}>Reuse job description</button></article>)}</div>:<p>No saved comparisons yet.</p>}</section>}
  <div className="rm-layout"><aside className="rm-inputs"><section className="rm-panel"><div className="rm-panel-heading"><h2>Job description</h2><label className="rm-file-button"><FaUpload/> Upload<input aria-label="Upload job description" type="file" accept=".pdf,.docx,.txt" disabled={busy||scoring} onChange={event=>{upload(event.target.files,true);event.target.value=''}}/></label></div><textarea aria-label="Job description" value={jd} maxLength={50000} disabled={busy||scoring} onChange={event=>changeJd(event.target.value)} placeholder="Paste a job description, or upload a PDF, DOCX or TXT file." rows={9}/><small>{jd.trim().split(/\s+/).filter(Boolean).length} words  |  At least 50 characters</small></section>
   <section className="rm-panel"><div className="rm-tabs" role="tablist" aria-label="Candidate source"><button role="tab" aria-selected={source==='upload'} disabled={busy||scoring} onClick={()=>{invalidate();setSource('upload')}}><FaUpload/> Upload resumes</button><button role="tab" aria-selected={source==='demo'} disabled={busy||scoring} onClick={()=>{invalidate();setSource('demo')}}><FaSearch/> Demo search</button></div>
   {source==='upload'?<><label className="rm-dropzone"><FaUpload/><strong>{busy?'Reading documents...':'Choose resume files'}</strong><span>PDF, DOCX or TXT  |  10 MB per file  |  Up to 50 resumes</span><input aria-label="Upload resumes" type="file" accept=".pdf,.docx,.txt" multiple disabled={busy||scoring} onChange={event=>{upload(event.target.files);event.target.value=''}}/></label>{uploads.length>0&&<><div className="rm-panel-heading"><small>{uploads.length} resumes ready</small><button className="rm-text-button" disabled={busy||scoring} onClick={()=>{invalidate();setUploads([])}}>Clear all</button></div><ul className="rm-upload-list">{uploads.map(candidate=><li key={candidate.id}><span>{candidate.name}</span><button className="rm-icon" disabled={busy||scoring} aria-label={'Remove '+candidate.name} onClick={()=>{invalidate();setUploads(old=>old.filter(item=>item.id!==candidate.id))}}><FaTimes/></button></li>)}</ul></>}</>:<><div className="rm-demo-note"><strong>Demonstration data</strong><p>Search the original Resume Match sample profiles. No TechFetch account or live search is used.</p></div><label>Search keywords<input aria-label="Search keywords" value={keywords} disabled={busy||scoring} onChange={event=>{invalidate();setDemo([]);setKeywords(event.target.value)}} placeholder="React, Python, AWS..."/></label><label>US state<select aria-label="US state" value={state} disabled={busy||scoring} onChange={event=>{invalidate();setDemo([]);setState(event.target.value)}}>{STATES.map(code=><option key={code} value={code}>{code==='ALL'?'All States':code}</option>)}</select></label><button className="rm-secondary rm-wide" disabled={busy||scoring} onClick={searchDemo}><FaSearch/> Search sample profiles</button></>}
   </section><button className="rm-primary rm-wide" disabled={busy||scoring||jd.trim().length<50||!candidates.length} onClick={analyze}><FaCheckCircle/> {scoring?'Scoring and saving...':'Score & rank candidates'}</button>
  </aside><section className="rm-output" aria-live="polite">
   {results.length>0&&<div className="rm-summary"><FaTrophy/><div><small>Top match{source==='demo'?'  |  Demonstration candidate':''}</small><h2>{results[0].candidate.name}</h2></div><strong>{results[0].score}%</strong></div>}
   <div className="rm-panel-heading"><h2>{results.length?'Ranked candidates':'Candidate preview'}</h2><span className="rm-source">{source==='demo'?'Demo dataset':'Your uploads'}  |  {candidates.length}</span></div>
   {!candidates.length?<div className="rm-empty"><FaFileAlt/><h2>Your shortlist starts here</h2><p>Add your job description, then upload resumes or explore the labelled sample dataset.</p></div>:(results.length?results:candidates.map(candidate=>({candidate}))).map((item,index)=>{
    const candidate=item.candidate,isOpen=expanded===candidate.id;
    return <article className="rm-candidate" key={candidate.id}><button className="rm-candidate-header" aria-expanded={isOpen} onClick={()=>setExpanded(isOpen?null:candidate.id)}><span className="rm-rank">{index+1}</span><div><h3>{candidate.name}</h3><p>{candidate.title||'Uploaded resume'}</p><small>{candidate.state||'Location not extracted'}{candidate.experience?'  |  '+candidate.experience+' years experience':''}</small></div>{item.score!==undefined?<span className={'rm-score '+(item.score>=70?'strong':item.score>=40?'moderate':'low')}>{item.score}%</span>:<span className="rm-source">Ready</span>}</button>{item.explanation&&<p className="rm-explanation">{item.explanation}</p>}{isOpen&&<div className="rm-details">{item.score!==undefined&&<><h4>Matched skills ({item.matchedKeywords.length})</h4><div className="rm-tags matched">{item.matchedKeywords.length?item.matchedKeywords.map(match=><span key={match.keyword}>{match.keyword}</span>):<small>No matching skills identified.</small>}</div><h4>Missing skills ({item.missingKeywords.length})</h4><div className="rm-tags missing">{item.missingKeywords.length?item.missingKeywords.map(match=><span key={match.keyword}>{match.keyword}</span>):<small>No missing skills identified.</small>}</div><h4>Category breakdown</h4>{item.categoryScores.filter(category=>category.total>0).map(category=><div key={category.category} className="rm-category"><span>{category.label}</span><progress max="100" value={category.percentage}/><small>{category.matched}/{category.total}</small></div>)}</>}{candidate.skills?.length>0&&<><h4>Profile skills</h4><div className="rm-tags matched">{candidate.skills.map(skill=><span key={skill}>{skill}</span>)}</div></>}<h4>Resume text</h4><pre className="rm-resume">{candidate.resumeText}</pre></div>}</article>
   })}
  </section></div>
 </main>;
}
