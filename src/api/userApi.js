import axiosInstance from "./axiosInstance";
export const getUsers=async(params={})=>(await axiosInstance.get("/user/list",{params})).data;
export const createUser=async(data)=>(await axiosInstance.post("/user/register",data)).data;
export const updateUser=async(id,data)=>(await axiosInstance.put(`/user/update/${id}`,data)).data;
export const deleteUser=async(id)=>(await axiosInstance.delete(`/user/delete/${id}`)).data;
