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
  Upload,
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
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  FilterOutlined,
  ReloadOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createExpenseCategory,
} from "../../../api/erpApi";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// ── Styles ──────────────────────────────────────────────────
const styles = {
  page: {
    background: "#F8FAFC",
    minHeight: "100%",
    padding: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  statsRow: { marginBottom: 24 },
  statCard: {
    borderRadius: 16,
    border: "1px solid #E2E8F0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  filterBar: {
    background: "#fff",
    borderRadius: 12,
    padding: "14px 18px",
    marginBottom: 20,
    border: "1px solid #E2E8F0",
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  tableCard: {
    borderRadius: 16,
    border: "1px solid #E2E8F0",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
};

const CURRENCY_COLORS = {
  EGP: "#10B981",
  USD: "#3B82F6",
  EUR: "#F59E0B",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        getExpenses(filters),
        getExpenseCategories(),
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
    } catch {
      message.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // ── Stats ──
  const totalEGP = expenses
    .filter((e) => e.currency === "EGP")
    .reduce((s, e) => s + parseFloat(e.amount), 0);
  const recurring = expenses.filter((e) => e.is_recurring).length;
  const thisMonth = expenses
    .filter((e) => dayjs(e.date).isSame(dayjs(), "month"))
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  // ── CRUD ──
  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ currency: "EGP", date: dayjs() });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
      category: record.category,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k === "date") fd.append(k, v.format("YYYY-MM-DD"));
        else if (k === "receipt" && v?.fileList?.[0]?.originFileObj)
          fd.append(k, v.fileList[0].originFileObj);
        else if (v !== undefined && v !== null) fd.append(k, v);
      });

      if (editingId) {
        await updateExpense(editingId, fd);
        message.success("تم التعديل");
      } else {
        await createExpense(fd);
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
      await deleteExpense(id);
      message.success("تم الحذف");
      fetchData();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const handleAddCategory = async () => {
    try {
      const vals = await catForm.validateFields();
      await createExpenseCategory(vals);
      message.success("تمت إضافة التصنيف");
      setCatModalOpen(false);
      catForm.resetFields();
      fetchData();
    } catch {
      message.error("حدث خطأ");
    }
  };

  // ── Columns ──
  const columns = [
    {
      title: "الوصف",
      dataIndex: "description",
      key: "description",
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>
            {v}
          </Text>
          {r.is_recurring && (
            <Tag color="blue" style={{ fontSize: 10 }}>
              متكرر
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "التصنيف",
      dataIndex: "category_name",
      key: "category_name",
      render: (v) =>
        v ? (
          <Tag
            icon={<PieChartOutlined />}
            color="geekblue"
            style={{ borderRadius: 8 }}
          >
            {v}
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
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
            color: CURRENCY_COLORS[r.currency] || "#EF4444",
            fontSize: 14,
          }}
        >
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
      render: (_, r) => (
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
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
            💸 المصروفات
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            إدارة وتتبع كل مصاريف الشركة
          </Text>
        </div>
        <Space>
          <Button
            icon={<PlusOutlined />}
            onClick={() => setCatModalOpen(true)}
            style={{ borderRadius: 8 }}
          >
            تصنيف جديد
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            style={{
              borderRadius: 8,
              background: "#EF4444",
              borderColor: "#EF4444",
            }}
          >
            مصروف جديد
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={styles.statsRow}>
        {[
          {
            title: "إجمالي المصروفات (EGP)",
            value: totalEGP,
            prefix: "ج.م",
            color: "#EF4444",
            icon: <DollarOutlined />,
          },
          {
            title: "هذا الشهر",
            value: thisMonth,
            prefix: "ج.م",
            color: "#F59E0B",
            icon: <CalendarOutlined />,
          },
          {
            title: "إجمالي السجلات",
            value: expenses.length,
            color: "#3B82F6",
            icon: <FileTextOutlined />,
          },
          {
            title: "مصاريف متكررة",
            value: recurring,
            color: "#8B5CF6",
            icon: <ReloadOutlined />,
          },
        ].map((s, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card style={styles.statCard} bodyStyle={{ padding: "16px 20px" }}>
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
      <div style={styles.filterBar}>
        <FilterOutlined style={{ color: "#94A3B8" }} />
        <Select
          placeholder="التصنيف"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
        >
          {categories.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.name}
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
          onClick={() => setFilters({})}
          style={{ borderRadius: 8 }}
        >
          إعادة تعيين
        </Button>
      </div>

      {/* Table */}
      <Card style={styles.tableCard} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{ emptyText: "لا توجد مصروفات" }}
          style={{ direction: "rtl" }}
        />
      </Card>

      {/* Expense Modal */}
      <Modal
        title={editingId ? "تعديل مصروف" : "إضافة مصروف جديد"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="حفظ"
        cancelText="إلغاء"
        width={560}
        okButtonProps={{
          style: { background: "#EF4444", borderColor: "#EF4444" },
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="description"
            label="الوصف"
            rules={[{ required: true, message: "الوصف مطلوب" }]}
          >
            <Input placeholder="مثال: إيجار المكتب" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item name="currency" label="العملة" initialValue="EGP">
                <Select>
                  <Option value="EGP">EGP - جنيه</Option>
                  <Option value="USD">USD - دولار</Option>
                  <Option value="EUR">EUR - يورو</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="category" label="التصنيف">
                <Select placeholder="اختر تصنيف" allowClear>
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="التاريخ"
                rules={[{ required: true, message: "التاريخ مطلوب" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="is_recurring" label="مصروف متكرر؟">
            <Select>
              <Option value={false}>لا</Option>
              <Option value={true}>نعم</Option>
            </Select>
          </Form.Item>
          <Form.Item name="receipt" label="إيصال (صورة)">
            <Upload maxCount={1} beforeUpload={() => false} listType="picture">
              <Button icon={<UploadOutlined />}>رفع إيصال</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal
        title="إضافة تصنيف جديد"
        open={catModalOpen}
        onOk={handleAddCategory}
        onCancel={() => setCatModalOpen(false)}
        okText="إضافة"
        cancelText="إلغاء"
        width={400}
      >
        <Form form={catForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="اسم التصنيف"
            rules={[{ required: true, message: "الاسم مطلوب" }]}
          >
            <Input placeholder="مثال: إيجار، شحن، تسويق..." />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="icon" label="أيقونة (emoji)">
                <Input placeholder="🏠" maxLength={4} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label="اللون">
                <Input type="color" style={{ height: 32, padding: 2 }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
