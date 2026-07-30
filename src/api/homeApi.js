import axiosInstance from "./axiosInstance";
export const getPublicHomeSummary = async () => (await axiosInstance.get("/home/summary")).data;