import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  message,
  Space,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  AppstoreOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { loginApi } from "../../api/authApi";
import useAuthStore from "../../store/authStore";

const { Title, Text, Link } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form] = Form.useForm();

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    try {
      const { data } = await loginApi(email, password);
      if (data.success) {
        const { access, refresh, user } = data.data;
        setAuth(user, access, refresh);
        message.success("أهلاً " + user.name + "! 👋");
        navigate("/dashboard");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "البريد الإلكتروني أو كلمة المرور غلط";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        display: "flex",
        direction: "rtl",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorations */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -300,
          left: -100,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Left panel - branding (desktop only) */}
      <div
        className="hidden lg:flex"
        style={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        <Space orientation="vertical" size={32}>
          <div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              <AppstoreOutlined style={{ color: "#fff", fontSize: 28 }} />
            </div>
            <Title
              level={1}
              style={{
                color: "#fff",
                margin: 0,
                fontSize: 42,
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            >
              لوحة التحكم
            </Title>
            <Title
              level={1}
              style={{
                color: "#6366F1",
                margin: 0,
                fontSize: 42,
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            >
              الإدارية
            </Title>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 16,
                marginTop: 16,
                display: "block",
              }}
            >
              إدارة متجرك الإلكتروني بكفاءة عالية من مكان واحد
            </Text>
          </div>

          {/* Stats teaser */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "طلب نشط", value: "1.2K" },
              { label: "منتج", value: "340+" },
              { label: "عميل", value: "8.5K" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  flex: 1,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Text
                  style={{
                    color: "#6366F1",
                    fontSize: 22,
                    fontWeight: 700,
                    display: "block",
                  }}
                >
                  {s.value}
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  {s.label}
                </Text>
              </div>
            ))}
          </div>
        </Space>
      </div>

      {/* Right panel - login form */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding:
            "env(safe-area-inset-top, 24px) 24px env(safe-area-inset-bottom, 24px)",
          background: "rgba(255,255,255,0.03)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box",
        }}
        className="login-form-panel"
      >
        {/* Mobile top branding strip */}
        <div
          className="lg:hidden"
          style={{ marginBottom: 32, textAlign: "center" }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
            }}
          >
            <AppstoreOutlined style={{ color: "#fff", fontSize: 22 }} />
          </div>
          <Text
            style={{
              color: "#6366F1",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            لوحة التحكم الإدارية
          </Text>
        </div>

        <div style={{ marginBottom: 28 }}>
          {/* Logo on desktop (hidden on mobile since we show it above) */}
          <div
            className="hidden lg:flex"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <AppstoreOutlined style={{ color: "#fff", fontSize: 22 }} />
          </div>

          <Title
            level={3}
            style={{
              color: "#fff",
              margin: 0,
              fontWeight: 700,
              fontSize: "clamp(18px, 5vw, 22px)",
            }}
          >
            أهلاً بعودتك 👋
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 14 }}>
            سجّل الدخول للوصول للوحة التحكم
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          style={{ direction: "rtl" }}
        >
          <Form.Item
            name="email"
            label={
              <Text style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 500 }}>
                البريد الإلكتروني
              </Text>
            }
            rules={[
              { required: true, message: "ادخل البريد الإلكتروني" },
              { type: "email", message: "بريد إلكتروني غير صحيح" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: "#475569" }} />}
              placeholder="admin@example.com"
              size="large"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 15,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <Text style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 500 }}>
                كلمة المرور
              </Text>
            }
            rules={[{ required: true, message: "ادخل كلمة المرور" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#475569" }} />}
              placeholder="••••••••"
              size="large"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 15,
              }}
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox style={{ color: "#94A3B8", fontSize: 13 }}>
                تذكرني
              </Checkbox>
            </Form.Item>
            <Link style={{ color: "#6366F1", fontSize: 13 }}>
              نسيت كلمة المرور؟
            </Link>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              style={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                border: "none",
                borderRadius: 10,
                height: 52,
                fontSize: 15,
                fontWeight: 600,
                boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
              }}
            >
              {loading ? "جاري التحقق..." : "تسجيل الدخول"}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 32 }}>
          <Text
            style={{
              color: "#475569",
              fontSize: 12,
              display: "block",
              textAlign: "center",
            }}
          >
            محمي بـ SSL • جميع الحقوق محفوظة © 2025
          </Text>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        /* Mobile: form takes full width */
        @media (max-width: 1023px) {
          .login-form-panel {
            max-width: 100% !important;
            width: 100% !important;
            border-right: none !important;
            padding: 40px 24px !important;
            min-height: 100vh;
            justify-content: center;
          }
        }

        /* Small phones */
        @media (max-width: 374px) {
          .login-form-panel {
            padding: 32px 16px !important;
          }
        }

        /* Make inputs bigger touch targets on mobile */
        @media (max-width: 1023px) {
          .ant-input-affix-wrapper,
          .ant-input {
            min-height: 48px !important;
          }
        }

        /* Antd dark input text fix */
        .ant-input,
        .ant-input-password input {
          color: #fff !important;
          background: transparent !important;
        }
        .ant-input::placeholder,
        .ant-input-password input::placeholder {
          color: #475569 !important;
        }
        .ant-input-affix-wrapper {
          background: rgba(255,255,255,0.05) !important;
        }
        .ant-input-affix-wrapper:hover,
        .ant-input-affix-wrapper-focused {
          border-color: #6366F1 !important;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.2) !important;
        }
        .ant-checkbox-wrapper:hover .ant-checkbox-inner,
        .ant-checkbox:hover .ant-checkbox-inner {
          border-color: #6366F1 !important;
        }
        .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #6366F1 !important;
          border-color: #6366F1 !important;
        }
        
        /* Hide/show helpers */
        .hidden { display: none !important; }
        @media (min-width: 1024px) {
          .hidden.lg\\:flex { display: flex !important; }
          .lg\\:hidden { display: none !important; }
        }
        @media (max-width: 1023px) {
          .lg\\:hidden { display: block !important; }
        }
      `}</style>
    </div>
  );
}
