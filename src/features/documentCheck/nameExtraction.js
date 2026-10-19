const FORBIDDEN=/\b(?:driver|licen[cs]e|identification|department|citizenship|immigration|services|receipt|petitioner|notice|approval|class|federal|limits|apply|country|address|expires|expiration|birth|document|history|travel|admission|given|surname|family|first|last|name|valid)\b/i;
function clean(value){return String(value||'').split(/\s{3,}|\t/)[0].replace(/^[\s\d:;#|~{}[\]().\\/"=+-]+/,'').replace(/[\s:;#|~{}[\]().\\/"=+-]+$/,'').replace(/\s+/g,' ').trim();}
function plausible(value){return !/^(?:not available|not provided|unknown|n\/?a|none|redacted)$/i.test(value)&&value.length>=2&&value.length<=80&&!/\d|https?:|@/.test(value)&&/^[\p{L}\p{M} ,.'\u2019-]+$/u.test(value)&&value.split(/\s+/).length<=7&&!FORBIDDEN.test(value);}
function candidate(value){const name=clean(value);return plausible(name)?name:'';}
function labelled(lines,pattern){
 for(let index=0;index<lines.length;index++){
  const match=lines[index].match(pattern);if(!match)continue;
  const inline=candidate(match[1]);if(inline)return inline;
  if(!String(match[1]||'').trim()){
   const next=candidate(lines[index+1]);if(next)return next;
  }
 }
 return '';
}
export function findDocumentName(text,type){
 const lines=String(text||'').replace(/\r/g,'').split('\n').map(line=>line.trim()).filter(Boolean);
 const first=labelled(lines,/(?:^|\s)(?:first\s*(?:\(\s*given\s*\))?\s*name|given\s*names?|FN)\b\s*[:#-]?\s*(.*)$/i);
 const last=labelled(lines,/(?:^|\s)(?:last\s*\/\s*surname|last\s*name|family\s*name|surname|LN)\b\s*[:#-]?\s*(.*)$/i);
 if(first&&last)return {value:first+' '+last,method:'labelled given and family names'};
 const full=labelled(lines,/(?:^|\s)(?:full\s*name|candidate\s*name|applicant\s*name)\b\s*[:#-]?\s*(.*)$/i);
 if(full)return {value:full,method:'full-name label'};
 // A generic NAME label must be standalone, not the suffix of a First/Last Name label.
 const generic=labelled(lines,/^\s*(?:\d+[.)]?\s+)?NAME\b\s*[:#-]?\s*(.*)$/i);
 if(generic)return {value:generic,method:'name label'};
 if(type==='visa'){
  for(let i=0;i<lines.length;i++){
   const match=lines[i].match(/\bBeneficiary\b\s*[:#-]?\s*(.*)$/i);if(!match)continue;
   const inline=candidate(match[1]);if(inline)return {value:inline,method:'beneficiary label'};
   const parts=(lines[i+1]||'').split(/\s{2,}|\t/).map(candidate).filter(Boolean);
   const withComma=parts.find(value=>value.includes(','));
   if(withComma)return {value:withComma,method:'beneficiary column'};
   if(parts.length===1&&parts[0].split(/\s+/).length>=2)return {value:parts[0],method:'beneficiary following line'};
  }
  const mrz=String(text).match(/(?:^|\n)\s*P<[A-Z<]{3}([A-Z<]{2,70})/);
  if(mrz){const [family,given]=mrz[1].split('<<');const value=candidate((given||'').replace(/</g,' ')+' '+family.replace(/</g,' '));if(value)return {value,method:'machine-readable name line'};}
 }
 if(type==='dl'&&/driver[\s\S]{0,18}licen[cs]e/i.test(text)){
  let family='',given='';
  for(const line of lines.slice(0,45)){
   const one=line.match(/^\s*1[.:#-]?\s*([^\d].*)$/),two=line.match(/^\s*2[.:#-]?\s*([^\d].*)$/);
   if(one&&!family)family=candidate(one[1]);if(two&&!given)given=candidate(two[1]);
  }
  if(family&&given)return {value:given+' '+family,method:'licence fields 1 and 2'};
  const firstDate=lines.findIndex(line=>/\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(line));
  if(firstDate>1&&firstDate<20){
   const names=lines.slice(Math.max(0,firstDate-3),firstDate).map(candidate).filter(Boolean).slice(-2);
   if(names.length===2)return {value:names[1]+' '+names[0],method:'licence name-position heuristic',needsConfirmation:true};
  }
 }
 if(first||last)return {value:[first,last].filter(Boolean).join(' '),method:'partial name label',needsConfirmation:true};
 return {value:'',method:''};
}
