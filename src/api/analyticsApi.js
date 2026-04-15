import axiosInstance from "./axiosInstance";

const analyticsApi = {
  getStats: (params) => axiosInstance.get("/dashboard/stats/", { params }),

  getAnalytics: (params) =>
    axiosInstance.get("/dashboard/analytics/", { params }),

  getInventoryAlerts: (params) =>
    axiosInstance.get("/dashboard/inventory-alerts/", { params }),
};

export const { getStats, getAnalytics, getInventoryAlerts } = analyticsApi;
export default analyticsApi;
