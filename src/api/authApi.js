import axiosInstance from "./axiosInstance";

export const loginApi = (email, password) =>
  axiosInstance.post("/auth/login/", { email, password });

export const logoutApi = (refreshToken) =>
  axiosInstance.post("/auth/logout/", { refresh: refreshToken });

export const getMeApi = () => axiosInstance.get("/auth/me/");

export const updateMeApi = (data) => axiosInstance.patch("/auth/me/", data);

export const changePasswordApi = (data) =>
  axiosInstance.post("/auth/change-password/", data);
