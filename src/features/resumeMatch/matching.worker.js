/* global globalThis */
import { rankCandidates } from './multiResumeAnalyzer';
globalThis.onmessage = event => {
 try { globalThis.postMessage({results:rankCandidates(event.data.candidates,event.data.jobDescription)}); }
 catch(error) { globalThis.postMessage({error:error.message || 'Could not rank these resumes.'}); }
};
