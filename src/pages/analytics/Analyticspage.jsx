import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Select,
  Typography,
  Spin,
  Empty,
  Statistic,
  Space,
  Tag,
} from "antd";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  RiseOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { getAnalytics } from "../../api/analyticsApi";

const { Text, Title } = Typography;
const { Option } = Select;

const COLORS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
];

const fmtMoney = (v) =>
  "$" + Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

// ── Custom Pie Label ──────────────────────────────────────────────────────────

const PieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Section Card ─────────────────────────────────────────────────────────────

const ChartCard = ({ title, subtitle, children, loading, style }) => (
  <Card
    style={{ borderRadius: 16, border: "1px solid #E2E8F0", ...style }}
    bodyStyle={{ padding: 20 }}
  >
    <div style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: 700, color: "#0F172A", fontSize: 15 }}>
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            color: "#94A3B8",
            fontSize: 12,
            display: "block",
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      )}
    </div>
    {loading ? (
      <div
        style={{
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin />
      </div>
    ) : (
      children
    )}
  </Card>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [group, setGroup] = useState("day");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: res } = await getAnalytics({ period, group });
        if (res.success) setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [period, group]);

  // ── Formatted data ────────────────────────────────────────────────────────

  const salesData = (data?.sales_over_time || []).map((p) => ({
    period: p.period,
    revenue: Number(p.revenue || 0),
    orders: p.orders,
  }));

  const categoryData = (data?.revenue_by_category || []).map((c, i) => ({
    name: c["product__category__name"] || "غير محدد",
    revenue: Number(c.revenue || 0),
    fill: COLORS[i % COLORS.length],
  }));

  const paymentData = (data?.by_payment_method || []).map((p, i) => ({
    name:
      p.payment_method === "stripe"
        ? "Stripe"
        : p.payment_method === "paypal"
        ? "PayPal"
        : "الدفع عند الاستلام",
    value: p.count,
    total: Number(p.total || 0),
    fill: COLORS[i % COLORS.length],
  }));

  const statusData = (data?.by_status || []).map((s, i) => {
    const labels = {
      pending: "قيد الانتظار",
      confirmed: "مؤكد",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغي",
      refunded: "مسترجع",
    };
    return {
      name: labels[s.status] || s.status,
      value: s.count,
      fill: COLORS[i % COLORS.length],
    };
  });

  const kpiCards = [
    {
      label: "متوسط قيمة الطلب",
      value: fmtMoney(data?.avg_order_value),
      icon: <ShoppingCartOutlined />,
      color: "#6366F1",
    },
    {
      label: "إجمالي الإيراد",
      value: fmtMoney(salesData.reduce((a, b) => a + b.revenue, 0)),
      icon: <DollarOutlined />,
      color: "#10B981",
    },
    {
      label: "إجمالي الطلبات",
      value: salesData.reduce((a, b) => a + b.orders, 0),
      icon: <RiseOutlined />,
      color: "#F59E0B",
    },
    {
      label: "الفئات المباعة",
      value: categoryData.length,
      icon: <PieChartOutlined />,
      color: "#8B5CF6",
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
            التحليلات
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            تقارير وإحصاءات تفصيلية للمتجر
          </Text>
        </div>
        <Space>
          <Select value={group} onChange={setGroup} style={{ width: 120 }}>
            <Option value="day">يومي</Option>
            <Option value="month">شهري</Option>
          </Select>
          <Select value={period} onChange={setPeriod} style={{ width: 140 }}>
            <Option value={7}>آخر 7 أيام</Option>
            <Option value={30}>آخر 30 يوم</Option>
            <Option value={90}>آخر 90 يوم</Option>
            <Option value={365}>آخر سنة</Option>
          </Select>
        </Space>
      </div>

      {/* ── KPI Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {kpiCards.map((card) => (
          <Col xs={12} md={6} key={card.label}>
            <Card
              loading={loading}
              style={{
                borderRadius: 16,
                border: "1px solid #E2E8F0",
                overflow: "hidden",
                position: "relative",
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  left: 0,
                  height: 3,
                  background: card.color,
                }}
              />
              <Space>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: card.color + "18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {React.cloneElement(card.icon, {
                    style: { color: card.color, fontSize: 18 },
                  })}
                </div>
                <div>
                  <Text
                    style={{ color: "#94A3B8", fontSize: 12, display: "block" }}
                  >
                    {card.label}
                  </Text>
                  <Text
                    style={{ fontWeight: 800, fontSize: 20, color: "#0F172A" }}
                  >
                    {card.value}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Sales Over Time ── */}
      <ChartCard
        title="المبيعات عبر الوقت"
        subtitle="الإيرادات والطلبات لكل فترة"
        loading={loading}
        style={{ marginBottom: 16 }}
      >
        {salesData.length === 0 ? (
          <Empty description="لا توجد بيانات" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={salesData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                }}
                formatter={(v, name) => [
                  name === "revenue" ? fmtMoney(v) : v,
                  name === "revenue" ? "الإيراد" : "الطلبات",
                ]}
              />
              <Legend
                formatter={(v) => (v === "revenue" ? "الإيراد" : "الطلبات")}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#6366F1"
                strokeWidth={2.5}
                fill="url(#gRevenue)"
                dot={false}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#gOrders)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Category + Payment Row ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* Revenue by Category */}
        <Col xs={24} lg={14}>
          <ChartCard
            title="الإيراد حسب الفئة"
            subtitle="أفضل 10 فئات من حيث الإيراد"
            loading={loading}
          >
            {categoryData.length === 0 ? (
              <Empty description="لا توجد بيانات" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F1F5F9"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickFormatter={fmtMoney}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#475569" }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                    formatter={(v) => [fmtMoney(v), "الإيراد"]}
                  />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Col>

        {/* Payment Method Distribution */}
        <Col xs={24} lg={10}>
          <ChartCard
            title="توزيع طرق الدفع"
            subtitle="عدد الطلبات لكل طريقة"
            loading={loading}
          >
            {paymentData.length === 0 ? (
              <Empty description="لا توجد بيانات" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      labelLine={false}
                      label={PieLabel}
                    >
                      {paymentData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #E2E8F0",
                        fontSize: 12,
                      }}
                      formatter={(v, _, props) => [
                        v + " طلب",
                        props.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {paymentData.map((item) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "#F8FAFC",
                      }}
                    >
                      <Space size={6}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: item.fill,
                          }}
                        />
                        <Text style={{ fontSize: 12, color: "#475569" }}>
                          {item.name}
                        </Text>
                      </Space>
                      <Space size={8}>
                        <Tag style={{ borderRadius: 6, fontSize: 11 }}>
                          {item.value} طلب
                        </Tag>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#10B981",
                          }}
                        >
                          {fmtMoney(item.total)}
                        </Text>
                      </Space>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>
        </Col>
      </Row>

      {/* ── Order Status Distribution ── */}
      <ChartCard
        title="توزيع حالات الطلبات"
        subtitle="عدد الطلبات لكل حالة"
        loading={loading}
      >
        {statusData.length === 0 ? (
          <Empty description="لا توجد بيانات" />
        ) : (
          <Row gutter={[12, 12]}>
            {statusData.map((item) => (
              <Col xs={12} sm={8} md={4} key={item.name}>
                <div
                  style={{
                    padding: "16px 12px",
                    borderRadius: 12,
                    textAlign: "center",
                    background: item.fill + "12",
                    border: `1px solid ${item.fill}33`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: item.fill,
                      display: "block",
                    }}
                  >
                    {item.value}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748B" }}>
                    {item.name}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </ChartCard>
    </div>
  );
}
