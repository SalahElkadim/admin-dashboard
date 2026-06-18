import React, { useState, useEffect } from "react";
import { Button, InputNumber, Space, Typography, Tooltip, Alert } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  TagsOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

// ─────────────────────────────────────────────────────────────────────────────
// PRICE TIERS TAB COMPONENT
// Props:
//   tiers       : [{min_quantity, unit_price}]  ← الـ state من الـ parent
//   onChange    : (newTiers) => void             ← يحدّث الـ state في الـ parent
//   productPrice: number                          ← السعر الأصلي للمنتج
// ─────────────────────────────────────────────────────────────────────────────
export default function PriceTiersTab({ tiers, onChange, productPrice }) {
  const handleAdd = () => {
    const lastQty = tiers.length > 0 ? tiers[tiers.length - 1].min_quantity : 0;
    onChange([
      ...tiers,
      { min_quantity: lastQty + 1, unit_price: productPrice || 0 },
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = tiers.map((tier, i) =>
      i === index ? { ...tier, [field]: value } : tier
    );
    onChange(updated);
  };

  const handleDelete = (index) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* ── شرح توضيحي ── */}
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{
          borderRadius: 10,
          marginBottom: 20,
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          color: "#1D4ED8",
        }}
        message={
          <Text style={{ fontSize: 13, color: "#1D4ED8" }}>
            حدد سعر الوحدة بناءً على الكمية المشتراة. سعر أول tier سيتأثر بسعر
            الخصم لو موجود في معلومات المنتج.
          </Text>
        }
      />

      {/* ── Header ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 40px",
          gap: 8,
          padding: "8px 12px",
          background: "#F8FAFC",
          borderRadius: "10px 10px 0 0",
          border: "1px solid #E2E8F0",
          borderBottom: "none",
        }}
      >
        <Text style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
          الكمية الدنيا (قطعة)
        </Text>
        <Text style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
          سعر القطعة
        </Text>
        <div />
      </div>

      {/* ── Rows ── */}
      <div
        style={{
          border: "1px solid #E2E8F0",
          borderRadius: tiers.length === 0 ? "0 0 10px 10px" : 0,
          overflow: "hidden",
        }}
      >
        {tiers.length === 0 ? (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "#94A3B8",
              fontSize: 13,
            }}
          >
            <TagsOutlined
              style={{ fontSize: 28, display: "block", marginBottom: 8 }}
            />
            لم تضف أي tier بعد — اضغط "إضافة tier" للبدء
          </div>
        ) : (
          tiers.map((tier, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 40px",
                gap: 8,
                padding: "10px 12px",
                background: index % 2 === 0 ? "#fff" : "#FAFAFA",
                borderBottom:
                  index < tiers.length - 1 ? "1px solid #F1F5F9" : "none",
                alignItems: "center",
              }}
            >
              {/* الكمية الدنيا */}
              <Space size={6} align="center">
                {index === 0 && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: "#6366F1",
                      background: "#EEF2FF",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    الأساسي
                  </Text>
                )}
                <InputNumber
                  min={1}
                  value={tier.min_quantity}
                  onChange={(val) => handleChange(index, "min_quantity", val)}
                  style={{ width: index === 0 ? 90 : "100%" }}
                  size="small"
                  placeholder="مثال: 1"
                />
              </Space>

              {/* السعر */}
              <InputNumber
                min={0}
                step={0.01}
                value={tier.unit_price}
                onChange={(val) => handleChange(index, "unit_price", val)}
                style={{ width: "100%" }}
                size="small"
                placeholder="مثال: 350"
                formatter={(v) => (v ? `${v}` : "")}
                addonAfter={
                  <Text style={{ fontSize: 11, color: "#94A3B8" }}>ج.م</Text>
                }
              />

              {/* حذف */}
              <Tooltip title="حذف">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(index)}
                  style={{ color: "#EF4444" }}
                />
              </Tooltip>
            </div>
          ))
        )}
      </div>

      {/* ── ملاحظة الـ tier الأول ── */}
      {tiers.length > 0 && (
        <div
          style={{
            background: "#FFF7ED",
            border: "1px solid #FED7AA",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            padding: "8px 12px",
            fontSize: 12,
            color: "#C2410C",
          }}
        >
          💡 سعر أول tier (الكمية الدنيا {tiers[0]?.min_quantity}) سيُستبدل
          تلقائياً بسعر الخصم لو موجود في تبويب "معلومات المنتج"
        </div>
      )}

      {/* ── Add Button ── */}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{
          marginTop: 12,
          borderRadius: 10,
          borderColor: "#6366F1",
          color: "#6366F1",
          height: 40,
          fontWeight: 600,
        }}
      >
        إضافة tier
      </Button>
    </div>
  );
}
