import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Tag,
  Space,
  Popconfirm,
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  message,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined,
  DollarOutlined,
  CalendarOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getRevenues,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  bulkDeleteRevenues,
} from "../../../api/erpApi";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SOURCE_CONFIG = {
  sale: {
    label: "أوردر مبيعات",
    color: "green",
    icon: <ShoppingCartOutlined />,
  },
  manual: { label: "يدوي", color: "blue", icon: <DollarOutlined /> },
  other: { label: "أخرى", color: "default", icon: <DollarOutlined /> },
};

export default function RevenuesPage() {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getRevenues(filters);
      const data = res.data;
      setRevenues(data?.results ?? data?.data?.results ?? data ?? []);
    } catch {
      message.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Stats
  const totalRevenue = revenues.reduce(
    (s, r) => s + parseFloat(r.amount || 0),
    0
  );
  const thisMonth = revenues
    .filter((r) => dayjs(r.date).isSame(dayjs(), "month"))
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const fromSales = revenues
    .filter((r) => r.source === "sale")
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const manual = revenues
    .filter((r) => r.source !== "sale")
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ currency: "EGP", date: dayjs(), source: "manual" });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({ ...record, date: dayjs(record.date) });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, date: values.date.format("YYYY-MM-DD") };
      if (editingId) {
        await updateRevenue(editingId, payload);
        message.success("تم التعديل");
      } else {
        await createRevenue(payload);
        message.success("تم الإضافة");
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("حدث خطأ");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRevenue(id);
      message.success("تم الحذف");
      fetchData();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteRevenues(selectedRowKeys);
      message.success(`تم حذف ${selectedRowKeys.length} إيراد`);
      setSelectedRowKeys([]);
      fetchData();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const allIds = revenues.map((r) => r.id);
      await bulkDeleteRevenues(allIds);
      message.success("تم حذف كل الإيرادات");
      setSelectedRowKeys([]);
      fetchData();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const columns = [
    {
      title: "المصدر",
      dataIndex: "source",
      key: "source",
      render: (v) => {
        const cfg = SOURCE_CONFIG[v] || SOURCE_CONFIG.other;
        return (
          <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 8 }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "الوصف",
      dataIndex: "description",
      key: "description",
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{v || "—"}</Text>
          {r.sales_order && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              أوردر #{r.sales_order}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "المبلغ",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
      render: (v, r) => (
        <Text
          strong
          style={{
            color: parseFloat(v) < 0 ? "#EF4444" : "#10B981",
            fontSize: 14,
          }}
        >
          {parseFloat(v) > 0 ? "+" : ""}
          {parseFloat(v).toLocaleString("ar-EG")} {r.currency}
        </Text>
      ),
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (v) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: "#94A3B8" }} />
          <Text style={{ color: "#475569", fontSize: 12 }}>
            {dayjs(v).format("DD MMM YYYY")}
          </Text>
        </Space>
      ),
    },
    {
      title: "الإجراءات",
      key: "actions",
      width: 100,
      render: (_, r) =>
        r.source === "sale" ? (
          <Tag color="default" style={{ fontSize: 11 }}>
            تلقائي
          </Tag>
        ) : (
          <Space>
            <Tooltip title="تعديل">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(r)}
              />
            </Tooltip>
            <Popconfirm
              title="تأكيد الحذف؟"
              onConfirm={() => handleDelete(r.id)}
              okText="نعم"
              cancelText="لا"
            >
              <Tooltip title="حذف">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
            💰 الإيرادات
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            تتبع كل إيرادات الشركة (تلقائية ويدوية)
          </Text>
        </div>
        <Space wrap>
          {/* حذف المحدد */}
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`حذف ${selectedRowKeys.length} إيراد محدد؟`}
              onConfirm={handleBulkDelete}
              okText="نعم"
              cancelText="لا"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>
                حذف المحدد ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}

          {/* حذف الكل */}
          <Popconfirm
            title="سيتم حذف كل الإيرادات. هل أنت متأكد؟"
            onConfirm={handleDeleteAll}
            okText="نعم، احذف الكل"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              حذف الكل
            </Button>
          </Popconfirm>

          {/* إضافة إيراد */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            style={{
              borderRadius: 8,
              background: "#10B981",
              borderColor: "#10B981",
            }}
          >
            إيراد يدوي
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            title: "إجمالي الإيرادات",
            value: totalRevenue,
            color: "#10B981",
            icon: <RiseOutlined />,
            prefix: "ج.م",
          },
          {
            title: "هذا الشهر",
            value: thisMonth,
            color: "#3B82F6",
            icon: <CalendarOutlined />,
            prefix: "ج.م",
          },
          {
            title: "من المبيعات",
            value: fromSales,
            color: "#F59E0B",
            icon: <ShoppingCartOutlined />,
            prefix: "ج.م",
          },
          {
            title: "إيرادات أخرى",
            value: manual,
            color: "#8B5CF6",
            icon: <DollarOutlined />,
            prefix: "ج.م",
          },
        ].map((s, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card
              style={{
                borderRadius: 16,
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
              bodyStyle={{ padding: "16px 20px" }}
            >
              <Space align="start">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: s.color + "18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.color,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
                <Statistic
                  title={
                    <Text style={{ fontSize: 12, color: "#64748B" }}>
                      {s.title}
                    </Text>
                  }
                  value={s.value}
                  prefix={s.prefix}
                  valueStyle={{ color: s.color, fontSize: 20, fontWeight: 700 }}
                />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          border: "1px solid #E2E8F0",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <FilterOutlined style={{ color: "#94A3B8" }} />
        <Select
          placeholder="المصدر"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
        >
          {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
            <Option key={k} value={k}>
              {v.label}
            </Option>
          ))}
        </Select>
        <RangePicker
          style={{ borderRadius: 8 }}
          onChange={(dates) => {
            if (dates) {
              setFilters((f) => ({
                ...f,
                from: dates[0].format("YYYY-MM-DD"),
                to: dates[1].format("YYYY-MM-DD"),
              }));
            } else {
              setFilters((f) => {
                const n = { ...f };
                delete n.from;
                delete n.to;
                return n;
              });
            }
          }}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setFilters({});
            fetchData();
          }}
          style={{ borderRadius: 8 }}
        >
          إعادة تعيين
        </Button>
      </div>

      {/* Table */}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={revenues}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{ emptyText: "لا توجد إيرادات" }}
          style={{ direction: "rtl" }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={editingId ? "تعديل إيراد" : "إضافة إيراد يدوي"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="حفظ"
        cancelText="إلغاء"
        width={500}
        okButtonProps={{
          style: { background: "#10B981", borderColor: "#10B981" },
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="source" label="المصدر" initialValue="manual">
            <Select>
              <Option value="manual">يدوي</Option>
              <Option value="other">أخرى</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="الوصف">
            <Input placeholder="وصف الإيراد..." />
          </Form.Item>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item
                name="amount"
                label="المبلغ"
                rules={[{ required: true, message: "المبلغ مطلوب" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="currency" label="العملة" initialValue="EGP">
                <Select>
                  <Option value="EGP">EGP</Option>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="date"
            label="التاريخ"
            rules={[{ required: true, message: "التاريخ مطلوب" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
