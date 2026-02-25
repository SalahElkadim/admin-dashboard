import axiosInstance from "./axiosInstance";

export const getCoupons = (params) =>
  axiosInstance.get("/coupons/", { params });

export const getCouponById = (id) => axiosInstance.get(`/coupons/${id}/`);

export const createCoupon = (data) => axiosInstance.post("/coupons/", data);

export const updateCoupon = (id, data) =>
  axiosInstance.put(`/coupons/${id}/`, data);

export const patchCoupon = (id, data) =>
  axiosInstance.patch(`/coupons/${id}/`, data);

export const deleteCoupon = (id) => axiosInstance.delete(`/coupons/${id}/`);

export const validateCoupon = (data) =>
  axiosInstance.post("/coupons/validate/", data);
