import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  Statistic,
  Space,
  Tooltip,
  Drawer,
  Timeline,
  Badge,
  Divider,
  message,
  Popconfirm,
  Empty,
  Spin,
} from "antd";
import {
  CarOutlined,
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RocketOutlined,
  InboxOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  getShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  getShipmentEvents,
  addShipmentEvent,
  getShippingCarriers,
} from "../../../api/erpApi";

const { Option } = Select;

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    color: "default",
    label: "في الانتظار",
    icon: <ClockCircleOutlined />,
  },
  picked_up: {
    color: "processing",
    label: "تم الاستلام",
    icon: <InboxOutlined />,
  },
  in_transit: { color: "blue", label: "في الطريق", icon: <CarOutlined /> },
  out_for_delivery: {
    color: "orange",
    label: "جاري التوصيل",
    icon: <RocketOutlined />,
  },
  delivered: {
    color: "success",
    label: "تم التسليم",
    icon: <CheckCircleOutlined />,
  },
  failed: {
    color: "error",
    label: "فشل التوصيل",
    icon: <CloseCircleOutlined />,
  },
  returned: {
    color: "warning",
    label: "مُرتجع للمرسل",
    icon: <WarningOutlined />,
  },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([k, v]) => ({
  value: k,
  label: v.label,
}));

// ── Stats Card ────────────────────────────────────────────────
const StatsCard = ({ icon, title, value, color, subtitle }) => (
  <Card
    style={{
      borderRadius: 16,
      border: "none",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      background: "#fff",
      overflow: "hidden",
      position: "relative",
    }}
    bodyStyle={{ padding: "20px 24px" }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <div>
        <p
          style={{ margin: 0, color: "#64748B", fontSize: 13, fontWeight: 500 }}
        >
          {title}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 28,
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          {value}
        </p>
        {subtitle && (
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color,
        }}
      >
        {icon}
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: color,
        borderRadius: "0 0 16px 16px",
        opacity: 0.6,
      }}
    />
  </Card>
);

// ── Timeline Drawer ───────────────────────────────────────────
const ShipmentTimeline = ({ shipment, open, onClose, carriers }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && shipment) {
      setLoading(true);
      getShipmentEvents(shipment.id)
        .then((r) => setEvents(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, shipment]);

  const handleAddEvent = async () => {
    try {
      const vals = await form.validateFields();
      const res = await addShipmentEvent(shipment.id, {
        ...vals,
        event_time: new Date().toISOString(),
      });
      setEvents((prev) => [res.data, ...prev]);
      form.resetFields();
      message.success("تم إضافة الحدث");
    } catch {}
  };

  const carrierName =
    carriers.find((c) => c.id === shipment?.carrier)?.name || "—";
  const cfg = STATUS_CONFIG[shipment?.status] || {};

  return (
    <Drawer
      title={
        <Space>
          <CarOutlined style={{ color: "#10B981" }} />
          <span>تفاصيل الشحنة — {shipment?.tracking_number || "—"}</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={520}
      placement="left"
    >
      {shipment && (
        <>
          {/* Info */}
          <Card
            style={{
              borderRadius: 12,
              marginBottom: 20,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <Row gutter={[12, 10]}>
              <Col span={12}>
                <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                  المستلم
                </p>
                <p style={{ margin: 0, fontWeight: 600, color: "#0F172A" }}>
                  {shipment.recipient_name}
                </p>
              </Col>
              <Col span={12}>
                <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                  الهاتف
                </p>
                <p style={{ margin: 0, fontWeight: 600, color: "#0F172A" }}>
                  {shipment.recipient_phone}
                </p>
              </Col>
              <Col span={12}>
                <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                  المدينة
                </p>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {shipment.city} — {shipment.country}
                </p>
              </Col>
              <Col span={12}>
                <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                  شركة الشحن
                </p>
                <p style={{ margin: 0, fontWeight: 600 }}>{carrierName}</p>
              </Col>
              <Col span={12}>
                <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                  الحالة
                </p>
                <Tag color={cfg.color} icon={cfg.icon}>
                  {cfg.label}
                </Tag>
              </Col>
              <Col span={12}>
                <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                  تكلفة الشحن
                </p>
                <p style={{ margin: 0, fontWeight: 600, color: "#10B981" }}>
                  {shipment.shipping_cost} EGP
                </p>
              </Col>
              {shipment.notes && (
                <Col span={24}>
                  <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                    ملاحظات
                  </p>
                  <p style={{ margin: 0, color: "#475569" }}>
                    {shipment.notes}
                  </p>
                </Col>
              )}
            </Row>
          </Card>

          {/* Add event */}
          <Card
            style={{
              borderRadius: 12,
              marginBottom: 20,
              border: "1px solid #E2E8F0",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <p
              style={{ margin: "0 0 12px", fontWeight: 600, color: "#0F172A" }}
            >
              إضافة تحديث
            </p>
            <Form form={form} layout="vertical">
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="الحالة"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="اختر">
                      {STATUS_OPTIONS.map((o) => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="location" label="الموقع">
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder="القاهرة"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="description"
                    label="الوصف"
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea rows={2} placeholder="وصف التحديث..." />
                  </Form.Item>
                </Col>
              </Row>
              <Button
                type="primary"
                onClick={handleAddEvent}
                block
                style={{
                  background: "#10B981",
                  border: "none",
                  borderRadius: 8,
                }}
              >
                إضافة تحديث
              </Button>
            </Form>
          </Card>

          {/* Timeline */}
          <p style={{ margin: "0 0 16px", fontWeight: 600, color: "#0F172A" }}>
            <ClockCircleOutlined style={{ marginLeft: 6, color: "#10B981" }} />
            سجل الشحنة
          </p>
          {loading ? (
            <Spin />
          ) : events.length === 0 ? (
            <Empty
              description="لا توجد تحديثات بعد"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Timeline
              items={events.map((ev) => ({
                color:
                  STATUS_CONFIG[ev.status]?.color === "success"
                    ? "green"
                    : STATUS_CONFIG[ev.status]?.color === "error"
                    ? "red"
                    : "blue",
                children: (
                  <div>
                    <Tag color={STATUS_CONFIG[ev.status]?.color}>
                      {STATUS_CONFIG[ev.status]?.label || ev.status}
                    </Tag>
                    {ev.location && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#94A3B8",
                          marginRight: 8,
                        }}
                      >
                        <EnvironmentOutlined /> {ev.location}
                      </span>
                    )}
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#475569",
                        fontSize: 13,
                      }}
                    >
                      {ev.description}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 11,
                        color: "#CBD5E1",
                      }}
                    >
                      {new Date(ev.event_time).toLocaleString("ar-EG")}
                    </p>
                  </div>
                ),
              }))}
            />
          )}
        </>
      )}
    </Drawer>
  );
};

// ── Create/Edit Modal ─────────────────────────────────────────
const ShipmentModal = ({ open, onClose, onSave, shipment, carriers }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      shipment ? form.setFieldsValue(shipment) : form.resetFields();
    }
  }, [open, shipment]);

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      if (shipment) {
        const res = await updateShipment(shipment.id, vals);
        onSave(res.data, "edit");
      } else {
        const res = await createShipment(vals);
        onSave(res.data, "create");
      }
      message.success(shipment ? "تم التحديث" : "تم الإنشاء");
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
          <CarOutlined style={{ color: "#10B981" }} />
          {shipment ? "تعديل الشحنة" : "إنشاء شحنة جديدة"}
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText={shipment ? "حفظ التعديلات" : "إنشاء"}
      cancelText="إلغاء"
      okButtonProps={{ style: { background: "#10B981", border: "none" } }}
      width={680}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="sales_order"
              label="رقم أمر البيع"
              rules={[{ required: true }]}
            >
              <Input placeholder="SO-XXXXXXXX" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="carrier" label="شركة الشحن">
              <Select placeholder="اختر شركة الشحن" allowClear>
                {carriers.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="tracking_number" label="رقم التتبع">
              <Input placeholder="TRK-XXXX" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="الحالة" initialValue="pending">
              <Select>
                {STATUS_OPTIONS.map((o) => (
                  <Option key={o.value} value={o.value}>
                    {o.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="shipping_cost" label="تكلفة الشحن">
              <Input type="number" suffix="EGP" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="estimated_delivery" label="التسليم المتوقع">
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Divider
              orientation="right"
              style={{ margin: "4px 0 16px", fontSize: 13, color: "#64748B" }}
            >
              بيانات المستلم
            </Divider>
          </Col>

          <Col span={12}>
            <Form.Item
              name="recipient_name"
              label="اسم المستلم"
              rules={[{ required: true }]}
            >
              <Input placeholder="محمد أحمد" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="recipient_phone"
              label="هاتف المستلم"
              rules={[{ required: true }]}
            >
              <Input placeholder="01xxxxxxxxx" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="address"
              label="العنوان"
              rules={[{ required: true }]}
            >
              <Input placeholder="شارع، منطقة، رقم" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="city" label="المدينة" rules={[{ required: true }]}>
              <Input placeholder="القاهرة" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="country" label="الدولة" initialValue="Egypt">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="postal_code" label="الكود البريدي">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="notes" label="ملاحظات">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

// ── Main Page ─────────────────────────────────────────────────
export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editShipment, setEditShipment] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        getShipments(filters),
        getShippingCarriers(),
      ]);
      setShipments(sRes.data);
      setCarriers(cRes.data);
    } catch {
      message.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSave = (item, mode) => {
    if (mode === "create") setShipments((p) => [item, ...p]);
    else setShipments((p) => p.map((s) => (s.id === item.id ? item : s)));
  };

  const handleDelete = async (id) => {
    try {
      await deleteShipment(id);
      setShipments((p) => p.filter((s) => s.id !== id));
      message.success("تم الحذف");
    } catch {
      message.error("فشل الحذف");
    }
  };

  const filtered = shipments.filter(
    (s) =>
      !search ||
      s.tracking_number?.includes(search) ||
      s.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.includes(search)
  );

  // Stats
  const stats = {
    total: shipments.length,
    inTransit: shipments.filter((s) =>
      ["in_transit", "out_for_delivery", "picked_up"].includes(s.status)
    ).length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    failed: shipments.filter((s) => ["failed", "returned"].includes(s.status))
      .length,
  };

  const columns = [
    {
      title: "رقم التتبع",
      dataIndex: "tracking_number",
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <span
            style={{
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "monospace",
            }}
          >
            {v || "—"}
          </span>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            #{r.id} • أمر: {r.sales_order}
          </span>
        </Space>
      ),
    },
    {
      title: "المستلم",
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{r.recipient_name}</span>
          <span style={{ fontSize: 12, color: "#64748B" }}>
            {r.recipient_phone}
          </span>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            <EnvironmentOutlined /> {r.city}
          </span>
        </Space>
      ),
    },
    {
      title: "الشركة",
      dataIndex: "carrier",
      render: (v) => carriers.find((c) => c.id === v)?.name || "—",
    },
    {
      title: "الحالة",
      dataIndex: "status",
      render: (v) => {
        const cfg = STATUS_CONFIG[v] || {};
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "التكلفة",
      dataIndex: "shipping_cost",
      render: (v) => (
        <span style={{ color: "#10B981", fontWeight: 600 }}>
          {Number(v).toLocaleString()} EGP
        </span>
      ),
    },
    {
      title: "التسليم المتوقع",
      dataIndex: "estimated_delivery",
      render: (v) => (v ? new Date(v).toLocaleDateString("ar-EG") : "—"),
    },
    {
      title: "",
      width: 120,
      render: (_, r) => (
        <Space>
          <Tooltip title="التفاصيل والتتبع">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedShipment(r);
                setDetailOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="تعديل">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditShipment(r);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف الشحنة؟"
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
      {/* Header */}
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
            <CarOutlined style={{ marginLeft: 10, color: "#10B981" }} />
            الشحنات
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>
            إدارة ومتابعة جميع الشحنات
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAll}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditShipment(null);
              setModalOpen(true);
            }}
            style={{
              background: "#10B981",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            شحنة جديدة
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<CarOutlined />}
            title="إجمالي الشحنات"
            value={stats.total}
            color="#6366F1"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<RocketOutlined />}
            title="في الطريق"
            value={stats.inTransit}
            color="#F59E0B"
            subtitle="معلقة وجاري توصيلها"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<CheckCircleOutlined />}
            title="تم التسليم"
            value={stats.delivered}
            color="#10B981"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<WarningOutlined />}
            title="فشل / مرتجع"
            value={stats.failed}
            color="#EF4444"
          />
        </Col>
      </Row>

      {/* Filters */}
      <Card
        style={{
          borderRadius: 16,
          border: "none",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          marginBottom: 20,
        }}
        bodyStyle={{ padding: "16px 24px" }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              placeholder="ابحث برقم التتبع أو الاسم أو المدينة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder="الحالة"
              allowClear
              style={{ width: "100%" }}
              onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            >
              {STATUS_OPTIONS.map((o) => (
                <Option key={o.value} value={o.value}>
                  {o.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder="شركة الشحن"
              allowClear
              style={{ width: "100%" }}
              onChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}
            >
              {carriers.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

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
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `إجمالي: ${t} شحنة`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="لا توجد شحنات"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          scroll={{ x: 900 }}
          style={{ borderRadius: 16, overflow: "hidden" }}
        />
      </Card>

      {/* Modal */}
      <ShipmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        shipment={editShipment}
        carriers={carriers}
      />

      {/* Detail / Timeline Drawer */}
      <ShipmentTimeline
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        shipment={selectedShipment}
        carriers={carriers}
      />
    </div>
  );
}
