import ExcelJS from 'exceljs';
import {workshopPhoto} from '../api/workshopApi';
export const workshopDay=date=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return '';const day=new Date(date+'T12:00:00Z');return Number.isNaN(day.getTime())?'':new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(day);};
export const workshopDate=date=>date?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')):'-';
export const workshopToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
async function thumbnail(blob){const bitmap=await createImageBitmap(blob);try{const canvas=document.createElement('canvas');canvas.width=190;canvas.height=120;const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,190,120);const scale=Math.min(190/bitmap.width,120/bitmap.height);context.drawImage(bitmap,(190-bitmap.width*scale)/2,(120-bitmap.height*scale)/2,bitmap.width*scale,bitmap.height*scale);return canvas.toDataURL('image/jpeg',.82);}finally{bitmap.close();}}
export async function createWorkshopWorkbook(rows,filters={},includePhotos=true,onProgress=()=>{},signal){
 const book=new ExcelJS.Workbook();book.creator='BeeData Technologies';book.created=new Date();const sheet=book.addWorksheet('Workshop meetings',{views:[{state:'frozen',ySplit:6}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});
 sheet.columns=[{width:18},{width:16},{width:25},{width:44},{width:26},{width:55},{width:55},{width:60},{width:26}];sheet.mergeCells('A1:I2');sheet.getCell('A1').value='BEEDATA TECHNOLOGIES | WORKSHOP';sheet.getCell('A1').font={name:'Calibri',size:20,bold:true,color:{argb:'FFFFFFFF'}};sheet.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF183B68'}};sheet.getCell('A1').alignment={vertical:'middle'};sheet.getRow(1).height=24;sheet.getRow(2).height=16;
 sheet.mergeCells('A3:I3');sheet.getCell('A3').value=`${rows.length} meetings | ${rows.reduce((n,r)=>n+r.attendees.length,0)} attendances | Exported ${new Date().toLocaleString()}`;
 sheet.mergeCells('A4:I4');sheet.getCell('A4').value='Filters: '+(Object.entries(filters).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(' | ')||'All meetings');sheet.getCell('A4').alignment={wrapText:true};sheet.getRow(4).height=30;
 const columns=['Date','Day','Team','Topic','Meeting presenter','Attendees','Remarks','Photos','Recorded by'];
 const values=rows.map(r=>[new Date(r.meeting_date+'T12:00:00Z'),r.day||workshopDay(r.meeting_date),r.team_name,r.topic,r.presenter_name,r.attendees.map(a=>a.name).join('\n'),r.remarks||'',r.photos.length,r.created_by_name]);
 sheet.addTable({name:'WorkshopMeetings',ref:'A6',headerRow:true,style:{theme:'TableStyleMedium2',showRowStripes:true},columns:columns.map(name=>({name,filterButton:true})),rows:values});sheet.getRow(6).height=26;sheet.getColumn(1).numFmt='dd mmm yyyy';
 for(let i=7;i<rows.length+7;i++){const row=sheet.getRow(i);row.alignment={vertical:'top',wrapText:true};row.height=Math.min(125,Math.max(36,(rows[i-7].attendees.length+1)*14));row.font={name:'Calibri',size:11,color:{argb:'FF233B57'}};}
 const attendees=book.addWorksheet('Attendee details',{views:[{state:'frozen',ySplit:1}]});
 attendees.columns=[{header:'Date',width:18},{header:'Day',width:16},{header:'Team',width:25},{header:'Topic',width:45},{header:'Presenter',width:27},{header:'Attendee',width:30}];
 attendees.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};attendees.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF183B68'}};
 for(const meeting of rows)for(const person of meeting.attendees){const row=attendees.addRow([new Date(meeting.meeting_date+'T12:00:00Z'),meeting.day||workshopDay(meeting.meeting_date),meeting.team_name,meeting.topic,meeting.presenter_name,person.name]);row.alignment={wrapText:true,vertical:'top'};row.height=32;}
 attendees.getColumn(1).numFmt='dd mmm yyyy';attendees.autoFilter='A1:F1';
 let missing=0;
 if(includePhotos&&rows.some(r=>r.photos.length)){
  let done=0;const total=rows.reduce((n,r)=>n+r.photos.length,0);
  for(const [index,meeting] of rows.entries()){
   if(!meeting.photos.length)continue;
   const row=sheet.getRow(index+7);row.height=Math.max(row.height,Math.ceil(meeting.photos.length/2)*100);row.getCell(8).value='';const unavailable=[];
   for(const [photoIndex,photo] of meeting.photos.entries()){
    if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
    try{const blob=await workshopPhoto(photo.id,signal);const base64=await thumbnail(blob);const image=book.addImage({base64,extension:'jpeg'});sheet.addImage(image,{tl:{nativeCol:7,nativeRow:row.number-1,nativeColOff:(8+(photoIndex%2)*198)*9525,nativeRowOff:(6+Math.floor(photoIndex/2)*132)*9525},ext:{width:190,height:120},editAs:'oneCell'});}
    catch(error){if(signal?.aborted)throw error;missing++;unavailable.push(photo.original_name||'Photo');}
    onProgress(++done,total);
   }
   if(unavailable.length)row.getCell(8).value='Unavailable: '+unavailable.join(', ');
  }
 }
 return {book,missing};
}
export async function downloadWorkshopWorkbook(rows,filters,includePhotos,onProgress,signal){const {book,missing}=await createWorkshopWorkbook(rows,filters,includePhotos,onProgress,signal);if(signal?.aborted)throw new DOMException('Cancelled','AbortError');const buffer=await book.xlsx.writeBuffer();if(signal?.aborted)throw new DOMException('Cancelled','AbortError');const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download='workshops-'+workshopToday()+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return missing;}
