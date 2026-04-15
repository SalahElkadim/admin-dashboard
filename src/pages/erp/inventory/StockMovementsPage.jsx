import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Select,
  Space,
  Typography,
  Row,
  Col,
  message,
  Empty,
  Tag,
  DatePicker,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { getStockMovements, getWarehouses } from "../../../api/erpApi";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// ── Movement Type Config ──────────────────────────────────────
const TYPE_CONFIG = {
  in: {
    label: "دخول",
    color: "#10B981",
    bg: "#F0FDF4",
    icon: <ArrowUpOutlined />,
    sign: "+",
  },
  out: {
    label: "خروج",
    color: "#EF4444",
    bg: "#FEF2F2",
    icon: <ArrowDownOutlined />,
    sign: "-",
  },
  return: {
    label: "مرتجع",
    color: "#F59E0B",
    bg: "#FFFBEB",
    icon: <SwapOutlined />,
    sign: "+",
  },
  adjust: {
    label: "تعديل يدوي",
    color: "#6366F1",
    bg: "#EEF2FF",
    icon: <FilterOutlined />,
    sign: "±",
  },
  transfer: {
    label: "تحويل مستودع",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    icon: <SwapOutlined />,
    sign: "↔",
  },
  damage: {
    label: "تالف / فاقد",
    color: "#94A3B8",
    bg: "#F8FAFC",
    icon: <ArrowDownOutlined />,
    sign: "-",
  },
};

const MovementTypeTag = ({ type }) => {
  const cfg = TYPE_CONFIG[type] || {
    label: type,
    color: "#94A3B8",
    bg: "#F8FAFC",
    icon: null,
  };
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
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ── Main Page ─────────────────────────────────────────────────
export default function StockMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filters
  const [filterWarehouse, setFilterWarehouse] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (filterWarehouse) params.warehouse = filterWarehouse;
      if (filterType) params.type = filterType;
      const res = await getStockMovements(params);
      const data = res.data;
      setMovements(
        data?.results ?? data?.data?.results ?? data?.data ?? data ?? []
      );
      setTotal(data?.count ?? data?.data?.count ?? 0);
    } catch {
      message.error("فشل في تحميل الحركات");
    } finally {
      setLoading(false);
    }
  }, [page, filterWarehouse, filterType]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await getWarehouses();
      const data = res.data;
      setWarehouses(data?.results ?? data?.data ?? data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMovements();
    fetchWarehouses();
  }, [fetchMovements, fetchWarehouses]);

  // Summary stats من البيانات المحملة
  const totalIn = movements
    .filter((m) => m.quantity > 0)
    .reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements
    .filter((m) => m.quantity < 0)
    .reduce((s, m) => s + Math.abs(m.quantity), 0);

  const columns = [
    {
      title: "النوع",
      dataIndex: "type",
      width: 150,
      render: (val) => <MovementTypeTag type={val} />,
    },
    {
      title: "المنتج",
      dataIndex: "variant",
      render: (val, row) => (
        <div>
          <Text style={{ fontWeight: 600, fontSize: 13, display: "block" }}>
            {row.variant_name || `Variant #${val}`}
          </Text>
          <Text style={{ color: "#94A3B8", fontSize: 11 }}>
            {row.reason || "—"}
          </Text>
        </div>
      ),
    },
    {
      title: "المستودع",
      dataIndex: "warehouse",
      width: 140,
      render: (val, row) => (
        <Tag
          style={{
            background: "#F1F5F9",
            color: "#475569",
            border: "none",
            borderRadius: 6,
          }}
        >
          {row.warehouse_name || `#${val}`}
        </Tag>
      ),
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      width: 100,
      render: (val) => {
        const cfg = val > 0 ? TYPE_CONFIG.in : TYPE_CONFIG.out;
        return (
          <Text style={{ fontWeight: 800, fontSize: 16, color: cfg.color }}>
            {val > 0 ? "+" : ""}
            {val}
          </Text>
        );
      },
    },
    {
      title: "قبل",
      dataIndex: "stock_before",
      width: 80,
      render: (val) => (
        <Text style={{ color: "#94A3B8", fontSize: 13 }}>{val}</Text>
      ),
    },
    {
      title: "بعد",
      dataIndex: "stock_after",
      width: 80,
      render: (val) => (
        <Text style={{ fontWeight: 600, fontSize: 13 }}>{val}</Text>
      ),
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      width: 130,
      render: (val) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          {val
            ? new Date(val).toLocaleString("ar-EG", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "—"}
        </Text>
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
            حركات المخزون
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            سجل كامل لكل حركات الدخول والخروج
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchMovements}
          style={{ borderRadius: 8 }}
        />
      </div>

      {/* Mini Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          {
            label: "إجمالي الدخول  (الصفحة الحالية)",
            value: `+${totalIn}`,
            color: "#10B981",
          },
          {
            label: "إجمالي الخروج (الصفحة الحالية)",
            value: `-${totalOut}`,
            color: "#EF4444",
          },
          {
            label: "صافي الحركة",
            value:
              totalIn - totalOut > 0
                ? `+${totalIn - totalOut}`
                : totalIn - totalOut,
            color: "#6366F1",
          },
        ].map((c) => (
          <Col xs={24} sm={8} key={c.label}>
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "16px 20px",
                border: "1px solid #E2E8F0",
                borderTop: `3px solid ${c.color}`,
              }}
            >
              <Text
                style={{ fontSize: 11, color: "#94A3B8", display: "block" }}
              >
                {c.label}
              </Text>
              <Text style={{ fontSize: 24, fontWeight: 800, color: c.color }}>
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
        <Select
          placeholder="نوع الحركة"
          allowClear
          style={{ width: 160 }}
          value={filterType}
          onChange={(v) => {
            setFilterType(v);
            setPage(1);
          }}
        >
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <Option key={k} value={k}>
              {v.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="المستودع"
          allowClear
          style={{ width: 160 }}
          value={filterWarehouse}
          onChange={(v) => {
            setFilterWarehouse(v);
            setPage(1);
          }}
        >
          {warehouses.map((w) => (
            <Option key={w.id} value={w.id}>
              {w.name}
            </Option>
          ))}
        </Select>
        {(filterType || filterWarehouse) && (
          <Button
            type="link"
            style={{ color: "#EF4444", padding: 0 }}
            onClick={() => {
              setFilterType(null);
              setFilterWarehouse(null);
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
          dataSource={movements}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
            showTotal: (t) => `${t} حركة`,
            style: { padding: "12px 20px", direction: "rtl" },
          }}
          rowClassName={(row) =>
            row.quantity > 0 ? "movement-in" : "movement-out"
          }
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: "#94A3B8" }}>لا توجد حركات مخزون</Text>
                }
              />
            ),
          }}
        />
      </div>

      <style>{`
        .movement-in  { border-right: 3px solid #10B98140 !important; }
        .movement-out { border-right: 3px solid #EF444440 !important; }
      `}</style>
    </div>
  );
}
