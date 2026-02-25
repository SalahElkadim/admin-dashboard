import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Card,
  Modal,
  Form,
  InputNumber,
  Upload,
  Image,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Badge,
  message,
  Avatar,
  Divider,
  Empty,
  Progress,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  InboxOutlined,
  PictureOutlined,
  AppstoreAddOutlined,
  MinusCircleOutlined,
  CheckCircleOutlined,
  TagsOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createProductVariant,
  getAttributes,
} from "../../api/productsApi";

const { Text, Title } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

// ─────────────────────────────────────────────────────────────────────────────
// CLOUDINARY CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = "deahgslyw";
const CLOUDINARY_UPLOAD_PRESET = "store_uploads"; // ← غير ده للـ preset بتاعك

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META = {
  active: { color: "green", label: "نشط" },
  hidden: { color: "orange", label: "مخفي" },
  archived: { color: "default", label: "مؤرشف" },
};

const fmtMoney = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD TO CLOUDINARY – مع progress
// ─────────────────────────────────────────────────────────────────────────────
const uploadToCloudinary = (file, type = "image", onProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.secure_url) resolve(data.secure_url);
        else
          reject(new Error(data.error?.message || "فشل الرفع على Cloudinary"));
      } catch {
        reject(new Error("خطأ في قراءة الاستجابة"));
      }
    };

    xhr.onerror = () => reject(new Error("خطأ في الاتصال بـ Cloudinary"));

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${type}/upload`
    );
    xhr.send(formData);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD PROGRESS ITEM
// ─────────────────────────────────────────────────────────────────────────────
function UploadProgressItem({ name, percent, type }) {
  const isDone = percent === 100;
  return (
    <div
      style={{
        background: isDone ? "#F0FDF4" : "#EEF2FF",
        border: `1px solid ${isDone ? "#BBF7D0" : "#C7D2FE"}`,
        borderRadius: 8,
        padding: "10px 14px",
        marginTop: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <Space size={6}>
          {type === "video" ? (
            <VideoCameraOutlined
              style={{ color: isDone ? "#10B981" : "#6366F1" }}
            />
          ) : (
            <PictureOutlined
              style={{ color: isDone ? "#10B981" : "#6366F1" }}
            />
          )}
          <Text style={{ fontSize: 12, maxWidth: 280 }} ellipsis>
            {name}
          </Text>
        </Space>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isDone ? "#10B981" : "#6366F1",
          }}
        >
          {isDone ? "✓ تم الرفع" : `${percent}%`}
        </Text>
      </div>
      <Progress
        percent={percent}
        showInfo={false}
        strokeColor={isDone ? "#10B981" : "#6366F1"}
        trailColor="#E2E8F0"
        size="small"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT FORM ITEM
// ─────────────────────────────────────────────────────────────────────────────

function VariantRow({ field, remove, attributes }) {
  const { key, ...fieldProps } = field;
  return (
    <div
      style={{
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "16px 16px 8px",
        marginBottom: 12,
        position: "relative",
      }}
    >
      <Tooltip title="حذف هذه الخصائص">
        <Button
          type="text"
          danger
          size="small"
          icon={<MinusCircleOutlined />}
          onClick={() => remove(fieldProps.name)}
          style={{ position: "absolute", top: 10, left: 10 }}
        />
      </Tooltip>

      <Row gutter={12}>
        <Col span={24}>
          <Form.Item
            key={key}
            {...fieldProps}
            name={[fieldProps.name, "attribute_value_ids"]}
            label="قيم الـمميزات (مثال: أحمر، XL)"
            rules={[{ required: true, message: "اختر قيمة واحدة على الأقل" }]}
          >
            <Select
              mode="multiple"
              placeholder="اختر الـ Attributes..."
              optionLabelProp="label"
              showSearch
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: "100%" }}
            >
              {attributes.map((attr) => (
                <Select.OptGroup key={attr.id} label={attr.name}>
                  {attr.values.map((val) => (
                    <Option
                      key={val.id}
                      value={val.id}
                      label={`${attr.name}: ${val.value}`}
                    >
                      <Space>
                        <Tag color="blue" style={{ borderRadius: 4 }}>
                          {attr.name}
                        </Tag>
                        {val.value}
                      </Space>
                    </Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={12} sm={8}>
          <Form.Item
            key={key}
            {...fieldProps}
            name={[fieldProps.name, "stock"]}
            label="المخزون"
            initialValue={0}
            rules={[{ required: true, message: "ادخل الكمية" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              size="middle"
              placeholder="0"
            />
          </Form.Item>
        </Col>

        <Col xs={12} sm={8}>
          <Form.Item
            key={key}
            {...fieldProps}
            name={[fieldProps.name, "price_override"]}
            label="سعر خاص (اختياري)"
          >
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: "100%" }}
              size="middle"
              formatter={(v) => (v ? `$ ${v}` : "")}
              parser={(v) => v?.replace(/\$\s?|(,*)/g, "") || ""}
              placeholder="سيستخدم سعر المنتج"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={8}>
          <Form.Item
            key={key}
            {...fieldProps}
            name={[fieldProps.name, "sku"]}
            label="SKU الـ"
          >
            <Input placeholder="VAR-001" size="middle" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT MODAL
// ─────────────────────────────────────────────────────────────────────────────

function ProductModal({
  open,
  onClose,
  onSaved,
  editRecord,
  categories,
  attributes,
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [activeTab, setActiveTab] = useState("info");
  const [uploadProgress, setUploadProgress] = useState({}); // { fileName: { percent, type } }

  const isEdit = !!editRecord;

  // ─── seed form on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      if (isEdit) {
        form.setFieldsValue({
          name: editRecord.name,
          description: editRecord.description,
          price: Number(editRecord.price),
          discount_price: editRecord.discount_price
            ? Number(editRecord.discount_price)
            : undefined,
          sku: editRecord.sku,
          category: editRecord.category,
          status: editRecord.status,
          variants: [],
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ status: "active", variants: [] });
      }
      setFileList([]);
      setVideoList([]);
      setUploadProgress({});
      setActiveTab("info");
    }
  }, [open, editRecord, isEdit, form]);

  // ─── submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setUploadProgress({});

      // ── 1. رفع الصور على Cloudinary ──
      const imageUrls = [];
      for (const f of fileList) {
        if (!f.originFileObj) continue;
        const fileName = f.name;
        setUploadProgress((prev) => ({
          ...prev,
          [fileName]: { percent: 0, type: "image" },
        }));
        const url = await uploadToCloudinary(
          f.originFileObj,
          "image",
          (percent) => {
            setUploadProgress((prev) => ({
              ...prev,
              [fileName]: { percent, type: "image" },
            }));
          }
        );
        imageUrls.push(url);
      }

      // ── 2. رفع الفيديوهات على Cloudinary ──
      const videoUrls = [];
      for (const f of videoList) {
        if (!f.originFileObj) continue;
        const fileName = f.name;
        setUploadProgress((prev) => ({
          ...prev,
          [fileName]: { percent: 0, type: "video" },
        }));
        const url = await uploadToCloudinary(
          f.originFileObj,
          "video",
          (percent) => {
            setUploadProgress((prev) => ({
              ...prev,
              [fileName]: { percent, type: "video" },
            }));
          }
        );
        videoUrls.push(url);
      }

      // ── 3. بناء FormData وإرساله للـ Backend ──
      const fd = new FormData();
      const productFields = [
        "name",
        "description",
        "price",
        "discount_price",
        "sku",
        "category",
        "status",
      ];
      productFields.forEach((k) => {
        if (values[k] !== undefined && values[k] !== null)
          fd.append(k, values[k]);
      });

      // بنبعت URLs بدل files
      imageUrls.forEach((url) => fd.append("uploaded_images", url));
      videoUrls.forEach((url) => fd.append("uploaded_videos", url));

      // ── 4. حفظ المنتج ──
      let productId;
      if (isEdit) {
        await updateProduct(editRecord.id, fd);
        productId = editRecord.id;
        message.success("تم تحديث المنتج ✅");
      } else {
        const { data } = await createProduct(fd);
        productId = data?.data?.id ?? data?.id;
        message.success("تم إنشاء المنتج ✅");
      }

      // ── 5. حفظ الـ Variants ──
      const variantsList = values.variants ?? [];
      if (!isEdit && variantsList.length > 0) {
        const variantResults = await Promise.allSettled(
          variantsList.map((v) =>
            createProductVariant(productId, {
              attribute_value_ids: v.attribute_value_ids,
              stock: v.stock ?? 0,
              price_override: v.price_override ?? null,
              sku: v.sku ?? null,
            })
          )
        );
        const failed = variantResults.filter(
          (r) => r.status === "rejected"
        ).length;
        if (failed > 0) {
          message.warning(`${failed} خصائص لم تُحفظ، تحقق من التكرار`);
        } else {
          message.success(`تم إضافة ${variantsList.length} خصائص بنجاح`);
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      if (err?.errorFields) {
        const firstErr = err.errorFields[0]?.name?.[0];
        if (firstErr === "variants") setActiveTab("variants");
        return;
      }
      message.error(err.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  // ─── Tab Header ──────────────────────────────────────────────────────────
  const TabBtn = ({ id, icon, label }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        border: "none",
        borderBottom:
          activeTab === id ? "3px solid #6366F1" : "3px solid transparent",
        background: "transparent",
        cursor: "pointer",
        color: activeTab === id ? "#6366F1" : "#64748B",
        fontWeight: activeTab === id ? 700 : 400,
        fontSize: 14,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </button>
  );

  const progressEntries = Object.entries(uploadProgress);
  const isUploading = progressEntries.some(([, v]) => v.percent < 100);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? "حفظ التعديلات" : "إضافة المنتج"}
      cancelText="إلغاء"
      confirmLoading={loading}
      okButtonProps={{ disabled: isUploading && loading }}
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <InboxOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <Text style={{ fontWeight: 700 }}>
            {isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}
          </Text>
        </Space>
      }
      width={740}
      style={{ direction: "rtl" }}
      styles={{ body: { padding: 0 } }}
    >
      {/* ── Tab Navigation ── */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #E2E8F0",
          padding: "0 24px",
          gap: 4,
          background: "#FAFAFA",
        }}
      >
        <TabBtn id="info" icon={<InboxOutlined />} label="معلومات المنتج" />
        <TabBtn id="images" icon={<PictureOutlined />} label="الصور والفيديو" />
        {!isEdit && (
          <TabBtn
            id="variants"
            icon={<AppstoreAddOutlined />}
            label="الخصائص"
          />
        )}
      </div>

      {/* ── Form Body ── */}
      <div
        style={{ maxHeight: "65vh", overflowY: "auto", padding: "20px 24px" }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          {/* ══════════════ TAB 1: معلومات ══════════════ */}
          <div style={{ display: activeTab === "info" ? "block" : "none" }}>
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  name="name"
                  label="اسم المنتج"
                  rules={[{ required: true, message: "ادخل اسم المنتج" }]}
                >
                  <Input placeholder="مثال: تيشرت قطن بريميوم" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="sku" label="الـ SKU">
                  <Input placeholder="SKU-001" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="الوصف">
              <Input.TextArea rows={3} placeholder="وصف مفصل للمنتج..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="price"
                  label="السعر الأصلي ($)"
                  rules={[{ required: true, message: "ادخل السعر" }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    size="large"
                    style={{ width: "100%" }}
                    formatter={(v) => `$ ${v}`}
                    parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="discount_price" label="سعر الخصم ($)">
                  <InputNumber
                    min={0}
                    step={0.01}
                    size="large"
                    style={{ width: "100%" }}
                    formatter={(v) => `$ ${v}`}
                    parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="category"
                  label="الفئة"
                  rules={[{ required: true, message: "اختر الفئة" }]}
                >
                  <Select placeholder="اختر..." size="large">
                    {categories.map((c) => (
                      <Option key={c.id} value={c.id}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="status" label="الحالة" initialValue="active">
              <Select size="large">
                <Option value="active">نشط</Option>
                <Option value="hidden">مخفي</Option>
                <Option value="archived">مؤرشف</Option>
              </Select>
            </Form.Item>
          </div>

          {/* ══════════════ TAB 2: الصور والفيديو ══════════════ */}
          <div style={{ display: activeTab === "images" ? "block" : "none" }}>
            {/* ── الصور ── */}
            <Form.Item label="صور المنتج">
              <Dragger
                listType="picture-card"
                fileList={fileList}
                beforeUpload={() => false}
                onChange={({ fileList: fl }) => setFileList(fl)}
                multiple
                accept="image/*"
                style={{ borderRadius: 10 }}
              >
                <p style={{ marginBottom: 8 }}>
                  <PictureOutlined style={{ fontSize: 32, color: "#6366F1" }} />
                </p>
                <p style={{ fontSize: 13, color: "#475569" }}>
                  اسحب الصور هنا أو اضغط للرفع
                </p>
                <p style={{ fontSize: 11, color: "#94A3B8" }}>
                  PNG, JPG – الصورة الأولى ستكون الصورة الرئيسية
                </p>
              </Dragger>
            </Form.Item>

            <Divider style={{ margin: "12px 0" }}>فيديوهات المنتج</Divider>

            {/* ── الفيديو ── */}
            <Form.Item>
              <Dragger
                listType="picture"
                fileList={videoList}
                beforeUpload={() => false}
                onChange={({ fileList: fl }) => setVideoList(fl)}
                multiple
                accept="video/*"
                style={{ borderRadius: 10 }}
              >
                <p style={{ marginBottom: 8 }}>
                  <VideoCameraOutlined
                    style={{ fontSize: 32, color: "#6366F1" }}
                  />
                </p>
                <p style={{ fontSize: 13, color: "#475569" }}>
                  اسحب الفيديوهات هنا أو اضغط للرفع
                </p>
                <p style={{ fontSize: 11, color: "#94A3B8" }}>MP4, MOV, AVI</p>
              </Dragger>
            </Form.Item>

            {/* ── ملخص الاختيار ── */}
            {(fileList.length > 0 || videoList.length > 0) && !loading && (
              <div
                style={{
                  background: "#EEF2FF",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "#6366F1",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <CheckCircleOutlined />
                {fileList.length > 0 && `${fileList.length} صورة`}
                {fileList.length > 0 && videoList.length > 0 && " · "}
                {videoList.length > 0 && `${videoList.length} فيديو`}
                {" – سيتم الرفع على Cloudinary عند الحفظ"}
              </div>
            )}

            {/* ── شريط التقدم ── */}
            {loading && progressEntries.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#64748B",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  جاري الرفع...
                </Text>
                {progressEntries.map(([name, { percent, type }]) => (
                  <UploadProgressItem
                    key={name}
                    name={name}
                    percent={percent}
                    type={type}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ══════════════ TAB 3: Variants ══════════════ */}
          {!isEdit && (
            <div
              style={{ display: activeTab === "variants" ? "block" : "none" }}
            >
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <TagsOutlined style={{ color: "#3B82F6", marginTop: 2 }} />
                <div>
                  <Text
                    style={{
                      fontWeight: 600,
                      color: "#1D4ED8",
                      display: "block",
                    }}
                  >
                    كيف تعمل الخصائص
                  </Text>
                  <Text style={{ fontSize: 12, color: "#3B82F6" }}>
                    الخصائص تحتوي على المميزات مثل الالوان والحجم والمخزون
                  </Text>
                </div>
              </div>

              {attributes.length === 0 && (
                <div
                  style={{
                    background: "#FFF7ED",
                    border: "1px solid #FED7AA",
                    borderRadius: 10,
                    padding: "12px 16px",
                    marginBottom: 16,
                    color: "#C2410C",
                    fontSize: 13,
                  }}
                >
                  ⚠️ لا توجد Attributes معرّفة. أضف Attributes من صفحة الإعدادات
                  أولاً.
                </div>
              )}

              <Form.List name="variants">
                {(fields, { add, remove }) => (
                  <>
                    {fields.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Text style={{ color: "#94A3B8" }}>
                            لم تُضف أي خصائص بعد
                          </Text>
                        }
                        style={{ margin: "20px 0" }}
                      />
                    ) : (
                      fields.map((field) => (
                        <VariantRow
                          key={field.key}
                          field={field}
                          remove={remove}
                          attributes={attributes}
                        />
                      ))
                    )}

                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add()}
                      disabled={attributes.length === 0}
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        borderColor: "#6366F1",
                        color: "#6366F1",
                        height: 44,
                        fontWeight: 600,
                      }}
                    >
                      + إضافة خصائص جديدة
                    </Button>

                    {fields.length > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          background: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                          borderRadius: 10,
                          padding: "10px 14px",
                          color: "#15803D",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <CheckCircleOutlined />
                        سيتم إنشاء {fields.length} خصائص تلقائياً بعد حفظ المنتج
                      </div>
                    )}
                  </>
                )}
              </Form.List>
            </div>
          )}

          <div style={{ height: 8 }} />
        </Form>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: undefined,
    category: undefined,
    in_stock: undefined,
    ordering: "-created_at",
    page: 1,
    page_size: 10,
  });

  // ── Fetch Products ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.in_stock) params.in_stock = filters.in_stock;
      params.ordering = filters.ordering;
      params.page = filters.page;
      params.page_size = filters.page_size;

      const { data } = await getProducts(params);
      setProducts(data.results ?? data);
      setTotal(data.count ?? (data.results ?? data).length);
    } catch {
      message.error("فشل تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Fetch Categories & Attributes ─────────────────────────────────────────
  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data.results ?? data))
      .catch(() => {});
    getAttributes()
      .then(({ data }) => setAttributes(data.results ?? data))
      .catch(() => {});
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      message.success("تم حذف المنتج");
      fetchProducts();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const openAdd = () => {
    setEditRecord(null);
    setModalOpen(true);
  };
  const openEdit = (record) => {
    setEditRecord(record);
    setModalOpen(true);
  };

  const handleFilterChange = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val, page: 1 }));

  const resetFilters = () =>
    setFilters({
      search: "",
      status: undefined,
      category: undefined,
      in_stock: undefined,
      ordering: "-created_at",
      page: 1,
      page_size: 10,
    });

  const handleTableChange = (pagination, _, sorter) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      page_size: pagination.pageSize,
      ordering: sorter.order
        ? (sorter.order === "ascend" ? "" : "-") + sorter.field
        : "-created_at",
    }));
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "المنتج",
      dataIndex: "name",
      width: 280,
      render: (name, r) => (
        <Space>
          <div
            style={{ cursor: r.primary_image ? "zoom-in" : "default" }}
            onClick={() => r.primary_image && setPreviewImg(r.primary_image)}
          >
            <Avatar
              shape="square"
              size={44}
              src={r.primary_image}
              style={{
                borderRadius: 10,
                background: "#EEF2FF",
                border: "1px solid #E2E8F0",
                flexShrink: 0,
              }}
              icon={<PictureOutlined style={{ color: "#6366F1" }} />}
            />
          </div>
          <div style={{ lineHeight: 1.4 }}>
            <Text style={{ fontWeight: 600, fontSize: 13, display: "block" }}>
              {name}
            </Text>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            >
              {r.sku || "—"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "الفئة",
      dataIndex: "category_name",
      width: 130,
      render: (v) => <Tag style={{ borderRadius: 6 }}>{v || "—"}</Tag>,
    },
    {
      title: "السعر",
      dataIndex: "price",
      width: 170,
      sorter: true,
      render: (price, r) => (
        <div>
          {r.discount_price ? (
            <>
              <Text style={{ fontWeight: 700, color: "#10B981" }}>
                {fmtMoney(r.discount_price)}
              </Text>
              <Text
                delete
                style={{ color: "#94A3B8", fontSize: 11, marginRight: 6 }}
              >
                {fmtMoney(price)}
              </Text>
              <Tag color="red" style={{ fontSize: 10, marginRight: 0 }}>
                -{r.discount_percentage}%
              </Tag>
            </>
          ) : (
            <Text style={{ fontWeight: 600 }}>{fmtMoney(price)}</Text>
          )}
        </div>
      ),
    },
    {
      title: "المخزون",
      dataIndex: "total_stock",
      width: 140,
      sorter: true,
      render: (v) => (
        <Space>
          <Badge
            color={v === 0 ? "#EF4444" : v <= 5 ? "#F59E0B" : "#10B981"}
            text={
              <Text style={{ fontSize: 13, fontWeight: 600 }}>
                {v === 0 ? "نفد" : `${v} وحدة`}
              </Text>
            }
          />
          <Tooltip title="إدارة المخزون">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate("/inventory")}
              style={{ color: "#F59E0B" }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      width: 100,
      render: (v) => {
        const m = STATUS_META[v] || {};
        return (
          <Tag color={m.color} style={{ borderRadius: 6 }}>
            {m.label}
          </Tag>
        );
      },
    },
    {
      title: "تاريخ الإضافة",
      dataIndex: "created_at",
      width: 130,
      sorter: true,
      render: (v) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>{v}</Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      fixed: "left",
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="تعديل">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
              style={{ color: "#6366F1" }}
            />
          </Tooltip>
          <Tooltip title="معاينة الصورة">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              disabled={!r.primary_image}
              onClick={() => setPreviewImg(r.primary_image)}
              style={{ color: "#475569" }}
            />
          </Tooltip>
          <Popconfirm
            title="تأكيد الحذف"
            description="هل أنت متأكد من حذف هذا المنتج؟"
            onConfirm={() => handleDelete(r.id)}
            okText="حذف"
            cancelText="إلغاء"
            okType="danger"
          >
            <Tooltip title="حذف">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeFiltersCount = [
    filters.status,
    filters.category,
    filters.in_stock,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div style={{ direction: "rtl" }}>
      {/* ── Page Header ── */}
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
            المنتجات
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            إدارة وتنظيم منتجات المتجر
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={openAdd}
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            border: "none",
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            fontWeight: 600,
          }}
        >
          إضافة منتج
        </Button>
      </div>

      {/* ── Filters Card ── */}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          marginBottom: 16,
        }}
        bodyStyle={{ padding: "16px 20px" }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              placeholder="ابحث بالاسم أو SKU..."
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
              <Option value="active">نشط</Option>
              <Option value="hidden">مخفي</Option>
              <Option value="archived">مؤرشف</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="الفئة"
              value={filters.category}
              onChange={(v) => handleFilterChange("category", v)}
              allowClear
              style={{ width: "100%" }}
            >
              {categories.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="المخزون"
              value={filters.in_stock}
              onChange={(v) => handleFilterChange("in_stock", v)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="true">متاح فقط</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.ordering}
              onChange={(v) => handleFilterChange("ordering", v)}
              style={{ width: "100%" }}
            >
              <Option value="-created_at">الأحدث</Option>
              <Option value="created_at">الأقدم</Option>
              <Option value="-price">أعلى سعر</Option>
              <Option value="price">أقل سعر</Option>
            </Select>
          </Col>
          <Col flex="none">
            <Tooltip title="إعادة تعيين الفلاتر">
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

      {/* ── Table Card ── */}
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
            {loading ? "جاري التحميل..." : `${total} منتج`}
          </Text>
        </div>

        <Table
          rowKey="id"
          dataSource={products}
          columns={columns}
          loading={loading}
          scroll={{ x: 1000 }}
          onChange={handleTableChange}
          pagination={{
            current: filters.page,
            pageSize: filters.page_size,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50"],
            showTotal: (t) => `إجمالي ${t} منتج`,
            position: ["bottomCenter"],
          }}
          rowClassName={(_, i) => (i % 2 === 0 ? "" : "ant-table-row-alt")}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <InboxOutlined
                  style={{
                    fontSize: 48,
                    color: "#CBD5E1",
                    display: "block",
                    marginBottom: 12,
                  }}
                />
                <Text style={{ color: "#94A3B8" }}>لا توجد منتجات</Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* ── Modal ── */}
      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchProducts}
        editRecord={editRecord}
        categories={categories}
        attributes={attributes}
      />

      {/* ── Image Preview ── */}
      <Image
        src={previewImg}
        style={{ display: "none" }}
        preview={{
          visible: !!previewImg,
          src: previewImg,
          onVisibleChange: (v) => {
            if (!v) setPreviewImg(null);
          },
        }}
      />
    </div>
  );
}
