import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  message,
  DatePicker,
  Tag,
  Space,
  Empty,
} from "antd";
import {
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  FilterOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import { getFinancialSummaries } from "../../../api/erpApi";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Custom Tooltip for recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 10,
          padding: "10px 14px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          direction: "rtl",
        }}
      >
        <Text strong style={{ fontSize: 12 }}>
          {label}
        </Text>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontSize: 12, marginTop: 4 }}>
            {p.name}: {parseFloat(p.value).toLocaleString("ar-EG")} ج.م
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialSummaryPage() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD"),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getFinancialSummaries(filters);
      setSummaries(res.data);
    } catch {
      message.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Aggregate stats
  const totalRevenue = summaries.reduce(
    (s, d) => s + parseFloat(d.total_revenue),
    0
  );
  const totalExpenses = summaries.reduce(
    (s, d) => s + parseFloat(d.total_expenses),
    0
  );
  const netProfit = summaries.reduce((s, d) => s + parseFloat(d.net_profit), 0);
  const totalOrders = summaries.reduce((s, d) => s + d.orders_count, 0);
  const totalReturned = summaries.reduce(
    (s, d) => s + parseFloat(d.returned_amount),
    0
  );
  const profitMargin =
    totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Chart data — sorted by date
  const chartData = [...summaries]
    .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
    .map((d) => ({
      date: dayjs(d.date).format("DD/MM"),
      إيرادات: parseFloat(d.total_revenue),
      مصروفات: parseFloat(d.total_expenses),
      صافي: parseFloat(d.net_profit),
    }));

  const columns = [
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (v) => (
        <Text style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>
          {dayjs(v).format("DD MMM YYYY")}
        </Text>
      ),
    },
    {
      title: "الإيرادات",
      dataIndex: "total_revenue",
      key: "total_revenue",
      sorter: (a, b) =>
        parseFloat(a.total_revenue) - parseFloat(b.total_revenue),
      render: (v) => (
        <Text strong style={{ color: "#10B981" }}>
          {parseFloat(v).toLocaleString("ar-EG")} ج.م
        </Text>
      ),
    },
    {
      title: "المصروفات",
      dataIndex: "total_expenses",
      key: "total_expenses",
      sorter: (a, b) =>
        parseFloat(a.total_expenses) - parseFloat(b.total_expenses),
      render: (v) => (
        <Text strong style={{ color: "#EF4444" }}>
          {parseFloat(v).toLocaleString("ar-EG")} ج.م
        </Text>
      ),
    },
    {
      title: "صافي الربح",
      dataIndex: "net_profit",
      key: "net_profit",
      sorter: (a, b) => parseFloat(a.net_profit) - parseFloat(b.net_profit),
      render: (v) => {
        const val = parseFloat(v);
        return (
          <Space>
            {val >= 0 ? (
              <RiseOutlined style={{ color: "#10B981" }} />
            ) : (
              <FallOutlined style={{ color: "#EF4444" }} />
            )}
            <Text strong style={{ color: val >= 0 ? "#10B981" : "#EF4444" }}>
              {val.toLocaleString("ar-EG")} ج.م
            </Text>
          </Space>
        );
      },
    },
    {
      title: "الأوردرات",
      dataIndex: "orders_count",
      key: "orders_count",
      render: (v) => (
        <Tag color="blue" style={{ borderRadius: 8 }}>
          {v} أوردر
        </Tag>
      ),
    },
    {
      title: "المرتجعات",
      dataIndex: "returned_amount",
      key: "returned_amount",
      render: (v) =>
        parseFloat(v) > 0 ? (
          <Text style={{ color: "#F59E0B" }}>
            {parseFloat(v).toLocaleString("ar-EG")} ج.م
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
            📊 الملخص المالي
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            نظرة شاملة على الأداء المالي اليومي
          </Text>
        </div>
        <Space>
          <RangePicker
            defaultValue={[dayjs().subtract(30, "day"), dayjs()]}
            style={{ borderRadius: 8 }}
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  from: dates[0].format("YYYY-MM-DD"),
                  to: dates[1].format("YYYY-MM-DD"),
                });
              }
            }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            style={{ borderRadius: 8 }}
          >
            تحديث
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            title: "إجمالي الإيرادات",
            value: totalRevenue,
            color: "#10B981",
            icon: <RiseOutlined />,
            prefix: "ج.م",
          },
          {
            title: "إجمالي المصروفات",
            value: totalExpenses,
            color: "#EF4444",
            icon: <FallOutlined />,
            prefix: "ج.م",
          },
          {
            title: "صافي الربح",
            value: netProfit,
            color: netProfit >= 0 ? "#3B82F6" : "#EF4444",
            icon: <DollarOutlined />,
            prefix: "ج.م",
          },
          {
            title: "هامش الربح",
            value: profitMargin,
            color: "#F59E0B",
            icon: <TrophyOutlined />,
            suffix: "%",
          },
          {
            title: "عدد الأوردرات",
            value: totalOrders,
            color: "#8B5CF6",
            icon: <ShoppingCartOutlined />,
          },
          {
            title: "المرتجعات",
            value: totalReturned,
            color: "#F97316",
            icon: <FallOutlined />,
            prefix: "ج.م",
          },
        ].map((s, i) => (
          <Col xs={24} sm={12} lg={4} key={i}>
            <Card
              style={{
                borderRadius: 16,
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
              bodyStyle={{ padding: "14px 16px" }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: s.color + "18",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: s.color,
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                {s.icon}
              </div>
              <Statistic
                title={
                  <Text style={{ fontSize: 11, color: "#64748B" }}>
                    {s.title}
                  </Text>
                }
                value={s.value}
                prefix={s.prefix}
                suffix={s.suffix}
                valueStyle={{ color: s.color, fontSize: 18, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      {chartData.length > 0 ? (
        <>
          {/* Area Chart — Revenue vs Expenses */}
          <Card
            title={<Text strong>الإيرادات مقابل المصروفات</Text>}
            style={{
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              marginBottom: 20,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorExpenses"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Area
                  type="monotone"
                  dataKey="إيرادات"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="مصروفات"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#colorExpenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Bar Chart — Net Profit */}
          <Card
            title={<Text strong>صافي الربح اليومي</Text>}
            style={{
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              marginBottom: 20,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="صافي"
                  radius={[4, 4, 0, 0]}
                  fill="#3B82F6"
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      ) : (
        !loading && (
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              marginBottom: 20,
            }}
          >
            <Empty description="لا توجد بيانات للفترة المحددة" />
          </Card>
        )
      )}

      {/* Detail Table */}
      <Card
        title={<Text strong>تفاصيل يومية</Text>}
        style={{
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={summaries}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{ emptyText: "لا توجد بيانات" }}
          style={{ direction: "rtl" }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row
                style={{ background: "#F8FAFC", fontWeight: 700 }}
              >
                <Table.Summary.Cell index={0}>
                  <Text strong>الإجمالي</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong style={{ color: "#10B981" }}>
                    {totalRevenue.toLocaleString("ar-EG")} ج.م
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Text strong style={{ color: "#EF4444" }}>
                    {totalExpenses.toLocaleString("ar-EG")} ج.م
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <Text
                    strong
                    style={{ color: netProfit >= 0 ? "#3B82F6" : "#EF4444" }}
                  >
                    {netProfit.toLocaleString("ar-EG")} ج.م
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <Tag color="blue">{totalOrders} أوردر</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Text style={{ color: "#F59E0B" }}>
                    {totalReturned.toLocaleString("ar-EG")} ج.م
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
}
