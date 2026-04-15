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
  message,
  Tooltip,
  Popconfirm,
  Empty,
  InputNumber,
  DatePicker,
  Divider,
  Spin,
  Avatar,
  Badge,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SearchOutlined,
  DeleteFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  getQuotations,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  getQuotationItems,
  addQuotationItem,
} from "../../../api/erpApi";
import axiosInstance from "../../../api/axiosInstance";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ── Config ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: {
    color: "#94A3B8",
    bg: "#F8FAFC",
    label: "مسودة",
    icon: <ClockCircleOutlined />,
  },
  sent: {
    color: "#3B82F6",
    bg: "#EFF6FF",
    label: "أُرسل للعميل",
    icon: <ClockCircleOutlined />,
  },
  accepted: {
    color: "#10B981",
    bg: "#F0FDF4",
    label: "مقبول",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    color: "#EF4444",
    bg: "#FEF2F2",
    label: "مرفوض",
    icon: <CloseCircleOutlined />,
  },
  expired: {
    color: "#F97316",
    bg: "#FFF7ED",
    label: "منتهي الصلاحية",
    icon: <CloseCircleOutlined />,
  },
  converted: {
    color: "#8B5CF6",
    bg: "#F5F3FF",
    label: "تحول لأمر بيع",
    icon: <CheckCircleOutlined />,
  },
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

// ── Stats Cards ───────────────────────────────────────────────
const StatsCards = ({ quotations }) => {
  const total = quotations.length;
  const accepted = quotations.filter((q) => q.status === "accepted").length;
  const pending = quotations.filter((q) =>
    ["draft", "sent"].includes(q.status)
  ).length;
  const converted = quotations.filter((q) => q.status === "converted").length;

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      {[
        {
          label: "إجمالي العروض",
          value: total,
          color: "#6366F1",
          icon: <FileTextOutlined />,
        },
        {
          label: "مقبول",
          value: accepted,
          color: "#10B981",
          icon: <CheckCircleOutlined />,
        },
        {
          label: "قيد الانتظار",
          value: pending,
          color: "#F59E0B",
          icon: <ClockCircleOutlined />,
        },
        {
          label: "تحول لأمر بيع",
          value: converted,
          color: "#8B5CF6",
          icon: <CheckCircleOutlined />,
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
              <Text
                style={{ fontSize: 11, color: "#94A3B8", display: "block" }}
              >
                {c.label}
              </Text>
              <Text style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
                {c.value}
              </Text>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
};

// ── Product Item Picker ───────────────────────────────────────
function ProductItemPicker({ onAdd }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
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
      const raw = res.data;
      const variants = raw?.results ?? raw?.data?.results ?? raw ?? [];
      const enriched = { ...prod, variants };
      setSelected(enriched);
      const active = variants.filter((v) => v.is_active !== false);
      setVariant(active.length === 1 ? active[0] : null);
      setQty(1);
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
    const activeVariants =
      selected.variants?.filter((v) => v.is_active !== false) ?? [];
    if (activeVariants.length > 0 && !variant) {
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
      note: "",
      _image: selected.primary_image ?? null,
    });

    setQuery("");
    setSelected(null);
    setVariant(null);
    setQty(1);
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
        🔍 ابحث عن منتج وأضفه للعرض
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
              maxHeight: 260,
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
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F0FDF4")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <Avatar
                  size={36}
                  src={p.primary_image}
                  shape="square"
                  style={{
                    borderRadius: 8,
                    background: "#EEF2FF",
                    flexShrink: 0,
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
                    style={{ display: "flex", justifyContent: "space-between" }}
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

      {selected && !loadingVariants && (
        <Row gutter={8} align="bottom">
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
          <Col span={8}>
            <Text
              style={{
                fontSize: 11,
                color: "#475569",
                display: "block",
                marginBottom: 3,
                fontWeight: 600,
              }}
            >
              سعر الوحدة
            </Text>
            <Text
              style={{
                fontWeight: 800,
                color: canAdd ? "#10B981" : "#94A3B8",
                fontSize: 15,
                lineHeight: "24px",
              }}
            >
              {fmt(unitPrice)} ج.م
            </Text>
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
              الإجمالي
            </Text>
            <Text
              style={{
                fontWeight: 800,
                color: canAdd ? "#6366F1" : "#94A3B8",
                fontSize: 15,
                lineHeight: "24px",
              }}
            >
              {fmt(unitPrice * qty)} ج.م
            </Text>
          </Col>
          <Col span={5}>
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
              أضف
            </Button>
          </Col>
        </Row>
      )}
    </div>
  );
}

// ── Items List ────────────────────────────────────────────────
function ItemsList({ items, onRemove, onQtyChange }) {
  if (items.length === 0)
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="ابحث عن منتج وأضفه للعرض"
        style={{ padding: "12px 0" }}
      />
    );

  const subtotal = items.reduce(
    (s, it) => s + Number(it.unit_price) * Number(it.quantity),
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
            size={36}
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
                style={{ width: 60 }}
              />
            </div>
            <div style={{ textAlign: "center", minWidth: 80 }}>
              <Text
                style={{ fontSize: 10, color: "#94A3B8", display: "block" }}
              >
                الإجمالي
              </Text>
              <Text style={{ fontWeight: 700, color: "#6366F1", fontSize: 13 }}>
                {fmt(Number(item.unit_price) * Number(item.quantity))} ج.م
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
          background: "#EEF2FF",
          borderRadius: 8,
          border: "1px solid #C7D2FE",
        }}
      >
        <Text style={{ fontWeight: 800, color: "#4338CA", fontSize: 14 }}>
          إجمالي العرض: {fmt(subtotal)} ج.م
        </Text>
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────
function QuotationDetailDrawer({ quotation, open, onClose, onStatusChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && quotation?.id) {
      setLoading(true);
      getQuotationItems(quotation.id)
        .then((r) => setItems(r.data?.results ?? r.data ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else setItems([]);
  }, [open, quotation]);

  if (!quotation) return null;

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
              background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileTextOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <div>
            <Text style={{ fontWeight: 700, fontSize: 15, display: "block" }}>
              {quotation.quotation_number}
            </Text>
            <StatusTag status={quotation.status} />
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
            value={quotation.status}
            style={{ width: 160 }}
            onChange={(v) => onStatusChange(quotation.id, v)}
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
      {/* Customer Info */}
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
        <InfoRow label="الاسم" value={quotation.customer_name} />
        <InfoRow label="التليفون" value={quotation.customer_phone || "—"} />
        <InfoRow label="الإيميل" value={quotation.customer_email || "—"} />
        <InfoRow
          label="صالح حتى"
          value={
            quotation.valid_until
              ? new Date(quotation.valid_until).toLocaleDateString("ar-EG")
              : "—"
          }
        />
        <InfoRow label="منتهي؟">
          <span
            style={{
              color: quotation.is_expired ? "#EF4444" : "#10B981",
              fontWeight: 700,
            }}
          >
            {quotation.is_expired ? "نعم" : "لا"}
          </span>
        </InfoRow>
      </div>

      {/* Items */}
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

      {/* Total */}
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 12,
          padding: "16px 20px",
          margin: "20px 0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text style={{ fontWeight: 700, fontSize: 15 }}>إجمالي العرض</Text>
          <Text style={{ fontWeight: 800, fontSize: 20, color: "#6366F1" }}>
            {fmt(quotation.subtotal)} ج.م
          </Text>
        </div>
      </div>

      {quotation.notes && (
        <div
          style={{
            background: "#FFFBEB",
            borderRadius: 12,
            padding: "14px 18px",
            border: "1px solid #FDE68A",
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
            ملاحظات
          </Text>
          <Text style={{ fontSize: 13, color: "#78350F" }}>
            {quotation.notes}
          </Text>
        </div>
      )}
    </Drawer>
  );
}

// ── Create / Edit Modal ───────────────────────────────────────
function QuotationFormModal({ open, onClose, onSuccess, editQuotation }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const isEdit = !!editQuotation;

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.setFieldsValue({
        customer_name: editQuotation.customer_name,
        customer_phone: editQuotation.customer_phone,
        customer_email: editQuotation.customer_email,
        status: editQuotation.status,
        valid_until: editQuotation.valid_until
          ? dayjs(editQuotation.valid_until)
          : null,
        notes: editQuotation.notes,
      });
      getQuotationItems(editQuotation.id)
        .then((r) => {
          const loaded = r.data?.results ?? r.data ?? [];
          setItems(
            loaded.map((it) => ({
              variant: it.variant ?? null,
              product_name: it.product_name,
              variant_name: it.variant_name || "",
              unit_price: Number(it.unit_price),
              quantity: it.quantity,
              note: it.note || "",
              _image: null,
            }))
          );
        })
        .catch(() => setItems([]));
    } else {
      form.resetFields();
      form.setFieldsValue({ status: "draft" });
      setItems([]);
    }
  }, [open, editQuotation]);

  const subtotal = items.reduce(
    (s, it) => s + Number(it.unit_price) * Number(it.quantity),
    0
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.warning("أضف منتجاً واحداً على الأقل");
        return;
      }
      if (values.valid_until)
        values.valid_until = values.valid_until.format("YYYY-MM-DD");
      setLoading(true);

      let quotationId;
      if (isEdit) {
        await updateQuotation(editQuotation.id, values);
        quotationId = editQuotation.id;
      } else {
        const res = await createQuotation(values);
        quotationId = res.data?.id ?? res.data?.data?.id;
      }

      if (!quotationId) {
        message.error("فشل في الحصول على رقم العرض");
        return;
      }

      for (const it of items) {
        await addQuotationItem(quotationId, {
          variant: it.variant,
          product_name: it.product_name,
          variant_name: it.variant_name || "",
          unit_price: it.unit_price,
          quantity: it.quantity,
          note: it.note || "",
        });
      }

      message.success(isEdit ? "تم تحديث العرض" : "تم إنشاء العرض بنجاح");
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
          <FileTextOutlined style={{ color: "#6366F1" }} />
          <Text style={{ fontWeight: 700 }}>
            {isEdit ? "تعديل عرض السعر" : "عرض سعر جديد"}
          </Text>
        </Space>
      }
      width={820}
      style={{ direction: "rtl", top: 16 }}
      styles={{
        body: { maxHeight: "80vh", overflowY: "auto", paddingRight: 8 },
      }}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: items.length ? "#EEF2FF" : "#F8FAFC",
              borderRadius: 8,
              padding: "6px 16px",
              border: `1px solid ${items.length ? "#C7D2FE" : "#E2E8F0"}`,
              minWidth: 180,
            }}
          >
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              إجمالي العرض:{" "}
            </Text>
            <Text
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: items.length ? "#6366F1" : "#94A3B8",
              }}
            >
              {fmt(subtotal)} ج.م
            </Text>
          </div>
          <Space>
            <Button onClick={onClose}>إلغاء</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              style={{ background: "#6366F1", borderColor: "#6366F1" }}
            >
              {isEdit ? "حفظ التعديلات" : "إنشاء العرض"}
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        {/* Customer */}
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
            <Form.Item name="valid_until" label="صالح حتى تاريخ">
              <DatePicker
                style={{ width: "100%" }}
                placeholder="اختر التاريخ"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
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
          <Col span={12}>
            <Form.Item name="notes" label="ملاحظات">
              <Input placeholder="أي ملاحظات..." />
            </Form.Item>
          </Col>
        </Row>

        {/* Products */}
        <Divider
          orientation="right"
          orientationMargin={0}
          style={{ fontSize: 12, color: "#94A3B8" }}
        >
          <Space>
            المنتجات
            {items.length > 0 && (
              <Badge count={items.length} style={{ background: "#6366F1" }} />
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
        />
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedQ, setSelectedQ] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editQuotation, setEditQuotation] = useState(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (filterStatus) params.status = filterStatus;
      const res = await getQuotations(params);
      const data = res.data;
      setQuotations(
        data?.results ?? data?.data?.results ?? data?.data ?? data ?? []
      );
      setTotal(data?.count ?? 0);
    } catch {
      message.error("فشل في تحميل عروض الأسعار");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateQuotation(id, { status });
      message.success("تم تحديث الحالة");
      fetchQuotations();
      if (selectedQ?.id === id) setSelectedQ((p) => ({ ...p, status }));
    } catch {
      message.error("فشل");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteQuotation(id);
      message.success("تم الحذف");
      fetchQuotations();
    } catch {
      message.error("فشل في الحذف");
    }
  };

  // client-side search
  const filtered = search
    ? quotations.filter(
        (q) =>
          q.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
          q.quotation_number?.toLowerCase().includes(search.toLowerCase())
      )
    : quotations;

  const columns = [
    {
      title: "رقم العرض",
      dataIndex: "quotation_number",
      width: 160,
      render: (val, row) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 700, color: "#6366F1" }}
          onClick={() => {
            setSelectedQ(row);
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
      title: "الحالة",
      dataIndex: "status",
      width: 160,
      render: (v) => <StatusTag status={v} />,
    },
    {
      title: "الإجمالي",
      dataIndex: "subtotal",
      width: 140,
      render: (v) => (
        <Text style={{ fontWeight: 700, color: "#6366F1" }}>{fmt(v)} ج.م</Text>
      ),
    },
    {
      title: "صالح حتى",
      dataIndex: "valid_until",
      width: 130,
      render: (v, row) => (
        <div>
          <Text style={{ color: "#94A3B8", fontSize: 12 }}>
            {v ? new Date(v).toLocaleDateString("ar-EG") : "—"}
          </Text>
          {row.is_expired && (
            <Tag
              color="red"
              style={{
                fontSize: 10,
                marginTop: 2,
                display: "block",
                width: "fit-content",
              }}
            >
              منتهي
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "تاريخ الإنشاء",
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
                setSelectedQ(row);
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
                setEditQuotation(row);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="حذف">
            <Popconfirm
              title="هل أنت متأكد من الحذف؟"
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
          <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
            عروض الأسعار
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة عروض الأسعار المقدمة للعملاء
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchQuotations}
            style={{ borderRadius: 8 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: "#6366F1",
              borderColor: "#6366F1",
              borderRadius: 8,
              height: 38,
            }}
            onClick={() => {
              setEditQuotation(null);
              setModalOpen(true);
            }}
          >
            عرض جديد
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <StatsCards quotations={quotations} />

      {/* Filters */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "14px 20px",
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
          placeholder="بحث باسم العميل أو رقم العرض..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 280, borderRadius: 8 }}
          allowClear
        />
        <Select
          placeholder="الحالة"
          allowClear
          style={{ width: 160 }}
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
        <Tooltip title="تحديث">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchQuotations}
            style={{ borderRadius: 8 }}
          />
        </Tooltip>
        {(filterStatus || search) && (
          <Button
            type="link"
            style={{ color: "#EF4444", padding: 0 }}
            onClick={() => {
              setFilterStatus(null);
              setSearch("");
              setPage(1);
            }}
          >
            مسح الفلاتر
          </Button>
        )}
      </div>

      {/* Table */}
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
          dataSource={filtered}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
            showTotal: (t) => `${t} عرض`,
            style: { padding: "12px 20px", direction: "rtl" },
          }}
          rowClassName={(_, i) => (i % 2 === 0 ? "" : "row-alt")}
          onRow={(row) => ({
            onClick: () => {
              setSelectedQ(row);
              setDrawerOpen(true);
            },
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: "#94A3B8" }}>لا توجد عروض أسعار</Text>
                }
              />
            ),
          }}
        />
      </div>

      <QuotationDetailDrawer
        quotation={selectedQ}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
      />

      <QuotationFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditQuotation(null);
        }}
        onSuccess={fetchQuotations}
        editQuotation={editQuotation}
      />

      <style>{`.row-alt { background: #FAFBFF; }`}</style>
    </div>
  );
}
