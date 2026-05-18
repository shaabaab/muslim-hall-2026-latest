import { Link, usePage } from "@inertiajs/react";
import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import {
    Card,
    Table,
    Tag,
    Typography,
    Input,
    Space,
    Statistic,
    Row,
    Col,
} from "antd";
import {
    DollarOutlined,
    SearchOutlined,
    WalletOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { router } from "@inertiajs/react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function ContestFee({ auth, fees, deposit, filters }) {

    const columns = [
        {
            title: "#",
            key: "index",
            width: 50,
            render: (_, __, index) => (fees.current_page - 1) * fees.per_page + index + 1,
        },
        {
            title: "Contest",
            dataIndex: ["contest", "title"],
            key: "contest",
            render: (text, record) => (
                <Text strong>{record.contest?.title || "N/A"}</Text>
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
            title: "Payment Method",
            dataIndex: "payment_method",
            key: "payment_method",
            render: (method) => (
                <Tag color="blue" style={{ textTransform: "capitalize" }}>
                    {method || "N/A"}
                </Tag>
            ),
        },
        {
            title: "Transaction ID",
            dataIndex: "transaction_id",
            key: "transaction_id",
            render: (txId) => (
                <Text copyable={{ text: txId }} code>
                    {txId || "N/A"}
                </Text>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag
                    color={status === "completed" ? "green" : status === "pending" ? "orange" : "red"}
                    icon={status === "completed" ? <CheckCircleOutlined /> : null}
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
            route("user.contest-fees.index"),
            { ...filters, search: value },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header="Contest Fees"
        >
            <div className="py-4">
                <div className="max-w-7xl mx-auto">
                    {/* Stats Cards */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} sm={12}>
                            <Card>
                                <Statistic
                                    title="Total Deposit"
                                    value={Number(deposit || 0).toFixed(2)}
                                    prefix={<WalletOutlined />}
                                    suffix="TK"
                                    valueStyle={{ color: "#389e0d" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Card>
                                <Statistic
                                    title="Total Transactions"
                                    value={fees.total || 0}
                                    prefix={<DollarOutlined />}
                                    valueStyle={{ color: "#1890ff" }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Transactions Table */}
                    <Card
                        title={
                            <Space>
                                <DollarOutlined />
                                <span>Transaction History</span>
                            </Space>
                        }
                        extra={
                            <Input.Search
                                placeholder="Search by contest..."
                                allowClear
                                defaultValue={filters?.search}
                                onSearch={handleSearch}
                                style={{ width: 250 }}
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
                                        route("user.contest-fees.index"),
                                        { ...filters, page, per_page: pageSize },
                                        { preserveState: true, preserveScroll: true },
                                    );
                                },
                            }}
                            scroll={{ x: 800 }}
                            locale={{
                                emptyText: (
                                    <div className="text-center py-8">
                                        <DollarOutlined style={{ fontSize: 40, color: "#d9d9d9" }} />
                                        <p className="mt-3 text-gray-400">
                                            No contest fee transactions yet.
                                        </p>
                                    </div>
                                ),
                            }}
                        />
                    </Card>
                </div>
            </div>
        </FrontAuthenticatedLayout>
    );
}
