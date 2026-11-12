import axios from '../../api/axiosInstance';
const unpack = response => response.data;
const payload = (value, attachment, photo, documents = {}) => {
 const data = new FormData();data.append('payload',JSON.stringify(value));
 if(attachment)data.append('attachment',attachment);
 if(photo)data.append('photo',photo);
 Object.entries(documents).forEach(([category,files])=>files.forEach(file=>data.append(`documents[${category}][]`,file)));
 return data;
};
export const teamflowApi = {
 weekly:(params,signal)=>axios.get('/teamflow/timesheets/weekly',{params,signal}).then(unpack),
 saveWeek:value=>axios.post('/teamflow/timesheets/weekly/save',value).then(unpack),
 copyWeek:value=>axios.post('/teamflow/timesheets/weekly/copy',value).then(unpack),
 importWeek:value=>axios.post('/teamflow/timesheets/weekly/import',value).then(unpack),
 reviewWeek:value=>axios.post('/teamflow/timesheets/weekly/review',value).then(unpack),
 tasks:(id,signal)=>axios.get(`/teamflow/projects/${id}/tasks`,{signal}).then(unpack),
 list:(section,params={},signal)=>axios.get(`/teamflow/${section}`,{params,signal}).then(unpack),
 options:(resource,signal)=>axios.get('/teamflow/options',{params:{resource},signal}).then(unpack),
 detail:(section,id)=>axios.get(`/teamflow/${section}/${id}`).then(unpack),
 save:(section,id,value,file)=>axios.post(`/teamflow/${section}${id?'/'+id:''}`,payload(value,file)).then(unpack),
 archive:(section,id)=>axios.delete(`/teamflow/${section}/${id}`).then(unpack),
 review:(id,status)=>axios.post(`/teamflow/timesheets/${id}/review`,{status}).then(unpack),
 assign:(id,user_ids)=>axios.post(`/teamflow/projects/${id}/assign`,{user_ids}).then(unpack),
 clock:value=>axios.post('/teamflow/attendance/clock',value).then(unpack),
 insights:(params,signal)=>axios.get('/teamflow/attendance/insights',{params,signal}).then(unpack),
 updateWork:value=>axios.post('/teamflow/attendance/work',value).then(unpack),
 presence:()=>axios.get('/teamflow/attendance/presence').then(unpack),
 profile:(id,signal)=>axios.get(id?`/teamflow/candidates/${id}/profile`:'/teamflow/profile',{signal}).then(unpack),
 saveProfile:(id,value,photo,documents)=>axios.post(id?`/teamflow/candidates/${id}/profile`:'/teamflow/profile',payload(value,null,photo,documents),{timeout:120000}).then(unpack),
 file:(id,preview=false)=>axios.get(`/teamflow/files/${id}`,{params:preview?{preview:1}:{},responseType:'blob'}).then(unpack),
 replaceFile:(id,file)=>{const data=new FormData();data.append('file',file);return axios.post(`/teamflow/files/${id}/replace`,data).then(unpack);},
 document:(candidateId,documentId)=>axios.get(`/teamflow/candidates/${candidateId}/documents/${documentId}`,{responseType:'blob'}).then(unpack),
};
export const teamflowMessage=error=>error?.response?.data?.message||error?.message||'TeamFlow could not complete this request.';
export function saveTeamflowBlob(blob,name){const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
