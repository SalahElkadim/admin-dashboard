import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";

// Layout
import DashboardLayout from "./layouts/DashboardLayout";

// Pages
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

// جوه الـ Routes
// Placeholder pages (هنعملهم في Tasks الجاية)
const Placeholder = ({ name }) => (
  <div
    style={{
      padding: 60,
      textAlign: "center",
      color: "#94A3B8",
      fontSize: 18,
      background: "#fff",
      borderRadius: 16,
      border: "2px dashed #E2E8F0",
    }}
  >
    🚧 صفحة <strong>{name}</strong> قيد الإنشاء...
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
