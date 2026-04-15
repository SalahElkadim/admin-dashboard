import axiosInstance from "./axiosInstance";

export const getCustomers = (params) =>
  axiosInstance.get("/customers/", { params });

export const getCustomerById = (id) => axiosInstance.get(`/customers/${id}/`);

export const getCustomer = (id) => axiosInstance.get(`/customers/${id}/`);

export const toggleBlockCustomer = (id) =>
  axiosInstance.post(`/customers/${id}/block/`);

export const getAdmins = (params) => axiosInstance.get("/admins/", { params });

export const createAdmin = (data) => axiosInstance.post("/admins/", data);

export const getRoles = () => axiosInstance.get("/roles/");

export const createRole = (data) => axiosInstance.post("/roles/", data);
