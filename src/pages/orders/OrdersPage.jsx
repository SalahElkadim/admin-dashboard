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
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Badge,
  Avatar,
  Steps,
  message,
  Modal,
  Form,
  Divider,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import {
  getOrders,
  getOrder,
  updateOrderStatus,
  getOrderStats,
  exportOrders,
} from "../../api/ordersapi";

const { Text, Title } = Typography;
const { Option } = Select;

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META = {
  pending: {
    color: "orange",
    label: "قيد الانتظار",
    icon: <ClockCircleOutlined />,
  },
  confirmed: { color: "blue", label: "مؤكد", icon: <CheckCircleOutlined /> },
  shipped: { color: "cyan", label: "تم الشحن", icon: <CarOutlined /> },
  delivered: {
    color: "green",
    label: "تم التسليم",
    icon: <CheckCircleOutlined />,
  },
  cancelled: { color: "red", label: "ملغي", icon: <CloseCircleOutlined /> },
  refunded: { color: "purple", label: "مسترجع", icon: <RollbackOutlined /> },
};

const PAYMENT_STATUS_META = {
  pending: { color: "orange", label: "قيد الانتظار" },
  paid: { color: "green", label: "مدفوع" },
  failed: { color: "red", label: "فشل" },
  refunded: { color: "purple", label: "مسترجع" },
};

const PAYMENT_METHOD_LABELS = {
  stripe: "Stripe",
  paypal: "PayPal",
  cod: "الدفع عند الاستلام",
};

const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

const fmtMoney = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

// ── Helper: استخرج الـ data من أي شكل response ──────────────────────────────
const extractData = (data) => data?.data ?? data;
const extractList = (data) =>
  data?.results ?? data?.data?.results ?? data?.data ?? [];
const extractCount = (data, list) =>
  data?.count ?? data?.data?.count ?? list.length;

// ── Order Steps ───────────────────────────────────────────────────────────────

const ORDER_STEPS = ["pending", "confirmed", "shipped", "delivered"];

function OrderStatusSteps({ status }) {
  if (["cancelled", "refunded"].includes(status)) {
    return (
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          background: status === "cancelled" ? "#FEF2F2" : "#FAF5FF",
          border: `1px solid ${status === "cancelled" ? "#FECACA" : "#E9D5FF"}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {STATUS_META[status].icon}
        <Text
          style={{
            fontWeight: 600,
            color: status === "cancelled" ? "#DC2626" : "#7C3AED",
          }}
        >
          الطلب {STATUS_META[status].label}
        </Text>
      </div>
    );
  }
  const current = ORDER_STEPS.indexOf(status);
  return (
    <Steps
      current={current}
      size="small"
      items={ORDER_STEPS.map((s) => ({
        title: STATUS_META[s]?.label,
        icon: STATUS_META[s]?.icon,
      }))}
      style={{ direction: "ltr" }}
    />
  );
}

// ── Update Status Modal ───────────────────────────────────────────────────────

function UpdateStatusModal({ open, order, onClose, onUpdated }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const allowed = ALLOWED_TRANSITIONS[order?.status] || [];

  const handleOk = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await updateOrderStatus(order.id, values);
      message.success("تم تحديث حالة الطلب ✅");
      onUpdated();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || "فشل التحديث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="تحديث الحالة"
      cancelText="إلغاء"
      confirmLoading={loading}
      title={
        <Text style={{ fontWeight: 700 }}>
          تحديث حالة الطلب #{order?.order_number}
        </Text>
      }
      width={420}
      style={{ direction: "rtl" }}
    >
      {allowed.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            textAlign: "center",
          }}
        >
          <Text style={{ color: "#DC2626" }}>لا يمكن تغيير حالة هذا الطلب</Text>
        </div>
      ) : (
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="status"
            label="الحالة الجديدة"
            rules={[{ required: true, message: "اختر الحالة" }]}
          >
            <Select
              placeholder="اختر الحالة..."
              size="large"
              style={{ width: "100%" }}
            >
              {allowed.map((s) => (
                <Option key={s} value={s}>
                  <Space>
                    {STATUS_META[s]?.icon}
                    {STATUS_META[s]?.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="payment_status" label="حالة الدفع (اختياري)">
            <Select
              placeholder="اختر..."
              size="large"
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(PAYMENT_STATUS_META).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

// ── Order Detail Drawer ───────────────────────────────────────────────────────

function OrderDrawer({ orderId, open, onClose, onStatusUpdate }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const loadOrder = useCallback(() => {
    if (!orderId) return;
    setLoading(true);
    getOrder(orderId)
      .then(({ data }) => {
        // ✅ نتعامل مع الـ response بشكل مرن
        setOrder(extractData(data));
      })
      .catch(() => message.error("فشل تحميل تفاصيل الطلب"))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (open) loadOrder();
  }, [open, loadOrder]);

  const handleUpdated = () => {
    loadOrder();
    onStatusUpdate();
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width={600}
        title={
          order && (
            <Space>
              <ShoppingCartOutlined style={{ color: "#6366F1" }} />
              <Text style={{ fontWeight: 700 }}>
                تفاصيل الطلب #{order.order_number}
              </Text>
            </Space>
          )
        }
        loading={loading}
        style={{ direction: "rtl" }}
        extra={
          order && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setStatusModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                border: "none",
                borderRadius: 8,
              }}
            >
              تحديث الحالة
            </Button>
          )
        }
      >
        {order && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Status Steps */}
            <Card
              style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
              bodyStyle={{ padding: 20 }}
            >
              <Text
                style={{
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 16,
                  color: "#0F172A",
                }}
              >
                حالة الطلب
              </Text>
              <OrderStatusSteps status={order.status} />
            </Card>

            {/* KPIs */}
            <Row gutter={12}>
              {[
                { label: "المجموع الفرعي", value: fmtMoney(order.subtotal) },
                {
                  label: "الخصم",
                  value: fmtMoney(order.discount_amount),
                  color: "#EF4444",
                },
                { label: "الشحن", value: fmtMoney(order.shipping_cost) },
                {
                  label: "الإجمالي",
                  value: fmtMoney(order.total_price),
                  color: "#10B981",
                  bold: true,
                },
              ].map((item) => (
                <Col span={6} key={item.label}>
                  <Card
                    style={{
                      borderRadius: 10,
                      border: "1px solid #F1F5F9",
                      textAlign: "center",
                    }}
                    bodyStyle={{ padding: "12px 8px" }}
                  >
                    <Text
                      style={{
                        color: "#94A3B8",
                        fontSize: 11,
                        display: "block",
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={{
                        fontWeight: item.bold ? 700 : 600,
                        color: item.color || "#0F172A",
                        fontSize: 14,
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {item.value}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Status badges */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  حالة الطلب:{" "}
                </Text>
                <Tag
                  color={STATUS_META[order.status]?.color}
                  style={{ borderRadius: 6 }}
                >
                  {STATUS_META[order.status]?.label}
                </Tag>
              </div>
              <div>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  حالة الدفع:{" "}
                </Text>
                <Tag
                  color={PAYMENT_STATUS_META[order.payment_status]?.color}
                  style={{ borderRadius: 6 }}
                >
                  {PAYMENT_STATUS_META[order.payment_status]?.label}
                </Tag>
              </div>
              <div>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  طريقة الدفع:{" "}
                </Text>
                <Tag style={{ borderRadius: 6 }}>
                  {PAYMENT_METHOD_LABELS[order.payment_method] ||
                    order.payment_method}
                </Tag>
              </div>
            </div>

            <Divider style={{ margin: "4px 0" }} />

            {/* Items */}
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
                🛍️ المنتجات ({order.items?.length})
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {order.items?.map((item) => (
                  <div
                    key={item.id}
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
                      {/* ← غيّر الـ Avatar ده */}
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <Avatar
                          shape="square"
                          size={40}
                          style={{ borderRadius: 8, background: "#EEF2FF" }}
                        >
                          {item.product_name?.[0]}
                        </Avatar>
                      )}
                      <div>
                        <Text
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            display: "block",
                          }}
                        >
                          {item.product_name}
                        </Text>
                        {item.variant_name && (
                          <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                            {item.variant_name}
                          </Text>
                        )}
                      </div>
                    </Space>
                    <div style={{ textAlign: "left" }}>
                      <Text
                        style={{
                          fontWeight: 700,
                          color: "#0F172A",
                          display: "block",
                        }}
                      >
                        {fmtMoney(item.total_price)}
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                        {fmtMoney(item.unit_price)} × {item.quantity}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Divider style={{ margin: "4px 0" }} />

            {/* Customer & Shipping */}
            <Row gutter={16}>
              <Col span={12}>
                <Card
                  title={
                    <Space>
                      <UserOutlined style={{ color: "#6366F1" }} />
                      <Text style={{ fontWeight: 700 }}>بيانات العميل</Text>
                    </Space>
                  }
                  style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
                  bodyStyle={{ padding: 16 }}
                  headStyle={{ padding: "12px 16px", minHeight: "auto" }}
                >
                  <Descriptions
                    column={1}
                    size="small"
                    labelStyle={{ color: "#94A3B8", fontSize: 12 }}
                  >
                    <Descriptions.Item label="الاسم">
                      {order.customer?.full_name || order.shipping_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="البريد">
                      {order.customer?.email || "—"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title={
                    <Space>
                      <EnvironmentOutlined style={{ color: "#10B981" }} />
                      <Text style={{ fontWeight: 700 }}>عنوان الشحن</Text>
                    </Space>
                  }
                  style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
                  bodyStyle={{ padding: 16 }}
                  headStyle={{ padding: "12px 16px", minHeight: "auto" }}
                >
                  <Descriptions
                    column={1}
                    size="small"
                    labelStyle={{ color: "#94A3B8", fontSize: 12 }}
                  >
                    <Descriptions.Item label="الاسم">
                      {order.shipping_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="الهاتف">
                      {order.shipping_phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="العنوان">
                      {order.shipping_address}, {order.shipping_city},{" "}
                      {order.shipping_country}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {/* Coupon */}
            {order.coupon_code && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <GiftOutlined style={{ color: "#10B981", fontSize: 18 }} />
                <div>
                  <Text
                    style={{
                      fontWeight: 600,
                      color: "#065F46",
                      display: "block",
                    }}
                  >
                    كود الخصم: {order.coupon_code}
                  </Text>
                  <Text style={{ color: "#047857", fontSize: 12 }}>
                    وفّرت {fmtMoney(order.discount_amount)}
                  </Text>
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                }}
              >
                <Text
                  style={{
                    fontWeight: 600,
                    color: "#92400E",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  📝 ملاحظات
                </Text>
                <Text style={{ color: "#78350F", fontSize: 13 }}>
                  {order.notes}
                </Text>
              </div>
            )}

            {/* Payments */}
            {order.payments?.length > 0 && (
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
                  <CreditCardOutlined style={{ marginLeft: 6 }} />
                  سجل المدفوعات
                </Text>
                {order.payments.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      marginBottom: 8,
                    }}
                  >
                    <Space>
                      <Tag color={PAYMENT_STATUS_META[p.status]?.color}>
                        {PAYMENT_STATUS_META[p.status]?.label}
                      </Tag>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#64748B",
                          fontFamily: "monospace",
                        }}
                      >
                        {p.transaction_id || "—"}
                      </Text>
                    </Space>
                    <Text style={{ fontWeight: 600 }}>
                      {fmtMoney(p.amount)}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {order && (
        <UpdateStatusModal
          open={statusModalOpen}
          order={order}
          onClose={() => setStatusModalOpen(false)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: undefined,
    payment_status: undefined,
    payment_method: undefined,
    date_from: undefined,
    date_to: undefined,
    ordering: "-created_at",
    page: 1,
    page_size: 10,
  });

  // ── Fetch Orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.payment_status)
        params.payment_status = filters.payment_status;
      if (filters.payment_method)
        params.payment_method = filters.payment_method;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      params.ordering = filters.ordering;
      params.page = filters.page;
      params.page_size = filters.page_size;

      const { data } = await getOrders(params);

      // ✅ نتعامل مع كل أشكال الـ response
      const list = extractList(data);
      const count = extractCount(data, list);
      setOrders(list);
      setTotal(count);
    } catch {
      message.error("فشل تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Fetch Stats ───────────────────────────────────────────────────────────
  useEffect(() => {
    getOrderStats()
      .then(({ data }) => {
        // ✅ نتعامل مع كل أشكال الـ response
        setStats(data?.data ?? data ?? {});
      })
      .catch(() => {});
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const { data } = await exportOrders({
        status: filters.status,
        date_from: filters.date_from,
        date_to: filters.date_to,
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "orders.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success("تم تصدير الطلبات ✅");
    } catch {
      message.error("فشل التصدير");
    }
  };

  const handleFilterChange = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val, page: 1 }));

  const resetFilters = () =>
    setFilters({
      search: "",
      status: undefined,
      payment_status: undefined,
      payment_method: undefined,
      date_from: undefined,
      date_to: undefined,
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
    filters.status,
    filters.payment_status,
    filters.payment_method,
    filters.date_from,
  ].filter(Boolean).length;

  // ── Stat Cards ────────────────────────────────────────────────────────────
  const statCards = [
    {
      key: "pending",
      label: "قيد الانتظار",
      color: "#F59E0B",
      bg: "#FFFBEB",
      border: "#FDE68A",
    },
    {
      key: "confirmed",
      label: "مؤكد",
      color: "#3B82F6",
      bg: "#EFF6FF",
      border: "#BFDBFE",
    },
    {
      key: "shipped",
      label: "تم الشحن",
      color: "#06B6D4",
      bg: "#ECFEFF",
      border: "#A5F3FC",
    },
    {
      key: "delivered",
      label: "تم التسليم",
      color: "#10B981",
      bg: "#F0FDF4",
      border: "#BBF7D0",
    },
    {
      key: "cancelled",
      label: "ملغي",
      color: "#EF4444",
      bg: "#FEF2F2",
      border: "#FECACA",
    },
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "رقم الطلب",
      dataIndex: "order_number",
      width: 140,
      render: (v) => (
        <Text
          style={{
            fontFamily: "monospace",
            fontWeight: 700,
            color: "#6366F1",
            fontSize: 13,
          }}
        >
          {v}
        </Text>
      ),
    },
    {
      title: "العميل",
      dataIndex: "customer_name",
      width: 180,
      render: (name, r) => (
        <Space>
          <Avatar
            size={30}
            style={{ background: "#6366F1", fontSize: 12, flexShrink: 0 }}
          >
            {name?.[0]}
          </Avatar>
          <div style={{ lineHeight: 1.3 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, display: "block" }}>
              {name}
            </Text>
            <Text style={{ fontSize: 11, color: "#94A3B8" }}>
              {r.customer_email || "—"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "المنتجات",
      dataIndex: "items_count",
      width: 90,
      render: (v) => <Tag style={{ borderRadius: 6 }}>{v} منتج</Tag>,
    },
    {
      title: "الإجمالي",
      dataIndex: "total_price",
      sorter: true,
      width: 120,
      render: (v) => <Text style={{ fontWeight: 700 }}>{fmtMoney(v)}</Text>,
    },
    {
      title: "حالة الطلب",
      dataIndex: "status",
      width: 130,
      render: (v) => {
        const m = STATUS_META[v] || {};
        return (
          <Tag color={m.color} style={{ borderRadius: 6 }}>
            {m.label}
          </Tag>
        );
      },
    },
    {
      title: "الدفع",
      dataIndex: "payment_status",
      width: 120,
      render: (v) => {
        const m = PAYMENT_STATUS_META[v] || {};
        return (
          <Tag color={m.color} style={{ borderRadius: 6 }}>
            {m.label}
          </Tag>
        );
      },
    },
    {
      title: "طريقة الدفع",
      dataIndex: "payment_method",
      width: 140,
      render: (v) => (
        <Text style={{ fontSize: 12 }}>{PAYMENT_METHOD_LABELS[v] || v}</Text>
      ),
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      sorter: true,
      width: 130,
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
            الطلبات
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            متابعة وإدارة طلبات المتجر
          </Text>
        </div>
        <Button
          icon={<DownloadOutlined />}
          size="large"
          onClick={handleExport}
          style={{
            borderRadius: 10,
            fontWeight: 600,
            borderColor: "#6366F1",
            color: "#6366F1",
          }}
        >
          تصدير CSV
        </Button>
      </div>

      {/* ── Stats ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {statCards.map((s) => (
          <Col xs={12} sm={8} md={6} xl={4} key={s.key}>
            <Card
              onClick={() =>
                handleFilterChange(
                  "status",
                  filters.status === s.key ? undefined : s.key
                )
              }
              style={{
                borderRadius: 12,
                cursor: "pointer",
                border: `1px solid ${
                  filters.status === s.key ? s.color : s.border
                }`,
                background: filters.status === s.key ? s.bg : "#fff",
                transition: "all .2s",
                boxShadow:
                  filters.status === s.key ? `0 0 0 2px ${s.color}33` : "none",
              }}
              bodyStyle={{ padding: "14px 16px" }}
            >
              <Text
                style={{ color: "#94A3B8", fontSize: 12, display: "block" }}
              >
                {s.label}
              </Text>
              <Text style={{ fontSize: 24, fontWeight: 700, color: s.color }}>
                {stats[s.key] ?? "—"}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

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
          <Col xs={24} sm={10} md={7}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              placeholder="رقم الطلب، اسم العميل، البريد..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="الحالة"
              value={filters.status}
              onChange={(v) => handleFilterChange("status", v)}
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(STATUS_META).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="حالة الدفع"
              value={filters.payment_status}
              onChange={(v) => handleFilterChange("payment_status", v)}
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(PAYMENT_STATUS_META).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="طريقة الدفع"
              value={filters.payment_method}
              onChange={(v) => handleFilterChange("payment_method", v)}
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              value={filters.ordering}
              onChange={(v) => handleFilterChange("ordering", v)}
              style={{ width: "100%" }}
            >
              <Option value="-created_at">الأحدث</Option>
              <Option value="created_at">الأقدم</Option>
              <Option value="-total_price">أعلى قيمة</Option>
              <Option value="total_price">أقل قيمة</Option>
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
            {loading ? "جاري التحميل..." : `${total} طلب`}
          </Text>
        </div>

        <Table
          rowKey="id"
          dataSource={orders}
          columns={columns}
          loading={loading}
          scroll={{ x: 1000 }}
          onChange={handleTableChange}
          pagination={{
            current: filters.page,
            pageSize: filters.page_size,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50"],
            showTotal: (t) => `إجمالي ${t} طلب`,
            position: ["bottomCenter"],
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <ShoppingCartOutlined
                  style={{
                    fontSize: 48,
                    color: "#CBD5E1",
                    display: "block",
                    marginBottom: 12,
                  }}
                />
                <Text style={{ color: "#94A3B8" }}>لا توجد طلبات</Text>
              </div>
            ),
          }}
        />
      </Card>

      <OrderDrawer
        open={drawerOpen}
        orderId={selectedId}
        onClose={() => setDrawerOpen(false)}
        onStatusUpdate={fetchOrders}
      />
    </div>
  );
}
