import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import ERPLayout from "./layouts/ERPLayout";

// ── Dashboard Pages ───────────────────────────────────────────
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/Dashboardpage";
import ProductsPage from "./pages/products/Productspage";
import OrdersPage from "./pages/orders/OrdersPage";
import CustomersPage from "./pages/customers/Customerspage";
import CouponsPage from "./pages/coupons/Couponspage";
import AnalyticsPage from "./pages/analytics/Analyticspage";
import NotificationsPage from "./pages/notifications/Notificationspage";
import SettingsPage from "./pages/settings/Settingspage";
import CategoriesPage from "./pages/categories/CategoriesPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import AttributesPage from "./pages/attributes/AttributesPage";

// ── ERP Pages ─────────────────
import SalesOrdersPage from "./pages/erp/sales/SalesOrdersPage";
import WarehousesPage from "./pages/erp/inventory/WarehousesPage";
import StockPage from "./pages/erp/inventory/StockPage";
import StockMovementsPage from "./pages/erp/inventory/StockMovementsPage";
import SuppliersPage from "./pages/erp/purchasing/SuppliersPage";
import PurchaseOrdersPage from "./pages/erp/purchasing/PurchaseOrdersPage";
import GoodsReceiptsPage from "./pages/erp/purchasing/GoodsReceiptsPage";
import ReturnsPage from "./pages/erp/returns/ReturnsPage";
import ExpensesPage from "./pages/erp/finance/ExpensesPage";
import RevenuesPage from "./pages/erp/finance/RevenuesPage";
import FinancialSummaryPage from "./pages/erp/finance/FinancialSummaryPage";
import ShipmentsPage from "./pages/erp/Shipment/ShipmentsPage";
import ShippingCarriersPage from "./pages/erp/Shipment/ShippingCarriersPage";
import CustomerSegmentsPage from "./pages/erp/customers/CustomerSegmentsPage";
import ERPCustomersPage from "./pages/erp/customers/ERPCustomersPage";
import HRPage from "./pages/erp/hr/HRPage";
import ReportsPage from "./pages/erp/reports/ReportsPage";
import QuotationsPage from "./pages/erp/sales/QuotationsPage";

// ── Protected Route ───────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* ══ DASHBOARD ══════════════════════════════════════ */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="attributes" element={<AttributesPage />} />
        </Route>

        {/* ══ ERP ════════════════════════════════════════════ */}
        <Route
          path="/erp"
          element={
            <ProtectedRoute>
              <ERPLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect */}
          <Route index element={<Navigate to="/erp/sales-orders" replace />} />
          {/* Sales */}
          <Route
            path="sales-orders"
            element={<SalesOrdersPage name="طلبات المبيعات" />}
          />
          <Route path="quotations" element={<QuotationsPage />} />

          {/* Inventory */}
          <Route
            path="warehouses"
            element={<WarehousesPage name="المخازن" />}
          />
          <Route path="stock" element={<StockPage name="المخزون" />} />
          <Route
            path="stock-movements"
            element={<StockMovementsPage name="حركات المخزون" />}
          />
          {/* Purchasing */}
          <Route path="suppliers" element={<SuppliersPage name="الموردين" />} />
          <Route
            path="purchase-orders"
            element={<PurchaseOrdersPage name="طلبات الشراء" />}
          />
          <Route
            path="goods-receipts"
            element={<GoodsReceiptsPage name="البضائع" />}
          />
          {/* Returns */}
          <Route path="returns" element={<ReturnsPage />} />
          {/* Finance */}
          <Route path="expenses" element={<ExpensesPage name="المصروفات" />} />
          <Route path="revenues" element={<RevenuesPage name="الإيرادات" />} />
          <Route
            path="financial-summaries"
            element={<FinancialSummaryPage name="الملخص المالي" />}
          />
          {/* Shipping */}
          <Route path="shipments" element={<ShipmentsPage name="الشحنات" />} />
          <Route
            path="shipping-carriers"
            element={<ShippingCarriersPage name="شركات الشحن" />}
          />
          {/* CRM */}
          <Route
            path="customers"
            element={<ERPCustomersPage name="العملاء" />}
          />
          <Route
            path="customer-segments"
            element={<CustomerSegmentsPage name="شرائح العملاء" />}
          />
          {/* HR */}
          <Route path="employees" element={<HRPage name="الموظفين" />} />
          {/* Reports */}
          <Route path="reports" element={<ReportsPage name="التقارير" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
