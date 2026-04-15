import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Typography,
  Space,
  Tooltip,
  Badge,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ShoppingOutlined,
  RollbackOutlined,
  DollarOutlined,
  CarOutlined,
  TeamOutlined,
  BarChartOutlined,
  UsergroupAddOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

// ── Color System ──────────────────────────────────────────────────────────────
const C = {
  // Greens – main palette
  g900: "#064E3B", // darkest – sidebar bg
  g800: "#065F46", // sidebar hover / pressed
  g700: "#047857", // active item bg
  g600: "#059669", // accent / logo gradient end
  g500: "#10B981", // brand / primary
  g400: "#34D399", // highlight / icon accent
  g300: "#6EE7B7", // subtle glow
  g200: "#A7F3D0", // very light tint
  g100: "#D1FAE5", // background tint
  g50: "#ECFDF5", // page background

  // Neutrals (green-tinted)
  dark: "#0A1A14", // text on dark
  mid: "#64748B",
  light: "#94A3B8",
  muted: "#CBD5E1",
  white: "#FFFFFF",

  // Header
  headerBg: "#FFFFFF",
  headerBorder: "#E2F5EE",

  // Content
  contentBg: "#F0FDF8",
};

// ── ERP Navigation Groups ─────────────────────────────────────────────────────
const ERP_NAV = [
  {
    type: "group",
    label: "المبيعات",
    children: [
      {
        key: "/erp/sales-orders",
        icon: <ShoppingCartOutlined />,
        label: "المبيعات",
      },
      {
        key: "/erp/quotations",
        icon: <ShoppingOutlined />,
        label: "عروض الأسعار",
      },
    ],
  },
  {
    type: "group",
    label: "المخزون",
    children: [
      { key: "/erp/warehouses", icon: <InboxOutlined />, label: "المستودعات" },
      { key: "/erp/stock", icon: <DashboardOutlined />, label: "المخزون" },
      {
        key: "/erp/stock-movements",
        icon: <BarChartOutlined />,
        label: "حركات المخزون",
      },
    ],
  },
  {
    type: "group",
    label: "المشتريات",
    children: [
      {
        key: "/erp/suppliers",
        icon: <UsergroupAddOutlined />,
        label: "الموردين",
      },
      {
        key: "/erp/purchase-orders",
        icon: <ShoppingOutlined />,
        label: "المشتريات",
      },
      {
        key: "/erp/goods-receipts",
        icon: <InboxOutlined />,
        label: "استلام البضاعة",
      },
    ],
  },
  {
    type: "group",
    label: "المرتجعات",
    children: [
      { key: "/erp/returns", icon: <RollbackOutlined />, label: "المرتجعات" },
    ],
  },
  {
    type: "group",
    label: "المالية",
    children: [
      { key: "/erp/expenses", icon: <DollarOutlined />, label: "المصروفات" },
      { key: "/erp/revenues", icon: <BarChartOutlined />, label: "الإيرادات" },
      {
        key: "/erp/financial-summaries",
        icon: <DashboardOutlined />,
        label: "الملخص المالي",
      },
    ],
  },
  {
    type: "group",
    label: "الشحن",
    children: [
      { key: "/erp/shipments", icon: <CarOutlined />, label: "الشحنات" },
      {
        key: "/erp/shipping-carriers",
        icon: <CarOutlined />,
        label: "شركات الشحن",
      },
    ],
  },
  {
    type: "group",
    label: "CRM",
    children: [
      { key: "/erp/customers", icon: <TeamOutlined />, label: "العملاء" },
      {
        key: "/erp/customer-segments",
        icon: <UsergroupAddOutlined />,
        label: "الشرائح",
      },
    ],
  },
  {
    type: "group",
    label: "الموارد البشرية",
    children: [
      { key: "/erp/employees", icon: <TeamOutlined />, label: "الموظفين" },
    ],
  },
  {
    type: "group",
    label: "التقارير",
    children: [
      { key: "/erp/reports", icon: <BarChartOutlined />, label: "التقارير" },
    ],
  },
];

const ALL_ITEMS = ERP_NAV.flatMap((g) => g.children);

// ── Injected global styles ────────────────────────────────────────────────────
const GLOBAL_CSS = `
  /* Sidebar menu – base item */
  .erp-sider .ant-menu-item {
    color: rgba(255,255,255,0.82) !important;
    border-radius: 8px !important;
    margin: 1px 0 !important;
    height: 38px !important;
    line-height: 38px !important;
    transition: background 0.18s, color 0.18s !important;
  }
  .erp-sider .ant-menu-item:hover {
    background: ${C.g800} !important;
    color: ${C.white} !important;
  }
  /* Active / selected item */
  .erp-sider .ant-menu-item-selected {
    background: linear-gradient(90deg, ${C.g600} 0%, ${C.g500} 100%) !important;
    color: ${C.white} !important;
    box-shadow: 0 2px 12px rgba(16,185,129,0.35) !important;
  }
  .erp-sider .ant-menu-item-selected .anticon {
    color: ${C.white} !important;
  }
  .erp-sider .ant-menu-item .anticon {
    color: rgba(255,255,255,0.65) !important;
    font-size: 15px !important;
  }
  /* Group title */
  .erp-sider .ant-menu-item-group-title {
    padding: 12px 12px 4px !important;
  }
  /* Scrollbar */
  .erp-sider::-webkit-scrollbar { width: 4px; }
  .erp-sider::-webkit-scrollbar-track { background: transparent; }
  .erp-sider::-webkit-scrollbar-thumb { background: ${C.g700}; border-radius: 4px; }

  /* Header notification button */
  .erp-header .ant-btn-text:hover {
    background: ${C.g100} !important;
    color: ${C.g600} !important;
  }
  /* Dropdown */
  .ant-dropdown-menu-item-danger:hover { background: #FEF2F2 !important; }
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function ERPLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshToken } = useAuthStore();
  const { unreadCount } = useNotificationStore();

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
      { key: "settings", icon: <SettingOutlined />, label: "الإعدادات" },
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
      if (key === "settings") navigate("/settings");
    },
  };

  const currentLabel =
    ALL_ITEMS.find((i) => location.pathname.startsWith(i.key))?.label || "ERP";

  const menuItems = ERP_NAV.map((group) => ({
    type: "group",
    label: collapsed ? null : (
      <Text
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: 1.5,
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {group.label}
      </Text>
    ),
    children: group.children.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
    })),
  }));

  const siderWidth = 256;

  return (
    <>
      {/* Inject CSS */}
      <style>{GLOBAL_CSS}</style>

      <Layout style={{ minHeight: "100vh", direction: "rtl" }}>
        {/* ─── SIDEBAR ─── */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={siderWidth}
          collapsedWidth={72}
          className="erp-sider"
          style={{
            background: C.g900,
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            overflowY: "auto",
            overflowX: "hidden",
            paddingBottom: 80,
            borderLeft: `1px solid ${C.g800}`,
          }}
        >
          {/* ── Logo ── */}
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? 0 : "0 18px",
              borderBottom: `1px solid ${C.g800}`,
              gap: 12,
              flexShrink: 0,
            }}
          >
            {/* Logo mark with glow */}
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${C.g500}, ${C.g600})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 0 16px rgba(16,185,129,0.5)`,
              }}
            >
              <AppstoreOutlined style={{ color: C.white, fontSize: 18 }} />
            </div>

            {!collapsed && (
              <div>
                <Text
                  style={{
                    color: C.white,
                    fontWeight: 700,
                    fontSize: 15,
                    display: "block",
                    lineHeight: 1.2,
                  }}
                >
                  ERP System
                </Text>
                <Text
                  style={{ color: C.g400, fontSize: 10, letterSpacing: 0.5 }}
                >
                  نظام تخطيط الموارد
                </Text>
              </div>
            )}
          </div>

          {/* ── Back to Dashboard ── */}
          {!collapsed && (
            <div
              onClick={() => navigate("/dashboard")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 18px",
                cursor: "pointer",
                borderBottom: `1px solid ${C.g800}`,
                transition: "background .15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.g800)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <ArrowRightOutlined
                style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}
              />
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                العودة للداشبورد
              </Text>
            </div>
          )}

          {/* ── Nav Menu ── */}
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            items={menuItems}
            style={{
              background: "transparent",
              border: "none",
              padding: "8px 8px",
            }}
            theme="dark"
          />

          {/* ── User Info (bottom) ── */}
          {!collapsed && (
            <div
              style={{
                position: "fixed",
                bottom: 0,
                width: siderWidth,
                padding: "12px 16px",
                borderTop: `1px solid ${C.g800}`,
                background: C.g900,
                zIndex: 101,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* Avatar with green ring */}
              <div
                style={{
                  padding: 2,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.g500}, ${C.g400})`,
                  flexShrink: 0,
                }}
              >
                <Avatar
                  size={32}
                  src={user?.avatar}
                  style={{ background: C.g700, display: "block" }}
                >
                  {user?.name?.[0] || "A"}
                </Avatar>
              </div>
              <div style={{ lineHeight: 1.35, overflow: "hidden", flex: 1 }}>
                <Text
                  style={{
                    color: C.white,
                    fontSize: 13,
                    fontWeight: 600,
                    display: "block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.name || "Admin"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                  {user?.role || "admin"}
                </Text>
              </div>
              {/* Settings icon */}
              <SettingOutlined
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 14,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                onClick={() => navigate("/settings")}
              />
            </div>
          )}
        </Sider>

        {/* ─── MAIN AREA ─── */}
        <Layout
          style={{
            marginRight: collapsed ? 72 : siderWidth,
            transition: "margin-right 0.2s",
            background: C.contentBg,
          }}
        >
          {/* ── Header ── */}
          <Header
            className="erp-header"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 99,
              background: C.headerBg,
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${C.headerBorder}`,
              height: 64,
              boxShadow: `0 1px 0 ${C.g100}`,
            }}
          >
            {/* Left side */}
            <Space size={16}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 17, color: C.g600 }}
              />

              {/* Breadcrumb */}
              <Space size={6} align="center">
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: C.g500,
                    display: "inline-block",
                  }}
                />
                <Text
                  style={{
                    color: C.g600,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/erp")}
                >
                  ERP
                </Text>
                <Text style={{ color: C.muted, fontSize: 13 }}>/</Text>
                <Text
                  style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}
                >
                  {currentLabel}
                </Text>
              </Space>
            </Space>

            {/* Right side */}
            <Space size={6}>
              {/* Notification bell */}
              <Tooltip title="الإشعارات">
                <Badge
                  count={unreadCount}
                  size="small"
                  styles={{
                    indicator: {
                      background: C.g500,
                      boxShadow: `0 0 0 1px ${C.white}`,
                    },
                  }}
                >
                  <Button
                    type="text"
                    style={{ color: C.g700, borderRadius: 8 }}
                    onClick={() => navigate("/notifications")}
                    icon={
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    }
                  />
                </Badge>
              </Tooltip>

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: C.g100,
                  margin: "0 4px",
                }}
              />

              {/* User avatar + dropdown */}
              <Dropdown
                menu={userMenu}
                placement="bottomLeft"
                arrow={{ pointAtCenter: true }}
              >
                <div
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 8px",
                    borderRadius: 10,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = C.g50)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      padding: 2,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.g500}, ${C.g400})`,
                    }}
                  >
                    <Avatar
                      size={30}
                      src={user?.avatar}
                      style={{ background: C.g700, display: "block" }}
                    >
                      {user?.name?.[0] || "A"}
                    </Avatar>
                  </div>
                  <div style={{ lineHeight: 1.3 }}>
                    <Text
                      style={{
                        color: "#111827",
                        fontSize: 13,
                        fontWeight: 600,
                        display: "block",
                      }}
                    >
                      {user?.name || "Admin"}
                    </Text>
                    <Text style={{ color: C.g600, fontSize: 10 }}>
                      {user?.role || "admin"}
                    </Text>
                  </div>
                </div>
              </Dropdown>
            </Space>
          </Header>

          {/* ── Content ── */}
          <Content style={{ padding: 24, minHeight: "calc(100vh - 64px)" }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
