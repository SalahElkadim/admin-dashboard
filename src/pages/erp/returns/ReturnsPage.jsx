import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Divider,
  Tooltip,
  Badge,
  Popconfirm,
  message,
  Drawer,
  Descriptions,
  Timeline,
  InputNumber,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getReturnRequests,
  getReturnRequest,
  createReturnRequest,
  updateReturnRequest,
  deleteReturnRequest,
  getReturnItems,
  addReturnItem,
  getSalesOrders,
} from "../../../api/erpApi";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// ── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    color: "orange",
    label: "قيد المراجعة",
    icon: <ClockCircleOutlined />,
  },
  approved: {
    color: "blue",
    label: "موافق عليه",
    icon: <CheckCircleOutlined />,
  },
  rejected: { color: "red", label: "مرفوض", icon: <CloseCircleOutlined /> },
  completed: { color: "green", label: "مكتمل", icon: <CheckCircleOutlined /> },
};

const REASON_LABELS = {
  defective: "منتج معيب",
  wrong_item: "منتج خاطئ",
  not_as_desc: "لا يطابق الوصف",
  changed_mind: "العميل غير رأيه",
  damaged: "تلف أثناء الشحن",
  other: "أخرى",
};

const REFUND_METHOD_LABELS = {
  cash: "استرداد نقدي",
  wallet: "محفظة المتجر",
  original: "طريقة الدفع الأصلية",
  exchange: "استبدال فقط",
};

const CONDITION_CONFIG = {
  good: { color: "green", label: "جيد — يرجع للمخزون" },
  damaged: { color: "orange", label: "تالف — يحتاج إصلاح" },
  unsellable: { color: "red", label: "غير صالح للبيع" },
};

// ── Stats Cards ──────────────────────────────────────────────────────────────

function StatsCards({ data }) {
  const stats = {
    total: data.length,
    pending: data.filter((r) => r.status === "pending").length,
    approved: data.filter((r) => r.status === "approved").length,
    completed: data.filter((r) => r.status === "completed").length,
    totalRefund: data
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0),
  };

  const cards = [
    {
      title: "إجمالي المرتجعات",
      value: stats.total,
      icon: <RollbackOutlined style={{ fontSize: 22, color: "#6366F1" }} />,
      bg: "#EEF2FF",
      color: "#6366F1",
    },
    {
      title: "قيد المراجعة",
      value: stats.pending,
      icon: <ClockCircleOutlined style={{ fontSize: 22, color: "#F59E0B" }} />,
      bg: "#FFFBEB",
      color: "#F59E0B",
    },
    {
      title: "موافق عليها",
      value: stats.approved,
      icon: <CheckCircleOutlined style={{ fontSize: 22, color: "#3B82F6" }} />,
      bg: "#EFF6FF",
      color: "#3B82F6",
    },
    {
      title: "إجمالي المبالغ المستردة",
      value: `${stats.totalRefund.toLocaleString()} ج.م`,
      icon: <DollarOutlined style={{ fontSize: 22, color: "#10B981" }} />,
      bg: "#ECFDF5",
      color: "#10B981",
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {cards.map((card, i) => (
        <Col xs={24} sm={12} lg={6} key={i}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>
              <div>
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  {card.title}
                </Text>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#1E293B",
                    lineHeight: 1.3,
                  }}
                >
                  {card.value}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// ── Return Items Sub-table ───────────────────────────────────────────────────

function ReturnItemsTable({ returnId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReturnItems(returnId)
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [returnId]);

  const columns = [
    { title: "المنتج", dataIndex: "product_name", key: "product_name" },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
      render: (v) => <Badge count={v} showZero color="#6366F1" />,
    },
    {
      title: "الحالة",
      dataIndex: "condition",
      key: "condition",
      render: (v) => {
        const c = CONDITION_CONFIG[v] || {};
        return <Tag color={c.color}>{c.label || v}</Tag>;
      },
    },
    {
      title: "يُعاد للمخزون؟",
      dataIndex: "should_restock",
      key: "should_restock",
      render: (v) =>
        v ? <Tag color="green">نعم</Tag> : <Tag color="red">لا</Tag>,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey="id"
      loading={loading}
      size="small"
      pagination={false}
      locale={{ emptyText: "لا توجد منتجات" }}
    />
  );
}

// ── Return Detail Drawer ─────────────────────────────────────────────────────

function ReturnDetailDrawer({ returnId, open, onClose, onStatusChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!open || !returnId) return;
    setLoading(true);
    getReturnRequest(returnId)
      .then((res) => setData(res.data))
      .catch(() => message.error("فشل تحميل التفاصيل"))
      .finally(() => setLoading(false));
  }, [open, returnId]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await updateReturnRequest(returnId, { status: newStatus });
      message.success("تم تحديث الحالة");
      setData((prev) => ({ ...prev, status: newStatus }));
      onStatusChange?.();
    } catch {
      message.error("فشل تحديث الحالة");
    } finally {
      setUpdating(false);
    }
  };

  const statusActions = {
    pending: [
      { label: "موافقة", status: "approved", type: "primary" },
      { label: "رفض", status: "rejected", danger: true },
    ],
    approved: [
      { label: "إكمال الاسترجاع", status: "completed", type: "primary" },
    ],
    rejected: [],
    completed: [],
  };

  const actions = data ? statusActions[data.status] || [] : [];

  return (
    <Drawer
      title={
        <Space>
          <RollbackOutlined style={{ color: "#6366F1" }} />
          <span>تفاصيل المرتجع #{returnId}</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={600}
      loading={loading}
      extra={
        <Space>
          {actions.map((a) => (
            <Button
              key={a.status}
              type={a.type}
              danger={a.danger}
              size="small"
              loading={updating}
              onClick={() => handleStatusChange(a.status)}
            >
              {a.label}
            </Button>
          ))}
        </Space>
      }
    >
      {data && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Tag
              color={STATUS_CONFIG[data.status]?.color}
              style={{ fontSize: 13, padding: "3px 10px" }}
            >
              {STATUS_CONFIG[data.status]?.icon}{" "}
              {STATUS_CONFIG[data.status]?.label}
            </Tag>
          </div>

          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="رقم الأوردر">
              {data.sales_order}
            </Descriptions.Item>
            <Descriptions.Item label="سبب الإرجاع">
              {REASON_LABELS[data.reason] || data.reason}
            </Descriptions.Item>
            <Descriptions.Item label="طريقة الاسترداد">
              {REFUND_METHOD_LABELS[data.refund_method] || data.refund_method}
            </Descriptions.Item>
            <Descriptions.Item label="مبلغ الاسترداد">
              <Text strong style={{ color: "#10B981" }}>
                {parseFloat(data.refund_amount || 0).toLocaleString()} ج.م
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="تاريخ الطلب" span={2}>
              {dayjs(data.created_at).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            {data.customer_notes && (
              <Descriptions.Item label="ملاحظات العميل" span={2}>
                {data.customer_notes}
              </Descriptions.Item>
            )}
            {data.staff_notes && (
              <Descriptions.Item label="ملاحظات الموظف" span={2}>
                {data.staff_notes}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider orientation="right">المنتجات المُرجَعة</Divider>
          <ReturnItemsTable returnId={returnId} />
        </>
      )}
    </Drawer>
  );
}

// ── Add Return Item Form ─────────────────────────────────────────────────────

function AddItemForm({ returnId, onDone }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await addReturnItem(returnId, values);
      message.success("تمت إضافة المنتج");
      form.resetFields();
      onDone?.();
    } catch {
      message.error("فشل إضافة المنتج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={handleSubmit}
      style={{ flexWrap: "wrap", gap: 8 }}
    >
      <Form.Item
        name="product_name"
        rules={[{ required: true, message: "أدخل اسم المنتج" }]}
      >
        <Input placeholder="اسم المنتج" style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="quantity" rules={[{ required: true }]}>
        <InputNumber placeholder="الكمية" min={1} style={{ width: 90 }} />
      </Form.Item>
      <Form.Item name="condition" rules={[{ required: true }]}>
        <Select placeholder="الحالة" style={{ width: 160 }}>
          {Object.entries(CONDITION_CONFIG).map(([k, v]) => (
            <Option key={k} value={k}>
              {v.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} size="small">
          إضافة
        </Button>
      </Form.Item>
    </Form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    reason: "",
    search: "",
    dates: null,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [salesOrders, setSalesOrders] = useState([]);
  const [form] = Form.useForm();

  // fetch returns
  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      const res = await getReturnRequests(params);
      setReturns(res.data);
    } catch {
      message.error("فشل تحميل المرتجعات");
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  useEffect(() => {
    getSalesOrders({ status: "delivered" })
      .then((res) => setSalesOrders(res.data))
      .catch(() => {});
  }, []);

  // filtered data
  const filteredData = returns.filter((r) => {
    if (filters.reason && r.reason !== filters.reason) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!String(r.sales_order).includes(s) && !String(r.id).includes(s))
        return false;
    }
    if (filters.dates) {
      const [from, to] = filters.dates;
      const date = dayjs(r.created_at);
      if (date.isBefore(from, "day") || date.isAfter(to, "day")) return false;
    }
    return true;
  });

  // open add/edit modal
  const openModal = (record = null) => {
    setEditingReturn(record);
    form.setFieldsValue(
      record
        ? {
            sales_order: record.sales_order,
            reason: record.reason,
            refund_method: record.refund_method,
            refund_amount: record.refund_amount,
            customer_notes: record.customer_notes,
            staff_notes: record.staff_notes,
          }
        : {}
    );
    setModalOpen(true);
  };

  const handleModalSubmit = async (values) => {
    try {
      if (editingReturn) {
        await updateReturnRequest(editingReturn.id, values);
        message.success("تم تحديث المرتجع");
      } else {
        await createReturnRequest({ ...values, status: "pending" });
        message.success("تم إنشاء طلب المرتجع");
      }
      setModalOpen(false);
      form.resetFields();
      fetchReturns();
    } catch {
      message.error("فشلت العملية");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReturnRequest(id);
      message.success("تم الحذف");
      fetchReturns();
    } catch {
      message.error("فشل الحذف");
    }
  };

  // table columns
  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      width: 60,
      render: (v) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>#{v}</Text>
      ),
    },
    {
      title: "رقم الأوردر",
      dataIndex: "sales_order",
      key: "sales_order",
      render: (v) => (
        <Tag color="geekblue" style={{ fontFamily: "monospace" }}>
          #{v}
        </Tag>
      ),
    },
    {
      title: "سبب الإرجاع",
      dataIndex: "reason",
      key: "reason",
      render: (v) => REASON_LABELS[v] || v,
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (v) => {
        const c = STATUS_CONFIG[v] || {};
        return (
          <Tag color={c.color} icon={c.icon}>
            {c.label || v}
          </Tag>
        );
      },
      filters: Object.entries(STATUS_CONFIG).map(([k, v]) => ({
        text: v.label,
        value: k,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "طريقة الاسترداد",
      dataIndex: "refund_method",
      key: "refund_method",
      render: (v) => REFUND_METHOD_LABELS[v] || v,
    },
    {
      title: "مبلغ الاسترداد",
      dataIndex: "refund_amount",
      key: "refund_amount",
      sorter: (a, b) => a.refund_amount - b.refund_amount,
      render: (v) => (
        <Text strong style={{ color: "#10B981" }}>
          {parseFloat(v || 0).toLocaleString()} ج.م
        </Text>
      ),
    },
    {
      title: "تاريخ الطلب",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (v) => (
        <Text style={{ color: "#64748B", fontSize: 12 }}>
          {dayjs(v).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "الإجراءات",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="عرض التفاصيل">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              style={{ color: "#6366F1" }}
              onClick={() => {
                setSelectedId(record.id);
                setDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="تعديل">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ color: "#3B82F6" }}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="هل أنت متأكد من الحذف؟"
            onConfirm={() => handleDelete(record.id)}
            okText="نعم"
            cancelText="لا"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="حذف">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                style={{ color: "#EF4444" }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: "#1E293B" }}>
            <RollbackOutlined style={{ color: "#6366F1", marginLeft: 8 }} />
            المرتجعات
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة طلبات إرجاع المنتجات واسترداد المبالغ
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            border: "none",
            borderRadius: 8,
            height: 38,
            fontWeight: 600,
          }}
        >
          طلب مرتجع جديد
        </Button>
      </div>

      {/* Stats */}
      <StatsCards data={returns} />

      {/* Filters */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
        bodyStyle={{ padding: "14px 20px" }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              placeholder="بحث برقم الأوردر أو المرتجع..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="الحالة"
              value={filters.status || undefined}
              onChange={(v) => setFilters((f) => ({ ...f, status: v || "" }))}
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <Option key={k} value={k}>
                  <Tag color={v.color} style={{ marginLeft: 4 }}>
                    {v.label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="سبب الإرجاع"
              value={filters.reason || undefined}
              onChange={(v) => setFilters((f) => ({ ...f, reason: v || "" }))}
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(REASON_LABELS).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={10} md={7}>
            <RangePicker
              placeholder={["من تاريخ", "إلى تاريخ"]}
              value={filters.dates}
              onChange={(dates) => setFilters((f) => ({ ...f, dates }))}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col xs={24} sm={4} md={3}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilters({ status: "", reason: "", search: "", dates: null });
                fetchReturns();
              }}
              style={{ width: "100%" }}
            >
              إعادة تعيين
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontWeight: 600, color: "#1E293B" }}>
            قائمة المرتجعات
            <Badge
              count={filteredData.length}
              showZero
              color="#6366F1"
              style={{ marginRight: 8 }}
            />
          </Text>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchReturns}
            loading={loading}
          >
            تحديث
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `إجمالي ${total} مرتجع`,
            showSizeChanger: true,
          }}
          scroll={{ x: 900 }}
          locale={{ emptyText: "لا توجد مرتجعات" }}
          rowClassName={(record) =>
            record.status === "pending" ? "row-highlight-pending" : ""
          }
        />
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        title={
          <Space>
            <RollbackOutlined style={{ color: "#6366F1" }} />
            {editingReturn ? "تعديل طلب المرتجع" : "طلب مرتجع جديد"}
          </Space>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingReturn ? "حفظ التعديلات" : "إنشاء الطلب"}
        cancelText="إلغاء"
        okButtonProps={{
          style: { background: "#6366F1", border: "none" },
        }}
        width={600}
        destroyOnClose
      >
        <Divider style={{ margin: "12px 0" }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
          requiredMark="optional"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="sales_order"
                label="أوردر البيع"
                rules={[{ required: true, message: "اختر أوردر البيع" }]}
              >
                <Select
                  showSearch
                  placeholder="اختر الأوردر"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {salesOrders.map((o) => (
                    <Option key={o.id} value={o.id}>
                      {o.order_number} — {o.customer_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reason"
                label="سبب الإرجاع"
                rules={[{ required: true, message: "اختر السبب" }]}
              >
                <Select placeholder="اختر السبب">
                  {Object.entries(REASON_LABELS).map(([k, v]) => (
                    <Option key={k} value={k}>
                      {v}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="refund_method"
                label="طريقة الاسترداد"
                rules={[{ required: true, message: "اختر الطريقة" }]}
              >
                <Select placeholder="اختر الطريقة">
                  {Object.entries(REFUND_METHOD_LABELS).map(([k, v]) => (
                    <Option key={k} value={k}>
                      {v}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="refund_amount"
                label="مبلغ الاسترداد"
                rules={[{ required: true, message: "أدخل المبلغ" }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                  addonAfter="ج.م"
                />
              </Form.Item>
            </Col>
            {editingReturn && (
              <Col span={12}>
                <Form.Item name="status" label="الحالة">
                  <Select>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <Option key={k} value={k}>
                        <Tag color={v.color}>{v.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item name="customer_notes" label="ملاحظات العميل">
                <TextArea rows={2} placeholder="ملاحظات العميل..." />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="staff_notes" label="ملاحظات الموظف">
                <TextArea rows={2} placeholder="ملاحظات داخلية للموظفين..." />
              </Form.Item>
            </Col>
          </Row>

          {/* Add items section (only for existing returns) */}
          {editingReturn && (
            <>
              <Divider orientation="right">إضافة منتجات للمرتجع</Divider>
              <AddItemForm returnId={editingReturn.id} onDone={() => {}} />
            </>
          )}
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <ReturnDetailDrawer
        returnId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={fetchReturns}
      />

      {/* Styling */}
      <style>{`
        .row-highlight-pending > td {
          background: #FFFBEB !important;
        }
        .ant-table-tbody > tr.row-highlight-pending:hover > td {
          background: #FEF3C7 !important;
        }
      `}</style>
    </div>
  );
}
