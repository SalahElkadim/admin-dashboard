/**
 * ============================================================
 *  ERP — HRPage.jsx  (5 تابات: أقسام + موظفون + حضور + إجازات + أهداف)
 * ============================================================
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Tabs,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  TimePicker,
  message,
  Popconfirm,
  Empty,
  Progress,
  Avatar,
  Badge,
  InputNumber,
} from "antd";
import {
  TeamOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  CalendarOutlined,
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getSalesTargets,
  createSalesTarget,
  updateSalesTarget,
  deleteSalesTarget,
} from "../../../api/erpApi";

const { Title, Text } = Typography;
const { Option } = Select;

// ─────────────────────────────────────────────────────────────
//  SECTION 0 — DEPARTMENTS
// ─────────────────────────────────────────────────────────────

function DepartmentModal({ open, onClose, onSaved, department, employees }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      department ? form.setFieldsValue(department) : form.resetFields();
    }
  }, [open, department, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (department) {
        await updateDepartment(department.id, values);
        message.success("تم تحديث القسم");
      } else {
        await createDepartment(values);
        message.success("تم إضافة القسم");
      }
      onClose();
      onSaved();
    } catch (err) {
      if (err?.response?.data) message.error("خطأ في البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={department ? "حفظ التعديلات" : "إضافة القسم"}
      cancelText="إلغاء"
      confirmLoading={loading}
      title={
        <Space>
          <ApartmentOutlined style={{ color: "#10B981" }} />
          <span>{department ? "تعديل قسم" : "إضافة قسم جديد"}</span>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="اسم القسم"
          rules={[{ required: true, message: "مطلوب" }]}
        >
          <Input placeholder="مثال: المبيعات، المحاسبة، التسويق..." />
        </Form.Item>
        <Form.Item name="manager" label="المدير المسؤول (اختياري)">
          <Select placeholder="اختر الموظف المدير" allowClear>
            {employees.map((e) => (
              <Option key={e.id} value={e.id}>
                {e.full_name || e.name || `موظف #${e.id}`} —{" "}
                {e.job_title || "—"}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

function DepartmentsTab({ departments, employees, loading, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteDepartment(id);
      message.success("تم الحذف");
      onRefresh();
    } catch {
      message.error("فشل الحذف — تأكد إن القسم مش مرتبط بموظفين");
    } finally {
      setDeleting(false);
    }
  };

  const empMap = Object.fromEntries(
    employees.map((e) => [e.id, e.full_name || e.name || `#${e.id}`])
  );

  const columns = [
    {
      title: "اسم القسم",
      dataIndex: "name",
      render: (v) => (
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ApartmentOutlined style={{ color: "#6366F1" }} />
          </div>
          <Text strong style={{ fontSize: 13 }}>
            {v}
          </Text>
        </Space>
      ),
    },
    {
      title: "المدير",
      dataIndex: "manager",
      render: (v) =>
        v ? (
          <Tag color="blue">{empMap[v] || `#${v}`}</Tag>
        ) : (
          <Text style={{ color: "#CBD5E1" }}>—</Text>
        ),
    },
    {
      title: "عدد الموظفين",
      render: (_, r) => {
        const count = employees.filter((e) => e.department === r.id).length;
        return <Tag color={count > 0 ? "green" : "default"}>{count} موظف</Tag>;
      },
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "created_at",
      render: (v) => (
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          {v ? dayjs(v).format("DD/MM/YYYY") : "—"}
        </Text>
      ),
    },
    {
      title: "إجراءات",
      align: "center",
      render: (_, r) => (
        <Space>
          <Tooltip title="تعديل">
            <Button
              type="text"
              icon={<EditOutlined />}
              style={{ color: "#10B981" }}
              onClick={() => {
                setSelected(r);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف القسم؟"
            onConfirm={() => handleDelete(r.id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              loading={deleting}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  إجمالي الأقسام
                </Text>
              }
              value={departments.length}
              prefix={<ApartmentOutlined style={{ color: "#6366F1" }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  أقسام بمدير
                </Text>
              }
              value={departments.filter((d) => d.manager).length}
              prefix={<UserOutlined style={{ color: "#10B981" }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  متوسط الموظفين/قسم
                </Text>
              }
              value={
                departments.length
                  ? Math.round(employees.length / departments.length)
                  : 0
              }
              prefix={<TeamOutlined style={{ color: "#F59E0B" }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#10B981", borderColor: "#10B981" }}
            onClick={() => {
              setSelected(null);
              setModalOpen(true);
            }}
          >
            إضافة قسم
          </Button>
        </Space>
      </div>

      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={departments}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: <Empty description="لا توجد أقسام — ابدأ بإضافة قسم" />,
          }}
          pagination={{ pageSize: 10, showTotal: (t) => `إجمالي ${t} قسم` }}
          style={{ direction: "rtl" }}
        />
      </Card>

      <DepartmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={onRefresh}
        department={selected}
        employees={employees}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  SECTION A — EMPLOYEES
// ─────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "دوام كامل", color: "green" },
  { value: "part_time", label: "دوام جزئي", color: "blue" },
  { value: "contract", label: "عقد مؤقت", color: "orange" },
  { value: "freelance", label: "فريلانس", color: "purple" },
];

function EmployeeModal({ open, onClose, onSaved, employee, departments }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (employee) {
        form.setFieldsValue({
          ...employee,
          hire_date: employee.hire_date ? dayjs(employee.hire_date) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, employee, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        hire_date: values.hire_date?.format("YYYY-MM-DD"),
      };
      if (employee) {
        await updateEmployee(employee.id, payload);
        message.success("تم تحديث بيانات الموظف");
      } else {
        await createEmployee(payload);
        message.success("تم إضافة الموظف");
      }
      onClose();
      onSaved();
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
      okText={employee ? "حفظ التعديلات" : "إضافة الموظف"}
      cancelText="إلغاء"
      confirmLoading={loading}
      width={640}
      title={
        <Space>
          <UserOutlined style={{ color: "#10B981" }} />
          <span>{employee ? "تعديل موظف" : "إضافة موظف جديد"}</span>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {/* ✅ اسم الموظف — بدل UserSearchSelect */}
        <Form.Item
          name="name"
          label="اسم الموظف"
          rules={[{ required: true, message: "اكتب اسم الموظف" }]}
        >
          <Input placeholder="مثال: أحمد محمد علي" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="department" label="القسم">
              <Select placeholder="اختر القسم" allowClear>
                {departments.map((d) => (
                  <Option key={d.id} value={d.id}>
                    {d.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="job_title"
              label="المسمى الوظيفي"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <Input placeholder="مثال: مدير مبيعات" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="employment_type" label="نوع التوظيف">
              <Select placeholder="اختر نوع التوظيف">
                {EMPLOYMENT_TYPES.map((t) => (
                  <Option key={t.value} value={t.value}>
                    {t.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="hire_date"
              label="تاريخ التعيين"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="salary" label="الراتب">
              <InputNumber style={{ width: "100%" }} min={0} addonAfter="EGP" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="national_id" label="الرقم القومي">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="emergency_contact" label="جهة اتصال الطوارئ">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="is_active" label="الحالة" initialValue={true}>
              <Select>
                <Option value={true}>نشط</Option>
                <Option value={false}>غير نشط</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

function EmployeesTab({ departments, onRefresh: onDeptRefresh }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      const data = res.data;
      setEmployees(
        data?.results ??
          data?.data?.results ??
          (Array.isArray(data) ? data : [])
      );
    } catch {
      message.error("فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      message.success("تم الحذف");
      fetchEmployees();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const typeMap = Object.fromEntries(EMPLOYMENT_TYPES.map((t) => [t.value, t]));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const activeCount = employees.filter((e) => e.is_active).length;
  const totalSalaries = employees.reduce(
    (s, e) => s + Number(e.salary || 0),
    0
  );

  const columns = [
    {
      title: "الموظف",
      render: (_, r) => (
        <Space>
          <Avatar size={36} style={{ background: "#10B981", fontWeight: 700 }}>
            {(r.name || r.full_name || "م")[0].toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ display: "block", fontSize: 13 }}>
              {r.name || r.full_name || `موظف #${r.id}`}
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>
              {r.job_title}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "القسم",
      dataIndex: "department",
      render: (v) =>
        v ? (
          <Tag color="blue">{deptMap[v] || v}</Tag>
        ) : (
          <Text style={{ color: "#CBD5E1" }}>—</Text>
        ),
    },
    {
      title: "نوع التوظيف",
      dataIndex: "employment_type",
      render: (v) => {
        const t = typeMap[v];
        return t ? <Tag color={t.color}>{t.label}</Tag> : <Tag>{v}</Tag>;
      },
    },
    {
      title: "الراتب",
      dataIndex: "salary",
      render: (v) => (
        <Text style={{ color: "#0F172A", fontWeight: 600 }}>
          {Number(v).toLocaleString()} EGP
        </Text>
      ),
    },
    {
      title: "تاريخ التعيين",
      dataIndex: "hire_date",
      render: (v) => (
        <Text style={{ color: "#64748B", fontSize: 13 }}>{v || "—"}</Text>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "is_active",
      render: (v) =>
        v ? (
          <Badge status="success" text="نشط" />
        ) : (
          <Badge status="default" text="غير نشط" />
        ),
    },
    {
      title: "إجراءات",
      align: "center",
      render: (_, r) => (
        <Space>
          <Tooltip title="تعديل">
            <Button
              type="text"
              icon={<EditOutlined />}
              style={{ color: "#10B981" }}
              onClick={() => {
                setSelected(r);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف الموظف؟"
            onConfirm={() => handleDelete(r.id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  إجمالي الموظفين
                </Text>
              }
              value={employees.length}
              prefix={<TeamOutlined style={{ color: "#10B981" }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  الموظفون النشطون
                </Text>
              }
              value={activeCount}
              prefix={<CheckCircleOutlined style={{ color: "#22C55E" }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  إجمالي الرواتب الشهرية
                </Text>
              }
              value={totalSalaries.toLocaleString()}
              suffix="EGP"
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchEmployees}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#10B981", borderColor: "#10B981" }}
            onClick={() => {
              setSelected(null);
              setModalOpen(true);
            }}
          >
            إضافة موظف
          </Button>
        </Space>
      </div>

      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={employees}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="لا يوجد موظفون" /> }}
          pagination={{ pageSize: 10, showTotal: (t) => `إجمالي ${t} موظف` }}
          style={{ direction: "rtl" }}
        />
      </Card>

      <EmployeeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          fetchEmployees();
          onDeptRefresh?.();
        }}
        employee={selected}
        departments={departments}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  SECTION B — ATTENDANCE
// ─────────────────────────────────────────────────────────────

const ATTENDANCE_STATUS = [
  { value: "present", label: "حاضر", color: "green" },
  { value: "absent", label: "غائب", color: "red" },
  { value: "late", label: "متأخر", color: "orange" },
  { value: "half_day", label: "نصف يوم", color: "blue" },
  { value: "on_leave", label: "إجازة", color: "purple" },
];
const attStatusMap = Object.fromEntries(
  ATTENDANCE_STATUS.map((s) => [s.value, s])
);

function AttendanceModal({ open, onClose, onSaved, record, employees }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (record) {
        form.setFieldsValue({
          ...record,
          date: record.date ? dayjs(record.date) : null,
          check_in: record.check_in ? dayjs(record.check_in, "HH:mm:ss") : null,
          check_out: record.check_out
            ? dayjs(record.check_out, "HH:mm:ss")
            : null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ date: dayjs(), status: "present" });
      }
    }
  }, [open, record, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        date: values.date?.format("YYYY-MM-DD"),
        check_in: values.check_in?.format("HH:mm:ss"),
        check_out: values.check_out?.format("HH:mm:ss"),
      };
      if (record) {
        await updateAttendance(record.id, payload);
        message.success("تم التحديث");
      } else {
        await createAttendance(payload);
        message.success("تم التسجيل");
      }
      onClose();
      onSaved();
    } catch (err) {
      if (err?.response?.data) message.error("خطأ في البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={record ? "حفظ" : "تسجيل"}
      cancelText="إلغاء"
      confirmLoading={loading}
      title={
        <Space>
          <CalendarOutlined style={{ color: "#10B981" }} />
          <span>{record ? "تعديل سجل الحضور" : "تسجيل حضور"}</span>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            {/* ✅ اختيار الموظف من قائمة بالاسم */}
            <Form.Item
              name="employee"
              label="الموظف"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <Select
                placeholder="اختر الموظف"
                showSearch
                optionFilterProp="children"
              >
                {employees.map((e) => (
                  <Option key={e.id} value={e.id}>
                    {e.name || e.full_name || `#${e.id}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="check_in" label="وقت الحضور">
              <TimePicker style={{ width: "100%" }} format="HH:mm" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="check_out" label="وقت الانصراف">
              <TimePicker style={{ width: "100%" }} format="HH:mm" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="status" label="الحالة" initialValue="present">
          <Select>
            {ATTENDANCE_STATUS.map((s) => (
              <Option key={s.value} value={s.value}>
                {s.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="notes" label="ملاحظات">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function AttendanceTab({ employees }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterDate, setFilterDate] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDate) params.date = filterDate.format("YYYY-MM-DD");
      const res = await getAttendance(params);
      const data = res.data;
      setRecords(
        data?.results ??
          data?.data?.results ??
          (Array.isArray(data) ? data : [])
      );
    } catch {
      message.error("فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    try {
      await deleteAttendance(id);
      message.success("تم الحذف");
      fetchData();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  const columns = [
    {
      title: "الموظف",
      dataIndex: "employee",
      render: (v, r) => (
        <Space>
          <Avatar size={28} style={{ background: "#10B981", fontSize: 11 }}>
            {(r.employee_name?.[0] || "م").toUpperCase()}
          </Avatar>
          <Text strong style={{ fontSize: 13 }}>
            {r.employee_name || `#${v}`}
          </Text>
        </Space>
      ),
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      render: (v) => (
        <Text style={{ color: "#64748B", fontSize: 13 }}>{v}</Text>
      ),
    },
    {
      title: "الحضور",
      dataIndex: "check_in",
      render: (v) =>
        v ? (
          <Space size={4}>
            <ClockCircleOutlined style={{ color: "#22C55E" }} />
            <Text style={{ fontSize: 13 }}>{v?.slice(0, 5)}</Text>
          </Space>
        ) : (
          <Text style={{ color: "#CBD5E1" }}>—</Text>
        ),
    },
    {
      title: "الانصراف",
      dataIndex: "check_out",
      render: (v) =>
        v ? (
          <Space size={4}>
            <ClockCircleOutlined style={{ color: "#EF4444" }} />
            <Text style={{ fontSize: 13 }}>{v?.slice(0, 5)}</Text>
          </Space>
        ) : (
          <Text style={{ color: "#CBD5E1" }}>—</Text>
        ),
    },
    {
      title: "ساعات العمل",
      dataIndex: "hours_worked",
      render: (v) => (
        <Tag color={v > 0 ? "green" : "default"}>{v || 0} ساعة</Tag>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      render: (v) => {
        const s = attStatusMap[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{v}</Tag>;
      },
    },
    {
      title: "إجراءات",
      align: "center",
      render: (_, r) => (
        <Space>
          <Tooltip title="تعديل">
            <Button
              type="text"
              icon={<EditOutlined />}
              style={{ color: "#10B981" }}
              onClick={() => {
                setSelected(r);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف السجل؟"
            onConfirm={() => handleDelete(r.id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          {
            label: "إجمالي السجلات",
            value: records.length,
            color: "#10B981",
            icon: <CalendarOutlined />,
          },
          {
            label: "حاضر",
            value: presentCount,
            color: "#22C55E",
            icon: <CheckCircleOutlined />,
          },
          {
            label: "غائب",
            value: absentCount,
            color: "#EF4444",
            icon: <ClockCircleOutlined />,
          },
        ].map((s, i) => (
          <Col span={8} key={i}>
            <Card
              size="small"
              style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#64748B", fontSize: 12 }}>
                    {s.label}
                  </Text>
                }
                value={s.value}
                prefix={React.cloneElement(s.icon, {
                  style: { color: s.color },
                })}
                valueStyle={{ color: "#0F172A", fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <DatePicker
          placeholder="تصفية بالتاريخ"
          value={filterDate}
          onChange={setFilterDate}
          allowClear
        />
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#10B981", borderColor: "#10B981" }}
            onClick={() => {
              setSelected(null);
              setModalOpen(true);
            }}
          >
            تسجيل حضور
          </Button>
        </Space>
      </div>

      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="لا توجد سجلات" /> }}
          pagination={{ pageSize: 10 }}
          style={{ direction: "rtl" }}
        />
      </Card>

      <AttendanceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchData}
        record={selected}
        employees={employees}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  SECTION C — LEAVE REQUESTS
// ─────────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  { value: "annual", label: "إجازة سنوية", color: "blue" },
  { value: "sick", label: "إجازة مرضية", color: "red" },
  { value: "unpaid", label: "إجازة بدون راتب", color: "orange" },
  { value: "maternity", label: "إجازة أمومة", color: "pink" },
  { value: "emergency", label: "طارئ", color: "volcano" },
];
const LEAVE_STATUS = [
  { value: "pending", label: "قيد المراجعة", color: "gold" },
  { value: "approved", label: "موافق عليه", color: "green" },
  { value: "rejected", label: "مرفوض", color: "red" },
];
const leaveTypeMap = Object.fromEntries(LEAVE_TYPES.map((t) => [t.value, t]));
const leaveStatusMap = Object.fromEntries(
  LEAVE_STATUS.map((s) => [s.value, s])
);

function LeaveRequestModal({ open, onClose, onSaved, leave, employees }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (leave) {
        form.setFieldsValue({
          ...leave,
          start_date: leave.start_date ? dayjs(leave.start_date) : null,
          end_date: leave.end_date ? dayjs(leave.end_date) : null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ status: "pending" });
      }
    }
  }, [open, leave, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        start_date: values.start_date?.format("YYYY-MM-DD"),
        end_date: values.end_date?.format("YYYY-MM-DD"),
      };
      if (leave) {
        await updateLeaveRequest(leave.id, payload);
        message.success("تم التحديث");
      } else {
        await createLeaveRequest(payload);
        message.success("تم تقديم الطلب");
      }
      onClose();
      onSaved();
    } catch (err) {
      if (err?.response?.data) message.error("خطأ في البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={leave ? "حفظ" : "تقديم الطلب"}
      cancelText="إلغاء"
      confirmLoading={loading}
      title={
        <Space>
          <CalendarOutlined style={{ color: "#10B981" }} />
          <span>{leave ? "تعديل طلب الإجازة" : "طلب إجازة جديد"}</span>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            {/* ✅ اختيار الموظف من قائمة بالاسم */}
            <Form.Item
              name="employee"
              label="الموظف"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <Select
                placeholder="اختر الموظف"
                showSearch
                optionFilterProp="children"
              >
                {employees.map((e) => (
                  <Option key={e.id} value={e.id}>
                    {e.name || e.full_name || `#${e.id}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label="نوع الإجازة"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <Select placeholder="اختر نوع الإجازة">
                {LEAVE_TYPES.map((t) => (
                  <Option key={t.value} value={t.value}>
                    {t.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="start_date"
              label="من"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="end_date"
              label="إلى"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="status" label="الحالة" initialValue="pending">
          <Select>
            {LEAVE_STATUS.map((s) => (
              <Option key={s.value} value={s.value}>
                {s.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="reason" label="السبب">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function LeaveRequestsTab({ employees }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await getLeaveRequests(params);
      const data = res.data;
      setLeaves(
        data?.results ??
          data?.data?.results ??
          (Array.isArray(data) ? data : [])
      );
    } catch {
      message.error("فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    try {
      await deleteLeaveRequest(id);
      message.success("تم الحذف");
      fetchData();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;

  const columns = [
    {
      title: "الموظف",
      dataIndex: "employee",
      render: (v, r) => (
        <Space>
          <Avatar size={28} style={{ background: "#6366F1", fontSize: 11 }}>
            {(r.employee_name?.[0] || "م").toUpperCase()}
          </Avatar>
          <Text strong style={{ fontSize: 13 }}>
            {r.employee_name || `#${v}`}
          </Text>
        </Space>
      ),
    },
    {
      title: "نوع الإجازة",
      dataIndex: "type",
      render: (v) => {
        const t = leaveTypeMap[v];
        return t ? <Tag color={t.color}>{t.label}</Tag> : <Tag>{v}</Tag>;
      },
    },
    {
      title: "الفترة",
      render: (_, r) => (
        <Text style={{ fontSize: 13, color: "#64748B" }}>
          {r.start_date} → {r.end_date}
        </Text>
      ),
    },
    {
      title: "عدد الأيام",
      dataIndex: "days_count",
      render: (v) => <Tag color="blue">{v} أيام</Tag>,
    },
    {
      title: "الحالة",
      dataIndex: "status",
      render: (v) => {
        const s = leaveStatusMap[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{v}</Tag>;
      },
    },
    {
      title: "إجراءات",
      align: "center",
      render: (_, r) => (
        <Space>
          <Tooltip title="تعديل">
            <Button
              type="text"
              icon={<EditOutlined />}
              style={{ color: "#10B981" }}
              onClick={() => {
                setSelected(r);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف الطلب؟"
            onConfirm={() => handleDelete(r.id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { label: "إجمالي الطلبات", value: leaves.length, color: "#10B981" },
          { label: "قيد المراجعة", value: pendingCount, color: "#F59E0B" },
          { label: "موافق عليه", value: approvedCount, color: "#22C55E" },
        ].map((s, i) => (
          <Col span={8} key={i}>
            <Card
              size="small"
              style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#64748B", fontSize: 12 }}>
                    {s.label}
                  </Text>
                }
                value={s.value}
                valueStyle={{ color: s.color, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <Select
          placeholder="تصفية بالحالة"
          value={filterStatus}
          onChange={setFilterStatus}
          allowClear
          style={{ width: 180 }}
        >
          {LEAVE_STATUS.map((s) => (
            <Option key={s.value} value={s.value}>
              {s.label}
            </Option>
          ))}
        </Select>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#10B981", borderColor: "#10B981" }}
            onClick={() => {
              setSelected(null);
              setModalOpen(true);
            }}
          >
            طلب إجازة
          </Button>
        </Space>
      </div>

      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={leaves}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="لا توجد طلبات إجازة" /> }}
          pagination={{ pageSize: 10 }}
          style={{ direction: "rtl" }}
        />
      </Card>

      <LeaveRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchData}
        leave={selected}
        employees={employees}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  SECTION D — SALES TARGETS
// ─────────────────────────────────────────────────────────────

function SalesTargetModal({ open, onClose, onSaved, target, employees }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (target) {
        form.setFieldsValue({
          ...target,
          period_start: target.period_start ? dayjs(target.period_start) : null,
          period_end: target.period_end ? dayjs(target.period_end) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, target, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        period_start: values.period_start?.format("YYYY-MM-DD"),
        period_end: values.period_end?.format("YYYY-MM-DD"),
      };
      if (target) {
        await updateSalesTarget(target.id, payload);
        message.success("تم التحديث");
      } else {
        await createSalesTarget(payload);
        message.success("تم إنشاء الهدف");
      }
      onClose();
      onSaved();
    } catch (err) {
      if (err?.response?.data) message.error("خطأ في البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={target ? "حفظ" : "إنشاء الهدف"}
      cancelText="إلغاء"
      confirmLoading={loading}
      title={
        <Space>
          <AimOutlined style={{ color: "#10B981" }} />
          <span>{target ? "تعديل الهدف" : "هدف مبيعات جديد"}</span>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {/* ✅ اختيار الموظف من قائمة بالاسم */}
        <Form.Item
          name="employee"
          label="الموظف"
          rules={[{ required: true, message: "مطلوب" }]}
        >
          <Select
            placeholder="اختر الموظف"
            showSearch
            optionFilterProp="children"
          >
            {employees.map((e) => (
              <Option key={e.id} value={e.id}>
                {e.name || e.full_name || `#${e.id}`}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="period_start"
              label="بداية الفترة"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="period_end"
              label="نهاية الفترة"
              rules={[{ required: true, message: "مطلوب" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="target_amount"
          label="المبلغ المستهدف"
          rules={[{ required: true, message: "مطلوب" }]}
        >
          <InputNumber style={{ width: "100%" }} min={0} addonAfter="EGP" />
        </Form.Item>

        <Form.Item name="notes" label="ملاحظات">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function SalesTargetsTab({ employees }) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSalesTargets();
      const data = res.data;
      setTargets(
        data?.results ??
          data?.data?.results ??
          (Array.isArray(data) ? data : [])
      );
    } catch {
      message.error("فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    try {
      await deleteSalesTarget(id);
      message.success("تم الحذف");
      fetchData();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const avgAchievement = targets.length
    ? Math.round(
        targets.reduce((s, t) => s + Number(t.achievement_percentage || 0), 0) /
          targets.length
      )
    : 0;

  const columns = [
    {
      title: "الموظف",
      dataIndex: "employee",
      render: (v, r) => (
        <Space>
          <Avatar size={32} style={{ background: "#10B981" }}>
            {(r.employee_name?.[0] || "م").toUpperCase()}
          </Avatar>
          <Text strong style={{ fontSize: 13 }}>
            {r.employee_name || `#${v}`}
          </Text>
        </Space>
      ),
    },
    {
      title: "الفترة",
      render: (_, r) => (
        <Text style={{ fontSize: 13, color: "#64748B" }}>
          {r.period_start} → {r.period_end}
        </Text>
      ),
    },
    {
      title: "الهدف",
      dataIndex: "target_amount",
      render: (v) => (
        <Text style={{ fontWeight: 600, color: "#0F172A" }}>
          {Number(v).toLocaleString()} EGP
        </Text>
      ),
    },
    {
      title: "المُحقق",
      dataIndex: "achieved_amount",
      render: (v) => (
        <Text style={{ fontWeight: 600, color: "#10B981" }}>
          {Number(v || 0).toLocaleString()} EGP
        </Text>
      ),
    },
    {
      title: "نسبة الإنجاز",
      dataIndex: "achievement_percentage",
      render: (v) => {
        const pct = Number(v || 0);
        return (
          <div style={{ minWidth: 120 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: pct >= 100 ? "#10B981" : "#64748B",
                  fontWeight: 700,
                }}
              >
                {pct}%
              </Text>
              {pct >= 100 && <TrophyOutlined style={{ color: "#F59E0B" }} />}
            </div>
            <Progress
              percent={Math.min(pct, 100)}
              size="small"
              showInfo={false}
              strokeColor={
                pct >= 100 ? "#10B981" : pct >= 75 ? "#F59E0B" : "#EF4444"
              }
            />
          </div>
        );
      },
    },
    {
      title: "إجراءات",
      align: "center",
      render: (_, r) => (
        <Space>
          <Tooltip title="تعديل">
            <Button
              type="text"
              icon={<EditOutlined />}
              style={{ color: "#10B981" }}
              onClick={() => {
                setSelected(r);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف الهدف؟"
            onConfirm={() => handleDelete(r.id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  إجمالي الأهداف
                </Text>
              }
              value={targets.length}
              prefix={<AimOutlined style={{ color: "#10B981" }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  متوسط الإنجاز
                </Text>
              }
              value={avgAchievement}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: "#F59E0B" }} />}
              valueStyle={{
                color: avgAchievement >= 75 ? "#10B981" : "#EF4444",
                fontWeight: 700,
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Statistic
              title={
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  أهداف مكتملة
                </Text>
              }
              value={
                targets.filter(
                  (t) => Number(t.achievement_percentage || 0) >= 100
                ).length
              }
              prefix={<CheckCircleOutlined style={{ color: "#22C55E" }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#10B981", borderColor: "#10B981" }}
            onClick={() => {
              setSelected(null);
              setModalOpen(true);
            }}
          >
            هدف جديد
          </Button>
        </Space>
      </div>

      <Card
        style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={targets}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="لا توجد أهداف" /> }}
          pagination={{ pageSize: 10 }}
          style={{ direction: "rtl" }}
        />
      </Card>

      <SalesTargetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchData}
        target={selected}
        employees={employees}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN HR PAGE
// ─────────────────────────────────────────────────────────────

export default function HRPage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const fetchShared = useCallback(async () => {
    setDeptLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        getDepartments(),
        getEmployees(),
      ]);
      const deptData = deptRes.data;
      const empData = empRes.data;
      setDepartments(
        deptData?.results ??
          deptData?.data?.results ??
          (Array.isArray(deptData) ? deptData : [])
      );
      setEmployees(
        empData?.results ??
          empData?.data?.results ??
          (Array.isArray(empData) ? empData : [])
      );
    } catch {
      message.error("فشل تحميل البيانات الأساسية");
    } finally {
      setDeptLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShared();
  }, [fetchShared]);

  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#0F172A" }}>
          <TeamOutlined style={{ color: "#10B981", marginLeft: 8 }} />
          الموارد البشرية
        </Title>
        <Text style={{ color: "#94A3B8", fontSize: 13 }}>
          إدارة الأقسام والموظفين والحضور والإجازات وأهداف المبيعات
        </Text>
      </div>

      <Tabs
        defaultActiveKey="departments"
        type="card"
        style={{ direction: "rtl" }}
        items={[
          {
            key: "departments",
            label: (
              <Space size={6}>
                <ApartmentOutlined />
                <span>الأقسام</span>
              </Space>
            ),
            children: (
              <DepartmentsTab
                departments={departments}
                employees={employees}
                loading={deptLoading}
                onRefresh={fetchShared}
              />
            ),
          },
          {
            key: "employees",
            label: (
              <Space size={6}>
                <UserOutlined />
                <span>الموظفون</span>
              </Space>
            ),
            children: (
              <EmployeesTab departments={departments} onRefresh={fetchShared} />
            ),
          },
          {
            key: "attendance",
            label: (
              <Space size={6}>
                <CalendarOutlined />
                <span>الحضور والانصراف</span>
              </Space>
            ),
            // ✅ بنبعت employees للـ AttendanceTab عشان يستخدمهم في الـ modal والجدول
            children: <AttendanceTab employees={employees} />,
          },
          {
            key: "leave",
            label: (
              <Space size={6}>
                <ClockCircleOutlined />
                <span>طلبات الإجازة</span>
              </Space>
            ),
            children: <LeaveRequestsTab employees={employees} />,
          },
          {
            key: "targets",
            label: (
              <Space size={6}>
                <AimOutlined />
                <span>أهداف المبيعات</span>
              </Space>
            ),
            children: <SalesTargetsTab employees={employees} />,
          },
        ]}
      />
    </div>
  );
}
