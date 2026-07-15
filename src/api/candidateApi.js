import axiosInstance from "./axiosInstance";

/*
|--------------------------------------------------------------------------
| Candidate List
|--------------------------------------------------------------------------
*/

export const getCandidateData = async (
  page = 1,
  limit = 10,
  search = ""
) => {
  const response = await axiosInstance.get(
    `/candidate/list?page=${page}&limit=${limit}&search=${search}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Candidate By ID
|--------------------------------------------------------------------------
*/

export const getCandidateById = async (id) => {
  const response = await axiosInstance.get(
    `/candidate/${id}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Create Candidate
|--------------------------------------------------------------------------
*/

export const createCandidate = async (formData) => {
  const response = await axiosInstance.post(
    "/candidate/create",
    formData
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Update Candidate
|--------------------------------------------------------------------------
*/

export const updateCandidate = async (id, formData) => {
  // PHP does not populate $_POST/$_FILES for multipart PUT requests.
  // The backend explicitly accepts POST for multipart candidate updates.
  const response = await axiosInstance.post(
    `/candidate/update/${id}`,
    formData
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Delete Candidate
|--------------------------------------------------------------------------
*/

export const deleteCandidate = async (id) => {
  const response = await axiosInstance.delete(
    `/candidate/delete/${id}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Candidate-to-Job AI Matching
|--------------------------------------------------------------------------
*/

export const matchSuitableJobs = async (candidateId) => {
  const response = await axiosInstance.post(
    `/matching/candidate/start/${candidateId}`
  );

  return response.data;
};

export const getMatchedJobs = async (candidateId) => {
  const response = await axiosInstance.get(
    `/matching/candidate/${candidateId}`
  );

  return response.data;
};
