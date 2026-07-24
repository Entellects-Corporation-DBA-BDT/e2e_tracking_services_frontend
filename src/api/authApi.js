import axiosInstance from "./axiosInstance";
import Cookies from "js-cookie";


export const loginUser = async (loginDetails) => {
  try {
    const response = await axiosInstance.post(
      "/auth/login",
      loginDetails
    );

    const token = response?.data?.token;
    const userData = response?.data?.user;

    Cookies.set("jwtToken", token, {
      expires: 30,
    });

    localStorage.setItem(
      "userData",
      JSON.stringify(userData)
    );
    window.dispatchEvent(new CustomEvent("e2e-auth-changed", { detail: { token } }));

    const resourceResponse = await axiosInstance.get(
      "/auth/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const resources = (resourceResponse.data.resources || [])
      .filter((resource) => resource.permissions?.view);

    return {
      ...response.data,
      firstRoute: resources.find((resource) => resource.route)?.route || "/dashboard",
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMyResources = async () => {
  const response = await axiosInstance.get("/resource/my");
  return response.data.data;
};
