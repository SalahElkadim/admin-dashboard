import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Select,
  Tag,
  Space,
  Typography,
  Card,
  Modal,
  InputNumber,
  Row,
  Col,
  Tooltip,
  Badge,
  message,
  Avatar,
  Statistic,
  Progress,
  Spin,
} from "antd";
import {
  EditOutlined,
  ReloadOutlined,
  WarningOutlined,
  StopOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  getInventoryAlerts,
  getProductVariants,
  updateVariantStock,
} from "../../api/inventoryApi";

const { Text, Title } = Typography;
const { Option } = Select;

// ── Stock Badge ───────────────────────────────────────────────────────────────

function StockBadge({ stock }) {
  if (stock === 0)
    return (
      <Tag
        color="red"
        icon={<StopOutlined />}
        style={{ borderRadius: 6, fontWeight: 600 }}
      >
        نفد المخزون
      </Tag>
    );
  if (stock <= 5)
    return (
      <Tag
        color="orange"
        icon={<WarningOutlined />}
        style={{ borderRadius: 6, fontWeight: 600 }}
      >
        منخفض ({stock})
      </Tag>
    );
  return (
    <Tag
      color="green"
      icon={<CheckCircleOutlined />}
      style={{ borderRadius: 6, fontWeight: 600 }}
    >
      {stock} وحدة
    </Tag>
  );
}

// ── Stock Edit Modal ──────────────────────────────────────────────────────────

function StockModal({ open, onClose, product, onSaved }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    if (open && product) {
      setLoading(true);
      // product.product = الـ product ID القادم من InventoryAlertSerializer
      // product.id = الـ variant ID — ده الخطأ اللي كان بيحصل
      getProductVariants(product.product)
        .then(({ data }) => {
          const list = data.results ?? data;
          setVariants(list);
          const vals = {};
          list.forEach((v) => (vals[v.id] = v.stock));
          setEditValues(vals);
        })
        .catch(() => message.error("فشل تحميل الـ Variants"))
        .finally(() => setLoading(false));
    }
  }, [open, product]);

  const handleSave = async (variantId) => {
    const newStock = editValues[variantId];
    if (newStock === undefined || newStock < 0) {
      message.warning("ادخل قيمة صحيحة");
      return;
    }
    setSaving((prev) => ({ ...prev, [variantId]: true }));
    try {
      await updateVariantStock(product.product, variantId, newStock);
      message.success("✅ تم تحديث المخزون");
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, stock: newStock } : v))
      );
      onSaved();
    } catch {
      message.error("فشل التحديث");
    } finally {
      setSaving((prev) => ({ ...prev, [variantId]: false }));
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
            <InboxOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <Text style={{ fontWeight: 700 }}>
            إدارة مخزون: {product?.product_name}
          </Text>
        </Space>
      }
      width={560}
      style={{ direction: "rtl" }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : variants.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
          لا توجد خصائص لهذا المنتج
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          {variants.map((v, i) => (
            <div
              key={v.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 0",
                borderBottom:
                  i < variants.length - 1 ? "1px solid #F1F5F9" : "none",
              }}
            >
              <div style={{ flex: 1 }}>
                <Text style={{ fontWeight: 600, display: "block" }}>
                  {/* variant_label هو الـ field الصح من الـ serializer */}
                  {v.variant_label || v.sku || `Variant #${v.id}`}
                </Text>
                <StockBadge stock={v.stock} />
              </div>

              <InputNumber
                min={0}
                value={editValues[v.id]}
                onChange={(val) =>
                  setEditValues((prev) => ({ ...prev, [v.id]: val }))
                }
                style={{ width: 100 }}
                size="middle"
              />

              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving[v.id]}
                onClick={() => handleSave(v.id)}
                style={{
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  border: "none",
                  borderRadius: 8,
                }}
              >
                حفظ
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [stockModal, setStockModal] = useState({ open: false, product: null });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getInventoryAlerts(filterType);
      setAlerts(data.data ?? data);
    } catch {
      message.error("فشل تحميل بيانات المخزون");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const outCount = alerts.filter((a) => a.stock === 0).length;
  const lowCount = alerts.filter((a) => a.stock > 0 && a.stock <= 5).length;

  const columns = [
    {
      title: "المنتج",
      dataIndex: "product_name",
      render: (name, r) => (
        <Space>
          <Avatar
            shape="square"
            size={40}
            src={r.product_image}
            style={{
              borderRadius: 8,
              background: "#EEF2FF",
              border: "1px solid #E2E8F0",
            }}
            icon={<InboxOutlined style={{ color: "#6366F1" }} />}
          />
          <div>
            <Text style={{ fontWeight: 600, display: "block" }}>{name}</Text>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            >
              {r.sku || "—"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "الخصائص",
      dataIndex: "variant_label", // ✅ الـ field الصح من الـ serializer
      render: (v) => (
        <Text style={{ color: "#475569" }}>{v || "الافتراضي"}</Text>
      ),
    },
    {
      title: "المخزون الحالي",
      dataIndex: "stock",
      sorter: (a, b) => a.stock - b.stock,
      render: (v) => <StockBadge stock={v} />,
    },
    {
      title: "نسبة المخزون",
      dataIndex: "stock",
      render: (v) => {
        const pct = Math.min((v / 100) * 100, 100);
        return (
          <Progress
            percent={Math.round(pct)}
            size="small"
            strokeColor={v === 0 ? "#EF4444" : v <= 5 ? "#F59E0B" : "#10B981"}
            style={{ margin: 0, minWidth: 120 }}
          />
        );
      },
    },
    {
      title: "تعديل المخزون",
      key: "action",
      width: 120,
      render: (_, r) => (
        <Tooltip title="تعديل المخزون">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EditOutlined />}
            onClick={() => setStockModal({ open: true, product: r })}
            style={{
              borderRadius: 8,
              borderColor: "#6366F1",
              color: "#6366F1",
            }}
          >
            تعديل
          </Button>
        </Tooltip>
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
            إدارة المخزون
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            تتبع وتحديث مخزون المنتجات
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchAlerts}
          style={{ borderRadius: 8 }}
        >
          تحديث
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #FEE2E2",
              background: "#FFF5F5",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={
                <Text style={{ color: "#B91C1C", fontWeight: 600 }}>
                  نفد المخزون
                </Text>
              }
              value={outCount}
              suffix="منتج"
              valueStyle={{ color: "#EF4444", fontWeight: 700 }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #FEF3C7",
              background: "#FFFBEB",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={
                <Text style={{ color: "#92400E", fontWeight: 600 }}>
                  مخزون منخفض
                </Text>
              }
              value={lowCount}
              suffix="منتج"
              valueStyle={{ color: "#F59E0B", fontWeight: 700 }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Filter & Table ── */}
      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Text style={{ fontWeight: 700, color: "#0F172A" }}>
              تنبيهات المخزون
            </Text>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 160 }}
            >
              <Option value="all">الكل (≤ 5)</Option>
              <Option value="low">منخفض (1-5)</Option>
              <Option value="out">نفد (0)</Option>
            </Select>
          </div>
        }
      >
        <Table
          rowKey="id"
          dataSource={alerts}
          columns={columns}
          loading={loading}
          scroll={{ x: 700 }}
          pagination={{
            pageSize: 15,
            showTotal: (t) => `إجمالي ${t} variant`,
            position: ["bottomCenter"],
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <CheckCircleOutlined
                  style={{
                    fontSize: 48,
                    color: "#10B981",
                    display: "block",
                    marginBottom: 12,
                  }}
                />
                <Text style={{ color: "#94A3B8" }}>
                  🎉 لا توجد تنبيهات مخزون
                </Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* ── Stock Edit Modal ── */}
      <StockModal
        open={stockModal.open}
        product={stockModal.product}
        onClose={() => setStockModal({ open: false, product: null })}
        onSaved={fetchAlerts}
      />
    </div>
  );
}
