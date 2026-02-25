import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Card,
  Drawer,
  Descriptions,
  Avatar,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Badge,
  message,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  StopOutlined,
  ReloadOutlined,
  FilterOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CalendarOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  getCustomers,
  getCustomer,
  toggleBlockCustomer,
} from "../../api/customersApi";

const { Text, Title } = Typography;
const { Option } = Select;

const fmtMoney = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const STATUS_ORDER_COLOR = {
  pending: "orange",
  confirmed: "blue",
  shipped: "cyan",
  delivered: "green",
  cancelled: "red",
  refunded: "purple",
};

// ── Customer Detail Drawer ────────────────────────────────────────────────────

function CustomerDrawer({ customerId, open, onClose, onBlocked }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (open && customerId) {
      setLoading(true);
      getCustomer(customerId)
        .then(({ data }) => {
          // ✅ نتعامل مع الـ response بشكل مرن
          const customer = data?.data ?? data;
          setCustomer(customer);
        })
        .catch(() => message.error("فشل تحميل بيانات العميل"))
        .finally(() => setLoading(false));
    }
  }, [open, customerId]);

  const handleBlock = async () => {
    setBlocking(true);
    try {
      const { data } = await toggleBlockCustomer(customerId);
      const isBlocked = data?.data?.is_blocked ?? data?.is_blocked;
      setCustomer((prev) => ({ ...prev, is_blocked: isBlocked }));
      message.success(data?.message || "تم تغيير حالة العميل");
      onBlocked();
    } catch {
      message.error("فشل تغيير حالة العميل");
    } finally {
      setBlocking(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={580}
      loading={loading}
      style={{ direction: "rtl" }}
      title={
        customer && (
          <Space>
            <Avatar
              size={36}
              src={customer.avatar}
              style={{ background: "#6366F1" }}
            >
              {customer.full_name?.[0]}
            </Avatar>
            <div style={{ lineHeight: 1.3 }}>
              <Text style={{ fontWeight: 700, display: "block" }}>
                {customer.full_name}
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                {customer.email}
              </Text>
            </div>
          </Space>
        )
      }
      extra={
        customer && (
          <Popconfirm
            title={customer.is_blocked ? "تأكيد إلغاء الحظر" : "تأكيد الحظر"}
            description={
              customer.is_blocked
                ? "هل تريد السماح لهذا العميل بالدخول مجدداً؟"
                : "هل تريد حظر هذا العميل من الدخول؟"
            }
            onConfirm={handleBlock}
            okText="تأكيد"
            cancelText="إلغاء"
            okType={customer.is_blocked ? "primary" : "danger"}
          >
            <Button
              loading={blocking}
              icon={customer.is_blocked ? <UnlockOutlined /> : <LockOutlined />}
              danger={!customer.is_blocked}
              type={customer.is_blocked ? "default" : "primary"}
              style={{ borderRadius: 8 }}
            >
              {customer.is_blocked ? "إلغاء الحظر" : "حظر العميل"}
            </Button>
          </Popconfirm>
        )
      }
    >
      {customer && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Blocked warning */}
          {customer.is_blocked && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <StopOutlined style={{ color: "#EF4444", fontSize: 18 }} />
              <Text style={{ color: "#DC2626", fontWeight: 600 }}>
                هذا العميل محظور حالياً من الدخول
              </Text>
            </div>
          )}

          {/* KPI Cards */}
          <Row gutter={12}>
            {[
              {
                label: "إجمالي الطلبات",
                value: customer.total_orders,
                icon: <ShoppingCartOutlined />,
                color: "#6366F1",
              },
              {
                label: "إجمالي الإنفاق",
                value: fmtMoney(customer.total_spent),
                icon: <DollarOutlined />,
                color: "#10B981",
              },
            ].map((item) => (
              <Col span={12} key={item.label}>
                <Card
                  style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: item.color + "18",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {React.cloneElement(item.icon, {
                        style: { color: item.color, fontSize: 18 },
                      })}
                    </div>
                    <div>
                      <Text
                        style={{
                          color: "#94A3B8",
                          fontSize: 12,
                          display: "block",
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          fontWeight: 700,
                          fontSize: 18,
                          color: "#0F172A",
                        }}
                      >
                        {item.value}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Profile Info */}
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: "#6366F1" }} />
                <Text style={{ fontWeight: 700 }}>البيانات الشخصية</Text>
              </Space>
            }
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
            bodyStyle={{ padding: 16 }}
            headStyle={{ padding: "12px 16px", minHeight: "auto" }}
          >
            <Descriptions
              column={1}
              size="small"
              labelStyle={{ color: "#94A3B8", width: 130 }}
            >
              <Descriptions.Item
                label={
                  <Space>
                    <MailOutlined />
                    البريد الإلكتروني
                  </Space>
                }
              >
                {customer.email}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space>
                    <PhoneOutlined />
                    الهاتف
                  </Space>
                }
              >
                {customer.phone || "—"}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space>
                    <CalendarOutlined />
                    تاريخ التسجيل
                  </Space>
                }
              >
                {customer.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="الحالة">
                <Tag color={customer.is_active ? "green" : "default"}>
                  {customer.is_active ? "نشط" : "غير نشط"}
                </Tag>
                {customer.is_blocked && (
                  <Tag color="red" style={{ marginRight: 4 }}>
                    محظور
                  </Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Recent Orders */}
          {customer.recent_orders?.length > 0 && (
            <div>
              <Text
                style={{
                  fontWeight: 700,
                  color: "#0F172A",
                  fontSize: 14,
                  display: "block",
                  marginBottom: 12,
                }}
              >
                🛒 آخر الطلبات
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {customer.recent_orders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <Space>
                      <Text
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: "#6366F1",
                          fontSize: 13,
                        }}
                      >
                        #{order.order_number}
                      </Text>
                      <Tag
                        color={STATUS_ORDER_COLOR[order.status]}
                        style={{ borderRadius: 6, fontSize: 11 }}
                      >
                        {order.status_display}
                      </Tag>
                    </Space>
                    <div style={{ textAlign: "left" }}>
                      <Text style={{ fontWeight: 700, display: "block" }}>
                        {fmtMoney(order.total_price)}
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                        {order.created_at}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    is_blocked: undefined,
    is_active: undefined,
    ordering: "-created_at",
    page: 1,
    page_size: 10,
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.is_blocked !== undefined)
        params.is_blocked = filters.is_blocked;
      if (filters.is_active !== undefined) params.is_active = filters.is_active;
      params.ordering = filters.ordering;
      params.page = filters.page;
      params.page_size = filters.page_size;

      const { data } = await getCustomers(params);

      // ✅ نتعامل مع كل أشكال الـ response
      const list = data?.results ?? data?.data?.results ?? data?.data ?? [];
      const count = data?.count ?? data?.data?.count ?? list.length;
      setCustomers(list);
      setTotal(count);
    } catch {
      message.error("فشل تحميل العملاء");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleFilterChange = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val, page: 1 }));

  const resetFilters = () =>
    setFilters({
      search: "",
      is_blocked: undefined,
      is_active: undefined,
      ordering: "-created_at",
      page: 1,
      page_size: 10,
    });

  const openDrawer = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleTableChange = (pagination, _, sorter) =>
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      page_size: pagination.pageSize,
      ordering: sorter.order
        ? (sorter.order === "ascend" ? "" : "-") + sorter.field
        : "-created_at",
    }));

  const activeFiltersCount = [
    filters.search,
    filters.is_blocked !== undefined ? filters.is_blocked : null,
    filters.is_active !== undefined ? filters.is_active : null,
  ].filter(Boolean).length;

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "العميل",
      dataIndex: "full_name",
      width: 220,
      render: (name, r) => (
        <Space>
          <Avatar
            size={38}
            src={r.avatar}
            style={{ background: "#6366F1", flexShrink: 0 }}
          >
            {name?.[0]}
          </Avatar>
          <div style={{ lineHeight: 1.3 }}>
            <Text style={{ fontWeight: 600, fontSize: 13, display: "block" }}>
              {name}
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>{r.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "الهاتف",
      dataIndex: "phone",
      width: 140,
      render: (v) => <Text style={{ fontSize: 13 }}>{v || "—"}</Text>,
    },
    {
      title: "الطلبات",
      dataIndex: "total_orders",
      width: 100,
      sorter: true,
      render: (v) => (
        <Tag color="blue" style={{ borderRadius: 6 }}>
          {v} طلب
        </Tag>
      ),
    },
    {
      title: "إجمالي الإنفاق",
      dataIndex: "total_spent",
      width: 140,
      sorter: true,
      render: (v) => (
        <Text style={{ fontWeight: 700, color: "#10B981" }}>{fmtMoney(v)}</Text>
      ),
    },
    {
      title: "الحالة",
      width: 140,
      render: (_, r) => (
        <Space size={4}>
          <Tag
            color={r.is_active ? "green" : "default"}
            style={{ borderRadius: 6 }}
          >
            {r.is_active ? "نشط" : "غير نشط"}
          </Tag>
          {r.is_blocked && (
            <Tag color="red" style={{ borderRadius: 6 }}>
              محظور
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "تاريخ التسجيل",
      dataIndex: "created_at",
      width: 130,
      sorter: true,
      render: (v) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>{v}</Text>
      ),
    },
    {
      title: "",
      key: "actions",
      fixed: "left",
      width: 60,
      render: (_, r) => (
        <Tooltip title="عرض التفاصيل">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDrawer(r.id)}
            style={{ color: "#6366F1" }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ direction: "rtl" }}>
      {/* ── Header ── */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
            العملاء
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة عملاء المتجر ومتابعة نشاطهم
          </Text>
        </div>
        <Badge
          count={total}
          overflowCount={9999}
          style={{ backgroundColor: "#6366F1" }}
        >
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "#EEF2FF",
              border: "1px solid #C7D2FE",
            }}
          >
            <Text style={{ color: "#6366F1", fontWeight: 600, fontSize: 13 }}>
              إجمالي العملاء
            </Text>
          </div>
        </Badge>
      </div>

      {/* ── Filters ── */}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          marginBottom: 16,
        }}
        bodyStyle={{ padding: "14px 20px" }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              placeholder="ابحث بالاسم أو البريد أو الهاتف..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="حالة الحظر"
              value={filters.is_blocked}
              onChange={(v) => handleFilterChange("is_blocked", v)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={false}>غير محظور</Option>
              <Option value={true}>محظور</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="حالة النشاط"
              value={filters.is_active}
              onChange={(v) => handleFilterChange("is_active", v)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={true}>نشط</Option>
              <Option value={false}>غير نشط</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.ordering}
              onChange={(v) => handleFilterChange("ordering", v)}
              style={{ width: "100%" }}
            >
              <Option value="-created_at">الأحدث تسجيلاً</Option>
              <Option value="created_at">الأقدم تسجيلاً</Option>
            </Select>
          </Col>
          <Col flex="none">
            <Tooltip title="إعادة تعيين">
              <Badge count={activeFiltersCount} size="small" color="#6366F1">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetFilters}
                  style={{ borderRadius: 8 }}
                />
              </Badge>
            </Tooltip>
          </Col>
        </Row>
      </Card>

      {/* ── Table ── */}
      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FilterOutlined style={{ color: "#94A3B8" }} />
          <Text style={{ color: "#64748B", fontSize: 13 }}>
            {loading ? "جاري التحميل..." : `${total} عميل`}
          </Text>
        </div>

        <Table
          rowKey="id"
          dataSource={customers}
          columns={columns}
          loading={loading}
          scroll={{ x: 900 }}
          onChange={handleTableChange}
          rowClassName={(r) => (r.is_blocked ? "blocked-row" : "")}
          pagination={{
            current: filters.page,
            pageSize: filters.page_size,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50"],
            showTotal: (t) => `إجمالي ${t} عميل`,
            position: ["bottomCenter"],
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <UserOutlined
                  style={{
                    fontSize: 48,
                    color: "#CBD5E1",
                    display: "block",
                    marginBottom: 12,
                  }}
                />
                <Text style={{ color: "#94A3B8" }}>لا يوجد عملاء</Text>
              </div>
            ),
          }}
        />
      </Card>

      <CustomerDrawer
        open={drawerOpen}
        customerId={selectedId}
        onClose={() => setDrawerOpen(false)}
        onBlocked={fetchCustomers}
      />

      <style>{`
        .blocked-row td { background: #FEF2F2 !important; }
        .blocked-row:hover td { background: #FEE2E2 !important; }
      `}</style>
    </div>
  );
}
