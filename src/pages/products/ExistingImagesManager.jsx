/**
 * ExistingImagesManager.jsx
 *
 * ضيف الـ import ده في ProductsPage.jsx:
 *   import ExistingImagesManager from "./ExistingImagesManager";
 *
 * واستخدمه جوه تاب الصور في ProductModal بدل الـ comment التالي:
 *   {isEdit && <ExistingImagesManager productId={editRecord?.id} />}
 */

import React, { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  PictureOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  getProduct,
  deleteProductImage,
  setPrimaryImage,
} from "../../api/productsApi";

const { Text } = Typography;

export default function ExistingImagesManager({ productId, onImagesChange }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);

  // ── جلب الصور الموجودة ──────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    getProduct(productId)
      .then(({ data }) => {
        const imgs = data?.data?.images ?? data?.images ?? [];
        setImages(imgs);
        onImagesChange?.(imgs.length);
      })
      .catch(() => message.error("فشل تحميل صور المنتج"))
      .finally(() => setLoading(false));
  }, [productId]);

  // ── حذف صورة ────────────────────────────────────────────────────────────
  const handleDelete = async (imageId) => {
    setDeletingId(imageId);
    try {
      await deleteProductImage(productId, imageId);
      const updated = images.filter((img) => img.id !== imageId);
      setImages(updated);
      onImagesChange?.(updated.length);
      message.success("تم حذف الصورة");
    } catch {
      message.error("فشل حذف الصورة");
    } finally {
      setDeletingId(null);
    }
  };

  // ── تعيين كرئيسية ────────────────────────────────────────────────────────
  const handleSetPrimary = async (imageId) => {
    setSettingPrimaryId(imageId);
    try {
      await setPrimaryImage(productId, imageId);
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
      message.success("تم تعيين الصورة الرئيسية");
    } catch {
      message.error("فشل تعيين الصورة الرئيسية");
    } finally {
      setSettingPrimaryId(null);
    }
  };

  // ── لا يوجد صور ─────────────────────────────────────────────────────────
  if (!loading && images.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "20px 0 8px",
          color: "#94A3B8",
          fontSize: 13,
        }}
      >
        <PictureOutlined
          style={{ fontSize: 28, display: "block", marginBottom: 6 }}
        />
        لا توجد صور مضافة بعد
      </div>
    );
  }

  // ── العرض ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "#FAFAFA",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Space size={6}>
          <PictureOutlined style={{ color: "#6366F1" }} />
          <Text style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
            الصور الحالية
          </Text>
          <Tag
            style={{
              borderRadius: 20,
              fontSize: 11,
              background: "#EEF2FF",
              border: "none",
              color: "#6366F1",
              fontWeight: 600,
            }}
          >
            {images.length}
          </Tag>
        </Space>
        {loading && <Spin size="small" />}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 10,
        }}
      >
        {images.map((img) => {
          const rawUrl =
            typeof img.image === "string"
              ? img.image
              : img.image?.url ?? img.image?.secure_url ?? "";

          // بيشيل الـ prefix الزيادة "image/upload/" لو موجودة قبل https
          const imgUrl = rawUrl.replace(/^image\/upload\/(?=https?:\/\/)/, "");

          const isDeleting = deletingId === img.id;
          const isSettingPrimary = settingPrimaryId === img.id;

          return (
            <div
              key={img.id}
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                border: img.is_primary
                  ? "2px solid #6366F1"
                  : "1px solid #E2E8F0",
                background: "#F8FAFC",
                aspectRatio: "1",
                opacity: isDeleting ? 0.4 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {/* الصورة */}
              <Avatar
                shape="square"
                size="100%"
                src={imgUrl}
                icon={<PictureOutlined />}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 0,
                }}
              />

              {/* Primary Badge */}
              {img.is_primary && (
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "#6366F1",
                    borderRadius: 6,
                    padding: "2px 6px",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <CheckCircleOutlined
                    style={{ color: "#fff", fontSize: 10 }}
                  />
                  <Text
                    style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}
                  >
                    رئيسية
                  </Text>
                </div>
              )}

              {/* Attribute Value Badge (لو مربوطة بخاصية) */}
              {img.attribute_value && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 28,
                    right: 0,
                    left: 0,
                    background: "rgba(0,0,0,0.45)",
                    padding: "2px 4px",
                    textAlign: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 10 }} ellipsis>
                    {img.attribute_value}
                  </Text>
                </div>
              )}

              {/* Actions Bar */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  left: 0,
                  background: "rgba(15,23,42,0.65)",
                  display: "flex",
                  justifyContent: "center",
                  gap: 4,
                  padding: "4px 2px",
                }}
              >
                {/* تعيين رئيسية */}
                {!img.is_primary && (
                  <Tooltip title="تعيين كرئيسية">
                    <Button
                      type="text"
                      size="small"
                      loading={isSettingPrimary}
                      icon={
                        <StarOutlined
                          style={{ color: "#FBBF24", fontSize: 13 }}
                        />
                      }
                      style={{ padding: "0 4px", height: 22 }}
                      onClick={() => handleSetPrimary(img.id)}
                    />
                  </Tooltip>
                )}

                {/* حذف */}
                <Popconfirm
                  title="حذف الصورة؟"
                  description="لن تتمكن من استرجاعها"
                  onConfirm={() => handleDelete(img.id)}
                  okText="حذف"
                  cancelText="إلغاء"
                  okType="danger"
                  placement="top"
                >
                  <Tooltip title="حذف">
                    <Button
                      type="text"
                      size="small"
                      loading={isDeleting}
                      icon={
                        <DeleteOutlined
                          style={{ color: "#F87171", fontSize: 13 }}
                        />
                      }
                      style={{ padding: "0 4px", height: 22 }}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
