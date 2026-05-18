import { Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Card,
    Table,
    Tag,
    Typography,
    Input,
    Space,
    Row,
    Col,
    Statistic,
    Breadcrumb,
} from "antd";
import {
    DollarOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    HistoryOutlined,
    UserOutlined,
    TrophyOutlined,
} from "@ant-design/icons";
import { router } from "@inertiajs/react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function FeesIndex({ auth, fees, filters }) {
    const columns = [
        {
            title: "#",
            key: "index",
            width: 70,
            render: (_, __, index) =>
                (fees.current_page - 1) * fees.per_page + index + 1,
        },
        {
            title: "User",
            key: "user",
            render: (_, record) => (
                <Space>
                    <UserOutlined />
                    <div>
                        <Text strong>{record.user?.name || "N/A"}</Text>
                        <br />
                        <Text type="secondary" size="small">
                            {record.user?.email || "N/A"}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "Contest",
            dataIndex: ["contest", "title"],
            key: "contest",
            render: (text, record) => (
                <Space>
                    <TrophyOutlined />
                    <Text strong>{record.contest?.title || "N/A"}</Text>
                </Space>
            ),
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (amount) => (
                <Text strong style={{ color: "#389e0d" }}>
                    ৳{Number(amount || 0).toFixed(2)}
                </Text>
            ),
        },
        {
            title: "Payment Info",
            key: "payment_info",
            render: (_, record) => (
                <div>
                    <Tag color="blue">
                        {record.payment_method?.toUpperCase() || "N/A"}
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                        ID: {record.transaction_id || "N/A"}
                    </Text>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag
                    color={
                        status === "completed"
                            ? "green"
                            : status === "pending"
                              ? "orange"
                              : "red"
                    }
                    icon={
                        status === "completed" ? <CheckCircleOutlined /> : null
                    }
                >
                    {(status || "unknown").toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => dayjs(date).format("MMM D, YYYY h:mm A"),
        },
    ];

    const handleSearch = (value) => {
        router.get(
            route("admin.contests.fees.index"),
            { ...filters, search: value },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            auth={auth}
            header={
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Title level={4} style={{ margin: 0 }}>
                        Contest Fees
                    </Title>
                    <Breadcrumb
                        items={[
                            { title: "Admin" },
                            { title: "Contests" },
                            { title: "Fees" },
                        ]}
                    />
                </div>
            }
        >
            <div style={{ padding: "0px" }}>
                <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                    <Col xs={24} sm={12} md={8}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Total Transactions"
                                value={fees.total || 0}
                                prefix={<HistoryOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Total Revenue (Fees)"
                                value={fees.data.reduce(
                                    (acc, curr) =>
                                        acc + Number(curr.amount || 0),
                                    0,
                                )}
                                prefix={<DollarOutlined />}
                                suffix="TK"
                                precision={2}
                                valueStyle={{ color: "#389e0d" }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card
                    bordered={false}
                    className="shadow-sm"
                    title={
                        <Space>
                            <DollarOutlined />
                            <span>Transaction History</span>
                        </Space>
                    }
                    extra={
                        <Input.Search
                            placeholder="Search contest or user..."
                            allowClear
                            defaultValue={filters?.search}
                            onSearch={handleSearch}
                            style={{ width: 300 }}
                            prefix={<SearchOutlined />}
                        />
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={fees.data}
                        rowKey="id"
                        pagination={{
                            current: fees.current_page,
                            pageSize: fees.per_page,
                            total: fees.total,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => {
                                router.get(
                                    route("admin.contests.fees.index"),
                                    { ...filters, page, per_page: pageSize },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                );
                            },
                        }}
                        scroll={{ x: 1000 }}
                    />
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
