import axiosInstance from "./axiosInstance";

export const getPrimeVendors = async (page = 1, limit = 10, search = "") => {
  const response = await axiosInstance.get("/primevendors/list", {
    params: { page, limit, search },
  });
  return response.data;
};

export const getPrimeVendorById = async (id) => {
  const response = await axiosInstance.get(`/primevendors/${id}`);
  return response.data;
};

export const createPrimeVendor = async (data) => {
  const response = await axiosInstance.post("/primevendors/create", data, {
    headers:
      data instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
  });
  return response.data;
};

export const updatePrimeVendor = async (id, data) => {
  const isMultipart = data instanceof FormData;
  const response = isMultipart
    ? await axiosInstance.post(`/primevendors/update/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    : await axiosInstance.put(`/primevendors/update/${id}`, data);
  return response.data;
};

export const deletePrimeVendor = async (id) => {
  const response = await axiosInstance.delete(`/primevendors/delete/${id}`);
  return response.data;
};
