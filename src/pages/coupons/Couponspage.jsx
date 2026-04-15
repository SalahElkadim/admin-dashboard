import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Card,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Switch,
  Popconfirm,
  Tooltip,
  Badge,
  Row,
  Col,
  Progress,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TagOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PercentageOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../../api/couponsApi";

const { Text, Title } = Typography;
const { Option } = Select;

const fmtMoney = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

// ── Coupon Modal ──────────────────────────────────────────────────────────────

function CouponModal({ open, onClose, onSaved, editRecord }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [discountType, setDiscountType] = useState("percentage");
  const isEdit = !!editRecord;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        form.setFieldsValue({
          code: editRecord.code,
          discount_type: editRecord.discount_type,
          value: Number(editRecord.value),
          min_order_value: Number(editRecord.min_order_value),
          max_uses: editRecord.max_uses,
          expiry_date: editRecord.expiry_date
            ? dayjs(editRecord.expiry_date)
            : null,
          is_active: editRecord.is_active,
        });
        setDiscountType(editRecord.discount_type);
      } else {
        form.resetFields();
        form.setFieldsValue({ discount_type: "percentage", is_active: true });
        setDiscountType("percentage");
      }
    }
  }, [open, editRecord, isEdit, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        ...values,
        expiry_date: values.expiry_date
          ? values.expiry_date.toISOString()
          : null,
      };

      if (isEdit) {
        await updateCoupon(editRecord.id, payload);
        message.success("تم تحديث الكوبون ✅");
      } else {
        await createCoupon(payload);
        message.success("تم إضافة الكوبون ✅");
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? "حفظ التعديلات" : "إنشاء الكوبون"}
      cancelText="إلغاء"
      confirmLoading={loading}
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TagOutlined style={{ color: "#fff", fontSize: 15 }} />
          </div>
          <Text style={{ fontWeight: 700 }}>
            {isEdit ? "تعديل الكوبون" : "إنشاء كوبون جديد"}
          </Text>
        </Space>
      }
      width={520}
      style={{ direction: "rtl" }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="code"
          label="كود الخصم"
          rules={[{ required: true, message: "ادخل كود الخصم" }]}
        >
          <Input
            placeholder="مثال: SUMMER20"
            size="large"
            style={{
              textTransform: "uppercase",
              fontFamily: "monospace",
              letterSpacing: 2,
            }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="discount_type"
              label="نوع الخصم"
              rules={[{ required: true }]}
            >
              <Select size="large" onChange={(v) => setDiscountType(v)}>
                <Option value="percentage">
                  <Space>
                    <PercentageOutlined />
                    نسبة مئوية
                  </Space>
                </Option>
                <Option value="fixed">
                  <Space>
                    <DollarOutlined />
                    قيمة ثابتة
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="value"
              label={
                discountType === "percentage"
                  ? "نسبة الخصم (%)"
                  : "قيمة الخصم ($)"
              }
              rules={[
                { required: true, message: "ادخل القيمة" },
                discountType === "percentage"
                  ? { type: "number", max: 100, message: "الحد الأقصى 100%" }
                  : {},
              ]}
            >
              <InputNumber
                min={0}
                max={discountType === "percentage" ? 100 : undefined}
                step={discountType === "percentage" ? 1 : 0.01}
                size="large"
                style={{ width: "100%" }}
                formatter={(v) =>
                  discountType === "percentage" ? `${v}%` : `$${v}`
                }
                parser={(v) => v.replace(/[%$\s]/g, "")}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="min_order_value"
              label="أقل قيمة للطلب ($)"
              initialValue={0}
            >
              <InputNumber
                min={0}
                step={0.01}
                size="large"
                style={{ width: "100%" }}
                formatter={(v) => `$ ${v}`}
                parser={(v) => v.replace(/\$\s?/g, "")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="max_uses" label="أقصى عدد استخدامات">
              <InputNumber
                min={1}
                size="large"
                style={{ width: "100%" }}
                placeholder="غير محدود"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="expiry_date" label="تاريخ الانتهاء">
          <DatePicker
            size="large"
            style={{ width: "100%" }}
            placeholder="بدون تاريخ انتهاء"
            showTime
            format="YYYY-MM-DD HH:mm"
            disabledDate={(d) => d && d < dayjs().startOf("day")}
          />
        </Form.Item>

        <Form.Item name="is_active" label="الحالة" valuePropName="checked">
          <Switch checkedChildren="مفعّل" unCheckedChildren="معطّل" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    is_active: undefined,
    discount_type: undefined,
    page: 1,
    page_size: 10,
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.is_active !== undefined) params.is_active = filters.is_active;
      if (filters.discount_type) params.discount_type = filters.discount_type;
      params.page = filters.page;
      params.page_size = filters.page_size;

      const { data } = await getCoupons(params);

      // ✅ الـ backend ممكن يرجع بأشكال مختلفة — بنتعامل مع كلها
      const list =
        data?.results ?? // paginated مباشرة
        data?.data?.results ?? // { success, data: { results } }
        data?.data ?? // { success, data: [...] }
        [];
      const count = data?.count ?? data?.data?.count ?? list.length;

      setCoupons(list);
      setTotal(count);
    } catch {
      message.error("فشل تحميل الكوبونات");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteCoupon(id);
      message.success("تم حذف الكوبون");
      fetchCoupons();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const openAdd = () => {
    setEditRecord(null);
    setModalOpen(true);
  };
  const openEdit = (record) => {
    setEditRecord(record);
    setModalOpen(true);
  };

  const handleFilterChange = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val, page: 1 }));

  const resetFilters = () =>
    setFilters({
      search: "",
      is_active: undefined,
      discount_type: undefined,
      page: 1,
      page_size: 10,
    });

  // ── Usage Bar ─────────────────────────────────────────────────────────────
  const UsageBar = ({ used, max }) => {
    if (!max)
      return <Text style={{ color: "#94A3B8", fontSize: 12 }}>غير محدود</Text>;
    const pct = Math.round((used / max) * 100);
    return (
      <div style={{ minWidth: 100 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 3,
          }}
        >
          <Text style={{ fontSize: 11, color: "#64748B" }}>
            {used} / {max}
          </Text>
          <Text
            style={{ fontSize: 11, color: pct >= 90 ? "#EF4444" : "#94A3B8" }}
          >
            {pct}%
          </Text>
        </div>
        <Progress
          percent={pct}
          showInfo={false}
          size="small"
          strokeColor={
            pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#6366F1"
          }
          trailColor="#F1F5F9"
        />
      </div>
    );
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "الكود",
      dataIndex: "code",
      width: 160,
      render: (v) => (
        <Text
          copyable
          style={{
            fontFamily: "monospace",
            fontWeight: 800,
            fontSize: 14,
            color: "#6366F1",
            letterSpacing: 1,
          }}
        >
          {v}
        </Text>
      ),
    },
    {
      title: "الخصم",
      width: 150,
      render: (_, r) => (
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background:
                r.discount_type === "percentage" ? "#EEF2FF" : "#F0FDF4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {r.discount_type === "percentage" ? (
              <PercentageOutlined style={{ color: "#6366F1" }} />
            ) : (
              <DollarOutlined style={{ color: "#10B981" }} />
            )}
          </div>
          <Text style={{ fontWeight: 700, fontSize: 15 }}>
            {r.discount_type === "percentage"
              ? `${r.value}%`
              : fmtMoney(r.value)}
          </Text>
        </Space>
      ),
    },
    {
      title: "الحد الأدنى",
      dataIndex: "min_order_value",
      width: 120,
      render: (v) =>
        Number(v) > 0 ? (
          <Text style={{ fontSize: 13 }}>{fmtMoney(v)}</Text>
        ) : (
          <Text style={{ color: "#94A3B8" }}>لا يوجد</Text>
        ),
    },
    {
      title: "الاستخدامات",
      width: 150,
      render: (_, r) => <UsageBar used={r.used_count} max={r.max_uses} />,
    },
    {
      title: "الانتهاء",
      dataIndex: "expiry_date",
      width: 150,
      render: (v) => {
        if (!v)
          return (
            <Text style={{ color: "#94A3B8", fontSize: 12 }}>لا يوجد</Text>
          );
        const expired = dayjs(v).isBefore(dayjs());
        return (
          <Space size={4}>
            <CalendarOutlined
              style={{ color: expired ? "#EF4444" : "#94A3B8", fontSize: 12 }}
            />
            <Text
              style={{ fontSize: 12, color: expired ? "#EF4444" : "#475569" }}
            >
              {dayjs(v).format("YYYY-MM-DD")}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "الصلاحية",
      width: 120,
      render: (_, r) => (
        <Space size={4}>
          {r.is_valid ? (
            <CheckCircleOutlined style={{ color: "#10B981" }} />
          ) : (
            <CloseCircleOutlined style={{ color: "#EF4444" }} />
          )}
          <Tag
            color={r.is_active ? (r.is_valid ? "green" : "orange") : "default"}
            style={{ borderRadius: 6 }}
          >
            {!r.is_active ? "معطّل" : r.is_valid ? "صالح" : "منتهي"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "",
      key: "actions",
      fixed: "left",
      width: 80,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="تعديل">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
              style={{ color: "#6366F1" }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف الكوبون"
            description="هل أنت متأكد من حذف هذا الكوبون؟"
            onConfirm={() => handleDelete(r.id)}
            okText="حذف"
            cancelText="إلغاء"
            okType="danger"
          >
            <Tooltip title="حذف">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeFiltersCount = [
    filters.search,
    filters.is_active !== undefined ? true : null,
    filters.discount_type,
  ].filter(Boolean).length;

  return (
    <div style={{ direction: "rtl" }}>
      {/* ── Header ── */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
            الكوبونات
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إنشاء وإدارة كودات الخصم
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={openAdd}
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            border: "none",
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            fontWeight: 600,
          }}
        >
          إنشاء كوبون
        </Button>
      </div>

      {/* ── Filters ── */}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          marginBottom: 16,
        }}
        bodyStyle={{ padding: "14px 20px" }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              placeholder="ابحث بالكود..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="نوع الخصم"
              value={filters.discount_type}
              onChange={(v) => handleFilterChange("discount_type", v)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="percentage">نسبة مئوية</Option>
              <Option value="fixed">قيمة ثابتة</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="الحالة"
              value={filters.is_active}
              onChange={(v) => handleFilterChange("is_active", v)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={true}>مفعّل</Option>
              <Option value={false}>معطّل</Option>
            </Select>
          </Col>
          <Col flex="none">
            <Tooltip title="إعادة تعيين">
              <Badge count={activeFiltersCount} size="small" color="#6366F1">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetFilters}
                  style={{ borderRadius: 8 }}
                />
              </Badge>
            </Tooltip>
          </Col>
        </Row>
      </Card>

      {/* ── Table ── */}
      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TagOutlined style={{ color: "#94A3B8" }} />
          <Text style={{ color: "#64748B", fontSize: 13 }}>
            {loading ? "جاري التحميل..." : `${total} كوبون`}
          </Text>
        </div>

        <Table
          rowKey="id"
          dataSource={coupons}
          columns={columns}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: filters.page,
            pageSize: filters.page_size,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50"],
            showTotal: (t) => `إجمالي ${t} كوبون`,
            position: ["bottomCenter"],
          }}
          onChange={(p) =>
            setFilters((prev) => ({
              ...prev,
              page: p.current,
              page_size: p.pageSize,
            }))
          }
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <TagOutlined
                  style={{
                    fontSize: 48,
                    color: "#CBD5E1",
                    display: "block",
                    marginBottom: 12,
                  }}
                />
                <Text style={{ color: "#94A3B8" }}>لا توجد كوبونات</Text>
              </div>
            ),
          }}
        />
      </Card>

      <CouponModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchCoupons}
        editRecord={editRecord}
      />
    </div>
  );
}
