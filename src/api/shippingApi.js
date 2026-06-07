// api/shippingApi.js
import api from "./axios";

export const getShippingRates = () => api.get("/shipping-rates/");

export const getShippingCost = async (governorate) => {
  const res = await getShippingRates();
  const rates = res.data.data;
  const found = rates.find((r) => r.governorate === governorate);
  return found ? Number(found.cost) : 35; // fallback
};
