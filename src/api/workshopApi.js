import api from './axiosInstance';
const data=response=>{if(response.data?.success===false)throw Error(response.data.message||'Workshop request failed.');return response.data.data;};
export const workshopOptions=async signal=>data(await api.get('/workshops/options',{signal}));
export const workshopList=async(params,signal)=>data(await api.get('/workshops',{params,signal}));
export const workshopExport=async(params,signal)=>data(await api.get('/workshops/export',{params,signal,timeout:60000}));
export const workshopSave=async(id,form)=>data(await api.post(id?`/workshops/${id}`:'/workshops',form,{timeout:120000}));
export const workshopDelete=async id=>data(await api.delete(`/workshops/${id}`));
export const workshopPhoto=async(id,signal)=>(await api.get(`/workshops/photos/${id}`,{responseType:'blob',signal,timeout:30000})).data;
