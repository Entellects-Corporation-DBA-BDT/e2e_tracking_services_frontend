import api from './axiosInstance';
export const getResumeMatchStatus = async () => (await api.get('/resume-match/status', {timeout:15000})).data.data;
export const getResumeMatchHistory = async () => (await api.get('/resume-match/history', {timeout:15000})).data.data;
export const saveResumeMatchHistory = async record => (await api.post('/resume-match/history', record, {timeout:15000})).data.data;
