import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  Space,
  Tooltip,
  Drawer,
  Timeline,
  Badge,
  message,
  Popconfirm,
  Empty,
  Statistic,
  Avatar,
  Divider,
  Switch,
} from "antd";
import {
  TeamOutlined,
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PhoneOutlined,
  MailOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  MessageOutlined,
  PushpinOutlined,
  StopOutlined,
  CheckOutlined,
  UserOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  getERPCustomers,
  createERPCustomer,
  updateERPCustomer,
  deleteERPCustomer,
  getCustomerNotes,
  addCustomerNote,
  getCustomerTags,
} from "../../../api/erpApi";

const { Option } = Select;
const { TextArea } = Input;

// ── Source config ─────────────────────────────────────────────
const SOURCE_CONFIG = {
  online: { color: "blue", label: "أونلاين" },
  whatsapp: { color: "green", label: "واتساب" },
  phone: { color: "orange", label: "هاتف" },
  walk_in: { color: "purple", label: "حضوري" },
  referral: { color: "cyan", label: "إحالة" },
  social: { color: "magenta", label: "سوشيال" },
};

// ── Customer Avatar ───────────────────────────────────────────
const CustomerAvatar = ({ name, size = 40 }) => {
  const colors = [
    "#10B981",
    "#6366F1",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <Avatar
      size={size}
      style={{ background: color, fontWeight: 700, fontSize: size * 0.4 }}
    >
      {name?.[0] || "?"}
    </Avatar>
  );
};

// ── Stats Card ────────────────────────────────────────────────
const StatsCard = ({ icon, title, value, color, subtitle }) => (
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
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <div>
        <p
          style={{ margin: 0, color: "#64748B", fontSize: 13, fontWeight: 500 }}
        >
          {title}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 28,
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          {value}
        </p>
        {subtitle && (
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color,
        }}
      >
        {icon}
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: color,
        opacity: 0.6,
      }}
    />
  </Card>
);

// ── Customer Detail Drawer ────────────────────────────────────
const CustomerDetail = ({ customer, open, onClose, onUpdate }) => {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [pinned, setPinned] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (open && customer) {
      setLoadingNotes(true);
      getCustomerNotes(customer.id)
        .then((r) => setNotes(r.data))
        .catch(() => {})
        .finally(() => setLoadingNotes(false));
    }
  }, [open, customer]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      setAddingNote(true);
      const res = await addCustomerNote(customer.id, {
        note: noteText,
        is_pinned: pinned,
      });
      setNotes((p) => [res.data, ...p]);
      setNoteText("");
      setPinned(false);
      message.success("تم إضافة الملاحظة");
    } catch {
    } finally {
      setAddingNote(false);
    }
  };

  const handleToggleBlock = async () => {
    try {
      const res = await updateERPCustomer(customer.id, {
        is_blocked: !customer.is_blocked,
      });
      onUpdate(res.data);
      message.success(customer.is_blocked ? "تم رفع الحظر" : "تم الحظر");
    } catch {}
  };

  if (!customer) return null;
  const srcCfg = SOURCE_CONFIG[customer.source] || {};

  return (
    <Drawer
      title={
        <Space>
          <CustomerAvatar name={customer.name} size={32} />
          <span>{customer.name}</span>
          {customer.is_blocked && <Tag color="error">محظور</Tag>}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={540}
      placement="left"
    >
      {/* Info Card */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 20,
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Row gutter={[12, 10]}>
          <Col span={12}>
            <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>الهاتف</p>
            <a
              href={`tel:${customer.phone}`}
              style={{ fontWeight: 600, color: "#0F172A" }}
            >
              <PhoneOutlined style={{ marginLeft: 4 }} />
              {customer.phone || "—"}
            </a>
          </Col>
          <Col span={12}>
            <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>البريد</p>
            <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>
              {customer.email || "—"}
            </span>
          </Col>
          <Col span={12}>
            <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>المصدر</p>
            <Tag color={srcCfg.color}>{srcCfg.label}</Tag>
          </Col>
          <Col span={12}>
            <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
              العضوية منذ
            </p>
            <span style={{ fontWeight: 500 }}>
              {new Date(customer.created_at).toLocaleDateString("ar-EG")}
            </span>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          {
            label: "إجمالي الطلبات",
            value: customer.total_orders,
            color: "#6366F1",
            icon: <ShoppingCartOutlined />,
          },
          {
            label: "إجمالي الإنفاق",
            value: `${Number(customer.total_spent || 0).toLocaleString()} EGP`,
            color: "#10B981",
            icon: <DollarOutlined />,
          },
          {
            label: "متوسط الطلب",
            value: `${Number(
              customer.avg_order_value || 0
            ).toLocaleString()} EGP`,
            color: "#F59E0B",
            icon: <StarOutlined />,
          },
        ].map((s, i) => (
          <Col span={8} key={i}>
            <Card
              style={{
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                textAlign: "center",
              }}
              bodyStyle={{ padding: "12px 8px" }}
            >
              <div style={{ color: s.color, fontSize: 20, marginBottom: 4 }}>
                {s.icon}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0F172A",
                }}
              >
                {s.value}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                {s.label}
              </p>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tags */}
      {customer.tags?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
            }}
          >
            التاجات
          </p>
          <Space wrap>
            {customer.tags.map((t) => (
              <Tag
                key={t.id}
                style={{
                  background: t.color + "20",
                  borderColor: t.color,
                  color: t.color,
                }}
              >
                {t.name}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Actions */}
      <Button
        block
        danger={!customer.is_blocked}
        icon={customer.is_blocked ? <CheckOutlined /> : <StopOutlined />}
        onClick={handleToggleBlock}
        style={{ marginBottom: 20, borderRadius: 8 }}
      >
        {customer.is_blocked ? "رفع الحظر عن العميل" : "حظر العميل"}
      </Button>

      <Divider />

      {/* Notes */}
      <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#0F172A" }}>
        <MessageOutlined style={{ marginLeft: 6, color: "#10B981" }} />
        ملاحظات الفريق
      </p>

      <Card
        style={{
          borderRadius: 12,
          marginBottom: 16,
          border: "1px solid #E2E8F0",
        }}
        bodyStyle={{ padding: 16 }}
      >
        <TextArea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="اكتب ملاحظة..."
          rows={3}
          style={{ marginBottom: 10 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            <Switch checked={pinned} onChange={setPinned} size="small" />
            <span style={{ fontSize: 12, color: "#64748B" }}>
              <PushpinOutlined /> تثبيت
            </span>
          </Space>
          <Button
            type="primary"
            onClick={handleAddNote}
            loading={addingNote}
            style={{ background: "#10B981", border: "none", borderRadius: 8 }}
          >
            إضافة
          </Button>
        </div>
      </Card>

      {notes.length === 0 ? (
        <Empty
          description="لا توجد ملاحظات"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notes.map((n) => (
            <Card
              key={n.id}
              style={{
                borderRadius: 12,
                border: `1px solid ${n.is_pinned ? "#10B981" : "#E2E8F0"}`,
                background: n.is_pinned ? "#F0FDF4" : "#fff",
              }}
              bodyStyle={{ padding: 12 }}
            >
              {n.is_pinned && (
                <Tag
                  color="green"
                  icon={<PushpinOutlined />}
                  style={{ marginBottom: 6 }}
                >
                  مثبتة
                </Tag>
              )}
              <p style={{ margin: 0, color: "#475569" }}>{n.note}</p>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94A3B8" }}>
                {new Date(n.created_at).toLocaleString("ar-EG")}
              </p>
            </Card>
          ))}
        </div>
      )}
    </Drawer>
  );
};

// ── Create/Edit Modal ─────────────────────────────────────────
const CustomerModal = ({ open, onClose, onSave, customer, tags }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open)
      customer
        ? form.setFieldsValue({
            ...customer,
            tags: customer.tags?.map((t) => t.id),
          })
        : form.resetFields();
  }, [open, customer]);

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      if (customer) {
        const res = await updateERPCustomer(customer.id, vals);
        onSave(res.data, "edit");
      } else {
        const res = await createERPCustomer(vals);
        onSave(res.data, "create");
      }
      message.success(customer ? "تم التحديث" : "تم الإضافة");
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
          <UserOutlined style={{ color: "#10B981" }} />
          {customer ? "تعديل العميل" : "إضافة عميل جديد"}
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText={customer ? "حفظ" : "إضافة"}
      cancelText="إلغاء"
      okButtonProps={{ style: { background: "#10B981", border: "none" } }}
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="الاسم" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} placeholder="اسم العميل" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="الهاتف">
              <Input prefix={<PhoneOutlined />} placeholder="01xxxxxxxxx" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="البريد الإلكتروني">
              <Input
                prefix={<MailOutlined />}
                placeholder="email@example.com"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="source" label="المصدر" initialValue="online">
              <Select>
                {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>
                    {v.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="tags" label="التاجات">
              <Select mode="multiple" placeholder="اختر تاجات">
                {tags.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="is_blocked" valuePropName="checked">
              <Space>
                <Switch />
                <span style={{ color: "#64748B" }}>محظور</span>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

// ── Main Page ─────────────────────────────────────────────────
export default function ERPCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        getERPCustomers(filters),
        getCustomerTags(),
      ]);
      setCustomers(cRes.data);
      setTags(tRes.data);
    } catch {
      message.error("فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSave = (item, mode) => {
    if (mode === "create") setCustomers((p) => [item, ...p]);
    else setCustomers((p) => p.map((c) => (c.id === item.id ? item : c)));
  };

  const handleUpdate = (item) => {
    setCustomers((p) => p.map((c) => (c.id === item.id ? item : c)));
    setSelectedCustomer(item);
  };

  const handleDelete = async (id) => {
    try {
      await deleteERPCustomer(id);
      setCustomers((p) => p.filter((c) => c.id !== id));
      message.success("تم الحذف");
    } catch {
      message.error("فشل الحذف");
    }
  };

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalSpent = customers.reduce(
    (s, c) => s + Number(c.total_spent || 0),
    0
  );
  const stats = {
    total: customers.length,
    active: customers.filter((c) => !c.is_blocked).length,
    blocked: customers.filter((c) => c.is_blocked).length,
    vip: customers.filter((c) => Number(c.total_orders) >= 5).length,
    totalSpent,
  };

  const columns = [
    {
      title: "العميل",
      render: (_, r) => (
        <Space>
          <CustomerAvatar name={r.name} />
          <Space direction="vertical" size={0}>
            <Space size={6}>
              <span style={{ fontWeight: 600, color: "#0F172A" }}>
                {r.name}
              </span>
              {r.is_blocked && (
                <Tag color="error" style={{ fontSize: 10 }}>
                  محظور
                </Tag>
              )}
            </Space>
            <span style={{ fontSize: 12, color: "#64748B" }}>{r.phone}</span>
            {r.email && (
              <span style={{ fontSize: 11, color: "#94A3B8" }}>{r.email}</span>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: "المصدر",
      dataIndex: "source",
      render: (v) => {
        const cfg = SOURCE_CONFIG[v] || {};
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "الطلبات",
      dataIndex: "total_orders",
      sorter: (a, b) => a.total_orders - b.total_orders,
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ShoppingCartOutlined style={{ color: "#6366F1" }} />
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ),
    },
    {
      title: "إجمالي الإنفاق",
      dataIndex: "total_spent",
      sorter: (a, b) => Number(a.total_spent) - Number(b.total_spent),
      render: (v) => (
        <span style={{ color: "#10B981", fontWeight: 700 }}>
          {Number(v).toLocaleString()} EGP
        </span>
      ),
    },
    {
      title: "متوسط الطلب",
      dataIndex: "avg_order_value",
      render: (v) => (
        <span style={{ color: "#475569" }}>
          {Number(v).toLocaleString()} EGP
        </span>
      ),
    },
    {
      title: "آخر طلب",
      dataIndex: "last_order_at",
      render: (v) =>
        v ? (
          new Date(v).toLocaleDateString("ar-EG")
        ) : (
          <span style={{ color: "#CBD5E1" }}>—</span>
        ),
    },
    {
      title: "التاجات",
      dataIndex: "tags",
      render: (tags) => (
        <Space size={4} wrap>
          {(tags || []).slice(0, 2).map((t) => (
            <Tag
              key={t.id}
              style={{
                fontSize: 10,
                background: t.color + "20",
                borderColor: t.color,
                color: t.color,
              }}
            >
              {t.name}
            </Tag>
          ))}
          {(tags || []).length > 2 && (
            <Tag style={{ fontSize: 10 }}>+{tags.length - 2}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "",
      width: 110,
      render: (_, r) => (
        <Space>
          <Tooltip title="الملف الكامل والملاحظات">
            <Button
              size="small"
              icon={<EyeOutlined />}
              type="primary"
              ghost
              onClick={() => {
                setSelectedCustomer(r);
                setDetailOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="تعديل">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditCustomer(r);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف العميل؟"
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
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#0F172A",
            }}
          >
            <TeamOutlined style={{ marginLeft: 10, color: "#10B981" }} />
            إدارة العملاء (CRM)
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748B" }}>
            متابعة وإدارة جميع العملاء وتاريخهم
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAll}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditCustomer(null);
              setModalOpen(true);
            }}
            style={{
              background: "#10B981",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            عميل جديد
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<TeamOutlined />}
            title="إجمالي العملاء"
            value={stats.total}
            color="#6366F1"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<CheckOutlined />}
            title="عملاء نشطون"
            value={stats.active}
            color="#10B981"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<StarOutlined />}
            title="VIP (5+ طلبات)"
            value={stats.vip}
            color="#F59E0B"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            icon={<DollarOutlined />}
            title="إجمالي الإنفاق"
            value={`${(stats.totalSpent / 1000).toFixed(1)}K`}
            color="#EC4899"
            subtitle="EGP"
          />
        </Col>
      </Row>

      {/* Filters */}
      <Card
        style={{
          borderRadius: 16,
          border: "none",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          marginBottom: 20,
        }}
        bodyStyle={{ padding: "16px 24px" }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={9}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              placeholder="ابحث بالاسم أو الهاتف أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder="المصدر"
              allowClear
              style={{ width: "100%" }}
              onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
            >
              {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder="الحالة"
              allowClear
              style={{ width: "100%" }}
              onChange={(v) => setFilters((f) => ({ ...f, blocked: v }))}
            >
              <Option value="false">نشط</Option>
              <Option value="true">محظور</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
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
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `إجمالي: ${t} عميل`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="لا توجد عملاء"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          scroll={{ x: 1000 }}
          style={{ borderRadius: 16, overflow: "hidden" }}
          rowClassName={(r) => (r.is_blocked ? "blocked-row" : "")}
        />
      </Card>

      {/* Create/Edit Modal */}
      <CustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        customer={editCustomer}
        tags={tags}
      />

      {/* Detail Drawer */}
      <CustomerDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        customer={selectedCustomer}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
