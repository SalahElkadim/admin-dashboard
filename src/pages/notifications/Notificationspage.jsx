import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  Badge,
  Tabs,
  Tooltip,
  Select,
  Row,
  Col,
  Avatar,
  Empty,
  message as antdMessage,
} from "antd";
import {
  BellOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  UserOutlined,
  CreditCardOutlined,
  RollbackOutlined,
  SettingOutlined,
  HistoryOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  LoginOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getActivityLogs,
} from "../../api/notificationsApi";
import useNotificationStore from "../../store/notificationStore";

const { Text, Title } = Typography;
const { Option } = Select;

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOTIF_ICON = {
  new_order: {
    icon: <ShoppingCartOutlined />,
    color: "#6366F1",
    bg: "#EEF2FF",
  },
  low_stock: { icon: <WarningOutlined />, color: "#F59E0B", bg: "#FFFBEB" },
  out_of_stock: { icon: <WarningOutlined />, color: "#EF4444", bg: "#FEF2F2" },
  new_user: { icon: <UserOutlined />, color: "#10B981", bg: "#F0FDF4" },
  payment: { icon: <CreditCardOutlined />, color: "#3B82F6", bg: "#EFF6FF" },
  refund: { icon: <RollbackOutlined />, color: "#8B5CF6", bg: "#FAF5FF" },
  system: { icon: <SettingOutlined />, color: "#64748B", bg: "#F8FAFC" },
};

const ACTION_META = {
  create: { color: "green", label: "إضافة", icon: <CheckCircleOutlined /> },
  update: { color: "blue", label: "تعديل", icon: <EditOutlined /> },
  delete: { color: "red", label: "حذف", icon: <DeleteOutlined /> },
  view: { color: "default", label: "عرض", icon: <EyeOutlined /> },
  login: { color: "cyan", label: "دخول", icon: <LoginOutlined /> },
  logout: { color: "orange", label: "خروج", icon: <LogoutOutlined /> },
};

// ── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [marking, setMarking] = useState(false);
  const { fetchUnreadCount, resetUnread } = useNotificationStore();

  const [filters, setFilters] = useState({
    unread: undefined,
    page: 1,
    page_size: 15,
  });

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, page_size: filters.page_size };
      if (filters.unread !== undefined) params.unread = filters.unread;

      const { data } = await getNotifications(params);

      // ✅ نتعامل مع كل أشكال الـ response
      const list = data?.results ?? data?.data?.results ?? data?.data ?? [];
      const count = data?.count ?? data?.data?.count ?? list.length;
      setNotifs(list);
      setTotal(count);
    } catch {
      antdMessage.error("فشل تحميل الإشعارات");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleMarkOne = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      fetchUnreadCount();
    } catch {
      antdMessage.error("فشل");
    }
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      resetUnread();
      antdMessage.success("تم تحديد الكل كمقروء ✅");
    } catch {
      antdMessage.error("فشل");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <Space>
          <Select
            placeholder="كل الإشعارات"
            value={filters.unread}
            onChange={(v) => setFilters((p) => ({ ...p, unread: v, page: 1 }))}
            allowClear
            style={{ width: 160 }}
          >
            <Option value="true">غير مقروءة فقط</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setFilters((p) => ({ ...p, page: 1 }))}
            style={{ borderRadius: 8 }}
          />
        </Space>
        <Button
          icon={<CheckOutlined />}
          loading={marking}
          onClick={handleMarkAll}
          style={{ borderRadius: 8, borderColor: "#6366F1", color: "#6366F1" }}
        >
          تحديد الكل كمقروء
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(5)].map((_, i) => (
            <Card
              key={i}
              loading
              style={{ borderRadius: 12 }}
              bodyStyle={{ padding: 16 }}
            />
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <Empty
          image={<BellOutlined style={{ fontSize: 64, color: "#CBD5E1" }} />}
          description={
            <Text style={{ color: "#94A3B8" }}>لا توجد إشعارات</Text>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifs.map((n) => {
            const meta = NOTIF_ICON[n.type] || NOTIF_ICON.system;
            return (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: n.is_read ? "#FAFAFA" : "#F5F3FF",
                  border: `1px solid ${n.is_read ? "#E2E8F0" : "#DDD6FE"}`,
                  transition: "all .2s",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: meta.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {React.cloneElement(meta.icon, {
                    style: { color: meta.color, fontSize: 18 },
                  })}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: n.is_read ? 500 : 700,
                        fontSize: 14,
                        color: "#0F172A",
                      }}
                    >
                      {n.title}
                    </Text>
                    <Text
                      style={{ color: "#94A3B8", fontSize: 11, flexShrink: 0 }}
                    >
                      {n.created_at}
                    </Text>
                  </div>
                  <Text
                    style={{
                      color: "#64748B",
                      fontSize: 13,
                      display: "block",
                      marginTop: 2,
                    }}
                  >
                    {n.message}
                  </Text>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {!n.is_read && (
                    <>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#6366F1",
                        }}
                      />
                      <Tooltip title="تحديد كمقروء">
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined style={{ fontSize: 12 }} />}
                          onClick={() => handleMarkOne(n.id)}
                          style={{
                            color: "#6366F1",
                            padding: "0 4px",
                            height: "auto",
                          }}
                        />
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > filters.page_size && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Button
            disabled={filters.page === 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
          >
            السابق
          </Button>
          <Text style={{ padding: "4px 12px", color: "#64748B", fontSize: 13 }}>
            صفحة {filters.page} من {Math.ceil(total / filters.page_size)}
          </Text>
          <Button
            disabled={filters.page >= Math.ceil(total / filters.page_size)}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Activity Log Tab ──────────────────────────────────────────────────────────

function ActivityLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    action: undefined,
    model_name: undefined,
    date_from: undefined,
    date_to: undefined,
    page: 1,
    page_size: 15,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, page_size: filters.page_size };
      if (filters.action) params.action = filters.action;
      if (filters.model_name) params.model_name = filters.model_name;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const { data } = await getActivityLogs(params);

      // ✅ نتعامل مع كل أشكال الـ response
      const list = data?.results ?? data?.data?.results ?? data?.data ?? [];
      const count = data?.count ?? data?.data?.count ?? list.length;
      setLogs(list);
      setTotal(count);
    } catch {
      antdMessage.error("فشل تحميل سجل النشاط");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const MODEL_COLORS = {
    User: "#6366F1",
    Product: "#10B981",
    Order: "#F59E0B",
    Coupon: "#8B5CF6",
    Category: "#06B6D4",
    Payment: "#EF4444",
    ProductVariant: "#EC4899",
    Attribute: "#14B8A6",
    AttributeValue: "#F97316",
  };

  const MODEL_OPTIONS = [
    "User",
    "Product",
    "Order",
    "Coupon",
    "Category",
    "Payment",
    "ProductVariant",
    "Attribute",
    "AttributeValue",
  ];

  const columns = [
    {
      title: "المشرف",
      dataIndex: "admin_email",
      width: 200,
      render: (v) => (
        <Space>
          <Avatar size={28} style={{ background: "#6366F1", fontSize: 11 }}>
            {v?.[0]?.toUpperCase()}
          </Avatar>
          <Text style={{ fontSize: 13 }}>{v || "—"}</Text>
        </Space>
      ),
    },
    {
      title: "الإجراء",
      dataIndex: "action",
      width: 110,
      render: (v) => {
        const m = ACTION_META[v] || {};
        return (
          <Tag color={m.color} icon={m.icon} style={{ borderRadius: 6 }}>
            {m.label || v}
          </Tag>
        );
      },
    },

    {
      title: "العنصر",
      dataIndex: "object_repr",
      ellipsis: true,
      render: (v) => (
        <Tooltip title={v}>
          <Text style={{ fontSize: 12, color: "#475569" }}>{v || "—"}</Text>
        </Tooltip>
      ),
    },
    {
      title: "الـ IP",
      dataIndex: "ip_address",
      width: 130,
      render: (v) => (
        <Text
          style={{ fontFamily: "monospace", fontSize: 12, color: "#94A3B8" }}
        >
          {v || "—"}
        </Text>
      ),
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      width: 140,
      render: (v) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>{v}</Text>
      ),
    },
  ];

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[10, 10]} align="middle">
          <Col xs={12} sm={6}>
            <Select
              placeholder="الإجراء"
              value={filters.action}
              onChange={(v) =>
                setFilters((p) => ({ ...p, action: v, page: 1 }))
              }
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(ACTION_META).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6}>
            <Select
              placeholder="النموذج"
              value={filters.model_name}
              onChange={(v) =>
                setFilters((p) => ({ ...p, model_name: v, page: 1 }))
              }
              allowClear
              style={{ width: "100%" }}
            >
              {MODEL_OPTIONS.map((m) => (
                <Option key={m} value={m}>
                  {m}
                </Option>
              ))}
            </Select>
          </Col>
          <Col flex="none">
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                setFilters((p) => ({
                  ...p,
                  action: undefined,
                  model_name: undefined,
                  page: 1,
                }))
              }
              style={{ borderRadius: 8 }}
            />
          </Col>
        </Row>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        dataSource={logs}
        columns={columns}
        loading={loading}
        scroll={{ x: 800 }}
        size="small"
        pagination={{
          current: filters.page,
          pageSize: filters.page_size,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["15", "30", "50"],
          showTotal: (t) => `${t} سجل`,
          position: ["bottomCenter"],
          onChange: (page, size) =>
            setFilters((p) => ({ ...p, page, page_size: size })),
        }}
        locale={{
          emptyText: (
            <div style={{ padding: "30px 0", textAlign: "center" }}>
              <HistoryOutlined
                style={{
                  fontSize: 40,
                  color: "#CBD5E1",
                  display: "block",
                  marginBottom: 8,
                }}
              />
              <Text style={{ color: "#94A3B8" }}>لا يوجد نشاط</Text>
            </div>
          ),
        }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const tabItems = [
    {
      key: "notifications",
      label: (
        <Space>
          <BellOutlined />
          الإشعارات
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              size="small"
              style={{ background: "#6366F1" }}
            />
          )}
        </Space>
      ),
      children: <NotificationsTab />,
    },
    {
      key: "activity",
      label: (
        <Space>
          <HistoryOutlined />
          سجل النشاط
        </Space>
      ),
      children: <ActivityLogTab />,
    },
  ];

  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
          الإشعارات والنشاط
        </Title>
        <Text style={{ color: "#94A3B8", fontSize: 13 }}>
          متابعة الإشعارات وسجل عمليات المشرفين
        </Text>
      </div>

      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: "0 24px 24px" }}
      >
        <Tabs items={tabItems} defaultActiveKey="notifications" />
      </Card>
    </div>
  );
}
