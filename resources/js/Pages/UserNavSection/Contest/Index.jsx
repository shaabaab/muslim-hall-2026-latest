import { Link, router } from "@inertiajs/react";
import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";

import {
    Table,
    Button,
    Space,
    Tag,
    Input,
    Card,
    Typography,
    Popconfirm,
    message,
    Tooltip,
    Row,
    Col,
    Select,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    FilterOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ contests, filters, auth }) {
    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    // Search handler
    const handleSearch = (value) => {
        router.get(
            route("user.contests.participate.index"),
            {
                ...filters,
                search: value,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleTableChange = (pagination, filters) => {
        router.get(
            route("user.contests.participate.index"),
            {
                ...filters,
                page: pagination.current,
                per_page: pagination.pageSize,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Reset all filters
    const resetFilters = () => {
        router.get(
            route("user.contests.participate.index"),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            render: (text, record, index) => (
                <Space>
                    <Text strong>{index + 1}</Text>
                </Space>
            ),
        },

        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },

        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },

        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },

        {
            title: "User Type",
            dataIndex: "user_type",
            key: "user_type",
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },

        {
            title: "Payment Type",
            dataIndex: "payment_type",
            key: "payment_type",
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },

        {
            title: "Contest Status",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                switch (Number(status)) {
                    case 1:
                        return <Tag color="blue">Upcoming</Tag>;
                    case 2:
                        return <Tag color="green">Running</Tag>;
                    case 3:
                        return <Tag color="red">Ended</Tag>;
                    case 4:
                        return <Tag color="gray">Archived</Tag>;
                    default:
                        return <Tag color="default">Unknown</Tag>;
                }
            },
        },

        {
            title: "Total Prize Positions",
            key: "prize_positions",
            render: (_, record) => (
                <Text>
                    {record.prizes
                        ? record.prizes.length + " Positions"
                        : "N/A"}
                </Text>
            ),
        },

        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Contest Details">
                        <Link
                            href={route(
                                "user.contests.participate.show",
                                record.id,
                            )}
                        >
                            <Button
                                type="default"
                                icon={<EyeOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>

                    <Tooltip title="Entry of this Contest">
                        <Link href={route("user.entries.create", record.id)}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <FrontAuthenticatedLayout user={auth.user} header="Contest Management">
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Contests
                        </Title>
                        <Text type="secondary">
                            Manage your application contests
                        </Text>
                    </div>
                </div>

                {/* Filters Section */}
                <Card size="small" className="mb-4">
                    <div className="flex items-center mb-4">
                        <FilterOutlined className="mr-2" />
                        <Text strong>Filters & Search</Text>
                    </div>

                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search by title, description..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>

                        <Col xs={24} sm={12} md={4}>
                            <Button
                                icon={<ReloadOutlined />}
                                size="large"
                                onClick={resetFilters}
                                style={{ width: "100%" }}
                            >
                                Reset Filters
                            </Button>
                        </Col>
                    </Row>
                </Card>

                <Table
                    columns={columns}
                    dataSource={contests.data.map((contest) => ({
                        ...contest,
                        key: contest.id,
                    }))}
                    pagination={{
                        current: contests.current_page,
                        pageSize: contests.per_page,
                        total: contests.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} contests`,
                        pageSizeOptions: ["10", "20", "50", "100"],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                    loading={contests.data.length === 0 && !filters.search}
                />
            </Card>
        </FrontAuthenticatedLayout>
    );
}
