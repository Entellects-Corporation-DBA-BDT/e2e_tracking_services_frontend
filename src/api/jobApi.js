// src/api/jobApi.js

import axiosInstance from "./axiosInstance";

/*
|--------------------------------------------------------------------------
| Jobs List
|--------------------------------------------------------------------------
*/

export const getJobsData = async (
  page = 1,
  limit = 10,
  search = ""
) => {
  const response = await axiosInstance.get(
    `/jobs/list?page=${page}&limit=${limit}&search=${search}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Job By ID
|--------------------------------------------------------------------------
*/

export const getJobById = async (id) => {
  const response = await axiosInstance.get(
    `/jobs/${id}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Create Job
|--------------------------------------------------------------------------
*/

export const createJob = async (formData) => {
  const response = await axiosInstance.post(
    "/jobs/create",
    formData
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Update Job
|--------------------------------------------------------------------------
*/

export const updateJob = async (id, formData) => {
  const response = await axiosInstance.put(
    `/jobs/update/${id}`,
    formData
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Delete Job
|--------------------------------------------------------------------------
*/

export const deleteJob = async (id) => {
  const response = await axiosInstance.delete(
    `/jobs/delete/${id}`
  );

  return response.data;
};

export const matchCandidates = async (jobId) => {

  const response = await axiosInstance.post(
    `/matching/start/${jobId}`
  );

  return response.data;

};

export const getMatchedCandidates = async (jobId) => {

  const response = await axiosInstance.get(
    `/matching/job/${jobId}`
  );

  return response.data;

};
