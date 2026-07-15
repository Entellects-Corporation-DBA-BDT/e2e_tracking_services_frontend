import axios from "axios";
import { baseUrl } from "../Config/env";
import Cookies from "js-cookie";

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
    const publicRoutes = ["/login", "/register", "/send-otp", "/verify-otp"];

    if (token && !publicRoutes.includes(config.url)) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


export default axiosInstance;
