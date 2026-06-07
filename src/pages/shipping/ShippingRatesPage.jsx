// pages/shipping/ShippingRatesPage.jsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Tag,
  Popconfirm,
  message,
  Card,
  Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api/axiosInstance";

const { Title } = Typography;

const SEED_DATA = [
  { governorate: "القاهرة", cost: 25 },
  { governorate: "الجيزة", cost: 25 },
  { governorate: "الإسكندرية", cost: 35 },
  { governorate: "الدقهلية", cost: 35 },
  { governorate: "البحيرة", cost: 35 },
  { governorate: "الفيوم", cost: 35 },
  { governorate: "الغربية", cost: 35 },
  { governorate: "الإسماعيلية", cost: 35 },
  { governorate: "المنوفية", cost: 35 },
  { governorate: "المنيا", cost: 35 },
  { governorate: "القليوبية", cost: 35 },
  { governorate: "السويس", cost: 35 },
  { governorate: "دمياط", cost: 35 },
  { governorate: "الشرقية", cost: 35 },
  { governorate: "كفر الشيخ", cost: 35 },
  { governorate: "بني سويف", cost: 35 },
  { governorate: "بورسعيد", cost: 35 },
  { governorate: "أسيوط", cost: 35 },
  { governorate: "سوهاج", cost: 35 },
  { governorate: "قنا", cost: 35 },
  { governorate: "مطروح", cost: 35 },
  { governorate: "شمال سيناء", cost: 50 },
  { governorate: "جنوب سيناء", cost: 50 },
  { governorate: "الوادي الجديد", cost: 50 },
  { governorate: "البحر الأحمر", cost: 50 },
  { governorate: "الأقصر", cost: 50 },
  { governorate: "أسوان", cost: 50 },
];

export default function ShippingRatesPage() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [form] = Form.useForm();

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/shipping-rates/?page_size=100");
      setRates(res.data.results || res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ ...record, cost: Number(record.cost) });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.patch(`/shipping-rates/${editing.id}/`, values);
        message.success("تم التحديث.");
      } else {
        await api.post("/shipping-rates/", values);
        message.success("تمت الإضافة.");
      }
      setModalOpen(false);
      fetchRates();
    } catch (err) {
      message.error(err.response?.data?.message || "حدث خطأ.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/shipping-rates/${id}/`);
      message.success("تم الحذف.");
      fetchRates();
    } catch {
      message.error("فشل الحذف.");
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.post("/shipping-rates/bulk/", SEED_DATA);
      message.success(
        `تم: ${res.data.data.created} جديد، ${res.data.data.updated} محدّث`
      );
      fetchRates();
    } catch {
      message.error("فشل الـ seed.");
    } finally {
      setSeeding(false);
    }
  };

  const getCostColor = (cost) => {
    if (cost <= 25) return "success";
    if (cost <= 35) return "processing";
    return "warning";
  };

  const columns = [
    {
      title: "المحافظة",
      dataIndex: "governorate",
      sorter: (a, b) => a.governorate.localeCompare(b.governorate),
    },
    {
      title: "تكلفة الشحن",
      dataIndex: "cost",
      render: (cost) => (
        <Tag color={getCostColor(Number(cost))}>
          {Number(cost).toLocaleString()} ج.م
        </Tag>
      ),
      sorter: (a, b) => Number(a.cost) - Number(b.cost),
    },
    {
      title: "الإجراءات",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            تعديل
          </Button>
          <Popconfirm
            title="حذف هذا السعر؟"
            onConfirm={() => handleDelete(record.id)}
            okText="نعم"
            cancelText="لا"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          أسعار الشحن
        </Title>
        <Space>
          {rates.length === 0 && (
            <Button loading={seeding} onClick={handleSeed}>
              تعبئة المحافظات الافتراضية
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            إضافة محافظة
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rates}
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? "تعديل سعر الشحن" : "إضافة محافظة جديدة"}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="حفظ"
        cancelText="إلغاء"
        style={{ direction: "rtl" }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="governorate"
            label="اسم المحافظة"
            rules={[{ required: true, message: "أدخل اسم المحافظة" }]}
          >
            <Input placeholder="مثال: القاهرة" />
          </Form.Item>
          <Form.Item
            name="cost"
            label="تكلفة الشحن (ج.م)"
            rules={[{ required: true, message: "أدخل تكلفة الشحن" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="مثال: 35"
              addonAfter="ج.م"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
