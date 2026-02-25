import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  Typography,
  Row,
  Col,
  Divider,
  Space,
  Tag,
  message as antdMessage,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CameraOutlined,
  SaveOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosInstance";
import useAuthStore from "../../store/authStore";

const { Text, Title } = Typography;

// ── Profile Form ──────────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  React.useEffect(() => {
    form.setFieldsValue({
      first_name: user?.name?.split(" ")[0] || "",
      last_name: user?.name?.split(" ")[1] || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user, form]);

  const handleAvatarChange = ({ file }) => {
    if (file.originFileObj) {
      setAvatarFile(file.originFileObj);
      const url = URL.createObjectURL(file.originFileObj);
      setAvatarPreview(url);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (avatarFile) fd.append("avatar", avatarFile);

      const { data } = await axiosInstance.patch("/auth/me/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        setAuth(
          {
            ...user,
            name: `${values.first_name} ${values.last_name}`.trim(),
            email: values.email,
          },
          accessToken,
          refreshToken
        );
        antdMessage.success("تم تحديث الملف الشخصي ✅");
      }
    } catch (err) {
      if (err?.errorFields) return;
      antdMessage.error(err.response?.data?.message || "فشل التحديث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
      bodyStyle={{ padding: 28 }}
    >
      {/* Avatar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div style={{ position: "relative" }}>
          <Avatar
            size={80}
            src={avatarPreview || user?.avatar}
            style={{ background: "#6366F1", fontSize: 28 }}
          >
            {user?.name?.[0] || "A"}
          </Avatar>
          <Upload
            showUploadList={false}
            beforeUpload={() => false}
            accept="image/*"
            onChange={handleAvatarChange}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "#6366F1",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #fff",
              }}
            >
              <CameraOutlined style={{ color: "#fff", fontSize: 12 }} />
            </div>
          </Upload>
        </div>
        <div>
          <Text style={{ fontWeight: 700, fontSize: 18, display: "block" }}>
            {user?.name || "Admin"}
          </Text>
          <Tag
            color="purple"
            style={{
              borderRadius: 6,
              marginTop: 4,
              textTransform: "capitalize",
            }}
          >
            {user?.role || "admin"}
          </Tag>
        </div>
      </div>

      <Divider style={{ margin: "0 0 24px" }} />

      {/* Form */}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="first_name"
              label="الاسم الأول"
              rules={[{ required: true, message: "ادخل الاسم الأول" }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
                placeholder="الاسم الأول"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="last_name" label="الاسم الأخير">
              <Input
                prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
                placeholder="الاسم الأخير"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label="البريد الإلكتروني"
          rules={[
            { required: true, message: "ادخل البريد الإلكتروني" },
            { type: "email", message: "بريد غير صحيح" },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: "#94A3B8" }} />}
            placeholder="admin@example.com"
            size="large"
          />
        </Form.Item>

        <Form.Item name="phone" label="رقم الهاتف">
          <Input
            prefix={<PhoneOutlined style={{ color: "#94A3B8" }} />}
            placeholder="+966 50 000 0000"
            size="large"
          />
        </Form.Item>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSubmit}
          size="large"
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
          }}
        >
          حفظ التغييرات
        </Button>
      </Form>
    </Card>
  );
}

// ── Password Section ──────────────────────────────────────────────────────────

function PasswordSection() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await axiosInstance.post("/auth/change-password/", values);
      antdMessage.success("تم تغيير كلمة المرور بنجاح ✅");
      form.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      antdMessage.error(err.response?.data?.message || "فشل تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
      bodyStyle={{ padding: 28 }}
    >
      <Space style={{ marginBottom: 20 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SafetyCertificateOutlined
            style={{ color: "#F59E0B", fontSize: 18 }}
          />
        </div>
        <div>
          <Text style={{ fontWeight: 700, fontSize: 15, display: "block" }}>
            الأمان
          </Text>
          <Text style={{ color: "#94A3B8", fontSize: 13 }}>
            تغيير كلمة المرور
          </Text>
        </div>
      </Space>

      <Divider style={{ margin: "0 0 24px" }} />

      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="old_password"
          label="كلمة المرور الحالية"
          rules={[{ required: true, message: "ادخل كلمة المرور الحالية" }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
            placeholder="••••••••"
            size="large"
            iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="new_password"
          label="كلمة المرور الجديدة"
          rules={[
            { required: true, message: "ادخل كلمة المرور الجديدة" },
            { min: 8, message: "على الأقل 8 أحرف" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
            placeholder="••••••••"
            size="large"
            iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="confirm_password"
          label="تأكيد كلمة المرور"
          dependencies={["new_password"]}
          rules={[
            { required: true, message: "أكد كلمة المرور" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("new_password") === value)
                  return Promise.resolve();
                return Promise.reject("كلمتا المرور غير متطابقتين");
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
            placeholder="••••••••"
            size="large"
            iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Button
          type="primary"
          icon={<SafetyCertificateOutlined />}
          loading={loading}
          onClick={handleSubmit}
          size="large"
          style={{
            background: "linear-gradient(135deg, #F59E0B, #EF4444)",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          تغيير كلمة المرور
        </Button>
      </Form>
    </Card>
  );
}

// ── App Info Section ──────────────────────────────────────────────────────────

function AppInfoSection() {
  const { user } = useAuthStore();
  const items = [
    { label: "الإصدار", value: "v1.0.0" },
    { label: "الدور", value: user?.role || "—" },
    { label: "البريد", value: user?.email || "—" },
  ];

  return (
    <Card
      style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
      bodyStyle={{ padding: 24 }}
    >
      <Space style={{ marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppstoreOutlined style={{ color: "#6366F1", fontSize: 18 }} />
        </div>
        <Text style={{ fontWeight: 700, fontSize: 15 }}>معلومات النظام</Text>
      </Space>

      <Divider style={{ margin: "0 0 16px" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: 10,
              background: "#F8FAFC",
            }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 13 }}>{item.label}</Text>
            <Text style={{ fontWeight: 600, fontSize: 13 }}>{item.value}</Text>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
          الإعدادات
        </Title>
        <Text style={{ color: "#94A3B8", fontSize: 13 }}>
          إدارة حسابك الشخصي وإعدادات الأمان
        </Text>
      </div>

      <Row gutter={[20, 20]}>
        {/* Left col */}
        <Col xs={24} lg={15}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ProfileSection />
            <PasswordSection />
          </div>
        </Col>

        {/* Right col */}
        <Col xs={24} lg={9}>
          <AppInfoSection />
        </Col>
      </Row>
    </div>
  );
}
