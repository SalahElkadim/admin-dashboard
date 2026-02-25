import React, { useState, useEffect, useCallback } from "react";
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
  Upload,
  Switch,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Badge,
  message,
  Avatar,
  TreeSelect,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  PictureOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categoriesApi";

const { Text, Title } = Typography;
const { Option } = Select;

// ── helpers ──────────────────────────────────────────────────────────────────

/** تحويل قائمة categories مسطّحة إلى شجرة مناسبة لـ TreeSelect */
const buildTree = (categories, parentId = null) =>
  categories
    .filter((c) => (c.parent ?? null) === parentId)
    .map((c) => ({
      title: c.name,
      value: c.id,
      children: buildTree(categories, c.id),
    }));

// ── Category Form Modal ───────────────────────────────────────────────────────

function CategoryModal({ open, onClose, onSaved, editRecord, allCategories }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const isEdit = !!editRecord;

  // استبعاد الـ category الحالية وأولادها من قائمة الـ parent
  const parentOptions = buildTree(
    allCategories.filter((c) => c.id !== editRecord?.id)
  );

  useEffect(() => {
    if (open) {
      if (isEdit) {
        form.setFieldsValue({
          name: editRecord.name,
          description: editRecord.description,
          parent: editRecord.parent ?? undefined,
          is_active: editRecord.is_active ?? true,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true });
      }
      setFileList([]);
    }
  }, [open, editRecord, isEdit, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        name: values.name,
        description: values.description ?? "",
        is_active: values.is_active,
        parent: values.parent ?? null,
      };

      if (isEdit) {
        await updateCategory(editRecord.id, payload);
        message.success("تم تحديث الفئة بنجاح ✅");
      } else {
        await createCategory(payload);
        message.success("تم إضافة الفئة بنجاح ✅");
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      const msg = err.response?.data?.message || "حدث خطأ، حاول مرة أخرى";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? "حفظ التعديلات" : "إضافة الفئة"}
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
            <FolderOpenOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <Text style={{ fontWeight: 700 }}>
            {isEdit ? "تعديل الفئة" : "إضافة فئة جديدة"}
          </Text>
        </Space>
      }
      width={520}
      style={{ direction: "rtl" }}
      styles={{
        body: { maxHeight: "65vh", overflowY: "auto", padding: "20px 24px" },
      }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        {/* Name */}
        <Form.Item
          name="name"
          label="اسم الفئة"
          rules={[{ required: true, message: "ادخل اسم الفئة" }]}
        >
          <Input placeholder="مثال: ملابس رجالي" size="large" />
        </Form.Item>

        {/* Description */}
        <Form.Item name="description" label="الوصف">
          <Input.TextArea rows={3} placeholder="وصف الفئة (اختياري)..." />
        </Form.Item>

        {/* Parent */}
        <Form.Item name="parent" label="الفئة الأب (إن وجدت)">
          <TreeSelect
            treeData={parentOptions}
            placeholder="اختر فئة أب أو اتركها فارغة"
            allowClear
            size="large"
            style={{ width: "100%" }}
            treeDefaultExpandAll
          />
        </Form.Item>

        {/* Active */}
        <Form.Item name="is_active" label="الحالة" valuePropName="checked">
          <Switch checkedChildren="نشطة" unCheckedChildren="مخفية" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    is_active: undefined,
    root_only: undefined,
    page: 1,
    page_size: 10,
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.is_active !== undefined) params.is_active = filters.is_active;
      if (filters.root_only) params.root_only = true;
      params.page = filters.page;
      params.page_size = filters.page_size;

      const { data } = await getCategories(params);
      setCategories(data.results ?? data);
      setTotal(data.count ?? (data.results ?? data).length);
    } catch {
      message.error("فشل تحميل الفئات");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      message.success("تم حذف الفئة");
      fetchCategories();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "فشل الحذف — تأكد أن الفئة لا تحتوي على منتجات أو فئات فرعية";
      message.error(msg);
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
      root_only: undefined,
      page: 1,
      page_size: 10,
    });

  const activeFiltersCount = [
    filters.search,
    filters.is_active,
    filters.root_only,
  ].filter((v) => v !== undefined && v !== "").length;

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns = [
    {
      title: "الفئة",
      dataIndex: "name",
      render: (name, r) => (
        <Space>
          <Avatar
            shape="square"
            size={40}
            style={{
              borderRadius: 10,
              background: r.parent
                ? "#EEF2FF"
                : "linear-gradient(135deg,#6366F1,#8B5CF6)",
              border: "1px solid #E2E8F0",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            icon={
              r.parent ? (
                <FolderOutlined style={{ color: "#6366F1" }} />
              ) : (
                <AppstoreOutlined style={{ color: "#fff" }} />
              )
            }
          />
          <div style={{ lineHeight: 1.4 }}>
            <Text style={{ fontWeight: 600, fontSize: 13, display: "block" }}>
              {name}
            </Text>
            {r.description && (
              <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                {r.description.length > 50
                  ? r.description.slice(0, 50) + "..."
                  : r.description}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "الفئة الأب",
      dataIndex: "parent_name",
      width: 160,
      render: (v) =>
        v ? (
          <Tag
            icon={<FolderOutlined />}
            style={{ borderRadius: 6, background: "#F1F5F9", border: "none" }}
          >
            {v}
          </Tag>
        ) : (
          <Tag
            style={{
              borderRadius: 6,
              background: "#EEF2FF",
              color: "#6366F1",
              border: "none",
              fontWeight: 600,
            }}
          >
            رئيسية
          </Tag>
        ),
    },
    {
      title: "المنتجات",
      dataIndex: "products_count",
      width: 110,
      render: (v) => (
        <Badge
          count={v ?? 0}
          showZero
          style={{ background: v > 0 ? "#6366F1" : "#CBD5E1" }}
        />
      ),
    },
    {
      title: "الفئات الفرعية",
      dataIndex: "children_count",
      width: 130,
      render: (v) => (
        <Text style={{ color: "#64748B", fontWeight: 600 }}>{v ?? 0} فئة</Text>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "is_active",
      width: 100,
      render: (v) => (
        <Tag color={v ? "green" : "default"} style={{ borderRadius: 6 }}>
          {v ? "نشطة" : "مخفية"}
        </Tag>
      ),
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "created_at",
      width: 130,
      render: (v) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          {v ? new Date(v).toLocaleDateString("ar-EG") : "—"}
        </Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 90,
      fixed: "left",
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
            title="تأكيد الحذف"
            description="هل أنت متأكد؟ لا يمكن حذف فئة بها منتجات أو فئات فرعية."
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

  return (
    <div style={{ direction: "rtl" }}>
      {/* ── Page Header ── */}
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
            الفئات
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة تصنيفات المنتجات
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
          إضافة فئة
        </Button>
      </div>

      {/* ── Filters Card ── */}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          marginBottom: 16,
        }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        <Row gutter={[12, 12]} align="middle">
          {/* Search */}
          <Col xs={24} sm={10} md={9}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              placeholder="ابحث باسم الفئة..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>

          {/* Status */}
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="الحالة"
              value={filters.is_active}
              onChange={(v) => handleFilterChange("is_active", v)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="true">نشطة</Option>
              <Option value="false">مخفية</Option>
            </Select>
          </Col>

          {/* Root only */}
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="النوع"
              value={filters.root_only}
              onChange={(v) => handleFilterChange("root_only", v)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={true}>رئيسية فقط</Option>
            </Select>
          </Col>

          {/* Reset */}
          <Col flex="none">
            <Tooltip title="إعادة تعيين الفلاتر">
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

      {/* ── Table Card ── */}
      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        styles={{ body: { padding: 0 } }}
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
          <FilterOutlined style={{ color: "#94A3B8" }} />
          <Text style={{ color: "#64748B", fontSize: 13 }}>
            {loading ? "جاري التحميل..." : `${total} فئة`}
          </Text>
        </div>

        <Table
          rowKey="id"
          dataSource={categories}
          columns={columns}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current: filters.page,
            pageSize: filters.page_size,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50"],
            showTotal: (t) => `إجمالي ${t} فئة`,
            position: ["bottomCenter"],
            onChange: (page, page_size) =>
              setFilters((prev) => ({ ...prev, page, page_size })),
          }}
          rowClassName={(_, i) => (i % 2 === 0 ? "" : "ant-table-row-alt")}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <FolderOutlined
                  style={{
                    fontSize: 48,
                    color: "#CBD5E1",
                    display: "block",
                    marginBottom: 12,
                  }}
                />
                <Text style={{ color: "#94A3B8" }}>لا توجد فئات</Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* ── Modal ── */}
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchCategories}
        editRecord={editRecord}
        allCategories={categories}
      />
    </div>
  );
}
