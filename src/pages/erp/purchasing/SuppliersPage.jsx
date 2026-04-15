import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Typography,
  Row,
  Col,
  message,
  Tooltip,
  Popconfirm,
  Empty,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../../api/erpApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ── Stats ─────────────────────────────────────────────────────
const StatsRow = ({ suppliers }) => {
  const total = suppliers.length;
  const active = suppliers.filter((s) => s.is_active).length;
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      {[
        { label: "إجمالي الموردين", value: total, color: "#6366F1" },
        { label: "نشط", value: active, color: "#10B981" },
        { label: "غير نشط", value: total - active, color: "#EF4444" },
      ].map((c) => (
        <Col xs={12} sm={8} key={c.label}>
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              borderTop: `3px solid ${c.color}`,
            }}
          >
            <Text style={{ fontSize: 11, color: "#94A3B8", display: "block" }}>
              {c.label}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: 800, color: c.color }}>
              {c.value}
            </Text>
          </div>
        </Col>
      ))}
    </Row>
  );
};

// ── Supplier Modal ────────────────────────────────────────────
function SupplierModal({ open, onClose, onSuccess, editItem }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!editItem;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        form.setFieldsValue({
          name: editItem.name,
          company: editItem.company,
          email: editItem.email,
          phone: editItem.phone,
          address: editItem.address,
          payment_terms: editItem.payment_terms,
          notes: editItem.notes,
          is_active: editItem.is_active,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true });
      }
    }
  }, [open, editItem]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (isEdit) {
        await updateSupplier(editItem.id, values);
        message.success("تم تحديث المورد");
      } else {
        await createSupplier(values);
        message.success("تم إضافة المورد");
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err?.response?.data) message.error("تحقق من البيانات");
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
          <UserOutlined style={{ color: "#10B981" }} />
          <Text style={{ fontWeight: 700 }}>
            {isEdit ? "تعديل المورد" : "إضافة مورد جديد"}
          </Text>
        </Space>
      }
      width={560}
      style={{ direction: "rtl" }}
      footer={
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onClose}>إلغاء</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            style={{ background: "#10B981", borderColor: "#10B981" }}
          >
            {isEdit ? "حفظ" : "إضافة"}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="اسم المورد"
              rules={[{ required: true, message: "أدخل اسم المورد" }]}
            >
              <Input placeholder="أحمد للتوريدات" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="company" label="اسم الشركة">
              <Input placeholder="شركة أحمد للتجارة" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phone" label="رقم الهاتف">
              <Input prefix={<PhoneOutlined />} placeholder="01xxxxxxxxx" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="الإيميل">
              <Input
                prefix={<MailOutlined />}
                placeholder="supplier@email.com"
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="address" label="العنوان">
          <TextArea rows={2} placeholder="القاهرة، شارع..." />
        </Form.Item>
        <Form.Item name="payment_terms" label="شروط الدفع">
          <Input placeholder="مثال: 30 يوم بعد الاستلام" />
        </Form.Item>
        <Form.Item name="notes" label="ملاحظات">
          <TextArea rows={2} placeholder="أي ملاحظات إضافية..." />
        </Form.Item>
        <Form.Item name="is_active" label="نشط" valuePropName="checked">
          <Switch
            checkedChildren="نشط"
            unCheckedChildren="موقف"
            defaultChecked
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSuppliers();
      const data = res.data;
      setSuppliers(data?.results ?? data?.data ?? data ?? []);
    } catch {
      message.error("فشل في تحميل الموردين");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleDelete = async (id) => {
    try {
      await deleteSupplier(id);
      message.success("تم الحذف");
      fetch();
    } catch {
      message.error("فشل في الحذف");
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.company?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)
  );

  const columns = [
    {
      title: "المورد",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "linear-gradient(135deg,#6366F115,#10B98115)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              border: "1px solid #E2E8F0",
            }}
          >
            🏢
          </div>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 14, display: "block" }}>
              {row.name}
            </Text>
            {row.company && (
              <Text style={{ color: "#64748B", fontSize: 12 }}>
                {row.company}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "التواصل",
      render: (_, row) => (
        <div>
          {row.phone && (
            <Text style={{ fontSize: 12, display: "block", color: "#475569" }}>
              📞 {row.phone}
            </Text>
          )}
          {row.email && (
            <Text style={{ fontSize: 12, color: "#94A3B8" }}>
              ✉️ {row.email}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "شروط الدفع",
      dataIndex: "payment_terms",
      render: (val) => (
        <Tag
          style={{
            background: "#F1F5F9",
            color: "#475569",
            border: "none",
            borderRadius: 6,
          }}
        >
          {val || "—"}
        </Tag>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "is_active",
      width: 100,
      render: (val) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            color: val ? "#10B981" : "#EF4444",
            background: val ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${val ? "#10B98130" : "#EF444430"}`,
          }}
        >
          {val ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          {val ? "نشط" : "موقف"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 90,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="تعديل">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              style={{ color: "#F59E0B" }}
              onClick={() => {
                setEditItem(row);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="حذف">
            <Popconfirm
              title="هل أنت متأكد من حذف هذا المورد؟"
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
              />
            </Popconfirm>
          </Tooltip>
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
          <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
            الموردين
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة موردي البضاعة والخدمات
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetch}
            style={{ borderRadius: 8 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: "#10B981",
              borderColor: "#10B981",
              borderRadius: 8,
              height: 38,
            }}
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
          >
            مورد جديد
          </Button>
        </Space>
      </div>

      <StatsRow suppliers={suppliers} />

      {/* Search */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "14px 20px",
          border: "1px solid #E2E8F0",
          marginBottom: 16,
        }}
      >
        <Input
          prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
          placeholder="بحث بالاسم أو الشركة أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300, borderRadius: 8 }}
          allowClear
        />
      </div>

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
          dataSource={filtered}
          loading={loading}
          pagination={{
            pageSize: 15,
            showTotal: (t) => `${t} مورد`,
            style: { padding: "12px 20px", direction: "rtl" },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: "#94A3B8" }}>لا يوجد موردين</Text>
                }
              />
            ),
          }}
        />
      </div>

      <SupplierModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        onSuccess={fetch}
        editItem={editItem}
      />
    </div>
  );
}
