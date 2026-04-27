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
  CheckCircleOutlined,
  TagsOutlined,
  VideoCameraOutlined,
  LinkOutlined,
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
const CLOUDINARY_UPLOAD_PRESET = "store_uploads";

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
// UPLOAD TO CLOUDINARY
// ─────────────────────────────────────────────────────────────────────────────
const uploadToCloudinary = (file, type = "image", onProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
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
// IMAGE + ATTRIBUTE LINKER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * بعد رفع الصور، بيظهر لكل صورة Dropdown يختار منه المستخدم
 * أي قيمة خاصية (AttributeValue) مرتبطة بيها — مثلاً اللون الأحمر.
 *
 * القيم المتاحة بتيجي من نفس الـ attributes اللي المنتج بيعمل variants منها.
 */
function ImageAttributeLinker({ uploadedImages, attributes, onChange }) {
  // uploadedImages: [{uid, name, url}]
  // linked: { uid -> attributeValueId | null }
  const [linked, setLinked] = useState({});

  // كل ما اتغيرت الصور نصفّر الـ mapping للصور الجديدة بس
  useEffect(() => {
    setLinked((prev) => {
      const next = {};
      uploadedImages.forEach((img) => {
        next[img.uid] = prev[img.uid] ?? null;
      });
      return next;
    });
  }, [uploadedImages]);

  const handleLink = (uid, avId) => {
    const next = { ...linked, [uid]: avId ?? null };
    setLinked(next);
    onChange(
      uploadedImages.map((img) => ({
        url: img.url,
        attribute_value: next[img.uid] ?? null,
      }))
    );
  };

  // flatten كل الـ values من كل الـ attributes
  const allValues = attributes.flatMap((attr) =>
    (attr.values ?? []).map((v) => ({ ...v, attrName: attr.name }))
  );

  if (uploadedImages.length === 0 || allValues.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 16,
        background: "#FAFAFA",
        border: "1px dashed #C7D2FE",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <Space style={{ marginBottom: 10 }}>
        <LinkOutlined style={{ color: "#6366F1" }} />
        <Text style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
          ربط كل صورة بلون / خاصية (اختياري)
        </Text>
      </Space>
      <Text
        style={{
          fontSize: 12,
          color: "#94A3B8",
          display: "block",
          marginBottom: 12,
        }}
      >
        عشان لما المستخدم يختار لون تظهرله صورته الصح تلقائياً
      </Text>

      {uploadedImages.map((img) => (
        <div
          key={img.uid}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 0",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          {/* thumbnail */}
          <Avatar
            shape="square"
            size={40}
            src={img.url}
            style={{
              borderRadius: 8,
              flexShrink: 0,
              border: "1px solid #E2E8F0",
            }}
            icon={<PictureOutlined />}
          />
          <Text ellipsis style={{ flex: 1, fontSize: 12, color: "#64748B" }}>
            {img.name}
          </Text>
          <Select
            placeholder="اختر خاصية..."
            allowClear
            size="small"
            style={{ width: 180 }}
            value={linked[img.uid] ?? undefined}
            onChange={(val) => handleLink(img.uid, val)}
          >
            {allValues.map((v) => (
              <Option key={v.id} value={v.id}>
                <Space size={4}>
                  <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                    {v.attrName}:
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>
                    {v.value}
                  </Text>
                </Space>
              </Option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTE SELECTOR + COMBINATIONS TABLE
// ─────────────────────────────────────────────────────────────────────────────
function AttributeSelector({ attributes, onChange }) {
  const [selectedValues, setSelectedValues] = useState({});
  const [combinations, setCombinations] = useState([]);
  const [stockValues, setStockValues] = useState({});
  const [generated, setGenerated] = useState(false);

  const handleAttrChange = (attrId, vals) => {
    const next = { ...selectedValues, [attrId]: vals };
    setSelectedValues(next);
    setGenerated(false);
    setCombinations([]);
    setStockValues({});
    onChange([]);
  };

  const handleGenerate = () => {
    const groups = attributes
      .filter((attr) => selectedValues[attr.id]?.length > 0)
      .map((attr) =>
        attr.values
          .filter((v) => selectedValues[attr.id]?.includes(v.id))
          .map((v) => ({ id: v.id, value: v.value, attrName: attr.name }))
      );

    if (groups.length === 0) {
      message.warning("اختر قيمة واحدة على الأقل");
      return;
    }

    const cartesian = (...arrays) =>
      arrays.reduce(
        (acc, arr) => acc.flatMap((combo) => arr.map((val) => [...combo, val])),
        [[]]
      );

    const combos = cartesian(...groups);
    setCombinations(combos);

    const stocks = {};
    combos.forEach((_, i) => (stocks[i] = 0));
    setStockValues(stocks);
    setGenerated(true);

    onChange(
      combos.map((combo) => ({
        attribute_value_ids: combo.map((c) => c.id),
        stock: 0,
      }))
    );
  };

  const handleStockChange = (index, val) => {
    const next = { ...stockValues, [index]: val };
    setStockValues(next);
    onChange(
      combinations.map((combo, i) => ({
        attribute_value_ids: combo.map((c) => c.id),
        stock: next[i] ?? 0,
      }))
    );
  };

  const totalSelected = Object.values(selectedValues).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0
  );

  return (
    <div>
      <div
        style={{
          background: "#EFF6FF",
          border: "0.5px solid #BFDBFE",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 13,
          color: "#1D4ED8",
        }}
      >
        الخطوة 1: حدد القيم المتاحة لكل خاصية ← الخطوة 2: اضغط "توليد" ← الخطوة
        3: حدد المخزون لكل توليفة
      </div>

      {attributes.map((attr) => (
        <div key={attr.id} style={{ marginBottom: 16 }}>
          <Text strong style={{ display: "block", marginBottom: 6 }}>
            {attr.name}
          </Text>
          <Select
            mode="multiple"
            placeholder={`اختر ${attr.name}...`}
            value={selectedValues[attr.id] || []}
            onChange={(vals) => handleAttrChange(attr.id, vals)}
            style={{ width: "100%" }}
          >
            {attr.values.map((v) => (
              <Option key={v.id} value={v.id}>
                {v.value}
              </Option>
            ))}
          </Select>
        </div>
      ))}

      <Button
        type="dashed"
        block
        icon={<AppstoreAddOutlined />}
        disabled={totalSelected === 0}
        onClick={handleGenerate}
        style={{
          borderRadius: 10,
          borderColor: "#6366F1",
          color: "#6366F1",
          height: 44,
          fontWeight: 600,
          marginBottom: 20,
        }}
      >
        {totalSelected > 0
          ? "توليد الـ Variants تلقائياً"
          : "اختر قيم الـ Attributes أولاً"}
      </Button>

      {generated && combinations.length > 0 && (
        <div>
          <div
            style={{
              background: "#F0FDF4",
              border: "0.5px solid #BBF7D0",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 12,
              fontSize: 13,
              color: "#15803D",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircleOutlined />
            {combinations.length} توليفة جاهزة — حدد المخزون لكل واحدة
          </div>

          {combinations.map((combo, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                marginBottom: 8,
                background: "#F8FAFC",
                borderRadius: 10,
                border: "0.5px solid #E2E8F0",
              }}
            >
              <Space size={6}>
                {combo.map((c, j) => (
                  <Tag key={j} style={{ borderRadius: 6, margin: 0 }}>
                    <Text style={{ fontSize: 11, color: "#64748B" }}>
                      {c.attrName}:
                    </Text>{" "}
                    <Text style={{ fontSize: 12, fontWeight: 500 }}>
                      {c.value}
                    </Text>
                  </Tag>
                ))}
              </Space>
              <Space>
                <Text style={{ fontSize: 12, color: "#64748B" }}>المخزون:</Text>
                <InputNumber
                  min={0}
                  value={stockValues[i]}
                  onChange={(val) => handleStockChange(i, val)}
                  style={{ width: 80 }}
                  size="small"
                />
              </Space>
            </div>
          ))}
        </div>
      )}
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
  const [uploadProgress, setUploadProgress] = useState({});
  const [variantsData, setVariantsData] = useState([]);

  // ── بعد رفع الصور نحتاج نخزن url لكل ملف + الـ attribute_value المختار ──
  // uploadedImagesWithAttrs: [{uid, name, url, attribute_value}]
  const [uploadedImagesWithAttrs, setUploadedImagesWithAttrs] = useState([]);

  const isEdit = !!editRecord;

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
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ status: "active" });
      }
      setFileList([]);
      setVideoList([]);
      setUploadProgress({});
      setActiveTab("info");
      setVariantsData([]);
      setUploadedImagesWithAttrs([]);
    }
  }, [open, editRecord, isEdit, form]);

  // ─────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setUploadProgress({});

      // ── 1. رفع الصور على Cloudinary ──
      const uploadedImages = []; // [{uid, name, url}]
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
        uploadedImages.push({ uid: f.uid, name: f.name, url });
      }

      // حدّث الـ state عشان ImageAttributeLinker يشتغل
      const linkedAttrs = {};
      uploadedImagesWithAttrs.forEach((item) => {
        linkedAttrs[item.uid] = item.attribute_value ?? null;
      });

      // ── 2. رفع الفيديوهات ──
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

      // ── 3. بناء الـ payload للباك اند ──
      // uploaded_images بقت array من objects { url, attribute_value }
      // الباك اند ProductWriteSerializer جاهز يستقبلها بعد التعديل
      const imagesPayload = uploadedImages.map((img) => ({
        url: img.url,
        attribute_value: linkedAttrs[img.uid] ?? null,
      }));

      // بنبعت JSON مش FormData عشان نقدر نبعت array of objects صح
      const payload = {
        name: values.name,
        description: values.description ?? "",
        price: values.price,
        discount_price: values.discount_price ?? null,
        sku: values.sku ?? "",
        category: values.category,
        status: values.status,
        uploaded_images: imagesPayload,
        uploaded_videos: videoUrls,
      };

      // ── 4. حفظ المنتج ──
      let productId;
      if (isEdit) {
        await updateProduct(editRecord.id, payload);
        productId = editRecord.id;
        message.success("تم تحديث المنتج ✅");
      } else {
        const { data } = await createProduct(payload);
        productId = data?.data?.id ?? data?.id;
        message.success("تم إنشاء المنتج ✅");
      }

      // ── 5. حفظ الـ Variants ──
      if (!isEdit && variantsData.length > 0) {
        const results = await Promise.allSettled(
          variantsData.map((v) =>
            createProductVariant(productId, {
              attribute_value_ids: v.attribute_value_ids,
              initial_stock: v.stock ?? 0,
            })
          )
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) message.warning(`${failed} توليفات لم تُحفظ`);
        else
          message.success(`تم إنشاء ${variantsData.length} variant بنجاح ✅`);
      }

      onSaved();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
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
                onChange={({ fileList: fl }) => {
                  setFileList(fl);
                  // لو حُذفت صورة نزيلها من الـ mapping
                  setUploadedImagesWithAttrs((prev) =>
                    prev.filter((img) => fl.find((f) => f.uid === img.uid))
                  );
                }}
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

            {/*
              ✦ جديد: ربط كل صورة بخاصية
              بيظهر لو:
                1. في صور مختارة
                2. في attributes موجودة (عشان نعرف نقدم إيه في الـ dropdown)
              لو الـ uploadedImagesWithAttrs فاضلة (قبل الرفع الفعلي)،
              بنعمل fallback من fileList عشان نعرض الـ linker بـ preview بس
            */}
            {fileList.length > 0 && attributes.length > 0 && (
              <ImageAttributeLinker
                uploadedImages={
                  uploadedImagesWithAttrs.length > 0
                    ? uploadedImagesWithAttrs
                    : fileList
                        .filter((f) => f.thumbUrl || f.url)
                        .map((f) => ({
                          uid: f.uid,
                          name: f.name,
                          url: f.thumbUrl || f.url || "",
                        }))
                }
                attributes={attributes}
                onChange={(mapped) => {
                  // mapped: [{url, attribute_value}]
                  // نحتاج نحافظ على uid عشان نعمل sync
                  setUploadedImagesWithAttrs((prev) => {
                    // لو الصور اترفعت فعلاً ← update الـ attribute_value بس
                    if (prev.length > 0) {
                      return prev.map((img, i) => ({
                        ...img,
                        attribute_value: mapped[i]?.attribute_value ?? null,
                      }));
                    }
                    // قبل الرفع ← خزن الـ mapping مؤقتاً
                    return fileList
                      .filter((f) => f.thumbUrl || f.url)
                      .map((f, i) => ({
                        uid: f.uid,
                        name: f.name,
                        url: f.thumbUrl || f.url || "",
                        attribute_value: mapped[i]?.attribute_value ?? null,
                      }));
                  });
                }}
              />
            )}

            <Divider style={{ margin: "16px 0" }}>فيديوهات المنتج</Divider>

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
                    الخصائص تحتوي على المميزات مثل الألوان والحجم والمخزون
                  </Text>
                </div>
              </div>

              {attributes.length === 0 ? (
                <div
                  style={{
                    background: "#FFF7ED",
                    border: "1px solid #FED7AA",
                    borderRadius: 10,
                    padding: "12px 16px",
                    color: "#C2410C",
                    fontSize: 13,
                  }}
                >
                  ⚠️ لا توجد Attributes معرّفة. أضف Attributes من صفحة الإعدادات
                  أولاً.
                </div>
              ) : (
                <AttributeSelector
                  attributes={attributes}
                  onChange={setVariantsData}
                />
              )}

              {variantsData.length > 0 && (
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
                  سيتم إنشاء {variantsData.length} variant تلقائياً بعد حفظ
                  المنتج
                </div>
              )}
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

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data.results ?? data))
      .catch(() => {});
    getAttributes()
      .then(({ data }) => setAttributes(data.results ?? data))
      .catch(() => {});
  }, []);

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
  const openEdit = (r) => {
    setEditRecord(r);
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

  const handleTableChange = (pagination, _, sorter) =>
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      page_size: pagination.pageSize,
      ordering: sorter.order
        ? (sorter.order === "ascend" ? "" : "-") + sorter.field
        : "-created_at",
    }));

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

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchProducts}
        editRecord={editRecord}
        categories={categories}
        attributes={attributes}
      />

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
