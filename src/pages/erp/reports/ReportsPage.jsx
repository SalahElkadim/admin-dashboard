/**
 * ============================================================
 *  ERP — ReportsPage.jsx
 *  /erp/reports
 * ============================================================
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  message,
  Popconfirm,
  Empty,
  Spin,
  Badge,
} from "antd";
import {
  BarChartOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getReports, createReport, deleteReport } from "../../../api/erpApi";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// ── Report Types ──────────────────────────────────────────────
const REPORT_TYPES = [
  {
    value: "sales_daily",
    label: "المبيعات اليومية",
    color: "blue",
    icon: "📅",
  },
  {
    value: "sales_monthly",
    label: "المبيعات الشهرية",
    color: "cyan",
    icon: "📆",
  },
  {
    value: "sales_by_source",
    label: "المبيعات حسب القناة",
    color: "purple",
    icon: "📊",
  },
  { value: "top_products", label: "أفضل المنتجات", color: "gold", icon: "🏆" },
  { value: "inventory", label: "حالة المخزون", color: "green", icon: "📦" },
  {
    value: "finance_monthly",
    label: "المالية الشهرية",
    color: "lime",
    icon: "💰",
  },
  {
    value: "customer_value",
    label: "قيمة العملاء (LTV)",
    color: "orange",
    icon: "👥",
  },
  { value: "staff_perf", label: "أداء الموظفين", color: "volcano", icon: "👤" },
  {
    value: "return_analysis",
    label: "تحليل المرتجعات",
    color: "red",
    icon: "↩️",
  },
];

const typeMap = Object.fromEntries(REPORT_TYPES.map((t) => [t.value, t]));

// ── Data Preview Modal ────────────────────────────────────────
function DataPreviewModal({ report, open, onClose }) {
  if (!report) return null;
  const data = report.data || {};
  const keys = Object.keys(data);
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <Space>
          <BarChartOutlined style={{ color: "#10B981" }} />
          <span>بيانات التقرير — {typeMap[report.report_type]?.label}</span>
        </Space>
      }
      width={640}
    >
      {keys.length === 0 ? (
        <Empty description="لا توجد بيانات" />
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {keys.map((k) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <Text style={{ color: "#64748B", fontWeight: 500 }}>{k}</Text>
              <Text strong style={{ color: "#0F172A" }}>
                {typeof data[k] === "object"
                  ? JSON.stringify(data[k])
                  : String(data[k])}
              </Text>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ── Create Report Modal ───────────────────────────────────────
function CreateReportModal({ open, onClose, onCreated }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const [start, end] = values.period;
      await createReport({
        report_type: values.report_type,
        period_start: start.format("YYYY-MM-DD"),
        period_end: end.format("YYYY-MM-DD"),
        data: {},
      });
      message.success("تم إنشاء التقرير بنجاح");
      form.resetFields();
      onClose();
      onCreated();
    } catch (err) {
      if (err?.response?.data) {
        message.error("خطأ في البيانات");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="إنشاء التقرير"
      cancelText="إلغاء"
      confirmLoading={loading}
      title={
        <Space>
          <PlusOutlined style={{ color: "#10B981" }} />
          <span>إنشاء تقرير جديد</span>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="report_type"
          label="نوع التقرير"
          rules={[{ required: true, message: "اختر نوع التقرير" }]}
        >
          <Select placeholder="اختر نوع التقرير" size="large">
            {REPORT_TYPES.map((t) => (
              <Option key={t.value} value={t.value}>
                <Space>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="period"
          label="الفترة الزمنية"
          rules={[{ required: true, message: "حدد الفترة" }]}
        >
          <RangePicker style={{ width: "100%" }} size="large" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [filterType, setFilterType] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      const res = await getReports(params);
      setReports(res.data);
    } catch {
      message.error("فشل تحميل التقارير");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDelete = async (id) => {
    try {
      await deleteReport(id);
      message.success("تم حذف التقرير");
      fetchReports();
    } catch {
      message.error("فشل الحذف");
    }
  };

  // ── Stats ──
  const totalReports = reports.length;
  const typeCounts = REPORT_TYPES.map((t) => ({
    ...t,
    count: reports.filter((r) => r.report_type === t.value).length,
  })).filter((t) => t.count > 0);

  // ── Columns ──
  const columns = [
    {
      title: "نوع التقرير",
      dataIndex: "report_type",
      render: (v) => {
        const t = typeMap[v];
        return t ? (
          <Space>
            <span>{t.icon}</span>
            <Tag color={t.color} style={{ margin: 0 }}>
              {t.label}
            </Tag>
          </Space>
        ) : (
          <Tag>{v}</Tag>
        );
      },
    },
    {
      title: "الفترة",
      render: (_, r) => (
        <Space>
          <CalendarOutlined style={{ color: "#94A3B8" }} />
          <Text style={{ fontSize: 13 }}>
            {r.period_start} → {r.period_end}
          </Text>
        </Space>
      ),
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "generated_at",
      render: (v) => (
        <Text style={{ color: "#64748B", fontSize: 13 }}>
          {dayjs(v).format("YYYY-MM-DD HH:mm")}
        </Text>
      ),
    },
    {
      title: "أُنشئ بواسطة",
      dataIndex: "generated_by",
      render: (v) =>
        v ? (
          <Space size={4}>
            <UserOutlined style={{ color: "#94A3B8" }} />
            <Text style={{ fontSize: 13 }}>{v}</Text>
          </Space>
        ) : (
          <Text style={{ color: "#CBD5E1", fontSize: 13 }}>—</Text>
        ),
    },
    {
      title: "البيانات",
      dataIndex: "data",
      render: (data) => {
        const count = Object.keys(data || {}).length;
        return (
          <Badge
            count={count}
            style={{ backgroundColor: count > 0 ? "#10B981" : "#E2E8F0" }}
            showZero
          >
            <FileTextOutlined style={{ fontSize: 18, color: "#94A3B8" }} />
          </Badge>
        );
      },
      align: "center",
    },
    {
      title: "إجراءات",
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="عرض البيانات">
            <Button
              type="text"
              icon={<EyeOutlined />}
              style={{ color: "#10B981" }}
              onClick={() => setPreviewReport(record)}
            />
          </Tooltip>
          <Popconfirm
            title="حذف التقرير؟"
            onConfirm={() => handleDelete(record.id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="حذف">
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ direction: "rtl" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
            <BarChartOutlined style={{ color: "#10B981", marginLeft: 8 }} />
            التقارير
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إنشاء وعرض تقارير النظام
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchReports}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
            style={{ background: "#10B981", borderColor: "#10B981" }}
          >
            تقرير جديد
          </Button>
        </Space>
      </div>

      {/* ── Stats Cards ── */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  إجمالي التقارير
                </Text>
              }
              value={totalReports}
              prefix={<BarChartOutlined style={{ color: "#10B981" }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
        {typeCounts.slice(0, 3).map((t) => (
          <Col span={6} key={t.value}>
            <Card
              size="small"
              style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#64748B", fontSize: 12 }}>
                    {t.label}
                  </Text>
                }
                value={t.count}
                prefix={<span>{t.icon}</span>}
                valueStyle={{ color: "#0F172A", fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Filter ── */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          borderRadius: 12,
          border: "1px solid #E2E8F0",
        }}
        bodyStyle={{ padding: "12px 16px" }}
      >
        <Space wrap>
          <Text style={{ color: "#64748B", fontSize: 13 }}>تصفية:</Text>
          <Select
            placeholder="كل أنواع التقارير"
            value={filterType}
            onChange={setFilterType}
            allowClear
            style={{ width: 220 }}
            size="small"
          >
            {REPORT_TYPES.map((t) => (
              <Option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* ── Table ── */}
      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={reports}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="لا توجد تقارير" /> }}
          pagination={{ pageSize: 10, showTotal: (t) => `إجمالي ${t} تقرير` }}
          style={{ direction: "rtl" }}
        />
      </Card>

      {/* ── Modals ── */}
      <CreateReportModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchReports}
      />
      <DataPreviewModal
        report={previewReport}
        open={!!previewReport}
        onClose={() => setPreviewReport(null)}
      />
    </div>
  );
}
