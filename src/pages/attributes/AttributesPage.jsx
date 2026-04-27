import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Typography,
  Card,
  Modal,
  Form,
  Row,
  Col,
  Tooltip,
  message,
  Divider,
  Badge,
  Select,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  TagsOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  PictureOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import {
  getAttributes,
  createAttribute,
  createAttributeValue,
  deleteAttributeValue,
} from "../../api/productsApi";

const { Text, Title } = Typography;
const { Option } = Select;

const TAG_COLORS = [
  "blue",
  "purple",
  "cyan",
  "green",
  "magenta",
  "orange",
  "gold",
  "lime",
  "volcano",
  "geekblue",
];
const getColor = (index) => TAG_COLORS[index % TAG_COLORS.length];

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: إضافة Attribute جديد
// ─────────────────────────────────────────────────────────────────────────────
function AddAttributeModal({ open, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await createAttribute({ name: values.name });
      message.success("تم إضافة الخاصية بنجاح ✅");
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
      okText="إضافة"
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
            <TagsOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <Text style={{ fontWeight: 700 }}>إضافة خاصية جديدة</Text>
        </Space>
      }
      width={440}
      style={{ direction: "rtl" }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="name"
          label="اسم الخاصية"
          rules={[{ required: true, message: "ادخل اسم الخاصية" }]}
          extra="مثال: اللون، المقاس، الخامة"
        >
          <Input
            placeholder="مثال: اللون"
            size="large"
            prefix={<TagsOutlined style={{ color: "#94A3B8" }} />}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: إدارة Values الخاصة بـ Attribute
// ─────────────────────────────────────────────────────────────────────────────
function ManageValuesModal({ open, onClose, attribute, onSaved }) {
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [values, setValues] = useState([]);

  useEffect(() => {
    if (open && attribute) {
      setValues(attribute.values ?? []);
      setNewValue("");
    }
  }, [open, attribute]);

  const handleAdd = async () => {
    if (!newValue.trim()) {
      message.warning("ادخل قيمة أولاً");
      return;
    }
    setAdding(true);
    try {
      const { data } = await createAttributeValue(attribute.id, {
        value: newValue.trim(),
      });
      const added = data.data ?? data;
      setValues((prev) => [...prev, added]);
      setNewValue("");
      message.success("تم إضافة القيمة ✅");
      onSaved();
    } catch (err) {
      message.error(err.response?.data?.message || "فشل الإضافة");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (valueId) => {
    setDeletingId(valueId);
    try {
      await deleteAttributeValue(attribute.id, valueId);
      setValues((prev) => prev.filter((v) => v.id !== valueId));
      message.success("تم الحذف");
      onSaved();
    } catch {
      message.error("فشل الحذف");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #F59E0B, #EF4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppstoreOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <Text style={{ fontWeight: 700 }}>قيم خاصية: {attribute?.name}</Text>
        </Space>
      }
      width={520}
      style={{ direction: "rtl" }}
    >
      {/* ── إضافة قيمة جديدة ── */}
      <div style={{ marginBottom: 20, marginTop: 16 }}>
        <Text
          style={{
            fontWeight: 600,
            display: "block",
            marginBottom: 8,
            color: "#374151",
          }}
        >
          إضافة قيمة جديدة
        </Text>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="مثال: أحمر، XL، قطن..."
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onPressEnter={handleAdd}
            size="large"
          />
          <Button
            type="primary"
            size="large"
            loading={adding}
            onClick={handleAdd}
            icon={<PlusOutlined />}
            style={{
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              border: "none",
            }}
          >
            إضافة
          </Button>
        </Space.Compact>
        <Text
          style={{
            fontSize: 12,
            color: "#94A3B8",
            marginTop: 4,
            display: "block",
          }}
        >
          اضغط Enter أو زر الإضافة
        </Text>
      </div>

      <Divider style={{ margin: "12px 0" }} />

      {/* ── القيم الحالية ── */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontWeight: 600, color: "#374151" }}>
            القيم الحالية
            <Badge
              count={values.length}
              style={{ background: "#6366F1", marginRight: 8 }}
            />
          </Text>
          {/* ✦ إشعار: بعض القيم مرتبطة بصور */}
          {values.some((v) => v.images_count > 0) && (
            <Space size={4}>
              <LinkOutlined style={{ color: "#10B981", fontSize: 12 }} />
              <Text style={{ fontSize: 11, color: "#10B981" }}>
                بعض القيم مرتبطة بصور منتجات
              </Text>
            </Space>
          )}
        </div>

        {values.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "#94A3B8",
              fontSize: 13,
              background: "#F8FAFC",
              borderRadius: 10,
              border: "1px dashed #E2E8F0",
            }}
          >
            لا توجد قيم بعد — أضف أول قيمة من الحقل أعلاه
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {values.map((v, i) => (
              <Tooltip
                key={v.id}
                title={
                  v.images_count > 0
                    ? `مرتبط بـ ${v.images_count} صورة منتج`
                    : "لا توجد صور مرتبطة بهذه القيمة"
                }
              >
                <Tag
                  color={getColor(i)}
                  style={{
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "default",
                  }}
                  closable
                  closeIcon={
                    deletingId === v.id ? (
                      <span style={{ fontSize: 10 }}>...</span>
                    ) : undefined
                  }
                  onClose={(e) => {
                    e.preventDefault();
                    handleDelete(v.id);
                  }}
                >
                  {/* ✦ أيقونة صورة لو في صور مرتبطة */}
                  {v.images_count > 0 && (
                    <PictureOutlined style={{ fontSize: 11 }} />
                  )}
                  {v.value}
                  {v.images_count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        background: "rgba(255,255,255,0.4)",
                        borderRadius: 10,
                        padding: "0 5px",
                        fontWeight: 700,
                      }}
                    >
                      {v.images_count}
                    </span>
                  )}
                </Tag>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AttributesPage() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [valuesModal, setValuesModal] = useState({
    open: false,
    attribute: null,
  });

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAttributes();
      setAttributes(data.results ?? data);
    } catch {
      message.error("فشل تحميل الخصائص");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const filtered = attributes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // إجمالي القيم المرتبطة بصور عبر كل الخصائص
  const totalLinkedValues = attributes.reduce(
    (sum, a) => sum + (a.values ?? []).filter((v) => v.images_count > 0).length,
    0
  );

  const columns = [
    {
      title: "اسم الخاصية",
      dataIndex: "name",
      render: (name) => (
        <Space>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TagsOutlined style={{ color: "#6366F1", fontSize: 16 }} />
          </div>
          <Text style={{ fontWeight: 700, fontSize: 14 }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: "القيم",
      dataIndex: "values",
      render: (values) => {
        if (!values || values.length === 0)
          return (
            <Text style={{ color: "#CBD5E1", fontSize: 12 }}>لا توجد قيم</Text>
          );

        const shown = values.slice(0, 5);
        const rest = values.length - 5;

        return (
          <Space wrap size={4}>
            {shown.map((v, i) => (
              <Tooltip
                key={v.id}
                title={
                  v.images_count > 0 ? `مرتبط بـ ${v.images_count} صورة` : null
                }
              >
                <Tag
                  color={getColor(i)}
                  style={{
                    borderRadius: 20,
                    padding: "2px 10px",
                    fontSize: 12,
                  }}
                  icon={
                    v.images_count > 0 ? (
                      <PictureOutlined style={{ fontSize: 10 }} />
                    ) : null
                  }
                >
                  {v.value}
                  {/* ✦ عداد الصور المرتبطة */}
                  {v.images_count > 0 && (
                    <span
                      style={{
                        marginRight: 4,
                        fontSize: 10,
                        background: "rgba(255,255,255,0.5)",
                        borderRadius: 8,
                        padding: "0 4px",
                      }}
                    >
                      {v.images_count}
                    </span>
                  )}
                </Tag>
              </Tooltip>
            ))}
            {rest > 0 && (
              <Tag
                style={{ borderRadius: 20, padding: "2px 10px", fontSize: 12 }}
              >
                +{rest} أخرى
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "عدد القيم",
      dataIndex: "values",
      width: 110,
      render: (values) => (
        <Badge
          count={values?.length ?? 0}
          showZero
          style={{
            background: values?.length > 0 ? "#6366F1" : "#CBD5E1",
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      // ✦ عمود جديد: عدد القيم المرتبطة بصور في هذه الخاصية
      title: "مرتبط بصور",
      dataIndex: "values",
      key: "linked",
      width: 120,
      render: (values) => {
        const count = (values ?? []).filter((v) => v.images_count > 0).length;
        return count > 0 ? (
          <Space size={4}>
            <PictureOutlined style={{ color: "#10B981", fontSize: 13 }} />
            <Text style={{ color: "#10B981", fontWeight: 600, fontSize: 13 }}>
              {count} قيم
            </Text>
          </Space>
        ) : (
          <Text style={{ color: "#CBD5E1", fontSize: 12 }}>—</Text>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 130,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="إدارة القيم">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<AppstoreOutlined />}
              onClick={() => setValuesModal({ open: true, attribute: r })}
              style={{
                borderRadius: 8,
                borderColor: "#6366F1",
                color: "#6366F1",
              }}
            >
              القيم
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

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
            خصائص المنتجات
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة الخصائص وقيمها (اللون، المقاس، الخامة...)
          </Text>
        </div>
        <Space>
          <Tooltip title="تحديث">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAttributes}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setAddModal(true)}
            style={{
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              border: "none",
              borderRadius: 10,
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              fontWeight: 600,
            }}
          >
            إضافة خاصية
          </Button>
        </Space>
      </div>

      {/* ── Stats ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 14, border: "1px solid #E2E8F0" }}
            bodyStyle={{ padding: 16 }}
          >
            <Text style={{ color: "#64748B", fontSize: 12, display: "block" }}>
              إجمالي الخصائص
            </Text>
            <Text style={{ fontSize: 28, fontWeight: 800, color: "#6366F1" }}>
              {attributes.length}
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 14, border: "1px solid #E2E8F0" }}
            bodyStyle={{ padding: 16 }}
          >
            <Text style={{ color: "#64748B", fontSize: 12, display: "block" }}>
              إجمالي القيم
            </Text>
            <Text style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>
              {attributes.reduce((sum, a) => sum + (a.values?.length ?? 0), 0)}
            </Text>
          </Card>
        </Col>
        {/* ✦ كارت جديد: القيم المرتبطة بصور */}
        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 14, border: "1px solid #E2E8F0" }}
            bodyStyle={{ padding: 16 }}
          >
            <Text style={{ color: "#64748B", fontSize: 12, display: "block" }}>
              قيم مرتبطة بصور
            </Text>
            <Space align="baseline">
              <Text style={{ fontSize: 28, fontWeight: 800, color: "#F59E0B" }}>
                {totalLinkedValues}
              </Text>
              <PictureOutlined style={{ color: "#F59E0B" }} />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ── Search + Table ── */}
      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9" }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
            placeholder="ابحث عن خاصية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 8, maxWidth: 300 }}
          />
        </div>

        <Table
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: 15,
            showTotal: (t) => `إجمالي ${t} خاصية`,
            position: ["bottomCenter"],
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <TagsOutlined
                  style={{
                    fontSize: 48,
                    color: "#CBD5E1",
                    display: "block",
                    marginBottom: 12,
                  }}
                />
                <Text style={{ color: "#94A3B8" }}>لا توجد خصائص</Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* ── Modals ── */}
      <AddAttributeModal
        open={addModal}
        onClose={() => setAddModal(false)}
        onSaved={fetchAttributes}
      />

      <ManageValuesModal
        open={valuesModal.open}
        attribute={valuesModal.attribute}
        onClose={() => setValuesModal({ open: false, attribute: null })}
        onSaved={fetchAttributes}
      />
    </div>
  );
}
