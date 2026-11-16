import axios from "axios";
import { baseUrl } from "../Config/env";
import Cookies from "js-cookie";
import {clearAuthSession} from '../auth/session';

const axiosInstance = axios.create({
  baseURL: baseUrl,
});

axiosInstance.interceptors.request.use( 
  (config) => {
    const token = Cookies.get("jwtToken");

    // Let the browser add the multipart boundary for file uploads.
    // Axios will still set application/json automatically for plain objects.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (typeof config.headers?.delete === "function") {
        config.headers.delete("Content-Type");
      } else if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    // Allow these public routes without token
    const publicRoutes = ["/auth/login", "/auth/register", "/login", "/register", "/send-otp", "/verify-otp"];

    if (token && !publicRoutes.includes(config.url?.split('?')[0]) && !config.headers?.Authorization) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(response=>response,error=>{
 const status=error?.response?.status,message=error?.response?.data?.error;
 const sent=error?.config?.headers?.Authorization||error?.config?.headers?.get?.('Authorization');
 if(sent&&(status===401||(status===403&&['Invalid token','User is inactive','Position is inactive'].includes(message))))clearAuthSession(String(sent).replace(/^Bearer\s+/i,''));
 return Promise.reject(error);
});


export default axiosInstance;
