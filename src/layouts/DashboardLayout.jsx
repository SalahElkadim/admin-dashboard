import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Button,
  Typography,
  Space,
  Tooltip,
  Modal,
  Input,
  Spin,
  Empty,
  Divider,
} from "antd";
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  TagOutlined,
  BarChartOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  SearchOutlined,
  AppstoreOutlined,
  InboxOutlined,
  BuildOutlined,
} from "@ant-design/icons";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";
import { getProducts } from "../api/productsApi";
import { getOrders } from "../api/ordersapi";
import { getCustomers } from "../api/customersApi";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "الداشبورد" },
  { key: "/categories", icon: <AppstoreOutlined />, label: "الفئات" },
  { key: "/products", icon: <ShoppingOutlined />, label: "المنتجات" },
  { key: "/attributes", icon: <BuildOutlined />, label: "الخصائص" },
  { key: "/inventory", icon: <InboxOutlined />, label: "المخزون" },
  { key: "/orders", icon: <ShoppingCartOutlined />, label: "الطلبات" },
  { key: "/customers", icon: <UserOutlined />, label: "العملاء" },
  { key: "/coupons", icon: <TagOutlined />, label: "الكوبونات" },
  { key: "/analytics", icon: <BarChartOutlined />, label: "التحليلات" },
  { key: "/notifications", icon: <BellOutlined />, label: "الإشعارات" },
  { key: "/settings", icon: <SettingOutlined />, label: "الإعدادات" },
];

// ── Global Search Modal ───────────────────────────────────────────────────────

function SearchModal({ open, onClose, navigate }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    products: [],
    orders: [],
    customers: [],
  });

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults({ products: [], orders: [], customers: [] });
      return;
    }
    setLoading(true);
    try {
      const [pRes, oRes, cRes] = await Promise.allSettled([
        getProducts({ search: q, page_size: 4 }),
        getOrders({ search: q, page_size: 4 }),
        getCustomers({ search: q, page_size: 4 }),
      ]);

      const extract = (res) => {
        if (res.status !== "fulfilled") return [];
        const d = res.value.data;
        return d?.results ?? d?.data?.results ?? d?.data ?? [];
      };

      setResults({
        products: extract(pRes),
        orders: extract(oRes),
        customers: extract(cRes),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce 400ms
  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ products: [], orders: [], customers: [] });
    }
  }, [open]);

  const goTo = (path) => {
    navigate(path);
    onClose();
  };

  const hasResults =
    results.products.length + results.orders.length + results.customers.length >
    0;

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 20px",
    cursor: "pointer",
    transition: "background .15s",
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={580}
      style={{ direction: "rtl", top: 80 }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Input */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
        <Input
          autoFocus
          prefix={<SearchOutlined style={{ color: "#94A3B8", fontSize: 16 }} />}
          placeholder="ابحث في المنتجات، الطلبات، العملاء..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          bordered={false}
          size="large"
          style={{ fontSize: 15 }}
          suffix={loading && <Spin size="small" />}
        />
      </div>

      {/* Results */}
      <div style={{ maxHeight: 460, overflowY: "auto", padding: "8px 0" }}>
        {!query.trim() ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <SearchOutlined
              style={{
                fontSize: 40,
                color: "#CBD5E1",
                display: "block",
                marginBottom: 8,
              }}
            />
            <Text style={{ color: "#94A3B8", fontSize: 13 }}>
              ابدأ الكتابة للبحث...
            </Text>
          </div>
        ) : loading ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <Spin />
          </div>
        ) : !hasResults ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text style={{ color: "#94A3B8" }}>
                لا توجد نتائج لـ "{query}"
              </Text>
            }
            style={{ padding: "24px 0" }}
          />
        ) : (
          <>
            {/* ── Products ── */}
            {results.products.length > 0 && (
              <div>
                <Text
                  style={{
                    display: "block",
                    padding: "8px 20px 4px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94A3B8",
                    letterSpacing: 1,
                  }}
                >
                  المنتجات
                </Text>
                {results.products.map((p) => (
                  <div
                    key={p.id}
                    style={rowStyle}
                    onClick={() => goTo("/products")}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F8FAFC")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Avatar
                      shape="square"
                      size={36}
                      src={p.images?.[0]?.image}
                      style={{
                        borderRadius: 8,
                        background: "#EEF2FF",
                        flexShrink: 0,
                      }}
                    >
                      <ShoppingOutlined style={{ color: "#6366F1" }} />
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          display: "block",
                        }}
                        ellipsis
                      >
                        {p.name}
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                        {p.category_name} · {p.price}
                      </Text>
                    </div>
                    <Text
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background:
                          p.status === "active" ? "#F0FDF4" : "#F8FAFC",
                        color: p.status === "active" ? "#10B981" : "#94A3B8",
                        border: `1px solid ${
                          p.status === "active" ? "#BBF7D0" : "#E2E8F0"
                        }`,
                      }}
                    >
                      {p.status === "active" ? "نشط" : "غير نشط"}
                    </Text>
                  </div>
                ))}
              </div>
            )}

            {results.products.length > 0 && results.orders.length > 0 && (
              <Divider style={{ margin: "4px 0" }} />
            )}

            {/* ── Orders ── */}
            {results.orders.length > 0 && (
              <div>
                <Text
                  style={{
                    display: "block",
                    padding: "8px 20px 4px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94A3B8",
                    letterSpacing: 1,
                  }}
                >
                  الطلبات
                </Text>
                {results.orders.map((o) => (
                  <div
                    key={o.id}
                    style={rowStyle}
                    onClick={() => goTo("/orders")}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F8FAFC")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: "#FFF7ED",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ShoppingCartOutlined style={{ color: "#F59E0B" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          display: "block",
                        }}
                      >
                        #{o.order_number}
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                        {o.customer_name} · {o.total_price}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.orders.length > 0 && results.customers.length > 0 && (
              <Divider style={{ margin: "4px 0" }} />
            )}

            {/* ── Customers ── */}
            {results.customers.length > 0 && (
              <div>
                <Text
                  style={{
                    display: "block",
                    padding: "8px 20px 4px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94A3B8",
                    letterSpacing: 1,
                  }}
                >
                  العملاء
                </Text>
                {results.customers.map((c) => (
                  <div
                    key={c.id}
                    style={rowStyle}
                    onClick={() => goTo("/customers")}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F8FAFC")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Avatar
                      size={36}
                      src={c.avatar}
                      style={{ background: "#6366F1", flexShrink: 0 }}
                    >
                      {c.full_name?.[0]}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          display: "block",
                        }}
                      >
                        {c.full_name}
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                        {c.email}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid #F1F5F9" }}>
        <Text style={{ color: "#CBD5E1", fontSize: 11 }}>
          ESC للإغلاق · Ctrl+K لفتح البحث
        </Text>
      </div>
    </Modal>
  );
}

// ── Dashboard Layout ──────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshToken } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Ctrl+K لفتح البحث
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      const { logoutApi } = await import("../api/authApi");
      await logoutApi(refreshToken);
    } catch {
      /* silent */
    }
    logout();
    navigate("/login");
  };

  const userMenu = {
    items: [
      { key: "profile", icon: <SettingOutlined />, label: "الإعدادات" },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "تسجيل الخروج",
        danger: true,
      },
    ],
    onClick: ({ key }) => {
      if (key === "logout") handleLogout();
    },
  };

  return (
    <Layout style={{ minHeight: "100vh", direction: "rtl" }}>
      {/* ─── SIDEBAR ─── */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: "#0F172A",
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? 0 : "0 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AppstoreOutlined style={{ color: "#fff", fontSize: 18 }} />
          </div>
          {!collapsed && (
            <Text
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "-0.3px",
                whiteSpace: "nowrap",
              }}
            >
              Admin Panel
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={NAV_ITEMS.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          style={{
            background: "transparent",
            border: "none",
            padding: "12px 8px",
          }}
          theme="dark"
        />

        {!collapsed && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <Space>
              <Avatar
                size={34}
                src={user?.avatar}
                style={{ background: "#6366F1", flexShrink: 0 }}
              >
                {user?.name?.[0] || "A"}
              </Avatar>
              <div style={{ lineHeight: 1.3, overflow: "hidden" }}>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    display: "block",
                  }}
                >
                  {user?.name || "Admin"}
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                  {user?.role || "admin"}
                </Text>
              </div>
            </Space>
          </div>
        )}
      </Sider>

      {/* ─── MAIN AREA ─── */}
      <Layout
        style={{
          marginRight: collapsed ? 80 : 240,
          transition: "margin-right 0.2s",
          background: "#F8FAFC",
        }}
      >
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 99,
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 0 #E2E8F0",
            height: 64,
          }}
        >
          <Space size={16}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, color: "#475569" }}
            />
            <Text style={{ color: "#94A3B8", fontSize: 13 }}>
              {NAV_ITEMS.find((i) => i.key === location.pathname)?.label ||
                "الداشبورد"}
            </Text>
          </Space>

          <Space size={8}>
            <Tooltip title="بحث (Ctrl+K)">
              <Button
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setSearchOpen(true)}
                style={{ color: "#475569" }}
              />
            </Tooltip>

            <Tooltip title="الإشعارات">
              <Badge count={unreadCount} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{ color: "#475569" }}
                  onClick={() => navigate("/notifications")}
                />
              </Badge>
            </Tooltip>

            <Dropdown menu={userMenu} placement="bottomLeft" arrow>
              <div
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Avatar
                  size={34}
                  src={user?.avatar}
                  style={{ background: "#6366F1" }}
                >
                  {user?.name?.[0] || "A"}
                </Avatar>
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 24, minHeight: "calc(100vh - 64px)" }}>
          <Outlet />
        </Content>
      </Layout>

      {/* ✅ Search Modal */}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        navigate={navigate}
      />
    </Layout>
  );
}
