/**
 * ============================================================
 *  ERP API — src/api/erpApi.js
 *  كل calls بتاعة الـ ERP في ملف واحد
 *  Base: /api/erp/
 * ============================================================
 */

import erpAxiosInstance from "./erpAxiosInstance";

const ERP = "/erp";

// ─────────────────────────────────────────────────────────────
//  MODULE 1 — SALES
// ─────────────────────────────────────────────────────────────

// Quotations
export const getQuotations = (params) =>
  erpAxiosInstance.get(`${ERP}/quotations/`, { params });
export const getQuotation = (id) =>
  erpAxiosInstance.get(`${ERP}/quotations/${id}/`);
export const createQuotation = (data) =>
  erpAxiosInstance.post(`${ERP}/quotations/`, data);
export const updateQuotation = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/quotations/${id}/`, data);
export const deleteQuotation = (id) =>
  erpAxiosInstance.delete(`${ERP}/quotations/${id}/`);
export const getQuotationItems = (qId) =>
  erpAxiosInstance.get(`${ERP}/quotations/${qId}/items/`);
export const addQuotationItem = (qId, data) =>
  erpAxiosInstance.post(`${ERP}/quotations/${qId}/items/`, data);

// Sales Orders
export const getSalesOrders = (params) =>
  erpAxiosInstance.get(`${ERP}/sales-orders/`, { params });
export const getSalesOrder = (id) =>
  erpAxiosInstance.get(`${ERP}/sales-orders/${id}/`);
export const createSalesOrder = (data) =>
  erpAxiosInstance.post(`${ERP}/sales-orders/`, data);
export const updateSalesOrder = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/sales-orders/${id}/`, data);
export const deleteSalesOrder = (id) =>
  erpAxiosInstance.delete(`${ERP}/sales-orders/${id}/`);
export const getSalesOrderItems = (orderId) =>
  erpAxiosInstance.get(`${ERP}/sales-orders/${orderId}/items/`);
export const addSalesOrderItem = (orderId, data) =>
  erpAxiosInstance.post(`${ERP}/sales-orders/${orderId}/items/`, data);

// ─────────────────────────────────────────────────────────────
//  MODULE 2 — INVENTORY
// ─────────────────────────────────────────────────────────────

export const getWarehouses = (params) =>
  erpAxiosInstance.get(`${ERP}/warehouses/`, { params });
export const getWarehouse = (id) =>
  erpAxiosInstance.get(`${ERP}/warehouses/${id}/`);
export const createWarehouse = (data) =>
  erpAxiosInstance.post(`${ERP}/warehouses/`, data);
export const updateWarehouse = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/warehouses/${id}/`, data);
export const deleteWarehouse = (id) =>
  erpAxiosInstance.delete(`${ERP}/warehouses/${id}/`);

export const getStock = (params) =>
  erpAxiosInstance.get(`${ERP}/stock/`, { params });
export const getStockItem = (id) => erpAxiosInstance.get(`${ERP}/stock/${id}/`);
export const adjustStock = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/stock/${id}/`, data);

export const getStockMovements = (params) =>
  erpAxiosInstance.get(`${ERP}/stock-movements/`, { params });

export const getStockAlerts = (params) =>
  erpAxiosInstance.get(`${ERP}/stock-alerts/`, { params });
export const createStockAlert = (data) =>
  erpAxiosInstance.post(`${ERP}/stock-alerts/`, data);
export const updateStockAlert = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/stock-alerts/${id}/`, data);
export const deleteStockAlert = (id) =>
  erpAxiosInstance.delete(`${ERP}/stock-alerts/${id}/`);

// ─────────────────────────────────────────────────────────────
//  MODULE 3 — PURCHASING
// ─────────────────────────────────────────────────────────────

export const getSuppliers = (params) =>
  erpAxiosInstance.get(`${ERP}/suppliers/`, { params });
export const getSupplier = (id) => erpAxiosInstance.get(`${ERP}/suppliers/${id}/`);
export const createSupplier = (data) =>
  erpAxiosInstance.post(`${ERP}/suppliers/`, data);
export const updateSupplier = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/suppliers/${id}/`, data);
export const deleteSupplier = (id) =>
  erpAxiosInstance.delete(`${ERP}/suppliers/${id}/`);

export const getPurchaseOrders = (params) =>
  erpAxiosInstance.get(`${ERP}/purchase-orders/`, { params });
export const getPurchaseOrder = (id) =>
  erpAxiosInstance.get(`${ERP}/purchase-orders/${id}/`);
export const createPurchaseOrder = (data) =>
  erpAxiosInstance.post(`${ERP}/purchase-orders/`, data);
export const updatePurchaseOrder = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/purchase-orders/${id}/`, data);
export const deletePurchaseOrder = (id) =>
  erpAxiosInstance.delete(`${ERP}/purchase-orders/${id}/`);
export const getPurchaseOrderItems = (poId) =>
  erpAxiosInstance.get(`${ERP}/purchase-orders/${poId}/items/`);
export const addPurchaseOrderItem = (poId, data) =>
  erpAxiosInstance.post(`${ERP}/purchase-orders/${poId}/items/`, data);

export const getGoodsReceipts = (params) =>
  erpAxiosInstance.get(`${ERP}/goods-receipts/`, { params });
export const createGoodsReceipt = (data) =>
  erpAxiosInstance.post(`${ERP}/goods-receipts/`, data);

// ─────────────────────────────────────────────────────────────
//  MODULE 4 — RETURNS
// ─────────────────────────────────────────────────────────────

export const getReturnRequests = (params) =>
  erpAxiosInstance.get(`${ERP}/returns/`, { params });
export const getReturnRequest = (id) =>
  erpAxiosInstance.get(`${ERP}/returns/${id}/`);
export const createReturnRequest = (data) =>
  erpAxiosInstance.post(`${ERP}/returns/`, data);
export const updateReturnRequest = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/returns/${id}/`, data);
export const deleteReturnRequest = (id) =>
  erpAxiosInstance.delete(`${ERP}/returns/${id}/`);
export const getReturnItems = (retId) =>
  erpAxiosInstance.get(`${ERP}/returns/${retId}/items/`);
export const addReturnItem = (retId, data) =>
  erpAxiosInstance.post(`${ERP}/returns/${retId}/items/`, data);

// ─────────────────────────────────────────────────────────────
//  MODULE 5 — FINANCE
// ─────────────────────────────────────────────────────────────

export const getExpenseCategories = () =>
  erpAxiosInstance.get(`${ERP}/expense-categories/`);
export const createExpenseCategory = (data) =>
  erpAxiosInstance.post(`${ERP}/expense-categories/`, data);
export const updateExpenseCategory = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/expense-categories/${id}/`, data);
export const deleteExpenseCategory = (id) =>
  erpAxiosInstance.delete(`${ERP}/expense-categories/${id}/`);

export const getExpenses = (params) =>
  erpAxiosInstance.get(`${ERP}/expenses/`, { params });
export const getExpense = (id) => erpAxiosInstance.get(`${ERP}/expenses/${id}/`);
export const createExpense = (data) =>
  erpAxiosInstance.post(`${ERP}/expenses/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateExpense = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/expenses/${id}/`, data);
export const deleteExpense = (id) =>
  erpAxiosInstance.delete(`${ERP}/expenses/${id}/`);

export const getRevenues = (params) =>
  erpAxiosInstance.get(`${ERP}/revenues/`, { params });
export const getRevenue = (id) => erpAxiosInstance.get(`${ERP}/revenues/${id}/`);
export const createRevenue = (data) =>
  erpAxiosInstance.post(`${ERP}/revenues/`, data);
export const updateRevenue = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/revenues/${id}/`, data);
export const deleteRevenue = (id) =>
  erpAxiosInstance.delete(`${ERP}/revenues/${id}/`);
export const bulkDeleteRevenues = (ids) =>
  erpAxiosInstance.delete(`${ERP}/revenues/bulk-delete/`, { data: { ids } });
export const getFinancialSummaries = (params) =>
  erpAxiosInstance.get(`${ERP}/financial-summaries/`, { params });

// ─────────────────────────────────────────────────────────────
//  MODULE 6 — SHIPPING
// ─────────────────────────────────────────────────────────────

export const getShippingCarriers = () =>
  erpAxiosInstance.get(`${ERP}/shipping-carriers/`);
export const createShippingCarrier = (data) =>
  erpAxiosInstance.post(`${ERP}/shipping-carriers/`, data);
export const updateShippingCarrier = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/shipping-carriers/${id}/`, data);
export const deleteShippingCarrier = (id) =>
  erpAxiosInstance.delete(`${ERP}/shipping-carriers/${id}/`);

export const getShipments = (params) =>
  erpAxiosInstance.get(`${ERP}/shipments/`, { params });
export const getShipment = (id) => erpAxiosInstance.get(`${ERP}/shipments/${id}/`);
export const createShipment = (data) =>
  erpAxiosInstance.post(`${ERP}/shipments/`, data);
export const updateShipment = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/shipments/${id}/`, data);
export const deleteShipment = (id) =>
  erpAxiosInstance.delete(`${ERP}/shipments/${id}/`);
export const getShipmentEvents = (shipId) =>
  erpAxiosInstance.get(`${ERP}/shipments/${shipId}/events/`);
export const addShipmentEvent = (shipId, data) =>
  erpAxiosInstance.post(`${ERP}/shipments/${shipId}/events/`, data);

// ─────────────────────────────────────────────────────────────
//  MODULE 7 — CRM
// ─────────────────────────────────────────────────────────────

export const getCustomerTags = () => erpAxiosInstance.get(`${ERP}/customer-tags/`);
export const createCustomerTag = (data) =>
  erpAxiosInstance.post(`${ERP}/customer-tags/`, data);
export const updateCustomerTag = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/customer-tags/${id}/`, data);
export const deleteCustomerTag = (id) =>
  erpAxiosInstance.delete(`${ERP}/customer-tags/${id}/`);

export const getERPCustomers = (params) =>
  erpAxiosInstance.get(`${ERP}/customers/`, { params });
export const getERPCustomer = (id) =>
  erpAxiosInstance.get(`${ERP}/customers/${id}/`);
export const createERPCustomer = (data) =>
  erpAxiosInstance.post(`${ERP}/customers/`, data);
export const updateERPCustomer = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/customers/${id}/`, data);
export const deleteERPCustomer = (id) =>
  erpAxiosInstance.delete(`${ERP}/customers/${id}/`);
export const getCustomerNotes = (cId) =>
  erpAxiosInstance.get(`${ERP}/customers/${cId}/notes/`);
export const addCustomerNote = (cId, data) =>
  erpAxiosInstance.post(`${ERP}/customers/${cId}/notes/`, data);

export const getCustomerSegments = (params) =>
  erpAxiosInstance.get(`${ERP}/customer-segments/`, { params });
export const createCustomerSegment = (data) =>
  erpAxiosInstance.post(`${ERP}/customer-segments/`, data);
export const updateCustomerSegment = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/customer-segments/${id}/`, data);
export const deleteCustomerSegment = (id) =>
  erpAxiosInstance.delete(`${ERP}/customer-segments/${id}/`);

// ─────────────────────────────────────────────────────────────
//  MODULE 8 — REPORTS
// ─────────────────────────────────────────────────────────────

export const getReports = (params) =>
  erpAxiosInstance.get(`${ERP}/reports/`, { params });
export const getReport = (id) => erpAxiosInstance.get(`${ERP}/reports/${id}/`);
export const createReport = (data) =>
  erpAxiosInstance.post(`${ERP}/reports/`, data);
export const deleteReport = (id) =>
  erpAxiosInstance.delete(`${ERP}/reports/${id}/`);

// ─────────────────────────────────────────────────────────────
//  MODULE 9 — HR
// ─────────────────────────────────────────────────────────────

export const getDepartments = () => erpAxiosInstance.get(`${ERP}/departments/`);
export const createDepartment = (data) =>
  erpAxiosInstance.post(`${ERP}/departments/`, data);
export const updateDepartment = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/departments/${id}/`, data);
export const deleteDepartment = (id) =>
  erpAxiosInstance.delete(`${ERP}/departments/${id}/`);

export const getEmployees = (params) =>
  erpAxiosInstance.get(`${ERP}/employees/`, { params });
export const getEmployee = (id) => erpAxiosInstance.get(`${ERP}/employees/${id}/`);
export const createEmployee = (data) =>
  erpAxiosInstance.post(`${ERP}/employees/`, data);
export const updateEmployee = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/employees/${id}/`, data);
export const deleteEmployee = (id) =>
  erpAxiosInstance.delete(`${ERP}/employees/${id}/`);

export const getAttendance = (params) =>
  erpAxiosInstance.get(`${ERP}/attendance/`, { params });
export const createAttendance = (data) =>
  erpAxiosInstance.post(`${ERP}/attendance/`, data);
export const updateAttendance = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/attendance/${id}/`, data);
export const deleteAttendance = (id) =>
  erpAxiosInstance.delete(`${ERP}/attendance/${id}/`);

export const getLeaveRequests = (params) =>
  erpAxiosInstance.get(`${ERP}/leave-requests/`, { params });
export const createLeaveRequest = (data) =>
  erpAxiosInstance.post(`${ERP}/leave-requests/`, data);
export const updateLeaveRequest = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/leave-requests/${id}/`, data);
export const deleteLeaveRequest = (id) =>
  erpAxiosInstance.delete(`${ERP}/leave-requests/${id}/`);

export const getSalesTargets = (params) =>
  erpAxiosInstance.get(`${ERP}/sales-targets/`, { params });
export const createSalesTarget = (data) =>
  erpAxiosInstance.post(`${ERP}/sales-targets/`, data);
export const updateSalesTarget = (id, data) =>
  erpAxiosInstance.patch(`${ERP}/sales-targets/${id}/`, data);
export const deleteSalesTarget = (id) =>
  erpAxiosInstance.delete(`${ERP}/sales-targets/${id}/`);
