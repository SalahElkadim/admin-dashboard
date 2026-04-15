import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Row,
  Col,
  Space,
  Tooltip,
  Popconfirm,
  message,
  Switch,
  Empty,
  Tag,
} from "antd";
import {
  CarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LinkOutlined,
  PhoneOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  getShippingCarriers,
  createShippingCarrier,
  updateShippingCarrier,
  deleteShippingCarrier,
} from "../../../api/erpApi";

const CarrierModal = ({ open, onClose, onSave, carrier }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) carrier ? form.setFieldsValue(carrier) : form.resetFields();
  }, [open, carrier]);

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      if (carrier) {
        const res = await updateShippingCarrier(carrier.id, vals);
        onSave(res.data, "edit");
      } else {
        const res = await createShippingCarrier(vals);
        onSave(res.data, "create");
      }
      message.success(carrier ? "تم التحديث" : "تم الإضافة");
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
          {carrier ? "تعديل شركة الشحن" : "إضافة شركة شحن"}
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText={carrier ? "حفظ" : "إضافة"}
      cancelText="إلغاء"
      okButtonProps={{ style: { background: "#10B981", border: "none" } }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="اسم الشركة" rules={[{ required: true }]}>
          <Input placeholder="أرامكس، Bosta، J&T..." />
        </Form.Item>
        <Form.Item name="phone" label="رقم التواصل">
          <Input prefix={<PhoneOutlined />} placeholder="02xxxxxxxx" />
        </Form.Item>
        <Form.Item name="default_cost" label="تكلفة الشحن الافتراضية">
          <Input type="number" suffix="EGP" prefix={<DollarOutlined />} />
        </Form.Item>
        <Form.Item
          name="tracking_url_template"
          label="رابط التتبع"
          help="استخدم {tracking_number} مكان رقم التتبع"
        >
          <Input
            prefix={<LinkOutlined />}
            placeholder="https://track.example.com/{tracking_number}"
          />
        </Form.Item>
        <Form.Item
          name="is_active"
          label="نشط"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch checkedChildren="نشط" unCheckedChildren="غير نشط" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default function ShippingCarriersPage() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCarrier, setEditCarrier] = useState(null);

  const fetchCarriers = async () => {
    setLoading(true);
    try {
      const res = await getShippingCarriers();
      setCarriers(res.data);
    } catch {
      message.error("فشل التحميل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const handleSave = (item, mode) => {
    if (mode === "create") setCarriers((p) => [item, ...p]);
    else setCarriers((p) => p.map((c) => (c.id === item.id ? item : c)));
  };

  const handleDelete = async (id) => {
    try {
      await deleteShippingCarrier(id);
      setCarriers((p) => p.filter((c) => c.id !== id));
      message.success("تم الحذف");
    } catch {
      message.error("فشل الحذف");
    }
  };

  const handleToggle = async (carrier) => {
    try {
      const res = await updateShippingCarrier(carrier.id, {
        is_active: !carrier.is_active,
      });
      setCarriers((p) => p.map((c) => (c.id === carrier.id ? res.data : c)));
    } catch {}
  };

  const columns = [
    {
      title: "شركة الشحن",
      dataIndex: "name",
      render: (v, r) => (
        <Space>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: r.is_active ? "#ECFDF5" : "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CarOutlined
              style={{ color: r.is_active ? "#10B981" : "#94A3B8" }}
            />
          </div>
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 600, color: "#0F172A" }}>{v}</span>
            {r.phone && (
              <span style={{ fontSize: 12, color: "#64748B" }}>{r.phone}</span>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: "التكلفة الافتراضية",
      dataIndex: "default_cost",
      render: (v) => (
        <span style={{ color: "#10B981", fontWeight: 600 }}>
          {Number(v).toLocaleString()} EGP
        </span>
      ),
    },
    {
      title: "رابط التتبع",
      dataIndex: "tracking_url_template",
      render: (v) =>
        v ? (
          <Tooltip title={v}>
            <Tag
              color="blue"
              icon={<LinkOutlined />}
              style={{
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              رابط متاح
            </Tag>
          </Tooltip>
        ) : (
          <span style={{ color: "#CBD5E1" }}>—</span>
        ),
    },
    {
      title: "الحالة",
      dataIndex: "is_active",
      render: (v, r) => (
        <Switch
          checked={v}
          onChange={() => handleToggle(r)}
          checkedChildren="نشط"
          unCheckedChildren="معطل"
          style={{ background: v ? "#10B981" : undefined }}
        />
      ),
    },
    {
      title: "",
      width: 100,
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditCarrier(r);
              setModalOpen(true);
            }}
          />
          <Popconfirm
            title="حذف شركة الشحن؟"
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
            <CarOutlined style={{ marginLeft: 10, color: "#10B981" }} />
            شركات الشحن
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748B" }}>
            إدارة شركات الشحن وتكاليفها
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchCarriers}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditCarrier(null);
              setModalOpen(true);
            }}
            style={{
              background: "#10B981",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            إضافة شركة
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: "إجمالي الشركات", value: carriers.length, color: "#6366F1" },
          {
            label: "شركات نشطة",
            value: carriers.filter((c) => c.is_active).length,
            color: "#10B981",
          },
          {
            label: "معطلة",
            value: carriers.filter((c) => !c.is_active).length,
            color: "#94A3B8",
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
          dataSource={carriers}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                description="لا توجد شركات شحن"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          pagination={{ pageSize: 10 }}
          style={{ borderRadius: 16, overflow: "hidden" }}
        />
      </Card>

      <CarrierModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        carrier={editCarrier}
      />
    </div>
  );
}
