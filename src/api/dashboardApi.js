import axiosInstance from "./axiosInstance";

export const getDashboardStats = (period = 30) =>
  axiosInstance.get(`/dashboard/stats/?period=${period}`);

export const getInventoryAlerts = (type = "all") =>
  axiosInstance.get(`/dashboard/inventory-alerts/?type=${type}`);
