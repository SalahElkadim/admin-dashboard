import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Space,
  Typography,
  Row,
  Col,
  message,
  Tooltip,
  Empty,
  Tag,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  getGoodsReceipts,
  createGoodsReceipt,
  getPurchaseOrders,
  getWarehouses,
} from "../../../api/erpApi";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ── Create Receipt Modal ──────────────────────────────────────
function ReceiptModal({
  open,
  onClose,
  onSuccess,
  purchaseOrders,
  warehouses,
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ received_at: dayjs() });
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.received_at) {
        values.received_at = values.received_at.toISOString();
      }
      setLoading(true);
      await createGoodsReceipt(values);
      message.success("تم تسجيل الاستلام وتحديث المخزون تلقائياً ✅");
      onSuccess();
      onClose();
    } catch (err) {
      if (err?.response?.data) message.error("تحقق من البيانات");
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
          <InboxOutlined style={{ color: "#10B981" }} />
          <Text style={{ fontWeight: 700 }}>تسجيل استلام بضاعة</Text>
        </Space>
      }
      width={480}
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
            تأكيد الاستلام
          </Button>
        </Space>
      }
    >
      {/* Info banner */}
      <div
        style={{
          background: "#F0FDF4",
          border: "1px solid #BBF7D0",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <CheckCircleOutlined style={{ color: "#10B981", fontSize: 18 }} />
        <Text style={{ fontSize: 13, color: "#065F46" }}>
          بعد التأكيد، سيتم رفع المخزون تلقائياً في المستودع المحدد.
        </Text>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="purchase_order"
          label="أمر الشراء"
          rules={[{ required: true, message: "اختر أمر الشراء" }]}
        >
          <Select
            placeholder="اختر أمر الشراء"
            showSearch
            filterOption={(input, option) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {purchaseOrders
              .filter((po) => !["received", "cancelled"].includes(po.status))
              .map((po) => (
                <Option key={po.id} value={po.id}>
                  {po.po_number} — {po.supplier_name}
                </Option>
              ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="warehouse"
          label="المستودع"
          rules={[{ required: true, message: "اختر المستودع" }]}
        >
          <Select placeholder="اختر المستودع">
            {warehouses.map((w) => (
              <Option key={w.id} value={w.id}>
                {w.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="received_at" label="تاريخ ووقت الاستلام">
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="notes" label="ملاحظات">
          <TextArea rows={2} placeholder="أي ملاحظات على البضاعة المستلمة..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterPO, setFilterPO] = useState(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPO) params.purchase_order = filterPO;
      const res = await getGoodsReceipts(params);
      const data = res.data;
      setReceipts(data?.results ?? data?.data ?? data ?? []);
    } catch {
      message.error("فشل في تحميل سجلات الاستلام");
    } finally {
      setLoading(false);
    }
  }, [filterPO]);

  const fetchMeta = useCallback(async () => {
    try {
      const [poRes, wRes] = await Promise.allSettled([
        getPurchaseOrders(),
        getWarehouses(),
      ]);
      if (poRes.status === "fulfilled") {
        const d = poRes.value.data;
        setPurchaseOrders(d?.results ?? d?.data ?? d ?? []);
      }
      if (wRes.status === "fulfilled") {
        const d = wRes.value.data;
        setWarehouses(d?.results ?? d?.data ?? d ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);
  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const columns = [
    {
      title: "أمر الشراء",
      dataIndex: "purchase_order",
      render: (val, row) => {
        const po = purchaseOrders.find((p) => p.id === val);
        return (
          <div>
            <Text style={{ fontWeight: 700, color: "#6366F1" }}>
              {po?.po_number || `#${val}`}
            </Text>
            {po?.supplier_name && (
              <Text
                style={{ color: "#94A3B8", fontSize: 11, display: "block" }}
              >
                {po.supplier_name}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "المستودع",
      dataIndex: "warehouse",
      width: 150,
      render: (val, row) => {
        const wh = warehouses.find((w) => w.id === val);
        return (
          <Tag
            style={{
              background: "#F1F5F9",
              color: "#475569",
              border: "none",
              borderRadius: 6,
            }}
          >
            {wh?.name || `#${val}`}
          </Tag>
        );
      },
    },
    {
      title: "تاريخ الاستلام",
      dataIndex: "received_at",
      width: 170,
      render: (val) => (
        <Text style={{ fontSize: 13, color: "#475569" }}>
          {val
            ? new Date(val).toLocaleString("ar-EG", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—"}
        </Text>
      ),
    },
    {
      title: "المستلم",
      dataIndex: "received_by",
      width: 130,
      render: (val) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          {val ? `#${val}` : "—"}
        </Text>
      ),
    },
    {
      title: "الحالة",
      width: 120,
      render: () => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            color: "#10B981",
            background: "#F0FDF4",
            border: "1px solid #10B98130",
          }}
        >
          <CheckCircleOutlined /> تم الاستلام
        </span>
      ),
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      render: (val) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>{val || "—"}</Text>
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
            استلام البضاعة
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            سجل استلامات البضاعة من الموردين — كل استلام يرفع المخزون تلقائياً
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchReceipts}
            style={{ borderRadius: 8 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: "#10B981",
              borderColor: "#10B981",
              borderRadius: 8,
              height: 38,
            }}
            onClick={() => setModalOpen(true)}
          >
            تسجيل استلام
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              borderTop: "3px solid #10B981",
            }}
          >
            <Text style={{ fontSize: 11, color: "#94A3B8", display: "block" }}>
              إجمالي الاستلامات
            </Text>
            <Text style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>
              {receipts.length}
            </Text>
          </div>
        </Col>
        <Col xs={12} sm={8}>
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              borderTop: "3px solid #6366F1",
            }}
          >
            <Text style={{ fontSize: 11, color: "#94A3B8", display: "block" }}>
              أوامر لم تُستلم بعد
            </Text>
            <Text style={{ fontSize: 28, fontWeight: 800, color: "#6366F1" }}>
              {
                purchaseOrders.filter(
                  (po) => !["received", "cancelled"].includes(po.status)
                ).length
              }
            </Text>
          </div>
        </Col>
        <Col xs={12} sm={8}>
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              borderTop: "3px solid #F59E0B",
            }}
          >
            <Text style={{ fontSize: 11, color: "#94A3B8", display: "block" }}>
              استلام جزئي
            </Text>
            <Text style={{ fontSize: 28, fontWeight: 800, color: "#F59E0B" }}>
              {purchaseOrders.filter((po) => po.status === "partial").length}
            </Text>
          </div>
        </Col>
      </Row>

      {/* Filter */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "14px 20px",
          border: "1px solid #E2E8F0",
          marginBottom: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <Select
          placeholder="فلتر بأمر الشراء"
          allowClear
          style={{ width: 240 }}
          showSearch
          value={filterPO}
          onChange={(v) => setFilterPO(v)}
          filterOption={(input, option) =>
            option?.children?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {purchaseOrders.map((po) => (
            <Option key={po.id} value={po.id}>
              {po.po_number} — {po.supplier_name}
            </Option>
          ))}
        </Select>
        {filterPO && (
          <Button
            type="link"
            style={{ color: "#EF4444", padding: 0 }}
            onClick={() => setFilterPO(null)}
          >
            مسح
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
          dataSource={receipts}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 15,
            showTotal: (t) => `${t} استلام`,
            style: { padding: "12px 20px", direction: "rtl" },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: "#94A3B8" }}>لا توجد سجلات استلام</Text>
                }
              />
            ),
          }}
        />
      </div>

      <ReceiptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchReceipts}
        purchaseOrders={purchaseOrders}
        warehouses={warehouses}
      />
    </div>
  );
}
