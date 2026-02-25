import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Avatar,
  Typography,
  Select,
  Spin,
  Badge,
  Progress,
  Empty,
  Space,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { getDashboardStats } from "../../api/dashboardApi";

const { Text, Title } = Typography;

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const fmtMoney = (n) => "$" + fmt(n);

const STATUS_COLORS = {
  pending: "orange",
  confirmed: "blue",
  shipped: "cyan",
  delivered: "green",
  cancelled: "red",
  refunded: "purple",
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, prefix, change, icon, color, loading }) {
  const up = change >= 0;
  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 16,
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
        position: "relative",
      }}
      bodyStyle={{ padding: 24 }}
    >
      {/* colored top stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          left: 0,
          height: 4,
          background: color,
          borderRadius: "16px 16px 0 0",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Text style={{ color: "#94A3B8", fontSize: 13, fontWeight: 500 }}>
            {title}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Statistic
              value={value}
              prefix={prefix}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: "#0F172A" }}
            />
          </div>
          {change !== undefined && (
            <Space style={{ marginTop: 8 }}>
              {up ? (
                <ArrowUpOutlined style={{ color: "#10B981", fontSize: 12 }} />
              ) : (
                <ArrowDownOutlined style={{ color: "#EF4444", fontSize: 12 }} />
              )}
              <Text
                style={{
                  color: up ? "#10B981" : "#EF4444",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {Math.abs(change)}%
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                مقارنة بالفترة السابقة
              </Text>
            </Space>
          )}
        </div>

        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: color + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {React.cloneElement(icon, { style: { fontSize: 22, color } })}
        </div>
      </div>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await getDashboardStats(period);
        if (data.success) setStats(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [period]);

  // ── Recent Orders columns ──────────────────────────────────────────────────

  const orderColumns = [
    {
      title: "رقم الطلب",
      dataIndex: "order_number",
      render: (v) => (
        <Text style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</Text>
      ),
    },
    {
      title: "العميل",
      dataIndex: "customer_name",
      render: (v) => (
        <Space>
          <Avatar size={28} style={{ background: "#6366F1", fontSize: 12 }}>
            {v?.[0]}
          </Avatar>
          <Text style={{ fontSize: 13 }}>{v}</Text>
        </Space>
      ),
    },
    {
      title: "الإجمالي",
      dataIndex: "total_price",
      render: (v) => <Text style={{ fontWeight: 600 }}>{fmtMoney(v)}</Text>,
    },
    {
      title: "الحالة",
      dataIndex: "status",
      render: (v) => (
        <Tag color={STATUS_COLORS[v]} style={{ borderRadius: 6 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: "تاريخ",
      dataIndex: "created_at",
      render: (v) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>{v}</Text>
      ),
    },
  ];

  // ── Top Products columns ───────────────────────────────────────────────────

  const productColumns = [
    {
      title: "المنتج",
      dataIndex: "name",
      render: (name, r) => (
        <Space>
          <Avatar
            shape="square"
            size={36}
            src={r.image}
            style={{ borderRadius: 8, background: "#E2E8F0" }}
          >
            {name?.[0]}
          </Avatar>
          <Text style={{ fontSize: 13, fontWeight: 500 }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: "المبيعات",
      dataIndex: "total_sold",
      render: (v) => <Tag color="blue">{v} وحدة</Tag>,
    },
    {
      title: "الإيراد",
      dataIndex: "total_revenue",
      render: (v) => (
        <Text style={{ fontWeight: 600, color: "#10B981" }}>{fmtMoney(v)}</Text>
      ),
    },
  ];

  // ── Chart data ─────────────────────────────────────────────────────────────

  const chartData = (stats?.sales_chart || []).map((p) => ({
    date: p.date,
    revenue: Number(p.revenue || 0),
    orders: p.orders,
  }));

  return (
    <div style={{ direction: "rtl" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
              نظرة عامة
            </Title>
            <Text style={{ color: "#94A3B8", fontSize: 13 }}>
              مرحباً! إليك ملخص أداء متجرك
            </Text>
          </div>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 160 }}
            options={[
              { value: 7, label: "آخر 7 أيام" },
              { value: 30, label: "آخر 30 يوم" },
              { value: 90, label: "آخر 90 يوم" },
            ]}
          />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            loading={loading}
            title="إجمالي الإيرادات"
            value={fmt(stats?.total_revenue)}
            prefix="$"
            change={stats?.revenue_change}
            icon={<DollarOutlined />}
            color="#6366F1"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            loading={loading}
            title="إجمالي الطلبات"
            value={stats?.total_orders}
            change={stats?.orders_change}
            icon={<ShoppingCartOutlined />}
            color="#10B981"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            loading={loading}
            title="العملاء الجدد"
            value={stats?.total_customers}
            change={stats?.customers_change}
            icon={<UserOutlined />}
            color="#F59E0B"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            loading={loading}
            title="المنتجات النشطة"
            value={stats?.total_products}
            icon={<InboxOutlined />}
            color="#8B5CF6"
          />
        </Col>
      </Row>

      {/* ── Alerts Row ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #FEF3C7",
              background: "#FFFBEB",
            }}
            bodyStyle={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ClockCircleOutlined style={{ color: "#F59E0B", fontSize: 22 }} />
            <div>
              <Text
                style={{ fontWeight: 600, color: "#92400E", display: "block" }}
              >
                {loading ? "..." : stats?.pending_orders} طلب في انتظار المعالجة
              </Text>
              <Text style={{ color: "#B45309", fontSize: 12 }}>
                تحتاج مراجعة
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #FEE2E2",
              background: "#FFF5F5",
            }}
            bodyStyle={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ExclamationCircleOutlined
              style={{ color: "#EF4444", fontSize: 22 }}
            />
            <div>
              <Text
                style={{ fontWeight: 600, color: "#991B1B", display: "block" }}
              >
                {loading ? "..." : stats?.low_stock_count} منتج مخزونه منخفض
              </Text>
              <Text style={{ color: "#B91C1C", fontSize: 12 }}>
                يحتاج إعادة تخزين
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Charts Row ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Area chart */}
        <Col xs={24} xl={16}>
          <Card
            title={
              <Text style={{ fontWeight: 700, color: "#0F172A" }}>
                المبيعات عبر الوقت
              </Text>
            }
            style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
            extra={<Badge color="#6366F1" text="الإيرادات" />}
          >
            {loading ? (
              <div
                style={{
                  height: 280,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin size="large" />
              </div>
            ) : chartData.length === 0 ? (
              <Empty
                description="لا توجد بيانات"
                style={{
                  height: 280,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#6366F1"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                    formatter={(v) => ["$" + fmt(v), "إيراد"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    fill="url(#colorRevenue)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Bar chart – orders */}
        <Col xs={24} xl={8}>
          <Card
            title={
              <Text style={{ fontWeight: 700, color: "#0F172A" }}>
                الطلبات اليومية
              </Text>
            }
            style={{
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              height: "100%",
            }}
          >
            {loading ? (
              <div
                style={{
                  height: 280,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin />
              </div>
            ) : chartData.length === 0 ? (
              <Empty description="لا توجد بيانات" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={chartData.slice(-14)}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                    formatter={(v) => [v, "طلب"]}
                  />
                  <Bar dataKey="orders" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Tables Row ── */}
      <Row gutter={[16, 16]}>
        {/* Recent Orders */}
        <Col xs={24} xl={14}>
          <Card
            title={
              <Text style={{ fontWeight: 700, color: "#0F172A" }}>
                آخر الطلبات
              </Text>
            }
            style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
            extra={
              <a href="/orders" style={{ color: "#6366F1", fontSize: 13 }}>
                عرض الكل
              </a>
            }
          >
            <Table
              loading={loading}
              dataSource={stats?.recent_orders || []}
              columns={orderColumns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: <Empty description="لا توجد طلبات" /> }}
            />
          </Card>
        </Col>

        {/* Top Products */}
        <Col xs={24} xl={10}>
          <Card
            title={
              <Text style={{ fontWeight: 700, color: "#0F172A" }}>
                أفضل المنتجات
              </Text>
            }
            style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
            extra={
              <a href="/products" style={{ color: "#6366F1", fontSize: 13 }}>
                عرض الكل
              </a>
            }
          >
            <Table
              loading={loading}
              dataSource={stats?.top_products || []}
              columns={productColumns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: <Empty description="لا توجد منتجات" /> }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
