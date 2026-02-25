import axiosInstance from "./axiosInstance";

// ── Products ──────────────────────────────────────────────────────────────────

export const getProducts = (params = {}) =>
  axiosInstance.get("/products/", { params });

export const getProduct = (id) => axiosInstance.get(`/products/${id}/`);

export const createProduct = (data) =>
  axiosInstance.post("/products/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateProduct = (id, data) =>
  axiosInstance.patch(`/products/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteProduct = (id) => axiosInstance.delete(`/products/${id}/`);

// ── Product Images ─────────────────────────────────────────────────────────────

export const deleteProductImage = (productId, imageId) =>
  axiosInstance.delete(`/products/${productId}/images/${imageId}/`);

export const setPrimaryImage = (productId, imageId) =>
  axiosInstance.patch(`/products/${productId}/images/${imageId}/`);

// ── Product Variants ───────────────────────────────────────────────────────────

export const getProductVariants = (productId) =>
  axiosInstance.get(`/products/${productId}/variants/`);

export const getProductVariant = (productId, variantId) =>
  axiosInstance.get(`/products/${productId}/variants/${variantId}/`);

export const createProductVariant = (productId, data) =>
  axiosInstance.post(`/products/${productId}/variants/`, data);

export const updateProductVariant = (productId, variantId, data) =>
  axiosInstance.patch(`/products/${productId}/variants/${variantId}/`, data);

export const deleteProductVariant = (productId, variantId) =>
  axiosInstance.delete(`/products/${productId}/variants/${variantId}/`);

export const updateVariantStock = (productId, variantId, stock) =>
  axiosInstance.patch(`/products/${productId}/variants/${variantId}/stock/`, {
    stock,
  });

// ── Categories ────────────────────────────────────────────────────────────────

export const getCategories = (params = {}) =>
  axiosInstance.get("/categories/", { params });

export const getCategory = (id) => axiosInstance.get(`/categories/${id}/`);

export const createCategory = (data) =>
  axiosInstance.post("/categories/", data);

export const updateCategory = (id, data) =>
  axiosInstance.patch(`/categories/${id}/`, data);

export const deleteCategory = (id) =>
  axiosInstance.delete(`/categories/${id}/`);

// ── Attributes ────────────────────────────────────────────────────────────────

export const getAttributes = () => axiosInstance.get("/attributes/");

export const createAttribute = (data) =>
  axiosInstance.post("/attributes/", data);

export const getAttributeValues = (attributeId) =>
  axiosInstance.get(`/attributes/${attributeId}/values/`);

export const createAttributeValue = (attributeId, data) =>
  axiosInstance.post(`/attributes/${attributeId}/values/`, data);

export const deleteAttribute = (id) =>
  axiosInstance.delete(`/attributes/${id}/`);

export const deleteAttributeValue = (attributeId, valueId) =>
  axiosInstance.delete(`/attributes/${attributeId}/values/${valueId}/`);