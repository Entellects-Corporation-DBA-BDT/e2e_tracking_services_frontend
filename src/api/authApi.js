import axiosInstance from "./axiosInstance";
import Cookies from "js-cookie";
import {notifySessionChanged,sessionCookieOptions,SELF_PROFILE_PATH} from '../auth/session';


export const loginUser = async (loginDetails) => {
  try {
    const response = await axiosInstance.post(
      "/auth/login",
      loginDetails
    );

    const token = response?.data?.token;
    const userData = response?.data?.user;

    if(typeof token!=='string'||!token.trim())throw new Error('The server did not return a valid session. Please try again.');
    Cookies.set("jwtToken", token, sessionCookieOptions(token));

    try{localStorage.setItem(
      "userData",
      JSON.stringify(userData)
    );}catch(_error){}
    notifySessionChanged();

    return {
      ...response.data,
      firstRoute: SELF_PROFILE_PATH,
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMyResources = async () => {
  const response = await axiosInstance.get("/resource/my");
  return response.data.data;
};
