import axiosInstance from "./axiosInstance";

// جيب تنبيهات المخزون (all | low | out)
export const getInventoryAlerts = (type = "all") =>
  axiosInstance.get("/dashboard/inventory-alerts/", { params: { type } });

// جيب الـ variants بتاعت منتج معين
export const getProductVariants = (productId) =>
  axiosInstance.get(`/products/${productId}/variants/`);

// عدّل الـ stock لـ variant معين
export const updateVariantStock = (productId, variantId, stock) =>
  axiosInstance.patch(`/products/${productId}/variants/${variantId}/stock/`, {
    stock,
  });
