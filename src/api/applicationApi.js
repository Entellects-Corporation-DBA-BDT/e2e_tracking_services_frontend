// api/candidateApi.js

import axiosInstance from "./axiosInstance";

export const getApplications = async (
  page = 1,
  limit = 10,
  search = "",
  position
) => {
  const response = await axiosInstance.get(
    `/application/list?page=${page}&limit=${limit}&search=${search}&position_id=${position}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Bench Sales By ID
|--------------------------------------------------------------------------
*/

export const getBenchSalesById = async (id) => {
  const response = await axiosInstance.get(
    `/benchsales/${id}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Bench Sales
|--------------------------------------------------------------------------
*/

export const getBenchSalesData = async (
  page = 1,
  limit = 10,
  search = ""
) => {
  const response = await axiosInstance.get(
    `/benchsales/list?page=${page}&limit=${limit}&search=${search}`
  );

  return response.data;
};

export const createBenchSalesApplication = async (formData) => {
  const response = await axiosInstance.post(
    "/benchsales/create",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


export const getDashboardSummary = async (params = {}) => {
  const response = await axiosInstance.get(
    "/application/dashboard/summary",
    { params }
  );

  return response.data?.data ?? response.data;
};

export const getRecruiterApplications = async (page = 1, limit = 10, search = "") => {
  const response = await axiosInstance.get("/recruiters/list", { params: { page, limit, search } });
  return response.data;
};

export const getRecruiterApplicationById = async (id) => {
  const response = await axiosInstance.get(`/recruiters/${id}`);
  return response.data;
};

export const createRecruiterApplication = async (formData) => {
  const response = await axiosInstance.post("/recruiters/create", formData);
  return response.data;
};

export const updateRecruiterApplication = async (id, formData) => {
  const response = await axiosInstance.put(`/recruiters/update/${id}`, formData);
  return response.data;
};

export const deleteRecruiterApplication = async (id) => {
  const response = await axiosInstance.delete(`/recruiters/delete/${id}`);
  return response.data;
};

export const updateRecruiterApplicationProcess = async (id, processId) => {
  const response = await axiosInstance.put(`/recruiters/process/${id}`, { process_id: processId });
  return response.data;
};

export const getSubmissionAnalytics = async (params = {}) => {
  const response = await axiosInstance.get(
    `/application/dashboard/submissions`,
    { params }
  );

  const payload = response.data;

  if (Array.isArray(payload)) {
    return { data: payload };
  }

  if (Array.isArray(payload?.data)) {
    return {
      data: payload.data,
      total: payload.total,
    };
  }

  if (payload?.data && typeof payload.data === "object") {
    return payload.data;
  }

  return payload || { data: [], total: 0 };
};

export const createApplication = async (formData) => {
  const response = await axiosInstance.post(
    "/application/create",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const updateBenchSalesApplication = async (id, data) => {
  console.log("Form Date", Object.fromEntries(data.entries()));

  const response = await axiosInstance.put(
    `/benchsales/update/${id}`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


export const deleteBenchSalesApplication = async (id) => {
  const response = await axiosInstance.delete(
    `/benchsales/delete/${id}`
  );

  return response.data;
};

export const getPerformanceDashboard = async () => {
  const response = await axiosInstance.get(
    "/benchsales/dashboard/performance"
  );
  return response.data;
};

export const updateApplicationProcess = async (id, processId) => {
  const response = await axiosInstance.put(
    `/benchsales/process/${id}`,
    {
      process_id: processId,
    }
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| Recent Activities`
|--------------------------------------------------------------------------
*/

export const getRecentActivities = async () => {
  const response = await axiosInstance.get(
    "/application/dashboard/recent-activities"
  );

  return response.data;
};
