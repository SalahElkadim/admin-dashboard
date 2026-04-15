import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  Button,
  Drawer,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Tooltip,
  Popconfirm,
  message,
  Spin,
  Empty,
  InputNumber,
  Avatar,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PrinterOutlined,
  DeleteFilled,
} from "@ant-design/icons";
import {
  getSalesOrders,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  getSalesOrderItems,
  addSalesOrderItem,
} from "../../../api/erpApi";
import axiosInstance from "../../../api/axiosInstance";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STATUS_CONFIG = {
  draft: {
    color: "#94A3B8",
    bg: "#F8FAFC",
    label: "مسودة",
    icon: <ClockCircleOutlined />,
  },
  confirmed: {
    color: "#3B82F6",
    bg: "#EFF6FF",
    label: "مؤكد",
    icon: <CheckCircleOutlined />,
  },
  processing: {
    color: "#F59E0B",
    bg: "#FFFBEB",
    label: "قيد التنفيذ",
    icon: <ClockCircleOutlined />,
  },
  shipped: {
    color: "#8B5CF6",
    bg: "#F5F3FF",
    label: "تم الشحن",
    icon: <CheckCircleOutlined />,
  },
  delivered: {
    color: "#10B981",
    bg: "#F0FDF4",
    label: "تم التسليم",
    icon: <CheckCircleOutlined />,
  },
  cancelled: {
    color: "#EF4444",
    bg: "#FEF2F2",
    label: "ملغي",
    icon: <CloseCircleOutlined />,
  },
  returned: {
    color: "#F97316",
    bg: "#FFF7ED",
    label: "مرتجع",
    icon: <CloseCircleOutlined />,
  },
};
const SOURCE_CONFIG = {
  online: { color: "#6366F1", label: "أونلاين" },
  manual: { color: "#64748B", label: "يدوي" },
  whatsapp: { color: "#10B981", label: "واتساب" },
  instagram: { color: "#EC4899", label: "إنستجرام" },
  facebook: { color: "#3B82F6", label: "فيسبوك" },
  phone: { color: "#F59E0B", label: "تليفون" },
  pos: { color: "#8B5CF6", label: "POS" },
};
const PAYMENT_STATUS_CONFIG = {
  pending: { color: "#F59E0B", label: "معلق" },
  paid: { color: "#10B981", label: "مدفوع" },
  partial: { color: "#3B82F6", label: "جزئي" },
  failed: { color: "#EF4444", label: "فشل" },
  refunded: { color: "#8B5CF6", label: "مسترجع" },
};

const fmt = (v) =>
  Number(v || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 });

const StatusTag = ({ status }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.color}30`,
      }}
    >
      {c.icon} {c.label}
    </span>
  );
};
const SourceTag = ({ source }) => {
  const c = SOURCE_CONFIG[source] || { color: "#94A3B8", label: source };
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        color: c.color,
        background: c.color + "15",
        border: `1px solid ${c.color}30`,
      }}
    >
      {c.label}
    </span>
  );
};

const StatsCards = ({ stats }) => (
  <Row gutter={16} style={{ marginBottom: 24 }}>
    {[
      {
        label: "إجمالي الأوامر",
        value: stats.total,
        icon: <ShoppingCartOutlined />,
        color: "#6366F1",
        suffix: "",
      },
      {
        label: "الإيرادات",
        value: fmt(stats.revenue),
        icon: <DollarOutlined />,
        color: "#10B981",
        suffix: " ج.م",
      },
      {
        label: "في انتظار الدفع",
        value: stats.pending,
        icon: <ClockCircleOutlined />,
        color: "#F59E0B",
        suffix: "",
      },
      {
        label: "تم التسليم",
        value: stats.delivered,
        icon: <CheckCircleOutlined />,
        color: "#3B82F6",
        suffix: "",
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
            <Text style={{ fontSize: 11, color: "#94A3B8", display: "block" }}>
              {c.label}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
              {c.value}
              {c.suffix}
            </Text>
          </div>
        </div>
      </Col>
    ))}
  </Row>
);

function ProductItemPicker({ onAdd }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setProducts([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchProducts = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setProducts([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axiosInstance.get("/products/", {
        params: { search: q, page_size: 20, status: "active" },
      });
      const data = res.data;
      setProducts(data?.results ?? data?.data?.results ?? data ?? []);
    } catch {
      setProducts([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (val) => {
    setQuery(val);
    setSelected(null);
    setVariant(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(val), 350);
  };

  const handleSelectProduct = async (prod) => {
    setProducts([]);
    setQuery(prod.name);
    setLoadingVariants(true);
    try {
      const res = await axiosInstance.get(`/products/${prod.id}/variants/`);
      const rawData = res.data;
      const variants =
        rawData?.results ?? rawData?.data?.results ?? rawData ?? [];
      const enriched = { ...prod, variants };
      setSelected(enriched);
      const activeVariants = variants.filter((v) => v.is_active !== false);
      setVariant(activeVariants.length === 1 ? activeVariants[0] : null);
      setQty(1);
      setDiscount(0);
    } catch {
      message.error("فشل في جلب المتغيرات");
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleAdd = () => {
    if (!selected) {
      message.warning("اختر منتجاً أولاً");
      return;
    }
    if (selected.variants?.length > 0 && !variant) {
      message.warning("اختر المتغير");
      return;
    }
    if (!qty || qty < 1) {
      message.warning("الكمية يجب أن تكون 1 على الأقل");
      return;
    }

    const price = Number(
      variant?.effective_price ??
        variant?.price_override ??
        selected?.effective_price ??
        selected?.price ??
        0
    );
    const variantLabel = variant
      ? variant.attribute_values?.map((av) => av.value).join(" / ") ||
        `#${variant.id}`
      : "";

    onAdd({
      variant: variant?.id ?? null,
      product_name: selected.name,
      variant_name: variantLabel,
      unit_price: price,
      quantity: qty,
      discount: discount || 0,
      note: "",
      _image: selected.primary_image ?? null,
      _stock: variant?.stock ?? selected?.total_stock ?? null,
    });

    setQuery("");
    setSelected(null);
    setVariant(null);
    setQty(1);
    setDiscount(0);
  };

  const activeVariants =
    selected?.variants?.filter((v) => v.is_active !== false) ?? [];
  const unitPrice = Number(
    variant?.effective_price ??
      variant?.price_override ??
      selected?.effective_price ??
      selected?.price ??
      0
  );
  const rowTotal = (unitPrice - Number(discount || 0)) * Number(qty || 0);
  const canAdd = selected && (activeVariants.length === 0 || variant);

  return (
    <div
      style={{
        background: "#F8FAFC",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1px dashed #CBD5E1",
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#475569",
          display: "block",
          marginBottom: 10,
        }}
      >
        🔍 ابحث عن منتج وأضفه للأمر
      </Text>
      <div style={{ position: "relative", marginBottom: 10 }} ref={dropdownRef}>
        <Input
          prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
          suffix={searching && <Spin size="small" />}
          placeholder="ابحث باسم المنتج..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          allowClear
          onClear={() => {
            setQuery("");
            setProducts([]);
            setSelected(null);
            setVariant(null);
          }}
        />
        {products.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              left: 0,
              zIndex: 1050,
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              boxShadow: "0 10px 30px rgba(0,0,0,.12)",
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid #F8FAFC",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F0FDF4")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <Avatar
                  size={38}
                  src={p.primary_image}
                  shape="square"
                  style={{
                    borderRadius: 8,
                    background: "#EEF2FF",
                    flexShrink: 0,
                    fontSize: 18,
                  }}
                >
                  📦
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                    {fmt(p.effective_price ?? p.price)} ج.م
                    {p.total_stock !== undefined && (
                      <span
                        style={{
                          marginRight: 8,
                          color: p.total_stock > 0 ? "#10B981" : "#EF4444",
                          fontWeight: 600,
                        }}
                      >
                        {p.total_stock > 0
                          ? `● ${p.total_stock} متاح`
                          : "● نفد"}
                      </span>
                    )}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loadingVariants && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <Spin size="small" />
          <Text style={{ marginRight: 8, fontSize: 12, color: "#94A3B8" }}>
            جاري تحميل المتغيرات...
          </Text>
        </div>
      )}

      {selected && !loadingVariants && activeVariants.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <Text
            style={{
              fontSize: 11,
              color: "#475569",
              display: "block",
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            اختر المتغير (مطلوب)
          </Text>
          <Select
            placeholder="اختر الحجم أو اللون..."
            style={{ width: "100%" }}
            value={variant?.id ?? undefined}
            onChange={(id) =>
              setVariant(activeVariants.find((v) => v.id === id))
            }
          >
            {activeVariants.map((v) => {
              const label =
                v.attribute_values?.map((av) => av.value).join(" / ") ||
                `#${v.id}`;
              const price = Number(
                v.effective_price ??
                  v.price_override ??
                  selected.effective_price ??
                  selected.price ??
                  0
              );
              return (
                <Option key={v.id} value={v.id} disabled={v.stock === 0}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span>
                      <span
                        style={{
                          color: "#10B981",
                          fontWeight: 700,
                          marginLeft: 8,
                        }}
                      >
                        {fmt(price)} ج.م
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: v.stock > 0 ? "#94A3B8" : "#EF4444",
                          marginLeft: 8,
                        }}
                      >
                        {v.stock > 0 ? `(${v.stock})` : "(نفد)"}
                      </span>
                    </span>
                  </div>
                </Option>
              );
            })}
          </Select>
        </div>
      )}

      {selected && !loadingVariants && activeVariants.length === 0 && (
        <div
          style={{
            background: "#FFF7ED",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 10,
            fontSize: 12,
            color: "#92400E",
          }}
        >
          ⚠️ هذا المنتج ليس له متغيرات — السعر:{" "}
          {fmt(selected.effective_price ?? selected.price)} ج.م
        </div>
      )}

      {selected && !loadingVariants && (
        <Row gutter={8} align="bottom">
          <Col span={5}>
            <Text
              style={{
                fontSize: 11,
                color: "#475569",
                display: "block",
                marginBottom: 3,
                fontWeight: 600,
              }}
            >
              الكمية
            </Text>
            <InputNumber
              min={1}
              value={qty}
              onChange={(v) => setQty(v)}
              style={{ width: "100%" }}
              size="small"
            />
          </Col>
          <Col span={5}>
            <Text
              style={{
                fontSize: 11,
                color: "#475569",
                display: "block",
                marginBottom: 3,
                fontWeight: 600,
              }}
            >
              خصم (ج.م)
            </Text>
            <InputNumber
              min={0}
              value={discount}
              onChange={(v) => setDiscount(v)}
              style={{ width: "100%" }}
              size="small"
            />
          </Col>
          <Col span={6}>
            <Text
              style={{
                fontSize: 11,
                color: "#475569",
                display: "block",
                marginBottom: 3,
                fontWeight: 600,
              }}
            >
              الإجمالي
            </Text>
            <Text
              style={{
                fontWeight: 800,
                color: canAdd ? "#10B981" : "#94A3B8",
                fontSize: 15,
                lineHeight: "24px",
              }}
            >
              {fmt(rowTotal)} ج.م
            </Text>
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              block
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={!canAdd}
              style={{
                background: canAdd ? "#10B981" : undefined,
                borderColor: canAdd ? "#10B981" : undefined,
                borderRadius: 8,
              }}
            >
              أضف للأمر
            </Button>
          </Col>
        </Row>
      )}
    </div>
  );
}

function ItemsList({ items, onRemove, onQtyChange, onDiscountChange }) {
  if (items.length === 0)
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="ابحث عن منتج وأضفه للأمر"
        style={{ padding: "12px 0" }}
      />
    );

  const subtotal = items.reduce(
    (s, it) =>
      s +
      (Number(it.unit_price) - Number(it.discount || 0)) * Number(it.quantity),
    0
  );

  return (
    <div>
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            background: idx % 2 === 0 ? "#FAFBFF" : "#fff",
            border: "1px solid #E2E8F0",
            marginBottom: 6,
          }}
        >
          <Avatar
            size={38}
            src={item._image}
            shape="square"
            style={{
              borderRadius: 8,
              background: "#EEF2FF",
              flexShrink: 0,
              fontSize: 16,
            }}
          >
            📦
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontWeight: 600,
                fontSize: 13,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.product_name}
            </Text>
            <Text style={{ fontSize: 11, color: "#94A3B8" }}>
              {item.variant_name || "—"}
              <span style={{ marginRight: 8, color: "#64748B" }}>
                {fmt(item.unit_price)} ج.م/قطعة
              </span>
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <div>
              <Text
                style={{
                  fontSize: 10,
                  color: "#94A3B8",
                  display: "block",
                  textAlign: "center",
                }}
              >
                كمية
              </Text>
              <InputNumber
                size="small"
                min={1}
                value={item.quantity}
                onChange={(v) => onQtyChange(idx, v)}
                style={{ width: 58 }}
              />
            </div>
            <div>
              <Text
                style={{
                  fontSize: 10,
                  color: "#94A3B8",
                  display: "block",
                  textAlign: "center",
                }}
              >
                خصم
              </Text>
              <InputNumber
                size="small"
                min={0}
                value={item.discount}
                onChange={(v) => onDiscountChange(idx, v)}
                style={{ width: 60 }}
              />
            </div>
            <div style={{ textAlign: "center", minWidth: 72 }}>
              <Text
                style={{ fontSize: 10, color: "#94A3B8", display: "block" }}
              >
                الإجمالي
              </Text>
              <Text style={{ fontWeight: 700, color: "#10B981", fontSize: 13 }}>
                {fmt(
                  (Number(item.unit_price) - Number(item.discount || 0)) *
                    Number(item.quantity)
                )}{" "}
                ج.م
              </Text>
            </div>
            <Tooltip title="حذف">
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteFilled />}
                onClick={() => onRemove(idx)}
                style={{ marginTop: 12 }}
              />
            </Tooltip>
          </div>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 4,
          padding: "8px 12px",
          background: "#F0FDF4",
          borderRadius: 8,
          border: "1px solid #BBF7D0",
        }}
      >
        <Text style={{ fontWeight: 800, color: "#059669", fontSize: 14 }}>
          إجمالي المنتجات: {fmt(subtotal)} ج.م
        </Text>
      </div>
    </div>
  );
}

function OrderDetailDrawer({ order, open, onClose, onStatusChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && order?.id) {
      setLoading(true);
      getSalesOrderItems(order.id)
        .then((r) => setItems(r.data?.results ?? r.data ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else setItems([]);
  }, [open, order]);

  if (!order) return null;

  const InfoRow = ({ label, value, children }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid #F1F5F9",
      }}
    >
      <Text style={{ color: "#94A3B8", fontSize: 13 }}>{label}</Text>
      <Text style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>
        {children || value}
      </Text>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={540}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg,#10B981,#059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCartOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 15, display: "block" }}>
              {order.order_number}
            </Text>
            <StatusTag status={order.status} />
          </div>
        </div>
      }
      extra={
        <Space>
          <Tooltip title="طباعة">
            <Button
              icon={<PrinterOutlined />}
              size="small"
              onClick={() => window.print()}
            />
          </Tooltip>
          <Select
            size="small"
            value={order.status}
            style={{ width: 140 }}
            onChange={(v) => onStatusChange(order.id, v)}
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <Option key={k} value={k}>
                {v.label}
              </Option>
            ))}
          </Select>
        </Space>
      }
    >
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94A3B8",
            letterSpacing: 1,
            display: "block",
            marginBottom: 12,
          }}
        >
          بيانات العميل
        </Text>
        <InfoRow label="الاسم" value={order.customer_name} />
        <InfoRow label="التليفون" value={order.customer_phone || "—"} />
        <InfoRow label="الإيميل" value={order.customer_email || "—"} />
        <InfoRow label="المصدر">
          <SourceTag source={order.source} />
        </InfoRow>
      </div>

      <Text
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#94A3B8",
          letterSpacing: 1,
          display: "block",
          marginBottom: 12,
        }}
      >
        المنتجات
      </Text>
      {loading ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="لا توجد منتجات"
          style={{ padding: 24 }}
        />
      ) : (
        items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              📦
            </div>
            <div style={{ flex: 1 }}>
              <Text style={{ fontWeight: 600, fontSize: 13, display: "block" }}>
                {item.product_name}
              </Text>
              {item.variant_name && (
                <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                  {item.variant_name}
                </Text>
              )}
            </div>
            <div style={{ textAlign: "left" }}>
              <Text
                style={{ fontSize: 12, color: "#94A3B8", display: "block" }}
              >
                {item.quantity} × {fmt(item.unit_price)}
              </Text>
              <Text style={{ fontWeight: 700, color: "#0F172A" }}>
                {fmt(item.total_price)} ج.م
              </Text>
            </div>
          </div>
        ))
      )}

      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 12,
          padding: "16px 20px",
          margin: "20px 0",
        }}
      >
        <InfoRow label="الإجمالي الفرعي" value={`${fmt(order.subtotal)} ج.م`} />
        {Number(order.discount_amount) > 0 && (
          <InfoRow
            label="الخصم"
            value={`- ${fmt(order.discount_amount)} ج.م`}
          />
        )}
        {Number(order.tax_amount) > 0 && (
          <InfoRow label="الضريبة" value={`${fmt(order.tax_amount)} ج.م`} />
        )}
        {Number(order.shipping_cost) > 0 && (
          <InfoRow label="الشحن" value={`${fmt(order.shipping_cost)} ج.م`} />
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 14,
          }}
        >
          <Text style={{ fontWeight: 700, fontSize: 15 }}>الإجمالي</Text>
          <Text style={{ fontWeight: 800, fontSize: 18, color: "#10B981" }}>
            {fmt(order.total)} ج.م
          </Text>
        </div>
      </div>

      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94A3B8",
            letterSpacing: 1,
            display: "block",
            marginBottom: 12,
          }}
        >
          الدفع
        </Text>
        <InfoRow label="طريقة الدفع" value={order.payment_method} />
        <InfoRow label="حالة الدفع">
          <span
            style={{
              color: PAYMENT_STATUS_CONFIG[order.payment_status]?.color,
              fontWeight: 700,
            }}
          >
            {PAYMENT_STATUS_CONFIG[order.payment_status]?.label}
          </span>
        </InfoRow>
        <InfoRow label="المدفوع" value={`${fmt(order.amount_paid)} ج.م`} />
        <InfoRow label="المتبقي" value={`${fmt(order.balance_due)} ج.م`} />
      </div>

      {order.internal_notes && (
        <div
          style={{
            background: "#FFFBEB",
            borderRadius: 12,
            padding: "14px 18px",
            border: "1px solid #FDE68A",
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#92400E",
              display: "block",
              marginBottom: 6,
            }}
          >
            ملاحظات داخلية
          </Text>
          <Text style={{ fontSize: 13, color: "#78350F" }}>
            {order.internal_notes}
          </Text>
        </div>
      )}
    </Drawer>
  );
}

// ── Create / Edit Modal ───────────────────────────────────────
function OrderFormModal({ open, onClose, onSuccess, editOrder }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const isEdit = !!editOrder;

  const discount = Form.useWatch("discount_amount", form) || 0;
  const tax = Form.useWatch("tax_amount", form) || 0;
  const shipping = Form.useWatch("shipping_cost", form) || 0;

  // ✅ الـ subtotal = مجموع (سعر - خصم item) × كمية لكل item
  const itemsSubtotal = items.reduce(
    (s, it) =>
      s +
      (Number(it.unit_price) - Number(it.discount || 0)) * Number(it.quantity),
    0
  );

  // ✅ الإجمالي الكلي الصحيح = subtotal - خصم إضافي + ضريبة + شحن
  const grandTotal =
    itemsSubtotal - Number(discount) + Number(tax) + Number(shipping);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.setFieldsValue({
        source: editOrder.source,
        status: editOrder.status,
        customer_name: editOrder.customer_name,
        customer_phone: editOrder.customer_phone,
        customer_email: editOrder.customer_email,
        customer_note: editOrder.customer_note,
        payment_method: editOrder.payment_method,
        payment_status: editOrder.payment_status,
        amount_paid: editOrder.amount_paid,
        discount_amount: editOrder.discount_amount,
        tax_amount: editOrder.tax_amount,
        shipping_cost: editOrder.shipping_cost,
        internal_notes: editOrder.internal_notes,
      });
      getSalesOrderItems(editOrder.id)
        .then((r) => {
          const loaded = r.data?.results ?? r.data ?? [];
          setItems(
            loaded.map((it) => ({
              variant: it.variant ?? null,
              product_name: it.product_name,
              variant_name: it.variant_name || "",
              unit_price: Number(it.unit_price),
              quantity: it.quantity,
              discount: Number(it.discount || 0),
              note: it.note || "",
              _image: null,
            }))
          );
        })
        .catch(() => setItems([]));
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: "draft",
        payment_method: "cash",
        payment_status: "pending",
      });
      setItems([]);
    }
  }, [open, editOrder]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.warning("أضف منتجاً واحداً على الأقل");
        return;
      }
      setLoading(true);

      // ✅ احسب الـ subtotal من الـ items وابعته مع الـ payload
      // عشان الـ backend يقدر يحسب الـ total صح فوراً
      const computedSubtotal = items.reduce(
        (s, it) =>
          s +
          (Number(it.unit_price) - Number(it.discount || 0)) *
            Number(it.quantity),
        0
      );
      const computedTotal =
        computedSubtotal -
        Number(values.discount_amount || 0) +
        Number(values.tax_amount || 0) +
        Number(values.shipping_cost || 0);

      const payload = {
        ...values,
        // ✅ ابعت الـ subtotal والـ total المحسوبين من الـ frontend
        // عشان الـ backend ميستناش الـ items يتضافوا
        subtotal: computedSubtotal,
        total: computedTotal,
      };

      let orderId;
      if (isEdit) {
        await updateSalesOrder(editOrder.id, payload);
        orderId = editOrder.id;
      } else {
        const res = await createSalesOrder(payload);
        orderId = res.data?.id ?? res.data?.data?.id;

        if (!orderId) {
          message.error("فشل في الحصول على رقم الأمر");
          return;
        }

        // ✅ ضيف items بعد إنشاء الأمر
        for (const it of items) {
          await addSalesOrderItem(orderId, {
            variant: it.variant,
            product_name: it.product_name,
            variant_name: it.variant_name || "",
            unit_price: it.unit_price,
            quantity: it.quantity,
            discount: it.discount || 0,
            note: it.note || "",
          });
        }

        // ✅ بعد إضافة الـ items، ابعت patch تاني لتحديث الـ total
        // عشان لو الـ backend بيحسبه من الـ items في الـ DB
        await updateSalesOrder(orderId, {
          subtotal: computedSubtotal,
          total: computedTotal,
          status: values.status,
        });
      }

      message.success(isEdit ? "تم تحديث الأمر" : "تم إنشاء الأمر بنجاح");
      onSuccess();
      onClose();
    } catch (err) {
      if (err?.response?.data) message.error("تحقق من البيانات المدخلة");
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
          <ShoppingCartOutlined style={{ color: "#10B981" }} />
          <Text style={{ fontWeight: 700 }}>
            {isEdit ? "تعديل الأمر" : "إنشاء أمر بيع جديد"}
          </Text>
        </Space>
      }
      width={820}
      style={{ direction: "rtl", top: 16 }}
      styles={{
        body: { maxHeight: "82vh", overflowY: "auto", paddingRight: 8 },
      }}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* ✅ الـ footer بيعرض التفاصيل الكاملة للإجمالي */}
          <div
            style={{
              background: items.length ? "#F0FDF4" : "#F8FAFC",
              borderRadius: 8,
              padding: "6px 16px",
              border: `1px solid ${items.length ? "#BBF7D0" : "#E2E8F0"}`,
              minWidth: 320,
            }}
          >
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span>
                <Text style={{ fontSize: 11, color: "#6B7280" }}>
                  المنتجات:{" "}
                </Text>
                <Text style={{ fontWeight: 700, color: "#0F172A" }}>
                  {fmt(itemsSubtotal)} ج.م
                </Text>
              </span>
              {Number(discount) > 0 && (
                <span>
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>خصم: </Text>
                  <Text style={{ fontWeight: 700, color: "#EF4444" }}>
                    - {fmt(discount)} ج.م
                  </Text>
                </span>
              )}
              {Number(tax) > 0 && (
                <span>
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>
                    ضريبة:{" "}
                  </Text>
                  <Text style={{ fontWeight: 700, color: "#F59E0B" }}>
                    + {fmt(tax)} ج.م
                  </Text>
                </span>
              )}
              {Number(shipping) > 0 && (
                <span>
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>شحن: </Text>
                  <Text style={{ fontWeight: 700, color: "#6366F1" }}>
                    + {fmt(shipping)} ج.م
                  </Text>
                </span>
              )}
              <span
                style={{ borderRight: "1px solid #D1FAE5", paddingRight: 16 }}
              >
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  الإجمالي:{" "}
                </Text>
                <Text
                  style={{
                    fontWeight: 800,
                    fontSize: 17,
                    color: items.length ? "#10B981" : "#94A3B8",
                  }}
                >
                  {fmt(grandTotal)} ج.م
                </Text>
              </span>
            </div>
          </div>
          <Space>
            <Button onClick={onClose}>إلغاء</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              style={{ background: "#10B981", borderColor: "#10B981" }}
            >
              {isEdit ? "حفظ التعديلات" : "إنشاء الأمر"}
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="source"
              label="المصدر"
              rules={[{ required: true, message: "اختر المصدر" }]}
            >
              <Select placeholder="اختر المصدر">
                {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>
                    {v.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="الحالة">
              <Select>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>
                    {v.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider
          orientation="right"
          orientationMargin={0}
          style={{ fontSize: 12, color: "#94A3B8" }}
        >
          بيانات العميل
        </Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customer_name"
              label="اسم العميل"
              rules={[{ required: true, message: "أدخل الاسم" }]}
            >
              <Input placeholder="محمد أحمد" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customer_phone" label="رقم الهاتف">
              <Input placeholder="01xxxxxxxxx" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="customer_email" label="الإيميل">
              <Input placeholder="example@email.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customer_note" label="ملاحظة العميل">
              <Input placeholder="تعليمات خاصة..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider
          orientation="right"
          orientationMargin={0}
          style={{ fontSize: 12, color: "#94A3B8" }}
        >
          <Space>
            المنتجات
            {items.length > 0 && (
              <Badge count={items.length} style={{ background: "#10B981" }} />
            )}
          </Space>
        </Divider>

        <ProductItemPicker
          onAdd={(item) => setItems((prev) => [...prev, item])}
        />

        <ItemsList
          items={items}
          onRemove={(idx) =>
            setItems((prev) => prev.filter((_, i) => i !== idx))
          }
          onQtyChange={(idx, v) =>
            setItems((prev) =>
              prev.map((it, i) => (i === idx ? { ...it, quantity: v } : it))
            )
          }
          onDiscountChange={(idx, v) =>
            setItems((prev) =>
              prev.map((it, i) => (i === idx ? { ...it, discount: v } : it))
            )
          }
        />

        <Divider
          orientation="right"
          orientationMargin={0}
          style={{ fontSize: 12, color: "#94A3B8", marginTop: 16 }}
        >
          التسعير والدفع
        </Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="discount_amount" label="خصم إضافي (ج.م)">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="tax_amount" label="الضريبة (ج.م)">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="shipping_cost" label="الشحن (ج.م)">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="payment_method" label="طريقة الدفع">
              <Select>
                <Option value="cash">كاش</Option>
                <Option value="card">كارت</Option>
                <Option value="transfer">تحويل</Option>
                <Option value="stripe">Stripe</Option>
                <Option value="cod">الدفع عند الاستلام</Option>
                <Option value="wallet">محفظة</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="payment_status" label="حالة الدفع">
              <Select>
                {Object.entries(PAYMENT_STATUS_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>
                    {v.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="amount_paid" label="المبلغ المدفوع">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="internal_notes" label="ملاحظات داخلية">
          <TextArea rows={2} placeholder="ملاحظات للفريق..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function SalesOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [stats, setStats] = useState({
    total: 0,
    revenue: 0,
    pending: 0,
    delivered: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterSource, setFilterSource] = useState(null);
  const [filterPayment, setFilterPayment] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterSource) params.source = filterSource;
      if (filterPayment) params.payment_status = filterPayment;
      const res = await getSalesOrders(params);
      const data = res.data;
      setOrders(
        data?.results ?? data?.data?.results ?? data?.data ?? data ?? []
      );
      setTotal(data?.count ?? data?.data?.count ?? 0);
    } catch {
      message.error("فشل في تحميل الأوامر");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterSource, filterPayment]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getSalesOrders({ page_size: 9999 });
      const data = res.data;
      const all =
        data?.results ?? data?.data?.results ?? data?.data ?? data ?? [];
      setStats({
        total: all.length,
        revenue: all.reduce((s, o) => s + Number(o.total || 0), 0),
        pending: all.filter((o) => o.payment_status === "pending").length,
        delivered: all.filter((o) => o.status === "delivered").length,
      });
    } catch {
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateSalesOrder(id, { status });
      message.success("تم تحديث الحالة");
      fetchOrders();
      fetchStats();
      if (selectedOrder?.id === id) setSelectedOrder((p) => ({ ...p, status }));
    } catch {
      message.error("فشل");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSalesOrder(id);
      message.success("تم الحذف");
      fetchOrders();
      fetchStats();
    } catch {
      message.error("فشل في الحذف");
    }
  };

  const columns = [
    {
      title: "رقم الأمر",
      dataIndex: "order_number",
      width: 145,
      render: (val, row) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 700, color: "#6366F1" }}
          onClick={() => {
            setSelectedOrder(row);
            setDrawerOpen(true);
          }}
        >
          {val}
        </Button>
      ),
    },
    {
      title: "العميل",
      dataIndex: "customer_name",
      render: (val, row) => (
        <div>
          <Text style={{ fontWeight: 600, display: "block", fontSize: 13 }}>
            {val}
          </Text>
          {row.customer_phone && (
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>
              {row.customer_phone}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "المصدر",
      dataIndex: "source",
      width: 100,
      render: (v) => <SourceTag source={v} />,
    },
    {
      title: "الحالة",
      dataIndex: "status",
      width: 140,
      render: (v) => <StatusTag status={v} />,
    },
    {
      title: "الإجمالي",
      dataIndex: "total",
      width: 130,
      render: (v) => <Text style={{ fontWeight: 700 }}>{fmt(v)} ج.م</Text>,
    },
    {
      title: "الدفع",
      dataIndex: "payment_status",
      width: 100,
      render: (v) => {
        const c = PAYMENT_STATUS_CONFIG[v] || { color: "#94A3B8", label: v };
        return (
          <Text style={{ color: c.color, fontWeight: 600, fontSize: 12 }}>
            {c.label}
          </Text>
        );
      },
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      width: 120,
      render: (v) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          {v ? new Date(v).toLocaleDateString("ar-EG") : "—"}
        </Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 110,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="التفاصيل">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              style={{ color: "#6366F1" }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(row);
                setDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="تعديل">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              style={{ color: "#F59E0B" }}
              onClick={(e) => {
                e.stopPropagation();
                setEditOrder(row);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="حذف">
            <Popconfirm
              title="هل أنت متأكد؟"
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
                onClick={(e) => e.stopPropagation()}
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
            أوامر البيع
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة جميع أوامر البيع من كل المصادر
          </Text>
        </div>
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
            setEditOrder(null);
            setModalOpen(true);
          }}
        >
          أمر جديد
        </Button>
      </div>

      <Spin spinning={statsLoading}>
        <StatsCards stats={stats} />
      </Spin>

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "16px 20px",
          border: "1px solid #E2E8F0",
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Input
          prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
          placeholder="بحث باسم العميل أو رقم الأمر..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 260, borderRadius: 8 }}
          allowClear
        />
        <Select
          placeholder="الحالة"
          allowClear
          style={{ width: 140 }}
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
        >
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <Option key={k} value={k}>
              {v.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="المصدر"
          allowClear
          style={{ width: 130 }}
          value={filterSource}
          onChange={(v) => {
            setFilterSource(v);
            setPage(1);
          }}
        >
          {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
            <Option key={k} value={k}>
              {v.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="حالة الدفع"
          allowClear
          style={{ width: 140 }}
          value={filterPayment}
          onChange={(v) => {
            setFilterPayment(v);
            setPage(1);
          }}
        >
          {Object.entries(PAYMENT_STATUS_CONFIG).map(([k, v]) => (
            <Option key={k} value={k}>
              {v.label}
            </Option>
          ))}
        </Select>
        <Tooltip title="تحديث">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchOrders();
              fetchStats();
            }}
            style={{ borderRadius: 8 }}
          />
        </Tooltip>
        {(filterStatus || filterSource || filterPayment || search) && (
          <Button
            type="link"
            style={{ color: "#EF4444", padding: 0 }}
            onClick={() => {
              setFilterStatus(null);
              setFilterSource(null);
              setFilterPayment(null);
              setSearch("");
              setPage(1);
            }}
          >
            مسح الفلاتر
          </Button>
        )}
      </div>

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
          dataSource={orders}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
            showTotal: (t) => `${t} أمر`,
            style: { padding: "12px 20px", direction: "rtl" },
          }}
          rowClassName={(_, i) => (i % 2 === 0 ? "" : "row-alt")}
          onRow={(row) => ({
            onClick: () => {
              setSelectedOrder(row);
              setDrawerOpen(true);
            },
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: "#94A3B8" }}>لا توجد أوامر</Text>
                }
              />
            ),
          }}
        />
      </div>

      <OrderDetailDrawer
        open={drawerOpen}
        order={selectedOrder}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
      />
      <OrderFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditOrder(null);
        }}
        onSuccess={() => {
          fetchOrders();
          fetchStats();
        }}
        editOrder={editOrder}
      />

      <style>{`.row-alt { background: #FAFBFF; }`}</style>
    </div>
  );
}
