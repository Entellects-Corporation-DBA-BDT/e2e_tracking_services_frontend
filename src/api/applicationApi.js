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


export const getDashboardSummary = async () => {
  const response = await axiosInstance.get(
    "/application/dashboard/summary"
  );

  return response.data.data;
};

export const getSubmissionAnalytics = async (
  startDate,
  endDate,
  category = "benchsales"
) => {
  const response = await axiosInstance.get(
    `/application/dashboard/submissions`,
    {
      params: {
        start_date: startDate,
        end_date: endDate,
        category,
      },
    }
  );

  return response.data;
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