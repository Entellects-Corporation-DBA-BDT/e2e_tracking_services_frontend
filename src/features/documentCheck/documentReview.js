import {findDocumentName} from './nameExtraction';
export const DOCUMENT_TYPES = [
 {id:'dl',label:'Driving licence',hint:'Front and back, or a combined PDF'},
 {id:'i94',label:'I-94 record',hint:'Most recent arrival / departure record'},
 {id:'travel',label:'Travel history',hint:'Arrival and departure history'},
 {id:'visa',label:'Visa copy',hint:'Visa page and relevant supporting page'},
];
export const MAX_FILE_BYTES=8*1024*1024;
export async function validateDocumentFile(file){
 if(!file||file.size===0)throw Error('Choose a non-empty document.');
 if(file.size>MAX_FILE_BYTES)throw Error('Each file must be 8 MB or smaller.');
 const extension=file.name.split('.').pop().toLowerCase();
 const mime={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'}[extension];
 if(!mime)throw Error('Choose PDF, JPG or PNG. Other formats are not accepted.');
 if(file.type&&file.type!==mime)throw Error('The file type does not match its extension. Export a fresh copy.');
 const header=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const isPdf=String.fromCharCode(...header.slice(0,5))==='%PDF-';
 const isPng=[137,80,78,71,13,10,26,10].every((value,index)=>header[index]===value);
 const isJpeg=header[0]===255&&header[1]===216&&header[2]===255;
 if(!(extension==='pdf'?isPdf:extension==='png'?isPng:isJpeg))throw Error('The file signature is invalid. Choose the original PDF or image export.');
 return mime;
}
export function normalizeName(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean).sort().join(' ');}
export function normalizeDate(value){
 const text=String(value||'').trim();let match,parts;
 const month=value=>['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(value.slice(0,3).toLowerCase())+1;
 if((match=text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)))parts=[+match[1],+match[2],+match[3]];
 else if((match=text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)))parts=[+match[3],+match[1],+match[2]];
 else if((match=text.match(/^(\d{4})[\s-]+([a-z]{3,9})[\s,-]+(\d{1,2})$/i)))parts=[+match[1],month(match[2]),+match[3]];
 else if((match=text.match(/^(\d{1,2})[\s-]*([a-z]{3,9})[\s,-]*(\d{4})$/i)))parts=[+match[3],month(match[2]),+match[1]];
 else if((match=text.match(/^([a-z]{3,9})[\s-]+(\d{1,2})[\s,-]+(\d{4})$/i)))parts=[+match[3],month(match[1]),+match[2]];
 else return null;
 const [year,monthNumber,day]=parts,date=new Date(Date.UTC(year,monthNumber-1,day));
 if(year<1900||year>2200||date.getUTCFullYear()!==year||date.getUTCMonth()+1!==monthNumber||date.getUTCDate()!==day)return null;
 return [year,String(monthNumber).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
}
const dateToken='(\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}|\\d{4}[\\s-]+[A-Za-z]{3,9}[\\s,-]+\\d{1,2}|\\d{1,2}[\\s-]*[A-Za-z]{3,9}[\\s,-]*\\d{4}|[A-Za-z]{3,9}[\\s-]+\\d{1,2}[\\s,-]+\\d{4})';
function dateAfter(text,label){return (text.match(new RegExp('(?:'+label+')\\s*[:#-]?\\s*'+dateToken,'i'))||[])[1]||'';}
function after(text,label){return (text.match(new RegExp('(?:^|\\n)\\s*(?:'+label+')[\\t ]*(?:[:#-]\\s*|\\r?\\n[\\t ]*)([^\\n]{2,80})','i'))||[])[1]?.trim()||'';}
export function reviewDocumentText(text,type,reference={},meta={}){
 const content=String(text||'').slice(0,100000);
 const nameEvidence=findDocumentName(content,type);
 const fields={name:nameEvidence.value,birthDate:dateAfter(content,'date of birth|birth date|DOB'),number:after(content,type==='i94'?'admission.*?(?:record )?number|I[- ]?94(?: number)?':type==='dl'?"(?:driver.?s? )?licen[cs]e(?: number| no\\.?| #)?|DL(?: number| no\\.?)?":'passport(?: number| no\\.?)?|document number|visa(?: number| no\\.?)?|control number|receipt(?: number| no\\.?)?'),expiryDate:dateAfter(content,'expiration date|date of expir(?:y|ation)|expiry date|expires|EXP'),issueDate:dateAfter(content,'issue date|date of issue'),admissionClass:after(content,'class of admission|visa class|visa type|class'),admitUntil:dateAfter(content,'admit until date|admit until')||after(content,'admit until date|admit until')};
 if(type==='i94'||type==='travel'){fields.expiryDate='';fields.issueDate='';}
 const required={dl:['name','birthDate','number','expiryDate'],i94:['name','birthDate','number','admissionClass','admitUntil'],travel:[],visa:['name','number','issueDate','expiryDate']}[type]||[];
 const labels={name:'Name',birthDate:'Date of birth',number:'Document / reference number',expiryDate:'Expiry date',issueDate:'Issue date',admissionClass:'Admission / visa class',admitUntil:'Admit-until entry'};
 const findings=[];
 function add(level,title,detail){findings.push({level,title,detail});}
 if(content.trim().length<30)add('review','Text could not be read reliably','Upload a clearer scan and inspect every page manually.');
 for(const key of required){if(!fields[key])add('review',labels[key]+' not located','The field may exist but was not recognised. Check the document visually.');}
 if(nameEvidence.needsConfirmation)add('review','Confirm the recognised name','A partial name or licence-layout heuristic was used. Compare the name with the visible document.');
 if(type==='travel'&&!fields.name)add('info','No name recognised on this travel record','Some travel-history layouts omit the name. Compare the document number with the related issuer record; no name is inferred from another upload.');
 if(type==='travel'&&!/arrival|departure/i.test(content))add('review','Travel entries not located','Arrival/departure labels were not recognised. Confirm the correct document was provided.');
 if(meta.confidence!==null&&meta.confidence!==undefined&&meta.confidence<70)add('review','OCR needs closer review','Text recognition confidence is below 70%. This is a readability signal, not an authenticity score.');
 if(meta.rotation)add('info','Scan orientation adjusted','The page was rotated locally to improve reading. Confirm the recognised values visually.');
 if(meta.lowResolution)add('review','Small image dimensions','A higher-resolution scan may improve reading accuracy.');
 if(reference.name&&fields.name){const expected=normalizeName(reference.name),actual=normalizeName(fields.name),matches=Boolean(expected&&actual&&expected===actual);add(matches?'info':'review',matches?'Name text matches the reference':'Name text needs comparison',matches?'The recognised name words match, ignoring order, case and accents.':'Check spelling, OCR errors and name order against the candidate reference.');}
 if(reference.dob&&fields.birthDate){const date=normalizeDate(fields.birthDate);add(date&&date===reference.dob?'info':'review',date&&date===reference.dob?'Birth-date text matches the reference':'Birth-date text needs comparison','Confirm the recognised date visually; date formats and OCR can be ambiguous.');}
 const today=reference.today||new Date().toISOString().slice(0,10);
 for(const key of ['birthDate','issueDate','expiryDate']){
  if(!fields[key])continue;const date=normalizeDate(fields[key]);
  if(!date)add('review',labels[key]+' format needs review','The recognised value is not a supported, valid calendar date.');
  else if(key==='expiryDate'&&date<today)add('review','A recognised expiry date is in the past','Confirm the date and document context. This is not a decision about immigration status or work eligibility.');
  else if((key==='birthDate'||key==='issueDate')&&date>today)add('review',labels[key]+' appears to be in the future','Confirm that OCR read the correct field and date.');
 }
 if(!findings.some(item=>item.level==='review'))add('info','No rule-based issues detected','The available text passed these limited checks. Originality and identity remain unverified.');
 return {nameMethod:nameEvidence.method,fields:Object.entries(fields).filter(([,value])=>value).map(([key,value])=>({key,label:labels[key],value,sensitive:['number','birthDate'].includes(key)})),findings,status:findings.some(item=>item.level==='review')?'Needs review':'Ready for manual review'};
}
export function crossDocumentFindings(results){
 const issues=[];
 for(let i=0;i<results.length;i++)for(let j=i+1;j<results.length;j++){
  const left=results[i],right=results[j];
  if(left.fingerprint&&left.fingerprint===right.fingerprint)issues.push({title:'Duplicate file detected',detail:'The same file appears in more than one upload. Confirm each selected document.',ids:[left.id,right.id]});
  for(const key of ['name','birthDate']){
   const a=left.fields.find(field=>field.key===key)?.value,b=right.fields.find(field=>field.key===key)?.value;
   const x=key==='name'?normalizeName(a):normalizeDate(a),y=key==='name'?normalizeName(b):normalizeDate(b);
   if(x&&y&&x!==y)issues.push({title:(key==='name'?'Name':'Birth date')+' differs between documents',detail:'Compare the original pages. OCR errors or formatting differences can cause this flag.',ids:[left.id,right.id]});
  }
 }
 return issues;
}
