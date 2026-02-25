import axiosInstance from "./axiosInstance";

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (params = {}) =>
  axiosInstance.get("/notifications/", { params });

export const markNotificationRead = (id) =>
  axiosInstance.post(`/notifications/${id}/mark-read/`);

export const markAllNotificationsRead = () =>
  axiosInstance.post("/notifications/mark-all-read/");

export const getUnreadCount = () =>
  axiosInstance.get("/notifications/unread-count/");

// ── Activity Log ──────────────────────────────────────────────────────────────
export const getActivityLogs = (params = {}) =>
  axiosInstance.get("/activity-logs/", { params });
