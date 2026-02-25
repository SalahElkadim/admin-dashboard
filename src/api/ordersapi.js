import axiosInstance from "./axiosInstance";

export const getOrders = (params = {}) =>
  axiosInstance.get("/orders/", { params });

export const getOrder = (id) => axiosInstance.get(`/orders/${id}/`);

export const updateOrderStatus = (id, data) =>
  axiosInstance.patch(`/orders/${id}/status/`, data);

export const getOrderStats = () => axiosInstance.get("/orders/stats/");

export const exportOrders = (params = {}) =>
  axiosInstance.get("/orders/export/", {
    params,
    responseType: "blob",
  });
