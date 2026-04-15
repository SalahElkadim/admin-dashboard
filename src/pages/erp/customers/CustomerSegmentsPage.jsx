import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Space,
  Tooltip,
  Popconfirm,
  message,
  Empty,
  Tag,
  Badge,
} from "antd";
import {
  UsergroupAddOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  getCustomerSegments,
  createCustomerSegment,
  updateCustomerSegment,
  deleteCustomerSegment,
} from "../../../api/erpApi";

const { TextArea } = Input;

// ── Segment Color ─────────────────────────────────────────────
const SEGMENT_COLORS = [
  "#10B981",
  "#6366F1",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#0EA5E9",
  "#14B8A6",
];

const SegmentModal = ({ open, onClose, onSave, segment }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState({});

  useEffect(() => {
    if (open) {
      if (segment) {
        form.setFieldsValue(segment);
        setRules(segment.filter_rules || {});
      } else {
        form.resetFields();
        setRules({});
      }
    }
  }, [open, segment]);

  const handleRuleChange = (key, val) => {
    setRules((r) => ({ ...r, [key]: val === "" ? undefined : Number(val) }));
  };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      const cleanRules = Object.fromEntries(
        Object.entries(rules).filter(([_, v]) => v !== undefined && v !== "")
      );
      const payload = { ...vals, filter_rules: cleanRules };
      if (segment) {
        const res = await updateCustomerSegment(segment.id, payload);
        onSave(res.data, "edit");
      } else {
        const res = await createCustomerSegment(payload);
        onSave(res.data, "create");
      }
      message.success(segment ? "تم التحديث" : "تم الإنشاء");
      onClose();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <UsergroupAddOutlined style={{ color: "#10B981" }} />
          {segment ? "تعديل الشريحة" : "شريحة جديدة"}
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText={segment ? "حفظ" : "إنشاء"}
      cancelText="إلغاء"
      okButtonProps={{ style: { background: "#10B981", border: "none" } }}
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="اسم الشريحة" rules={[{ required: true }]}>
          <Input placeholder="مثال: عملاء VIP / غير نشطين" />
        </Form.Item>
        <Form.Item name="description" label="الوصف">
          <TextArea rows={2} placeholder="وصف قصير للشريحة..." />
        </Form.Item>

        <div
          style={{
            background: "#F8FAFC",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #E2E8F0",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontWeight: 600,
              color: "#475569",
              fontSize: 13,
            }}
          >
            <FilterOutlined style={{ marginLeft: 6 }} />
            قواعد الفلترة
          </p>
          <Row gutter={[12, 12]}>
            <Col span={12}>
              <label
                style={{
                  fontSize: 12,
                  color: "#64748B",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                حد أدنى للطلبات
              </label>
              <Input
                type="number"
                min={0}
                placeholder="مثال: 3"
                value={rules.min_orders ?? ""}
                onChange={(e) => handleRuleChange("min_orders", e.target.value)}
                suffix="طلبات"
              />
            </Col>
            <Col span={12}>
              <label
                style={{
                  fontSize: 12,
                  color: "#64748B",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                حد أقصى للطلبات
              </label>
              <Input
                type="number"
                min={0}
                placeholder="مثال: 10"
                value={rules.max_orders ?? ""}
                onChange={(e) => handleRuleChange("max_orders", e.target.value)}
                suffix="طلبات"
              />
            </Col>
            <Col span={12}>
              <label
                style={{
                  fontSize: 12,
                  color: "#64748B",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                حد أدنى للإنفاق (EGP)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="مثال: 1000"
                value={rules.min_spent ?? ""}
                onChange={(e) => handleRuleChange("min_spent", e.target.value)}
              />
            </Col>
            <Col span={12}>
              <label
                style={{
                  fontSize: 12,
                  color: "#64748B",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                أيام بدون نشاط
              </label>
              <Input
                type="number"
                min={0}
                placeholder="مثال: 60"
                value={rules.days_inactive ?? ""}
                onChange={(e) =>
                  handleRuleChange("days_inactive", e.target.value)
                }
                suffix="يوم"
              />
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  );
};

// ── Rule Tags ─────────────────────────────────────────────────
const RuleTags = ({ rules }) => {
  if (!rules || Object.keys(rules).length === 0)
    return <span style={{ color: "#CBD5E1" }}>بدون قواعد</span>;
  const labels = {
    min_orders: (v) => `طلبات ≥ ${v}`,
    max_orders: (v) => `طلبات ≤ ${v}`,
    min_spent: (v) => `إنفاق ≥ ${v} EGP`,
    days_inactive: (v) => `غائب ${v} يوم+`,
  };
  return (
    <Space size={4} wrap>
      {Object.entries(rules).map(([k, v]) =>
        labels[k] ? (
          <Tag key={k} color="blue" style={{ fontSize: 11 }}>
            {labels[k](v)}
          </Tag>
        ) : null
      )}
    </Space>
  );
};

// ── Main Page ─────────────────────────────────────────────────
export default function CustomerSegmentsPage() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSegment, setEditSegment] = useState(null);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const res = await getCustomerSegments();
      setSegments(res.data);
    } catch {
      message.error("فشل التحميل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleSave = (item, mode) => {
    if (mode === "create") setSegments((p) => [item, ...p]);
    else setSegments((p) => p.map((s) => (s.id === item.id ? item : s)));
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomerSegment(id);
      setSegments((p) => p.filter((s) => s.id !== id));
      message.success("تم الحذف");
    } catch {
      message.error("فشل الحذف");
    }
  };

  const totalCustomers = segments.reduce(
    (s, seg) => s + (seg.customers_count || 0),
    0
  );

  const columns = [
    {
      title: "الشريحة",
      render: (_, r, i) => (
        <Space>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flexShrink: 0,
              background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] + "20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${
                SEGMENT_COLORS[i % SEGMENT_COLORS.length]
              }40`,
            }}
          >
            <UsergroupAddOutlined
              style={{
                color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                fontSize: 18,
              }}
            />
          </div>
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>
              {r.name}
            </span>
            {r.description && (
              <span style={{ fontSize: 12, color: "#64748B" }}>
                {r.description}
              </span>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: "العملاء",
      dataIndex: "customers_count",
      sorter: (a, b) => a.customers_count - b.customers_count,
      render: (v, _, i) => (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 20,
            background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] + "15",
            color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          <TeamOutlined />
          {v}
        </div>
      ),
    },
    {
      title: "قواعد الفلترة",
      dataIndex: "filter_rules",
      render: (v) => <RuleTags rules={v} />,
    },
    {
      title: "آخر تحديث",
      dataIndex: "last_refreshed_at",
      render: (v) =>
        v ? (
          <Space size={4} style={{ color: "#64748B", fontSize: 12 }}>
            <CalendarOutlined />
            {new Date(v).toLocaleDateString("ar-EG")}
          </Space>
        ) : (
          <span style={{ color: "#CBD5E1" }}>—</span>
        ),
    },
    {
      title: "",
      width: 100,
      render: (_, r) => (
        <Space>
          <Tooltip title="تعديل">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditSegment(r);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف الشريحة؟"
            onConfirm={() => handleDelete(r.id)}
            okText="نعم"
            cancelText="لا"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ direction: "rtl" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#0F172A",
            }}
          >
            <UsergroupAddOutlined
              style={{ marginLeft: 10, color: "#10B981" }}
            />
            شرائح العملاء
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748B" }}>
            تصنيف العملاء في مجموعات حسب قواعد محددة
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSegments}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditSegment(null);
              setModalOpen(true);
            }}
            style={{
              background: "#10B981",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            شريحة جديدة
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            label: "إجمالي الشرائح",
            value: segments.length,
            color: "#6366F1",
            icon: <UsergroupAddOutlined />,
          },
          {
            label: "إجمالي العملاء المصنفين",
            value: totalCustomers,
            color: "#10B981",
            icon: <TeamOutlined />,
          },
          {
            label: "متوسط حجم الشريحة",
            value: segments.length
              ? Math.round(totalCustomers / segments.length)
              : 0,
            color: "#F59E0B",
            icon: <FilterOutlined />,
          },
        ].map((s, i) => (
          <Col xs={24} sm={8} key={i}>
            <Card
              style={{
                borderRadius: 16,
                border: "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                overflow: "hidden",
                position: "relative",
              }}
              bodyStyle={{ padding: "20px 24px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <p style={{ margin: 0, color: "#64748B", fontSize: 13 }}>
                    {s.label}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#0F172A",
                    }}
                  >
                    {s.value}
                  </p>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: s.color + "18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    color: s.color,
                  }}
                >
                  {s.icon}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: s.color,
                  opacity: 0.6,
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Table */}
      <Card
        style={{
          borderRadius: 16,
          border: "none",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={segments}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                description="لا توجد شرائح بعد"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          pagination={{ pageSize: 10 }}
          style={{ borderRadius: 16, overflow: "hidden" }}
        />
      </Card>

      <SegmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        segment={editSegment}
      />
    </div>
  );
}
