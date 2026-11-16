// The PHP chat API returns SQL wall times from its America/New_York DB session.
// Resolve that source timezone before displaying dates in the viewer's timezone.
const easternParts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function chatDate(value){
 if(value instanceof Date)return Number.isFinite(value.getTime())?new Date(value.getTime()):null;
 if(typeof value!=='string'||!value.trim())return null;
 const text=value.trim(),sql=text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/);
 let date;
 if(sql){
  const [,year,month,day,hour,minute,second]=sql.map(Number),wall=Date.UTC(year,month-1,day,hour,minute,second);let instant=wall;
  for(let i=0;i<3;i++){const parts=Object.fromEntries(easternParts.formatToParts(new Date(instant)).map(p=>[p.type,p.value]));const displayed=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));instant+=wall-displayed;}
  date=new Date(instant);
  const parts=Object.fromEntries(easternParts.formatToParts(date).map(p=>[p.type,p.value]));
  if([Number(parts.year),Number(parts.month),Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second)].some((n,i)=>n!==Number(sql[i+1])))return null;
 }else date=new Date(text);
 return Number.isFinite(date.getTime())?date:null;
}
export function chatDateKey(value){const date=chatDate(value);return date?`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`:'unknown';}
export function chatDateLabel(value,now=new Date()){
 const date=chatDate(value),today=chatDate(now);if(!date||!today)return 'Date unavailable';
 const yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
 if(chatDateKey(date)===chatDateKey(today))return 'Today';
 if(chatDateKey(date)===chatDateKey(yesterday))return 'Yesterday';
 return date.toLocaleDateString(undefined,{day:'numeric',month:'short',year:date.getFullYear()===today.getFullYear()?undefined:'numeric'});
}
export const chatTimeLabel=value=>chatDate(value)?.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})||'—';
export const chatFullDate=value=>chatDate(value)?.toLocaleString([],{dateStyle:'full',timeStyle:'short'})||'Date unavailable';
export const chatIsoDate=value=>chatDate(value)?.toISOString();
export const chatInitials=name=>String(name||'?').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
