import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Card,
  Drawer,
  Descriptions,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Badge,
  Avatar,
  Steps,
  message,
  Modal,
  Form,
  Divider,
  InputNumber,
  Spin,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  GiftOutlined,
  DeleteOutlined,
  PlusOutlined,
  DeleteFilled,
} from "@ant-design/icons";
import {
  getOrders,
  getOrder,
  updateOrderStatus,
  getOrderStats,
  exportOrders,
  deleteOrder,
} from "../../api/ordersapi";
import axios from "axios";
import axiosInstance from "../../api/axiosInstance";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META = {
  pending: {
    color: "orange",
    label: "قيد الانتظار",
    icon: <ClockCircleOutlined />,
  },
  confirmed: { color: "blue", label: "مؤكد", icon: <CheckCircleOutlined /> },
  shipped: { color: "cyan", label: "تم الشحن", icon: <CarOutlined /> },
  delivered: {
    color: "green",
    label: "تم التسليم",
    icon: <CheckCircleOutlined />,
  },
  cancelled: { color: "red", label: "ملغي", icon: <CloseCircleOutlined /> },
  refunded: { color: "purple", label: "مسترجع", icon: <RollbackOutlined /> },
};

const PAYMENT_STATUS_META = {
  pending: { color: "orange", label: "قيد الانتظار" },
  paid: { color: "green", label: "مدفوع" },
  failed: { color: "red", label: "فشل" },
  refunded: { color: "purple", label: "مسترجع" },
};

const PAYMENT_METHOD_LABELS = {
  stripe: "Stripe",
  paypal: "PayPal",
  cod: "الدفع عند الاستلام",
};

const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

const NON_EDITABLE_STATUSES = ["delivered", "refunded"];

const fmtMoney = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const fmt = (v) =>
  Number(v || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 });

const extractData = (data) => data?.data ?? data;
const extractList = (data) =>
  data?.results ?? data?.data?.results ?? data?.data ?? [];
const extractCount = (data, list) =>
  data?.count ?? data?.data?.count ?? list.length;

// ── WhatsApp Icon ─────────────────────────────────────────────────────────────
const WhatsAppIcon = ({ size = 13, color = "#25D366" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ── Order Status Steps ────────────────────────────────────────────────────────
const ORDER_STEPS = ["pending", "confirmed", "shipped", "delivered"];

function OrderStatusSteps({ status }) {
  if (["cancelled", "refunded"].includes(status)) {
    return (
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          background: status === "cancelled" ? "#FEF2F2" : "#FAF5FF",
          border: `1px solid ${status === "cancelled" ? "#FECACA" : "#E9D5FF"}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {STATUS_META[status].icon}
        <Text
          style={{
            fontWeight: 600,
            color: status === "cancelled" ? "#DC2626" : "#7C3AED",
          }}
        >
          الطلب {STATUS_META[status].label}
        </Text>
      </div>
    );
  }
  return (
    <Steps
      current={ORDER_STEPS.indexOf(status)}
      size="small"
      items={ORDER_STEPS.map((s) => ({
        title: STATUS_META[s]?.label,
        icon: STATUS_META[s]?.icon,
      }))}
      style={{ direction: "ltr" }}
    />
  );
}

// ── Update Status Modal ───────────────────────────────────────────────────────
function UpdateStatusModal({ open, order, onClose, onUpdated }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const allowed = ALLOWED_TRANSITIONS[order?.status] || [];

  const handleOk = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await updateOrderStatus(order.id, values);
      message.success("تم تحديث حالة الطلب ✅");
      onUpdated();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || "فشل التحديث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="تحديث الحالة"
      cancelText="إلغاء"
      confirmLoading={loading}
      title={
        <Text style={{ fontWeight: 700 }}>
          تحديث حالة الطلب #{order?.order_number}
        </Text>
      }
      width={420}
      style={{ direction: "rtl" }}
    >
      {allowed.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            textAlign: "center",
          }}
        >
          <Text style={{ color: "#DC2626" }}>لا يمكن تغيير حالة هذا الطلب</Text>
        </div>
      ) : (
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="status"
            label="الحالة الجديدة"
            rules={[{ required: true, message: "اختر الحالة" }]}
          >
            <Select
              placeholder="اختر الحالة..."
              size="large"
              style={{ width: "100%" }}
            >
              {allowed.map((s) => (
                <Option key={s} value={s}>
                  <Space>
                    {STATUS_META[s]?.icon}
                    {STATUS_META[s]?.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="payment_status" label="حالة الدفع (اختياري)">
            <Select
              placeholder="اختر..."
              size="large"
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(PAYMENT_STATUS_META).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

// ── ProductItemPicker ─────────────────────────────────────────────────────────
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
      const d = res.data;
      setProducts(d?.results ?? d?.data?.results ?? d ?? []);
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
      setSelected({ ...prod, variants });
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
      message.warning("اختر الـ variant أولاً");
      return;
    }
    if (!qty || qty < 1) {
      message.warning("الكمية 1 على الأقل");
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
      product: selected.id,
      variant: variant?.id ?? null,
      quantity: qty,
      _product_name: selected.name,
      _variant_name: variantLabel,
      _unit_price: price,
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
        borderRadius: 10,
        padding: "12px 14px",
        border: "1px dashed #CBD5E1",
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#475569",
          display: "block",
          marginBottom: 8,
        }}
      >
        ابحث عن منتج وأضفه للأوردر
      </Text>

      <div style={{ position: "relative", marginBottom: 8 }} ref={dropdownRef}>
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
          size="small"
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
              boxShadow: "0 8px 24px rgba(0,0,0,.1)",
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
                  padding: "9px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #F8FAFC",
                  transition: "background .12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F0FDF4")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <Avatar
                  size={34}
                  src={p.primary_image}
                  shape="square"
                  style={{
                    borderRadius: 6,
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
                    {p.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                    {fmt(p.effective_price ?? p.price)} ج.م
                    {p.total_stock !== undefined && (
                      <span
                        style={{
                          marginRight: 6,
                          fontWeight: 600,
                          color: p.total_stock > 0 ? "#10B981" : "#EF4444",
                        }}
                      >
                        {p.total_stock > 0
                          ? ` ● ${p.total_stock} متاح`
                          : " ● نفد"}
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
        <div style={{ textAlign: "center", padding: "6px 0" }}>
          <Spin size="small" />
          <Text style={{ marginRight: 8, fontSize: 12, color: "#94A3B8" }}>
            جاري تحميل المتغيرات...
          </Text>
        </div>
      )}

      {selected && !loadingVariants && activeVariants.length > 1 && (
        <div style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 11,
              color: "#475569",
              display: "block",
              marginBottom: 3,
              fontWeight: 600,
            }}
          >
            اختر المتغير (مطلوب)
          </Text>
          <Select
            placeholder="اختر الحجم أو اللون..."
            size="small"
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
                v.effective_price ?? v.price_override ?? selected.price ?? 0
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
                          marginLeft: 6,
                          color: v.stock > 0 ? "#94A3B8" : "#EF4444",
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
            padding: "7px 10px",
            marginBottom: 8,
            fontSize: 12,
            color: "#92400E",
          }}
        >
          هذا المنتج ليس له متغيرات — السعر:{" "}
          {fmt(selected.effective_price ?? selected.price)} ج.م
        </div>
      )}

      {selected && !loadingVariants && (
        <Row gutter={8} align="bottom">
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
              السعر
            </Text>
            <Text
              style={{
                fontWeight: 700,
                color: canAdd ? "#10B981" : "#94A3B8",
                lineHeight: "24px",
              }}
            >
              {fmt(unitPrice * (qty || 0))} ج.م
            </Text>
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              block
              size="small"
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

// ── ItemsList ─────────────────────────────────────────────────────────────────
function ItemsList({ items, onRemove, onQtyChange }) {
  if (items.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "16px 0",
          color: "#94A3B8",
          fontSize: 13,
          background: "#F8FAFC",
          borderRadius: 8,
          border: "1px dashed #CBD5E1",
        }}
      >
        لا توجد منتجات — ابحث وأضف منتجاً
      </div>
    );
  }
  return (
    <div>
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderRadius: 10,
            background: idx % 2 === 0 ? "#FAFBFF" : "#fff",
            border: "1px solid #E2E8F0",
            marginBottom: 6,
          }}
        >
          <Avatar
            size={34}
            src={item._image}
            shape="square"
            style={{
              borderRadius: 6,
              background: "#EEF2FF",
              flexShrink: 0,
              fontSize: 15,
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
              {item._product_name || `منتج #${item.product}`}
            </Text>
            <Text style={{ fontSize: 11, color: "#94A3B8" }}>
              {item._variant_name || "—"}
              {item._unit_price ? (
                <span style={{ marginRight: 6, color: "#64748B" }}>
                  {fmt(item._unit_price)} ج.م/قطعة
                </span>
              ) : null}
            </Text>
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
          {item._unit_price && (
            <div style={{ textAlign: "center", minWidth: 68 }}>
              <Text
                style={{ fontSize: 10, color: "#94A3B8", display: "block" }}
              >
                الإجمالي
              </Text>
              <Text style={{ fontWeight: 700, color: "#10B981", fontSize: 12 }}>
                {fmt(Number(item._unit_price) * Number(item.quantity))} ج.م
              </Text>
            </div>
          )}
          <Tooltip
            title={items.length === 1 ? "لا يمكن حذف المنتج الأخير" : "حذف"}
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteFilled />}
              disabled={items.length === 1}
              onClick={() => onRemove(idx)}
              style={{ marginTop: 12, opacity: items.length === 1 ? 0.35 : 1 }}
            />
          </Tooltip>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 4,
          padding: "7px 12px",
          background: "#F0FDF4",
          borderRadius: 8,
          border: "1px solid #BBF7D0",
        }}
      >
        <Text style={{ fontWeight: 800, color: "#059669", fontSize: 13 }}>
          إجمالي المنتجات:{" "}
          {fmt(
            items.reduce(
              (s, it) => s + Number(it._unit_price || 0) * Number(it.quantity),
              0
            )
          )}{" "}
          ج.م
        </Text>
      </div>
    </div>
  );
}

// ── Edit Order Modal ──────────────────────────────────────────────────────────
function EditOrderModal({ open, order, onClose, onUpdated }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open || !order) return;
    form.setFieldsValue({
      shipping_name: order.shipping_name || "",
      shipping_phone: order.shipping_phone || "",
      whatsapp_number: order.whatsapp_number || "",
      shipping_address: order.shipping_address || "",
      shipping_city: order.shipping_city || "",
      shipping_country: order.shipping_country || "",
      shipping_postal_code: order.shipping_postal_code || "",
      payment_method: order.payment_method || undefined,
      payment_status: order.payment_status || undefined,
      shipping_cost: Number(order.shipping_cost) || 0,
      notes: order.notes || "",
    });
    setItems(
      (order.items || []).map((it) => ({
        product: it.product,
        variant: it.variant ?? null,
        quantity: it.quantity,
        _product_name: it.product_name,
        _variant_name: it.variant_name || "",
        _unit_price: Number(it.unit_price),
        _image: it.product_image ?? null,
      }))
    );
  }, [open, order]);

  const handleOk = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (items.length === 0) {
      message.warning("لازم يكون في منتج واحد على الأقل");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        shipping_name: values.shipping_name,
        shipping_phone: values.shipping_phone,
        whatsapp_number: values.whatsapp_number,
        shipping_address: values.shipping_address,
        shipping_city: values.shipping_city,
        shipping_country: values.shipping_country,
        shipping_postal_code: values.shipping_postal_code,
        payment_method: values.payment_method,
        payment_status: values.payment_status,
        shipping_cost: values.shipping_cost,
        notes: values.notes,
        items: items.map(({ product, variant, quantity }) => ({
          product,
          variant: variant || null,
          quantity,
        })),
      };
      await axios.patch(`/api/admin/orders/${order.id}/edit/`, payload);
      message.success("تم تحديث الأوردر بنجاح ✅");
      onUpdated();
      onClose();
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        "فشل التحديث";
      message.error(
        typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg)
      );
    } finally {
      setLoading(false);
    }
  };

  const isNonEditable = NON_EDITABLE_STATUSES.includes(order?.status);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="حفظ التعديلات"
      cancelText="إلغاء"
      confirmLoading={loading}
      okButtonProps={{ disabled: isNonEditable }}
      title={
        <Space>
          <EditOutlined style={{ color: "#6366F1" }} />
          <Text style={{ fontWeight: 700 }}>
            تعديل الطلب #{order?.order_number}
          </Text>
        </Space>
      }
      width={760}
      style={{ direction: "rtl", top: 16 }}
      styles={{
        body: { maxHeight: "82vh", overflowY: "auto", paddingRight: 8 },
      }}
    >
      {isNonEditable ? (
        <div
          style={{
            padding: 20,
            textAlign: "center",
            background: "#FEF2F2",
            borderRadius: 10,
            border: "1px solid #FECACA",
          }}
        >
          <Text style={{ color: "#DC2626", fontSize: 14 }}>
            لا يمكن تعديل الأوردرات بحالة "{STATUS_META[order?.status]?.label}"
          </Text>
        </div>
      ) : (
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          {/* بيانات الشحن */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: 10,
              padding: "14px 16px 4px",
              border: "1px solid #E2E8F0",
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontWeight: 600,
                color: "#0F172A",
                display: "block",
                marginBottom: 10,
              }}
            >
              📦 بيانات الشحن
            </Text>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="shipping_name"
                  label="الاسم"
                  rules={[{ required: true, message: "مطلوب" }]}
                >
                  <Input placeholder="اسم المستلم" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipping_phone"
                  label="الهاتف"
                  rules={[{ required: true, message: "مطلوب" }]}
                >
                  <Input placeholder="رقم الهاتف" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="whatsapp_number" label="واتساب">
                  <Input placeholder="رقم الواتساب (اختياري)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipping_city"
                  label="المدينة"
                  rules={[{ required: true, message: "مطلوب" }]}
                >
                  <Input placeholder="المدينة / المحافظة" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="shipping_address"
                  label="العنوان"
                  rules={[{ required: true, message: "مطلوب" }]}
                >
                  <Input placeholder="العنوان التفصيلي" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="shipping_country" label="الدولة">
                  <Input placeholder="الدولة" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="shipping_postal_code" label="الرمز البريدي">
                  <Input placeholder="الرمز البريدي" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* الدفع */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: 10,
              padding: "14px 16px 4px",
              border: "1px solid #E2E8F0",
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontWeight: 600,
                color: "#0F172A",
                display: "block",
                marginBottom: 10,
              }}
            >
              💳 الدفع والتكاليف
            </Text>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="payment_method" label="طريقة الدفع">
                  <Select placeholder="اختر..." allowClear>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                      <Option key={k} value={k}>
                        {v}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="payment_status" label="حالة الدفع">
                  <Select placeholder="اختر..." allowClear>
                    {Object.entries(PAYMENT_STATUS_META).map(([k, v]) => (
                      <Option key={k} value={k}>
                        {v.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="shipping_cost" label="تكلفة الشحن (ج.م)">
                  <InputNumber
                    min={0}
                    step={0.5}
                    style={{ width: "100%" }}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* المنتجات */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: 10,
              padding: "14px 16px 10px",
              border: "1px solid #E2E8F0",
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontWeight: 600,
                color: "#0F172A",
                display: "block",
                marginBottom: 10,
              }}
            >
              🛍️ المنتجات
              {items.length > 0 && (
                <span
                  style={{
                    marginRight: 8,
                    background: "#10B981",
                    color: "#fff",
                    borderRadius: 20,
                    padding: "1px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {items.length}
                </span>
              )}
            </Text>
            <ProductItemPicker
              onAdd={(newItem) => {
                const existIdx = items.findIndex(
                  (it) =>
                    it.product === newItem.product &&
                    it.variant === newItem.variant
                );
                if (existIdx !== -1) {
                  setItems((prev) =>
                    prev.map((it, i) =>
                      i === existIdx
                        ? { ...it, quantity: it.quantity + newItem.quantity }
                        : it
                    )
                  );
                  message.info("تم زيادة الكمية للمنتج الموجود");
                } else {
                  setItems((prev) => [...prev, newItem]);
                }
              }}
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
          </div>

          {/* ملاحظات */}
          <Form.Item name="notes" label="ملاحظات">
            <TextArea rows={2} placeholder="أي ملاحظات إضافية على الأوردر..." />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

// ── Order Detail Drawer ───────────────────────────────────────────────────────
function OrderDrawer({ orderId, open, onClose, onStatusUpdate }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadOrder = useCallback(() => {
    if (!orderId) return;
    setLoading(true);
    getOrder(orderId)
      .then(({ data }) => setOrder(extractData(data)))
      .catch(() => message.error("فشل تحميل تفاصيل الطلب"))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (open) loadOrder();
  }, [open, loadOrder]);

  const handleUpdated = () => {
    loadOrder();
    onStatusUpdate();
  };
  const canEdit = order && !NON_EDITABLE_STATUSES.includes(order.status);

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width={600}
        title={
          order && (
            <Space>
              <ShoppingCartOutlined style={{ color: "#6366F1" }} />
              <Text style={{ fontWeight: 700 }}>
                تفاصيل الطلب #{order.order_number}
              </Text>
            </Space>
          )
        }
        loading={loading}
        style={{ direction: "rtl" }}
        extra={
          order && (
            <Space>
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setEditModalOpen(true)}
                  style={{
                    borderRadius: 8,
                    borderColor: "#10B981",
                    color: "#10B981",
                  }}
                >
                  تعديل الأوردر
                </Button>
              )}
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setStatusModalOpen(true)}
                style={{
                  background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
                  border: "none",
                  borderRadius: 8,
                }}
              >
                تحديث الحالة
              </Button>
            </Space>
          )
        }
      >
        {order && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card
              style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
              bodyStyle={{ padding: 20 }}
            >
              <Text
                style={{
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 16,
                  color: "#0F172A",
                }}
              >
                حالة الطلب
              </Text>
              <OrderStatusSteps status={order.status} />
            </Card>

            <Row gutter={12}>
              {[
                { label: "المجموع الفرعي", value: fmtMoney(order.subtotal) },
                {
                  label: "الخصم",
                  value: fmtMoney(order.discount_amount),
                  color: "#EF4444",
                },
                { label: "الشحن", value: fmtMoney(order.shipping_cost) },
                {
                  label: "الإجمالي",
                  value: fmtMoney(order.total_price),
                  color: "#10B981",
                  bold: true,
                },
              ].map((item) => (
                <Col span={6} key={item.label}>
                  <Card
                    style={{
                      borderRadius: 10,
                      border: "1px solid #F1F5F9",
                      textAlign: "center",
                    }}
                    bodyStyle={{ padding: "12px 8px" }}
                  >
                    <Text
                      style={{
                        color: "#94A3B8",
                        fontSize: 11,
                        display: "block",
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={{
                        fontWeight: item.bold ? 700 : 600,
                        color: item.color || "#0F172A",
                        fontSize: 14,
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {item.value}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  حالة الطلب:{" "}
                </Text>
                <Tag
                  color={STATUS_META[order.status]?.color}
                  style={{ borderRadius: 6 }}
                >
                  {STATUS_META[order.status]?.label}
                </Tag>
              </div>
              <div>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  حالة الدفع:{" "}
                </Text>
                <Tag
                  color={PAYMENT_STATUS_META[order.payment_status]?.color}
                  style={{ borderRadius: 6 }}
                >
                  {PAYMENT_STATUS_META[order.payment_status]?.label}
                </Tag>
              </div>
              <div>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  طريقة الدفع:{" "}
                </Text>
                <Tag style={{ borderRadius: 6 }}>
                  {PAYMENT_METHOD_LABELS[order.payment_method] ||
                    order.payment_method}
                </Tag>
              </div>
            </div>

            <Divider style={{ margin: "4px 0" }} />

            <div>
              <Text
                style={{
                  fontWeight: 700,
                  color: "#0F172A",
                  fontSize: 14,
                  display: "block",
                  marginBottom: 12,
                }}
              >
                🛍️ المنتجات ({order.items?.length})
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <Space>
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <Avatar
                          shape="square"
                          size={40}
                          style={{ borderRadius: 8, background: "#EEF2FF" }}
                        >
                          {item.product_name?.[0]}
                        </Avatar>
                      )}
                      <div>
                        <Text
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            display: "block",
                          }}
                        >
                          {item.product_name}
                        </Text>
                        {item.variant_name && (
                          <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                            {item.variant_name}
                          </Text>
                        )}
                      </div>
                    </Space>
                    <div style={{ textAlign: "left" }}>
                      <Text
                        style={{
                          fontWeight: 700,
                          color: "#0F172A",
                          display: "block",
                        }}
                      >
                        {fmtMoney(item.total_price)}
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                        {fmtMoney(item.unit_price)} × {item.quantity}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Divider style={{ margin: "4px 0" }} />

            <Row gutter={16}>
              <Col span={12}>
                <Card
                  title={
                    <Space>
                      <UserOutlined style={{ color: "#6366F1" }} />
                      <Text style={{ fontWeight: 700 }}>بيانات العميل</Text>
                    </Space>
                  }
                  style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
                  bodyStyle={{ padding: 16 }}
                  headStyle={{ padding: "12px 16px", minHeight: "auto" }}
                >
                  <Descriptions
                    column={1}
                    size="small"
                    labelStyle={{ color: "#94A3B8", fontSize: 12 }}
                  >
                    <Descriptions.Item label="الاسم">
                      {order.customer?.full_name || order.shipping_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="البريد">
                      {order.customer?.email || "—"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title={
                    <Space>
                      <EnvironmentOutlined style={{ color: "#10B981" }} />
                      <Text style={{ fontWeight: 700 }}>عنوان الشحن</Text>
                    </Space>
                  }
                  style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
                  bodyStyle={{ padding: 16 }}
                  headStyle={{ padding: "12px 16px", minHeight: "auto" }}
                >
                  <Descriptions
                    column={1}
                    size="small"
                    labelStyle={{ color: "#94A3B8", fontSize: 12 }}
                  >
                    <Descriptions.Item label="الاسم">
                      {order.shipping_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="الهاتف">
                      {order.shipping_phone}
                    </Descriptions.Item>
                    {order.whatsapp_number && (
                      <Descriptions.Item
                        label={
                          <Space size={4}>
                            <WhatsAppIcon />
                            واتساب
                          </Space>
                        }
                      >
                        <a
                          href={`https://wa.me/2${order.whatsapp_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#25D366",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {order.whatsapp_number}
                          <span style={{ fontSize: 10, opacity: 0.7 }}>↗</span>
                        </a>
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="العنوان">
                      {order.shipping_address}, {order.shipping_city},{" "}
                      {order.shipping_country}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {order.coupon_code && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <GiftOutlined style={{ color: "#10B981", fontSize: 18 }} />
                <div>
                  <Text
                    style={{
                      fontWeight: 600,
                      color: "#065F46",
                      display: "block",
                    }}
                  >
                    كود الخصم: {order.coupon_code}
                  </Text>
                  <Text style={{ color: "#047857", fontSize: 12 }}>
                    وفّرت {fmtMoney(order.discount_amount)}
                  </Text>
                </div>
              </div>
            )}

            {order.notes && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                }}
              >
                <Text
                  style={{
                    fontWeight: 600,
                    color: "#92400E",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  📝 ملاحظات
                </Text>
                <Text style={{ color: "#78350F", fontSize: 13 }}>
                  {order.notes}
                </Text>
              </div>
            )}

            {order.payments?.length > 0 && (
              <div>
                <Text
                  style={{
                    fontWeight: 700,
                    color: "#0F172A",
                    fontSize: 14,
                    display: "block",
                    marginBottom: 12,
                  }}
                >
                  <CreditCardOutlined style={{ marginLeft: 6 }} />
                  سجل المدفوعات
                </Text>
                {order.payments.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      marginBottom: 8,
                    }}
                  >
                    <Space>
                      <Tag color={PAYMENT_STATUS_META[p.status]?.color}>
                        {PAYMENT_STATUS_META[p.status]?.label}
                      </Tag>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#64748B",
                          fontFamily: "monospace",
                        }}
                      >
                        {p.transaction_id || "—"}
                      </Text>
                    </Space>
                    <Text style={{ fontWeight: 600 }}>
                      {fmtMoney(p.amount)}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {order && (
        <UpdateStatusModal
          open={statusModalOpen}
          order={order}
          onClose={() => setStatusModalOpen(false)}
          onUpdated={handleUpdated}
        />
      )}
      {order && (
        <EditOrderModal
          open={editModalOpen}
          order={order}
          onClose={() => setEditModalOpen(false)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: undefined,
    payment_status: undefined,
    payment_method: undefined,
    date_from: undefined,
    date_to: undefined,
    ordering: "-created_at",
    page: 1,
    page_size: 10,
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.payment_status)
        params.payment_status = filters.payment_status;
      if (filters.payment_method)
        params.payment_method = filters.payment_method;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      params.ordering = filters.ordering;
      params.page = filters.page;
      params.page_size = filters.page_size;

      const { data } = await getOrders(params);
      const list = extractList(data);
      const count = extractCount(data, list);
      setOrders(list);
      setTotal(count);
    } catch {
      message.error("فشل تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useEffect(() => {
    getOrderStats()
      .then(({ data }) => setStats(data?.data ?? data ?? {}))
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    try {
      const { data } = await exportOrders({
        status: filters.status,
        date_from: filters.date_from,
        date_to: filters.date_to,
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "orders.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success("تم تصدير الطلبات ✅");
    } catch {
      message.error("فشل التصدير");
    }
  };

  const handleDeleteOrder = async (id) => {
    try {
      await deleteOrder(id);
      message.success("تم حذف الطلب بنجاح");
      fetchOrders();
    } catch (err) {
      message.error(err.response?.data?.message || "فشل حذف الطلب");
    }
  };

  const openEditFromTable = async (record) => {
    try {
      const { data } = await getOrder(record.id);
      setSelectedOrder(extractData(data));
      setEditModalOpen(true);
    } catch {
      message.error("فشل تحميل بيانات الطلب");
    }
  };

  const handleFilterChange = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val, page: 1 }));

  const resetFilters = () =>
    setFilters({
      search: "",
      status: undefined,
      payment_status: undefined,
      payment_method: undefined,
      date_from: undefined,
      date_to: undefined,
      ordering: "-created_at",
      page: 1,
      page_size: 10,
    });

  const openDrawer = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleTableChange = (pagination, _, sorter) =>
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      page_size: pagination.pageSize,
      ordering: sorter.order
        ? (sorter.order === "ascend" ? "" : "-") + sorter.field
        : "-created_at",
    }));

  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.payment_status,
    filters.payment_method,
    filters.date_from,
  ].filter(Boolean).length;

  const statCards = [
    {
      key: "pending",
      label: "قيد الانتظار",
      color: "#F59E0B",
      bg: "#FFFBEB",
      border: "#FDE68A",
    },
    {
      key: "confirmed",
      label: "مؤكد",
      color: "#3B82F6",
      bg: "#EFF6FF",
      border: "#BFDBFE",
    },
    {
      key: "shipped",
      label: "تم الشحن",
      color: "#06B6D4",
      bg: "#ECFEFF",
      border: "#A5F3FC",
    },
    {
      key: "delivered",
      label: "تم التسليم",
      color: "#10B981",
      bg: "#F0FDF4",
      border: "#BBF7D0",
    },
    {
      key: "cancelled",
      label: "ملغي",
      color: "#EF4444",
      bg: "#FEF2F2",
      border: "#FECACA",
    },
  ];

  const columns = [
    {
      title: "رقم الطلب",
      dataIndex: "order_number",
      width: 140,
      render: (v) => (
        <Text
          style={{
            fontFamily: "monospace",
            fontWeight: 700,
            color: "#6366F1",
            fontSize: 13,
          }}
        >
          {v}
        </Text>
      ),
    },
    {
      title: "العميل",
      dataIndex: "customer_name",
      width: 180,
      render: (name, r) => (
        <Space>
          <Avatar
            size={30}
            style={{ background: "#6366F1", fontSize: 12, flexShrink: 0 }}
          >
            {name?.[0]}
          </Avatar>
          <div style={{ lineHeight: 1.3 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, display: "block" }}>
              {name}
            </Text>
            <Text style={{ fontSize: 11, color: "#94A3B8" }}>
              {r.customer_email || "—"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "المنتجات",
      dataIndex: "items_count",
      width: 90,
      render: (v) => <Tag style={{ borderRadius: 6 }}>{v} منتج</Tag>,
    },
    {
      title: "الإجمالي",
      dataIndex: "total_price",
      sorter: true,
      width: 120,
      render: (v) => <Text style={{ fontWeight: 700 }}>{fmtMoney(v)}</Text>,
    },
    {
      title: "حالة الطلب",
      dataIndex: "status",
      width: 130,
      render: (v) => (
        <Tag color={STATUS_META[v]?.color} style={{ borderRadius: 6 }}>
          {STATUS_META[v]?.label}
        </Tag>
      ),
    },
    {
      title: "الدفع",
      dataIndex: "payment_status",
      width: 120,
      render: (v) => (
        <Tag color={PAYMENT_STATUS_META[v]?.color} style={{ borderRadius: 6 }}>
          {PAYMENT_STATUS_META[v]?.label}
        </Tag>
      ),
    },
    {
      title: "طريقة الدفع",
      dataIndex: "payment_method",
      width: 140,
      render: (v) => (
        <Text style={{ fontSize: 12 }}>{PAYMENT_METHOD_LABELS[v] || v}</Text>
      ),
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      sorter: true,
      width: 130,
      render: (v) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>{v}</Text>
      ),
    },
    {
      title: "",
      key: "actions",
      fixed: "left",
      width: 90,
      render: (_, r) => {
        const canEdit = !NON_EDITABLE_STATUSES.includes(r.status);
        return (
          <Space>
            <Tooltip title="عرض التفاصيل">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => openDrawer(r.id)}
                style={{ color: "#6366F1" }}
              />
            </Tooltip>
            {canEdit && (
              <Tooltip title="تعديل الأوردر">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditFromTable(r)}
                  style={{ color: "#10B981" }}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="حذف الطلب"
              description={`هل أنت متأكد من حذف الطلب #${r.order_number}؟`}
              onConfirm={() => handleDeleteOrder(r.id)}
              okText="حذف"
              cancelText="إلغاء"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="حذف الطلب">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{ color: "#EF4444" }}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ direction: "rtl" }}>
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
            الطلبات
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            متابعة وإدارة طلبات المتجر
          </Text>
        </div>
        <Button
          icon={<DownloadOutlined />}
          size="large"
          onClick={handleExport}
          style={{
            borderRadius: 10,
            fontWeight: 600,
            borderColor: "#6366F1",
            color: "#6366F1",
          }}
        >
          تصدير CSV
        </Button>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {statCards.map((s) => (
          <Col xs={12} sm={8} md={6} xl={4} key={s.key}>
            <Card
              onClick={() =>
                handleFilterChange(
                  "status",
                  filters.status === s.key ? undefined : s.key
                )
              }
              style={{
                borderRadius: 12,
                cursor: "pointer",
                border: `1px solid ${
                  filters.status === s.key ? s.color : s.border
                }`,
                background: filters.status === s.key ? s.bg : "#fff",
                transition: "all .2s",
                boxShadow:
                  filters.status === s.key ? `0 0 0 2px ${s.color}33` : "none",
              }}
              bodyStyle={{ padding: "14px 16px" }}
            >
              <Text
                style={{ color: "#94A3B8", fontSize: 12, display: "block" }}
              >
                {s.label}
              </Text>
              <Text style={{ fontSize: 24, fontWeight: 700, color: s.color }}>
                {stats[s.key] ?? "—"}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          marginBottom: 16,
        }}
        bodyStyle={{ padding: "14px 20px" }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={7}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              placeholder="رقم الطلب، اسم العميل، البريد..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="الحالة"
              value={filters.status}
              onChange={(v) => handleFilterChange("status", v)}
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(STATUS_META).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="حالة الدفع"
              value={filters.payment_status}
              onChange={(v) => handleFilterChange("payment_status", v)}
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(PAYMENT_STATUS_META).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="طريقة الدفع"
              value={filters.payment_method}
              onChange={(v) => handleFilterChange("payment_method", v)}
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              value={filters.ordering}
              onChange={(v) => handleFilterChange("ordering", v)}
              style={{ width: "100%" }}
            >
              <Option value="-created_at">الأحدث</Option>
              <Option value="created_at">الأقدم</Option>
              <Option value="-total_price">أعلى قيمة</Option>
              <Option value="total_price">أقل قيمة</Option>
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
          <FilterOutlined style={{ color: "#94A3B8" }} />
          <Text style={{ color: "#64748B", fontSize: 13 }}>
            {loading ? "جاري التحميل..." : `${total} طلب`}
          </Text>
        </div>
        <Table
          rowKey="id"
          dataSource={orders}
          columns={columns}
          loading={loading}
          scroll={{ x: 1100 }}
          onChange={handleTableChange}
          pagination={{
            current: filters.page,
            pageSize: filters.page_size,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50"],
            showTotal: (t) => `إجمالي ${t} طلب`,
            position: ["bottomCenter"],
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <ShoppingCartOutlined
                  style={{
                    fontSize: 48,
                    color: "#CBD5E1",
                    display: "block",
                    marginBottom: 12,
                  }}
                />
                <Text style={{ color: "#94A3B8" }}>لا توجد طلبات</Text>
              </div>
            ),
          }}
        />
      </Card>

      <OrderDrawer
        open={drawerOpen}
        orderId={selectedId}
        onClose={() => setDrawerOpen(false)}
        onStatusUpdate={fetchOrders}
      />

      {selectedOrder && (
        <EditOrderModal
          open={editModalOpen}
          order={selectedOrder}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedOrder(null);
          }}
          onUpdated={fetchOrders}
        />
      )}
    </div>
  );
}
