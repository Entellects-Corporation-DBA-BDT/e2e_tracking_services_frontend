import axiosInstance from './axiosInstance';
export const submitPublicW2=p=>axiosInstance.post('/w2/public',p).then(r=>r.data);
export const getW2Forms=params=>axiosInstance.get('/w2',{params}).then(r=>r.data);
export const getW2Form=id=>axiosInstance.get(`/w2/${id}`).then(r=>r.data.data);
export const updateW2Form=(id,p)=>axiosInstance.put(`/w2/${id}`,p).then(r=>r.data);
export const deleteW2Form=id=>axiosInstance.delete(`/w2/${id}`).then(r=>r.data);
