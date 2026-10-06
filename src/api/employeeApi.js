import axiosInstance from "./axiosInstance";

export const getEmployees = async (params = {}) => {
  const response = await axiosInstance.get("/employees", { params });
  return response.data;
};

export const getEmployeeById = async (id) => {
  const response = await axiosInstance.get(`/employees/${id}`, {timeout:15000});
  return response.data;
};

export const getAvailableCompanyNames = async (search = "") => {
  const response = await axiosInstance.get("/employees/available-users", { params: { search } });
  return response.data;
};

export const assignCompanyName = async (employeeId, userId) => {
  const response = await axiosInstance.post(`/employees/${employeeId}/assign-company-name`, {
    user_id: userId,
  });
  return response.data;
};

export const removeCompanyName = async (employeeId) => {
  const response = await axiosInstance.put(`/employees/${employeeId}/remove-company-name`);
  return response.data;
};

export const getEmployeeAttendance = async (employeeId, params = {}) => {
  const response = await axiosInstance.get(`/employees/${employeeId}/attendance`, { params });
  return response.data;
};
export const setEmployeeAttendanceDate = async (employeeId, date, present = true) => {
  const response = await axiosInstance.put(`/employees/${employeeId}/attendance/${date}`, { present });
  return response.data;
}; 
export const createEmployee = async (data) => (await axiosInstance.post("/employees", data)).data;
export const updateEmployee = async (id, data) => (await axiosInstance.request({method: data instanceof FormData ? "post" : "put", url: `/employees/${id}`, data, timeout:120000})).data;
export const deleteEmployee = async (id) => (await axiosInstance.delete(`/employees/${id}`)).data;
export const getMyEmployeeProfile = async () => (await axiosInstance.get("/employees/me")).data;
export const getPositions = async () => (await axiosInstance.get("/position/list", { params: { page: 1, limit: 100 }, timeout:15000 })).data;
export const getTodayAttendance = async (date, self = false) => (await axiosInstance.get("/attendance/today", { params: { ...(date ? { date } : {}), ...(self ? { self: 1 } : {}) } })).data;
export const getMonthlyAttendance = async (month) => (await axiosInstance.get("/attendance/month", { params: { month } })).data;
export const getAttendanceIpPermissions = async () => (await axiosInstance.get("/attendance/ip-settings")).data;
export const updateEmployeeWfhPermission = async (employeeId, wfhAllowed) => (await axiosInstance.put(`/attendance/ip-settings/${employeeId}`, { wfh_allowed: wfhAllowed })).data;
export const clockAttendance = async (action, employeeId) =>
  (await axiosInstance.post(`/attendance/time-${action}`, { employee_id: employeeId })).data;
export const getHolidays = async (year) => (await axiosInstance.get("/attendance/holidays", { params: { year } })).data;
export const saveHoliday = async (data) => (await axiosInstance.post("/attendance/holidays", data)).data;
export const deleteHoliday = async (id) => (await axiosInstance.delete(`/attendance/holidays/${id}`)).data;
export const getLeaves = async (params = {}) => (await axiosInstance.get("/attendance/leaves", { params })).data;
export const submitLeave = async (data) => (await axiosInstance.post("/attendance/leaves", data)).data;
export const addEmployeeLeave = async (data) => (await axiosInstance.post("/attendance/leaves/admin", data)).data;
export const reviewLeave = async (id, data) => (await axiosInstance.put(`/attendance/leaves/${id}`, data)).data;
export const editAttendance = async (id, data) => (await axiosInstance.put(`/attendance/records/${id}`, data)).data;
export const getPayslipRoster = async (month) => (await axiosInstance.get("/attendance/payslips", { params: { month } })).data;
export const getPayslipDraft = async (employeeId, month) => (await axiosInstance.get(`/attendance/payslips/draft/${employeeId}`, { params: { month } })).data;
export const generatePayslip = async (data) => (await axiosInstance.post("/attendance/payslips", data)).data;
export const sendPayslip = async (id) => (await axiosInstance.post(`/attendance/payslips/${id}/send`)).data;
export const updatePayslip = async (id, data) => (await axiosInstance.put("/attendance/payslips/" + id, data)).data;
export const getMailSender = async () => (await axiosInstance.get("/attendance/mail-sender")).data;
export const saveMailSender = async (data) => (await axiosInstance.post("/attendance/mail-sender", data)).data;
export const removeMailSender = async () => (await axiosInstance.delete("/attendance/mail-sender")).data;

export const sendEmployeeOnboardingInvite = async (data) => (await axiosInstance.post('/attendance/onboarding-invites', data)).data;
export const getEmployeeOnboardingInvite = async (token) => (await axiosInstance.get('/employee-onboarding/' + token)).data;
export const submitEmployeeOnboarding = async (token,data,onUploadProgress) => (await axiosInstance.post('/employee-onboarding/' + token,data,{onUploadProgress})).data;

export const updateMonthlyAttendance = async (employeeId,data) => (await axiosInstance.put('/attendance/month/' + employeeId,data)).data;

export const downloadEmployeeDocument = async (employeeId, documentId, name) => {
  const response = await axiosInstance.get('/employees/' + employeeId + '/documents/' + documentId, {responseType:'blob'});
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url; link.download = name || 'document'; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const getEmployeeUploadLimits = async () => (await axiosInstance.get('/employees/upload-limits')).data;

export const getEmployeeOnboardingRoles = async () => (await axiosInstance.get('/attendance/onboarding-roles')).data;

export const getLeaveMailSettings = async () => (await axiosInstance.get('/attendance/leave-mail-settings')).data;
export const saveLeaveMailSettings = async data => (await axiosInstance.post('/attendance/leave-mail-settings',data)).data;

export const updateMyEmployeeProfile = async data => (await axiosInstance.post('/employees/me',data,{timeout:120000})).data;
export const downloadEmployeeOnboardingDocument = async (token,documentId,name) => {
 const response=await axiosInstance.get(`/employee-onboarding/${token}/documents/${documentId}`,{responseType:'blob'});
 const url=URL.createObjectURL(response.data);const link=document.createElement('a');link.href=url;link.download=name||'document';document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
};

export const getEmployeePhoto = async id => (await axiosInstance.get(`/employees/${id}/photo`, {responseType:"blob",timeout:15000})).data;
export const uploadEmployeePhoto = async (id,file) => {const data=new FormData();data.append("photo",file);return (await axiosInstance.post(`/employees/${id}/photo`,data,{timeout:30000})).data;};
