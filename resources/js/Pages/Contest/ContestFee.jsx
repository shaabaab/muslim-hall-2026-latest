import { useForm } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  Typography,
  Space,
  message,
  InputNumber,
  Spin,
  Alert,
  Descriptions,
  Tag,
  Row,
  Col,
  Grid,
} from "antd";
import {
  SaveOutlined,
  CreditCardOutlined,
  UserOutlined,
  TrophyOutlined,
  BankOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  MoneyCollectOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

export default function Create({ auth, contest, sponsors = [], users = [] }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md এর নিচে mobile/tablet layout
  const [loading] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    payment_method: "",
    transaction_id: "",
    status: "completed",
    amount: 0,
    contest_id: contest?.id || "",
    sponsor_id: "",
    user_id: "",
  });

  useEffect(() => {
    if (contest?.id) {
      setData("contest_id", contest.id);
      // contest.entry_fee থাকলে ওটা নাও, না থাকলে contest.amount fallback
      setData("amount", Number(contest.entry_fee ?? contest.amount ?? 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest?.id]);

  const submit = () => {
    post(route("admin.contests.fee.store"), {
      onSuccess: () => {
        message.success("Contest fee created successfully");
        reset("payment_method", "transaction_id", "status", "sponsor_id", "user_id");
        // contest_id & amount আবার সেট করে দিচ্ছি
        setData("contest_id", contest?.id || "");
        setData("amount", Number(contest?.entry_fee ?? contest?.amount ?? 0));
        setData("status", "completed");
      },
      onError: () => {
        message.error("Error creating contest fee");
      },
    });
  };

  const getSponsors = () => (Array.isArray(sponsors) ? sponsors : []);
  const getUsers = () => (Array.isArray(users) ? users : []);

  const getContestStatusColor = (status) => {
    const statusColors = {
      active: "green",
      upcoming: "blue",
      completed: "red",
      cancelled: "red",
      draft: "orange",
    };
    return statusColors[status] || "default";
  };

  // Responsive Col span helpers
  const halfCol = { xs: 24, sm: 24, md: 12 };
  const fullCol = { xs: 24, sm: 24, md: 24 };

  return (
    <Authenticated user={auth.user} header="Create Contest Fee">
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: isMobile ? "12px" : "20px",
        }}
      >
        <Card
          style={{
            borderRadius: 12,
          }}
          bodyStyle={{
            padding: isMobile ? 14 : 22,
          }}
        >
          <div style={{ marginBottom: isMobile ? 14 : 18 }}>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 6 }}>
              Create New Contest Fee
            </Title>
            <Text type="secondary">Add a new contest fee payment record</Text>
          </div>

          {/* Contest Information Section */}
          {contest && contest.id && (
            <Card
              title={
                <Space>
                  <TrophyOutlined />
                  Contest Information
                </Space>
              }
              style={{
                marginBottom: 16,
                background: "#fafafa",
                borderRadius: 12,
              }}
              bodyStyle={{ padding: isMobile ? 12 : 16 }}
              bordered={false}
              size={isMobile ? "small" : "default"}
            >
              <Descriptions
                bordered
                size={isMobile ? "small" : "default"}
                column={{ xs: 1, sm: 2, md: 2 }}
              >
                <Descriptions.Item label="Contest ID">{contest.id}</Descriptions.Item>

                <Descriptions.Item label="Contest Name">
                  <strong>{contest.title || "N/A"}</strong>
                </Descriptions.Item>

                <Descriptions.Item label="Description" span={2}>
                  {contest.description || "No description available"}
                </Descriptions.Item>

                <Descriptions.Item label="Entry Fee">
                  <Space>
                    <MoneyCollectOutlined />
                    <Text strong>৳{contest.entry_fee ?? contest.amount ?? 0}</Text>
                  </Space>
                </Descriptions.Item>

                <Descriptions.Item label="Status">
                  <Tag color={getContestStatusColor(contest.status)}>
                    {contest.status == 2 ? "Running" : contest.status}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Start Date">
                  <Space>
                    <CalendarOutlined />
                    {contest.start_date || "N/A"}
                  </Space>
                </Descriptions.Item>

                <Descriptions.Item label="End Date">
                  <Space>
                    <CalendarOutlined />
                    {contest.end_date || "N/A"}
                  </Space>
                </Descriptions.Item>

                {contest.max_participants && (
                  <Descriptions.Item label="Max Participants">
                    {contest.max_participants}
                  </Descriptions.Item>
                )}

                {contest.current_participants !== undefined && (
                  <Descriptions.Item label="Current Participants">
                    {contest.current_participants}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          {(!contest?.id || !getUsers().length) && (
            <Alert
              message="Data Required"
              description="Please make sure contest and users are available in the system."
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              style={{ marginBottom: 16, borderRadius: 10 }}
            />
          )}

          <Spin spinning={loading}>
            <Form
              layout="vertical"
              onFinish={submit}
              style={{
                maxWidth: 760,
              }}
            >
              {/* Hidden contest_id field */}
              {contest?.id && (
                <Form.Item hidden>
                  <Input
                    value={data.contest_id}
                    onChange={(e) => setData("contest_id", e.target.value)}
                  />
                </Form.Item>
              )}

              <Row gutter={[12, 12]}>
                <Col {...halfCol}>
                  <Form.Item
                    label="Payment Method"
                    validateStatus={errors.payment_method ? "error" : ""}
                    help={errors.payment_method}
                    required
                  >
                    <Select
                      size="large"
                      placeholder="Select Payment Method"
                      value={data.payment_method}
                      onChange={(value) => setData("payment_method", value)}
                      suffixIcon={<CreditCardOutlined />}
                      style={{ width: "100%" }}
                    >
                      <Option value="credit_card">Credit Card</Option>
                      <Option value="debit_card">Debit Card</Option>
                      <Option value="paypal">PayPal</Option>
                      <Option value="bank_transfer">Bank Transfer</Option>
                      <Option value="stripe">Stripe</Option>
                      <Option value="cash">Cash</Option>
                      <Option value="bkash">bKash</Option>
                      <Option value="nagad">Nagad</Option>
                      <Option value="rocket">Rocket</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col {...halfCol}>
                  <Form.Item
                    label="Status"
                    validateStatus={errors.status ? "error" : ""}
                    help={errors.status}
                    required
                  >
                    <Select
                      size="large"
                      placeholder="Select Status"
                      value={data.status}
                      onChange={(value) => setData("status", value)}
                      style={{ width: "100%" }}
                    >
                      <Option value="pending">Pending</Option>
                      <Option value="completed">Completed</Option>
                      <Option value="failed">Failed</Option>
                      <Option value="refunded">Refunded</Option>
                      <Option value="cancelled">Cancelled</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col {...fullCol}>
                  <Form.Item
                    label="Transaction ID"
                    validateStatus={errors.transaction_id ? "error" : ""}
                    help={errors.transaction_id}
                    required
                  >
                    <Input
                      size="large"
                      placeholder="Enter transaction ID"
                      value={data.transaction_id}
                      onChange={(e) => setData("transaction_id", e.target.value)}
                      prefix={<BankOutlined />}
                    />
                  </Form.Item>
                </Col>

                <Col {...halfCol}>
                  <Form.Item
                    label="Amount (৳)"
                    validateStatus={errors.amount ? "error" : ""}
                    help={errors.amount}
                    required
                  >
                    <InputNumber
                      size="large"
                      placeholder="Enter amount"
                      value={data.amount}
                      onChange={(value) => setData("amount", value ?? 0)}
                      min={0}
                      step={1}
                      style={{ width: "100%" }}
                      addonBefore="৳"
                    />
                  </Form.Item>
                </Col>

                <Col {...halfCol}>
                  <Form.Item
                    label="User"
                    validateStatus={errors.user_id ? "error" : ""}
                    help={errors.user_id}
                    required
                  >
                    <Select
                      size="large"
                      placeholder="Select User"
                      value={data.user_id}
                      onChange={(value) => setData("user_id", value)}
                      suffixIcon={<UserOutlined />}
                      showSearch
                      optionFilterProp="label"
                      disabled={!getUsers().length}
                      style={{ width: "100%" }}
                    >
                      {getUsers().map((user) => {
                        const label = user.name || user.email || `User #${user.id}`;
                        return (
                          <Option key={user.id} value={user.id} label={label}>
                            {label}
                          </Option>
                        );
                      })}
                    </Select>

                    {!getUsers().length && (
                      <Text type="warning" style={{ fontSize: 12 }}>
                        No users available.
                      </Text>
                    )}
                  </Form.Item>
                </Col>

                <Col {...fullCol}>
                  <Form.Item
                    label="Sponsor (Optional)"
                    validateStatus={errors.sponsor_id ? "error" : ""}
                    help={errors.sponsor_id}
                  >
                    <Select
                      size="large"
                      placeholder="Select Sponsor"
                      value={data.sponsor_id}
                      onChange={(value) => setData("sponsor_id", value)}
                      suffixIcon={<UserOutlined />}
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      disabled={!getSponsors().length}
                      style={{ width: "100%" }}
                    >
                      {getSponsors().map((sp) => {
                        const label = sp.name || `Sponsor #${sp.id}`;
                        return (
                          <Option key={sp.id} value={sp.id} label={label}>
                            {label}
                          </Option>
                        );
                      })}
                    </Select>

                    {!getSponsors().length && (
                      <Text type="warning" style={{ fontSize: 12 }}>
                        No sponsors available.
                      </Text>
                    )}
                  </Form.Item>
                </Col>

                <Col {...fullCol}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      justifyContent: isMobile ? "stretch" : "flex-start",
                    }}
                  >
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={processing}
                      icon={<SaveOutlined />}
                      size="large"
                      disabled={!contest?.id || !getUsers().length}
                      style={{
                        width: isMobile ? "100%" : "auto",
                        borderRadius: 10,
                      }}
                    >
                      Create Contest Fee
                    </Button>

                    {/* Back button চাইলে uncomment করো */}
                    {/* <Link href={route("admin.contests.show", contest?.id)}>
                      <Button
                        size="large"
                        icon={<ArrowLeftOutlined />}
                        style={{ width: isMobile ? "100%" : "auto", borderRadius: 10 }}
                      >
                        Back to Contest
                      </Button>
                    </Link> */}
                  </div>
                </Col>
              </Row>
            </Form>
          </Spin>
        </Card>
      </div>
    </Authenticated>
  );
}