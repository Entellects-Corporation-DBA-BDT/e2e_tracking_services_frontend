import {lazy,Suspense} from 'react';
import {NavLink} from 'react-router-dom';
import {useTheme} from '../auth/ThemeContext';
import './AiTools.css';
const ResumeMatch=lazy(()=>import('./Dashboard/ResumeMatch'));
const InterviewReady=lazy(()=>import('../features/interviewReady/App'));
const DocumentCheck=lazy(()=>import('./Dashboard/DocumentCheck'));
export default function AiTools({tool}){
 const {darkMode,toggleTheme}=useTheme();
 return <div className={'ai-tools-shell'+(darkMode?' ai-tools-dark':'')}>
  <header className="ai-tools-header"><div className="ai-tools-brand"><span aria-hidden="true">B</span><div>BeeData Technologies<small>AI TOOLS</small></div></div>
   <nav aria-label="AI tools"><NavLink to="/ai-tools/resume-match">Resume Match</NavLink><NavLink to="/ai-tools/document-check">Document Check</NavLink><NavLink to="/ai-tools/interview-ready">InterviewReady AI</NavLink></nav>
   <button type="button" onClick={toggleTheme} aria-label={darkMode?'Use light theme':'Use dark theme'}>{darkMode?'Light mode':'Dark mode'}</button>
  </header>
  <div className="ai-tools-content"><Suspense fallback={<p role="status">Loading your workspace...</p>}>{tool==='interview-ready'?<InterviewReady/>:tool==='document-check'?<DocumentCheck standalone/>:<ResumeMatch standalone/>}</Suspense></div>
 </div>;
}
