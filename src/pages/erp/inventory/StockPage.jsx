import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  Row,
  Col,
  message,
  Tooltip,
  Empty,
  Tag,
  Progress,
  Badge,
} from "antd";
import {
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { getStock, adjustStock, getWarehouses } from "../../../api/erpApi";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ── Stock Level Badge ─────────────────────────────────────────
const StockBadge = ({ quantity, threshold = 5 }) => {
  if (quantity === 0)
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          color: "#EF4444",
          background: "#FEF2F2",
          border: "1px solid #EF444430",
        }}
      >
        <CloseCircleOutlined /> نفد
      </span>
    );
  if (quantity <= threshold)
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          color: "#F59E0B",
          background: "#FFFBEB",
          border: "1px solid #F59E0B30",
        }}
      >
        <WarningOutlined /> منخفض
      </span>
    );
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        color: "#10B981",
        background: "#F0FDF4",
        border: "1px solid #10B98130",
      }}
    >
      <CheckCircleOutlined /> متوفر
    </span>
  );
};

// ── Adjust Stock Modal ────────────────────────────────────────
function AdjustStockModal({ open, onClose, onSuccess, stockItem }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && stockItem) {
      form.setFieldsValue({ quantity: stockItem.quantity, reason: "" });
    }
  }, [open, stockItem]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await adjustStock(stockItem.id, values);
      message.success("تم تحديث المخزون");
      onSuccess();
      onClose();
    } catch (err) {
      if (err?.response?.data) message.error("فشل في التحديث");
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
          <EditOutlined style={{ color: "#10B981" }} />
          <Text style={{ fontWeight: 700 }}>تعديل المخزون يدوياً</Text>
        </Space>
      }
      width={420}
      style={{ direction: "rtl" }}
      footer={
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onClose}>إلغاء</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            style={{ background: "#10B981", borderColor: "#10B981" }}
          >
            تحديث
          </Button>
        </Space>
      }
    >
      {stockItem && (
        <div
          style={{
            background: "#F8FAFC",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            border: "1px solid #E2E8F0",
          }}
        >
          <Text style={{ fontWeight: 700, display: "block" }}>
            {stockItem.variant_name || "—"}
          </Text>
          <Text style={{ color: "#94A3B8", fontSize: 12 }}>
            {stockItem.warehouse_name} · الكمية الحالية:{" "}
            <strong>{stockItem.quantity}</strong>
          </Text>
        </div>
      )}
      <Form form={form} layout="vertical">
        <Form.Item
          name="quantity"
          label="الكمية الجديدة"
          rules={[{ required: true, message: "أدخل الكمية" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} size="large" />
        </Form.Item>
        <Form.Item name="reason" label="سبب التعديل">
          <TextArea rows={2} placeholder="جرد يدوي / تصحيح خطأ..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function StockPage() {
  const [stock, setStock] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState(null);
  const [filterLevel, setFilterLevel] = useState(null); // all / low / out
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterWarehouse) params.warehouse = filterWarehouse;
      const res = await getStock(params);
      const data = res.data;
      setStock(data?.results ?? data?.data ?? data ?? []);
    } catch {
      message.error("فشل في تحميل المخزون");
    } finally {
      setLoading(false);
    }
  }, [filterWarehouse]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await getWarehouses();
      const data = res.data;
      setWarehouses(data?.results ?? data?.data ?? data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStock();
    fetchWarehouses();
  }, [fetchStock, fetchWarehouses]);

  // Client-side filter للبحث والمستوى
  const filtered = stock.filter((s) => {
    const name = (s.variant_name || "").toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (filterLevel === "out") return s.quantity === 0;
    if (filterLevel === "low") return s.quantity > 0 && s.quantity <= 5;
    return true;
  });

  // Stats
  const totalItems = stock.length;
  const outOfStock = stock.filter((s) => s.quantity === 0).length;
  const lowStock = stock.filter(
    (s) => s.quantity > 0 && s.quantity <= 5
  ).length;
  const totalUnits = stock.reduce((s, i) => s + Number(i.quantity || 0), 0);

  const columns = [
    {
      title: "المنتج / المتغير",
      dataIndex: "variant_name",
      render: (val, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            📦
          </div>
          <div>
            <Text style={{ fontWeight: 600, fontSize: 13, display: "block" }}>
              {val || "—"}
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>
              ID: {row.variant}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "المستودع",
      dataIndex: "warehouse_name",
      width: 150,
      render: (val) => (
        <Tag
          style={{
            background: "#F1F5F9",
            color: "#475569",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
          }}
        >
          {val || "—"}
        </Tag>
      ),
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      width: 180,
      sorter: (a, b) => a.quantity - b.quantity,
      render: (val) => {
        const max = 100;
        const pct = Math.min((val / max) * 100, 100);
        const color = val === 0 ? "#EF4444" : val <= 5 ? "#F59E0B" : "#10B981";
        return (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>
                {val}
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 11 }}>وحدة</Text>
            </div>
            <Progress
              percent={pct}
              showInfo={false}
              size="small"
              strokeColor={color}
              trailColor="#F1F5F9"
            />
          </div>
        );
      },
    },
    {
      title: "الحالة",
      dataIndex: "quantity",
      width: 110,
      render: (val) => <StockBadge quantity={val} />,
    },
    {
      title: "",
      key: "actions",
      width: 70,
      render: (_, row) => (
        <Tooltip title="تعديل الكمية">
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            style={{ color: "#6366F1" }}
            onClick={() => {
              setSelectedItem(row);
              setModalOpen(true);
            }}
          />
        </Tooltip>
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
            المخزون
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            الكميات الفعلية في كل مستودع
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchStock}
          style={{ borderRadius: 8 }}
        />
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { label: "إجمالي الأصناف", value: totalItems, color: "#6366F1" },
          { label: "إجمالي الوحدات", value: totalUnits, color: "#10B981" },
          { label: "نفد من المخزون", value: outOfStock, color: "#EF4444" },
          { label: "مخزون منخفض", value: lowStock, color: "#F59E0B" },
        ].map((c) => (
          <Col xs={12} sm={6} key={c.label}>
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "18px 20px",
                border: `1px solid ${c.color}20`,
                borderTop: `3px solid ${c.color}`,
              }}
            >
              <Text
                style={{ fontSize: 11, color: "#94A3B8", display: "block" }}
              >
                {c.label}
              </Text>
              <Text style={{ fontSize: 26, fontWeight: 800, color: c.color }}>
                {c.value}
              </Text>
            </div>
          </Col>
        ))}
      </Row>

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
          placeholder="بحث بالمنتج..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240, borderRadius: 8 }}
          allowClear
        />
        <Select
          placeholder="المستودع"
          allowClear
          style={{ width: 160 }}
          value={filterWarehouse}
          onChange={(v) => setFilterWarehouse(v)}
        >
          {warehouses.map((w) => (
            <Option key={w.id} value={w.id}>
              {w.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="مستوى المخزون"
          allowClear
          style={{ width: 160 }}
          value={filterLevel}
          onChange={(v) => setFilterLevel(v)}
        >
          <Option value="out">نفد فقط</Option>
          <Option value="low">منخفض فقط</Option>
        </Select>
        {(search || filterWarehouse || filterLevel) && (
          <Button
            type="link"
            style={{ color: "#EF4444", padding: 0 }}
            onClick={() => {
              setSearch("");
              setFilterWarehouse(null);
              setFilterLevel(null);
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
          scroll={{ x: 700 }}
          pagination={{
            pageSize: 20,
            showTotal: (t) => `${t} صنف`,
            style: { padding: "12px 20px", direction: "rtl" },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: "#94A3B8" }}>لا توجد بيانات مخزون</Text>
                }
              />
            ),
          }}
        />
      </div>

      <AdjustStockModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={fetchStock}
        stockItem={selectedItem}
      />
    </div>
  );
}
