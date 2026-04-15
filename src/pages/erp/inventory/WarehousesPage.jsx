import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
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
  Card,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InboxOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../../../api/erpApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ── Stats ─────────────────────────────────────────────────────
const StatsRow = ({ warehouses }) => {
  const total = warehouses.length;
  const active = warehouses.filter((w) => w.is_active).length;
  const def = warehouses.find((w) => w.is_default);

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      {[
        {
          label: "إجمالي المستودعات",
          value: total,
          color: "#6366F1",
          icon: <InboxOutlined />,
        },
        {
          label: "نشط",
          value: active,
          color: "#10B981",
          icon: <CheckCircleOutlined />,
        },
        {
          label: "غير نشط",
          value: total - active,
          color: "#EF4444",
          icon: <CloseCircleOutlined />,
        },
        {
          label: "المستودع الافتراضي",
          value: def?.name || "—",
          color: "#F59E0B",
          icon: <HomeOutlined />,
          isText: true,
        },
      ].map((c) => (
        <Col xs={12} sm={6} key={c.label}>
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: c.color + "15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                color: c.color,
                flexShrink: 0,
              }}
            >
              {c.icon}
            </div>
            <div>
              <Text
                style={{ fontSize: 11, color: "#94A3B8", display: "block" }}
              >
                {c.label}
              </Text>
              <Text
                style={{
                  fontSize: c.isText ? 14 : 22,
                  fontWeight: 700,
                  color: "#0F172A",
                }}
              >
                {c.value}
              </Text>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
};

// ── Warehouse Form Modal ──────────────────────────────────────
function WarehouseModal({ open, onClose, onSuccess, editItem }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!editItem;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        form.setFieldsValue({
          name: editItem.name,
          location: editItem.location,
          is_default: editItem.is_default,
          is_active: editItem.is_active,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true, is_default: false });
      }
    }
  }, [open, editItem]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (isEdit) {
        await updateWarehouse(editItem.id, values);
        message.success("تم تحديث المستودع");
      } else {
        await createWarehouse(values);
        message.success("تم إنشاء المستودع");
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
          <InboxOutlined style={{ color: "#10B981" }} />
          <Text style={{ fontWeight: 700 }}>
            {isEdit ? "تعديل المستودع" : "إضافة مستودع جديد"}
          </Text>
        </Space>
      }
      width={480}
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
        <Form.Item
          name="name"
          label="اسم المستودع"
          rules={[{ required: true, message: "أدخل اسم المستودع" }]}
        >
          <Input placeholder="المستودع الرئيسي" />
        </Form.Item>
        <Form.Item name="location" label="الموقع / العنوان">
          <TextArea rows={2} placeholder="القاهرة، مدينة نصر..." />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="is_default"
              label="افتراضي"
              valuePropName="checked"
            >
              <Switch checkedChildren="نعم" unCheckedChildren="لا" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="is_active" label="نشط" valuePropName="checked">
              <Switch
                checkedChildren="نشط"
                unCheckedChildren="موقف"
                defaultChecked
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWarehouses();
      const data = res.data;
      setWarehouses(data?.results ?? data?.data ?? data ?? []);
    } catch {
      message.error("فشل في تحميل المستودعات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleDelete = async (id) => {
    try {
      await deleteWarehouse(id);
      message.success("تم الحذف");
      fetch();
    } catch {
      message.error("فشل في الحذف");
    }
  };

  const columns = [
    {
      title: "المستودع",
      dataIndex: "name",
      render: (val, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: row.is_default ? "#10B98115" : "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: row.is_default ? "#10B981" : "#94A3B8",
            }}
          >
            🏭
          </div>
          <div>
            <Text style={{ fontWeight: 700, display: "block", fontSize: 14 }}>
              {val}
            </Text>
            {row.is_default && (
              <Tag
                color="green"
                style={{ fontSize: 10, padding: "0 6px", borderRadius: 4 }}
              >
                افتراضي
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "الموقع",
      dataIndex: "location",
      render: (val) => (
        <Text style={{ color: "#64748B", fontSize: 13 }}>{val || "—"}</Text>
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
      title: "تاريخ الإنشاء",
      dataIndex: "created_at",
      width: 130,
      render: (val) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          {val ? new Date(val).toLocaleDateString("ar-EG") : "—"}
        </Text>
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
              title="هل أنت متأكد من حذف هذا المستودع؟"
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
            المستودعات
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة مستودعات التخزين
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
            مستودع جديد
          </Button>
        </Space>
      </div>

      <StatsRow warehouses={warehouses} />

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
          dataSource={warehouses}
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: "#94A3B8" }}>لا توجد مستودعات</Text>
                }
              />
            ),
          }}
        />
      </div>

      <WarehouseModal
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
