import axiosInstance from "./axiosInstance";
export const getAuthorizationProfile=async()=>(await axiosInstance.get("/auth/me")).data;
export const getPositionPermissions=async(id)=>(await axiosInstance.get(`/permission/position/${id}`)).data;
export const savePositionPermissions=async(id,data)=>(await axiosInstance.put(`/permission/position/${id}`,data)).data;
export const getUserPermissions=async(id)=>(await axiosInstance.get(`/permission/user/${id}`)).data;
export const saveUserPermissions=async(id,data)=>(await axiosInstance.put(`/permission/user/${id}`,data)).data;
export const resetUserPermissions=async(id)=>(await axiosInstance.delete(`/permission/user/${id}`)).data;