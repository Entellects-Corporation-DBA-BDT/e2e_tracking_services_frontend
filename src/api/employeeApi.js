import axiosInstance from "./axiosInstance";

export const getEmployees = async (params = {}) => {
  const response = await axiosInstance.get("/employees", { params });
  return response.data;
};

export const getEmployeeById = async (id) => {
  const response = await axiosInstance.get(`/employees/${id}`);
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
export const updateEmployee = async (id, data) => (await axiosInstance.put(`/employees/${id}`, data)).data;
export const deleteEmployee = async (id) => (await axiosInstance.delete(`/employees/${id}`)).data;
export const getMyEmployeeProfile = async () => (await axiosInstance.get("/employees/me")).data;
export const getPositions = async () => (await axiosInstance.get("/position/list", { params: { page: 1, limit: 100 } })).data;
export const getTodayAttendance = async () => (await axiosInstance.get("/attendance/today")).data;
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
