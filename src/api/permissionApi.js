import axiosInstance from "./axiosInstance";
export const getAuthorizationProfile=async()=>(await axiosInstance.get("/auth/me")).data;
export const getPositionPermissions=async(id)=>(await axiosInstance.get(`/permission/position/${id}`)).data;
export const savePositionPermissions=async(id,data)=>(await axiosInstance.put(`/permission/position/${id}`,data)).data;
