import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Drawer,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  message,
  Tooltip,
  Popconfirm,
  Empty,
  Tag,
  InputNumber,
  DatePicker,
  Divider,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  DeleteFilled,
} from "@ant-design/icons";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderItems,
  addPurchaseOrderItem,
  getSuppliers,
  getWarehouses,
} from "../../../api/erpApi";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STATUS_CONFIG = {
  draft: { color: "#94A3B8", bg: "#F8FAFC", label: "مسودة" },
  sent: { color: "#3B82F6", bg: "#EFF6FF", label: "أُرسل للمورد" },
  confirmed: { color: "#8B5CF6", bg: "#F5F3FF", label: "مؤكد" },
  partial: { color: "#F59E0B", bg: "#FFFBEB", label: "استُلم جزئياً" },
  received: { color: "#10B981", bg: "#F0FDF4", label: "استُلم كاملاً" },
  cancelled: { color: "#EF4444", bg: "#FEF2F2", label: "ملغي" },
};

const fmt = (v) =>
  Number(v || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 });

const StatusTag = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
      }}
    >
      {cfg.label}
    </span>
  );
};

// ── Detail Drawer ─────────────────────────────────────────────
function PODetailDrawer({ po, open, onClose, onStatusChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && po?.id) {
      setLoading(true);
      getPurchaseOrderItems(po.id)
        .then((r) => setItems(r.data?.results ?? r.data ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else {
      setItems([]);
    }
  }, [open, po]);

  if (!po) return null;

  const InfoRow = ({ label, value, children }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid #F1F5F9",
      }}
    >
      <Text style={{ color: "#94A3B8", fontSize: 13 }}>{label}</Text>
      <Text style={{ fontWeight: 600, fontSize: 13 }}>{children || value}</Text>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={540}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 15, display: "block" }}>
              {po.po_number}
            </Text>
            <StatusTag status={po.status} />
          </div>
        </div>
      }
      extra={
        <Select
          size="small"
          value={po.status}
          style={{ width: 160 }}
          onChange={(val) => onStatusChange(po.id, val)}
        >
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <Option key={k} value={k}>
              {v.label}
            </Option>
          ))}
        </Select>
      }
    >
      {/* Supplier Info */}
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94A3B8",
            letterSpacing: 1,
            display: "block",
            marginBottom: 12,
          }}
        >
          بيانات المورد
        </Text>
        <InfoRow label="المورد" value={po.supplier_name || `#${po.supplier}`} />
        <InfoRow label="المستودع" value={po.warehouse || "—"} />
        <InfoRow
          label="تاريخ التوقع"
          value={
            po.expected_date
              ? new Date(po.expected_date).toLocaleDateString("ar-EG")
              : "—"
          }
        />
      </div>

      {/* Items */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#94A3B8",
          letterSpacing: 1,
          display: "block",
          marginBottom: 12,
        }}
      >
        المنتجات المطلوبة
      </Text>

      {loading ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="لا توجد منتجات"
          style={{ padding: 24 }}
        />
      ) : (
        <div style={{ marginBottom: 20 }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: "#EEF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                📦
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{ fontWeight: 600, fontSize: 13, display: "block" }}
                >
                  {item.product_name}
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                  طُلب: {item.quantity_ordered} · استُلم:{" "}
                  {item.quantity_received}
                </Text>
              </div>
              <div style={{ textAlign: "left" }}>
                <Text
                  style={{ fontSize: 12, color: "#94A3B8", display: "block" }}
                >
                  {item.quantity_ordered} × {fmt(item.unit_cost)}
                </Text>
                <Text style={{ fontWeight: 700 }}>
                  {fmt(item.total_cost)} ج.م
                </Text>
              </div>
              {item.is_fully_received && (
                <Tag color="green" style={{ fontSize: 10, borderRadius: 4 }}>
                  ✓ استُلم
                </Tag>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text style={{ fontWeight: 700, fontSize: 15 }}>إجمالي التكلفة</Text>
          <Text style={{ fontWeight: 800, fontSize: 18, color: "#6366F1" }}>
            {fmt(po.total_cost)} ج.م
          </Text>
        </div>
      </div>

      {po.notes && (
        <div
          style={{
            background: "#FFFBEB",
            borderRadius: 12,
            padding: "14px 18px",
            border: "1px solid #FDE68A",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#92400E",
              display: "block",
              marginBottom: 6,
            }}
          >
            ملاحظات
          </Text>
          <Text style={{ fontSize: 13, color: "#78350F" }}>{po.notes}</Text>
        </div>
      )}
    </Drawer>
  );
}

// ── PO Form Modal ─────────────────────────────────────────────
function POFormModal({
  open,
  onClose,
  onSuccess,
  editPO,
  suppliers,
  warehouses,
}) {
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const isEdit = !!editPO;

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.setFieldsValue({
        supplier: editPO.supplier,
        status: editPO.status,
        expected_date: editPO.expected_date
          ? dayjs(editPO.expected_date)
          : null,
        warehouse: editPO.warehouse,
        notes: editPO.notes,
      });
      getPurchaseOrderItems(editPO.id)
        .then((r) => {
          const loaded = r.data?.results ?? r.data ?? [];
          setItems(
            loaded.map((it) => ({
              product_name: it.product_name,
              quantity_ordered: it.quantity_ordered,
              unit_cost: Number(it.unit_cost),
            }))
          );
        })
        .catch(() => setItems([]));
    } else {
      form.resetFields();
      form.setFieldsValue({ status: "draft" });
      setItems([]);
    }
  }, [open, editPO]);

  const handleAddItem = () => {
    itemForm.validateFields().then((vals) => {
      setItems((prev) => [
        ...prev,
        {
          product_name: vals.product_name,
          quantity_ordered: vals.quantity_ordered,
          unit_cost: Number(vals.unit_cost),
        },
      ]);
      itemForm.resetFields();
    });
  };

  const grandTotal = items.reduce(
    (s, it) => s + it.quantity_ordered * it.unit_cost,
    0
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.warning("أضف منتجاً واحداً على الأقل");
        return;
      }
      if (values.expected_date) {
        values.expected_date = values.expected_date.format("YYYY-MM-DD");
      }
      setLoading(true);

      let poId;
      if (isEdit) {
        await updatePurchaseOrder(editPO.id, values);
        poId = editPO.id;
      } else {
        const res = await createPurchaseOrder(values);
        poId = res.data?.id ?? res.data?.data?.id;
      }

      if (!poId) {
        message.error("فشل في الحصول على رقم الأمر");
        return;
      }

      for (const item of items) {
        await addPurchaseOrderItem(poId, {
          product_name: item.product_name,
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.unit_cost,
        });
      }

      message.success(isEdit ? "تم تحديث أمر الشراء" : "تم إنشاء أمر الشراء");
      onSuccess();
      onClose();
    } catch (err) {
      if (err?.response?.data) message.error("تحقق من البيانات المدخلة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <ShoppingOutlined style={{ color: "#6366F1" }} />
          <Text style={{ fontWeight: 700 }}>
            {isEdit ? "تعديل أمر الشراء" : "أمر شراء جديد"}
          </Text>
        </Space>
      }
      width={680}
      style={{ direction: "rtl", top: 16 }}
      styles={{
        body: { maxHeight: "78vh", overflowY: "auto", paddingRight: 8 },
      }}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: items.length ? "#F0FDF4" : "#F8FAFC",
              borderRadius: 8,
              padding: "6px 16px",
              border: `1px solid ${items.length ? "#BBF7D0" : "#E2E8F0"}`,
              minWidth: 180,
            }}
          >
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              الإجمالي الكلي:{" "}
            </Text>
            <Text
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: items.length ? "#6366F1" : "#94A3B8",
              }}
            >
              {fmt(grandTotal)} ج.م
            </Text>
          </div>
          <Space>
            <Button onClick={onClose}>إلغاء</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              style={{ background: "#6366F1", borderColor: "#6366F1" }}
            >
              {isEdit ? "حفظ التعديلات" : "إنشاء الأمر"}
            </Button>
          </Space>
        </div>
      }
    >
      {/* ── بيانات الأمر ── */}
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          name="supplier"
          label="المورد"
          rules={[{ required: true, message: "اختر المورد" }]}
        >
          <Select
            placeholder="اختر المورد"
            showSearch
            filterOption={(input, option) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {suppliers.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="status" label="الحالة">
              <Select>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>
                    {v.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="expected_date" label="تاريخ الاستلام المتوقع">
              <DatePicker
                style={{ width: "100%" }}
                placeholder="اختر التاريخ"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="warehouse" label="المستودع">
          <Select placeholder="اختر المستودع">
            {warehouses.map((w) => (
              <Option key={w.id} value={w.id}>
                {w.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="ملاحظات">
          <TextArea rows={2} placeholder="أي ملاحظات خاصة بهذا الأمر..." />
        </Form.Item>
      </Form>

      {/* ── المنتجات ── */}
      <Divider
        orientation="right"
        orientationMargin={0}
        style={{ fontSize: 12, color: "#94A3B8" }}
      >
        المنتجات المطلوبة
      </Divider>

      {/* Item input row */}
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 12,
          padding: "14px 16px",
          border: "1px dashed #CBD5E1",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#475569",
            display: "block",
            marginBottom: 10,
          }}
        >
          ➕ أضف منتجاً للأمر
        </Text>
        <Form form={itemForm} layout="vertical">
          <Row gutter={8} align="bottom">
            <Col span={10}>
              <Form.Item
                name="product_name"
                label="اسم المنتج"
                rules={[{ required: true, message: "أدخل اسم المنتج" }]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="مثال: شنطة سوداء XL" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="quantity_ordered"
                label="الكمية"
                rules={[{ required: true, message: "الكمية" }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="1"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="unit_cost"
                label="سعر الوحدة (ج.م)"
                rules={[{ required: true, message: "السعر" }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item style={{ marginBottom: 0 }} label=" ">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddItem}
                  style={{
                    background: "#10B981",
                    borderColor: "#10B981",
                    width: "100%",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="أضف منتجاً واحداً على الأقل"
          style={{ padding: "12px 0" }}
        />
      ) : (
        <div>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: idx % 2 === 0 ? "#FAFBFF" : "#fff",
                border: "1px solid #E2E8F0",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#EEF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                📦
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ fontWeight: 600, fontSize: 13, display: "block" }}
                >
                  {item.product_name}
                </Text>
                <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                  {item.quantity_ordered} قطعة × {fmt(item.unit_cost)} ج.م
                </Text>
              </div>
              <Text
                style={{
                  fontWeight: 700,
                  color: "#6366F1",
                  minWidth: 90,
                  textAlign: "left",
                }}
              >
                {fmt(item.quantity_ordered * item.unit_cost)} ج.م
              </Text>
              <Tooltip title="حذف">
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteFilled />}
                  onClick={() =>
                    setItems((prev) => prev.filter((_, i) => i !== idx))
                  }
                />
              </Tooltip>
            </div>
          ))}

          {/* Subtotal bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 4,
              padding: "8px 12px",
              background: "#EEF2FF",
              borderRadius: 8,
              border: "1px solid #C7D2FE",
            }}
          >
            <Text style={{ fontWeight: 800, color: "#4338CA", fontSize: 14 }}>
              إجمالي المنتجات: {fmt(grandTotal)} ج.م
            </Text>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [filterStatus, setFilterStatus] = useState(null);
  const [filterSupplier, setFilterSupplier] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPO, setEditPO] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (filterStatus) params.status = filterStatus;
      if (filterSupplier) params.supplier = filterSupplier;
      const res = await getPurchaseOrders(params);
      const data = res.data;
      setOrders(
        data?.results ?? data?.data?.results ?? data?.data ?? data ?? []
      );
      setTotal(data?.count ?? 0);
    } catch {
      message.error("فشل في تحميل أوامر الشراء");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterSupplier]);

  const fetchMeta = useCallback(async () => {
    try {
      const [sRes, wRes] = await Promise.allSettled([
        getSuppliers(),
        getWarehouses(),
      ]);
      if (sRes.status === "fulfilled") {
        const d = sRes.value.data;
        setSuppliers(d?.results ?? d?.data ?? d ?? []);
      }
      if (wRes.status === "fulfilled") {
        const d = wRes.value.data;
        setWarehouses(d?.results ?? d?.data ?? d ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const handleStatusChange = async (id, status) => {
    try {
      await updatePurchaseOrder(id, { status });
      message.success("تم تحديث الحالة");
      fetchOrders();
      if (selectedPO?.id === id) setSelectedPO((p) => ({ ...p, status }));
    } catch {
      message.error("فشل في تحديث الحالة");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePurchaseOrder(id);
      message.success("تم الحذف");
      fetchOrders();
    } catch {
      message.error("فشل في الحذف");
    }
  };

  // Stats
  const totalCost = orders.reduce((s, o) => s + Number(o.total_cost || 0), 0);
  const pending = orders.filter((o) =>
    ["draft", "sent"].includes(o.status)
  ).length;
  const received = orders.filter((o) => o.status === "received").length;

  const columns = [
    {
      title: "رقم الأمر",
      dataIndex: "po_number",
      width: 150,
      render: (val, row) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 700, color: "#6366F1" }}
          onClick={() => {
            setSelectedPO(row);
            setDrawerOpen(true);
          }}
        >
          {val}
        </Button>
      ),
    },
    {
      title: "المورد",
      dataIndex: "supplier_name",
      render: (val, row) => (
        <Text style={{ fontWeight: 600 }}>{val || `#${row.supplier}`}</Text>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      width: 150,
      render: (val) => <StatusTag status={val} />,
    },
    {
      title: "إجمالي التكلفة",
      dataIndex: "total_cost",
      width: 150,
      render: (val) => (
        <Text style={{ fontWeight: 700, color: "#6366F1" }}>
          {fmt(val)} ج.م
        </Text>
      ),
    },
    {
      title: "تاريخ الاستلام المتوقع",
      dataIndex: "expected_date",
      width: 160,
      render: (val) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          {val ? new Date(val).toLocaleDateString("ar-EG") : "—"}
        </Text>
      ),
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "created_at",
      width: 120,
      render: (val) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          {val ? new Date(val).toLocaleDateString("ar-EG") : "—"}
        </Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 110,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="التفاصيل">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              style={{ color: "#6366F1" }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPO(row);
                setDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="تعديل">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              style={{ color: "#F59E0B" }}
              onClick={(e) => {
                e.stopPropagation();
                setEditPO(row);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="حذف">
            <Popconfirm
              title="هل أنت متأكد من حذف هذا الأمر؟"
              okText="نعم"
              cancelText="لا"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(row.id)}
            >
              <Button
                size="small"
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: "#EF4444" }}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Tooltip>
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
          <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
            أوامر الشراء
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة طلبات الشراء من الموردين
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchOrders}
            style={{ borderRadius: 8 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: "#6366F1",
              borderColor: "#6366F1",
              borderRadius: 8,
              height: 38,
            }}
            onClick={() => {
              setEditPO(null);
              setModalOpen(true);
            }}
          >
            أمر شراء جديد
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          {
            label: "إجمالي الأوامر",
            value: orders.length,
            color: "#6366F1",
            isText: false,
          },
          {
            label: "إجمالي التكلفة",
            value: `${fmt(totalCost)} ج.م`,
            color: "#10B981",
            isText: true,
          },
          {
            label: "قيد الانتظار",
            value: pending,
            color: "#F59E0B",
            isText: false,
          },
          {
            label: "مستلمة بالكامل",
            value: received,
            color: "#3B82F6",
            isText: false,
          },
        ].map((c) => (
          <Col xs={12} sm={6} key={c.label}>
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "18px 20px",
                border: "1px solid #E2E8F0",
                borderTop: `3px solid ${c.color}`,
              }}
            >
              <Text
                style={{ fontSize: 11, color: "#94A3B8", display: "block" }}
              >
                {c.label}
              </Text>
              <Text
                style={{
                  fontSize: c.isText ? 16 : 26,
                  fontWeight: 800,
                  color: c.color,
                }}
              >
                {c.value}
              </Text>
            </div>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "14px 20px",
          border: "1px solid #E2E8F0",
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Select
          placeholder="الحالة"
          allowClear
          style={{ width: 160 }}
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
        >
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <Option key={k} value={k}>
              {v.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="المورد"
          allowClear
          showSearch
          style={{ width: 180 }}
          value={filterSupplier}
          onChange={(v) => {
            setFilterSupplier(v);
            setPage(1);
          }}
          filterOption={(input, option) =>
            option?.children?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {suppliers.map((s) => (
            <Option key={s.id} value={s.id}>
              {s.name}
            </Option>
          ))}
        </Select>
        {(filterStatus || filterSupplier) && (
          <Button
            type="link"
            style={{ color: "#EF4444", padding: 0 }}
            onClick={() => {
              setFilterStatus(null);
              setFilterSupplier(null);
              setPage(1);
            }}
          >
            مسح الفلاتر
          </Button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
            showTotal: (t) => `${t} أمر`,
            style: { padding: "12px 20px", direction: "rtl" },
          }}
          onRow={(row) => ({
            onClick: () => {
              setSelectedPO(row);
              setDrawerOpen(true);
            },
            style: { cursor: "pointer" },
          })}
          rowClassName={(_, i) => (i % 2 === 0 ? "" : "row-alt")}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: "#94A3B8" }}>لا توجد أوامر شراء</Text>
                }
              />
            ),
          }}
        />
      </div>

      <PODetailDrawer
        po={selectedPO}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
      />

      <POFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditPO(null);
        }}
        onSuccess={fetchOrders}
        editPO={editPO}
        suppliers={suppliers}
        warehouses={warehouses}
      />

      <style>{`.row-alt { background: #FAFBFF; }`}</style>
    </div>
  );
}
