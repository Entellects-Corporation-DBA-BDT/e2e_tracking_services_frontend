import axiosInstance from "./axiosInstance";

export const getDocumentReminders = async (filters = {}) => {
  const response = await axiosInstance.get("/document-reminders", { params: filters });
  return response.data;
};

export const exportDocumentReminders = async (filters = {}) => {
  const response = await axiosInstance.get("/document-reminders/export", { params: filters, responseType: "blob" });
  return response.data;
};
export const getDocumentReminder = async (id) => {
  const response = await axiosInstance.get(`/document-reminders/${id}`);
  return response.data;
};

export const uploadCandidateDocument = async (formData) => {
  const response = await axiosInstance.post("/document-reminders/documents/upload", formData);
  return response.data;
};

export const createManualReminder = async (documentId, expiryDate) => {
  const response = await axiosInstance.post(`/document-reminders/documents/${documentId}/manual`, {
    expiry_date: expiryDate,
  });
  return response.data;
};

export const updateDocumentReminder = async (id, data) => {
  const response = await axiosInstance.put(`/document-reminders/${id}/edit`, data);
  return response.data;
};

export const sendDocumentReminderNow = async (id) => {
  const response = await axiosInstance.post(`/document-reminders/${id}/send`);
  return response.data;
};

export const disableDocumentReminder = async (id) => {
  const response = await axiosInstance.post(`/document-reminders/${id}/disable`);
  return response.data;
};

export const getDocumentReminderDashboard = async () => {
  const response = await axiosInstance.get("/document-reminders/dashboard");
  return response.data;
};
