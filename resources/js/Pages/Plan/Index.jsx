import { Link, router } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";

import {
    Table,
    Button,
    Space,
    Tag,
    Card,
    Typography,
    Popconfirm,
    message,
    Tooltip,
    Input,
    Select,
    Row,
    Col,
    Pagination,
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ plans, filters, auth }) {
    const PLAN_FREE = 1;
    const PLAN_PAID = 2;

    const planTypes = {
        [PLAN_FREE]: { text: "Free", color: "green" },
        [PLAN_PAID]: { text: "Paid", color: "blue" },
    };

    const handleDelete = (id) => {
        router.delete(route("admin.plans.destroy", id), {
            onSuccess: () => {
                message.success("Plan deleted successfully");
            },
            onError: () => {
                message.error("Error deleting plan");
            },
        });
    };

    const handleSearch = (value) => {
        router.get(
            route("admin.plans.index"),
            {
                ...filters,
                search: value,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleFilter = (key, value) => {
        router.get(
            route("admin.plans.index"),
            {
                ...filters,
                [key]: value,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleTableChange = (pagination, tableFilters, sorter) => {
        router.get(
            route("admin.plans.index"),
            {
                ...filters,
                sort_field: sorter.field || "id",
                sort_direction: sorter.order === "ascend" ? "asc" : "desc",
                page: pagination.current,
                per_page: pagination.pageSize,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const resetFilters = () => {
        router.get(
            route("admin.plans.index"),
            {},
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: true,
            width: 80,
            responsive: ["md"],
        },
        {
            title: "Plan Name",
            dataIndex: "name",
            key: "name",
            sorter: true,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Plan Type",
            dataIndex: "plan_type",
            key: "plan_type",
            sorter: true,
            responsive: ["sm"],
            render: (text) => (
                <Tag color={planTypes[text]?.color || "default"}>
                    {planTypes[text]?.text || "Unknown"}
                </Tag>
            ),
        },
        {
            title: "Plan Status",
            dataIndex: "status",
            key: "status",
            sorter: true,
            sortOrder:
                filters.sort_field === "status"
                    ? filters.sort_direction === "asc"
                        ? "ascend"
                        : "descend"
                    : false,
            render: (text) => (
                <Tag color={text ? "green" : "red"}>
                    {text ? "Active" : "Inactive"}
                </Tag>
            ),
        },
        {
            title: "Validity",
            dataIndex: "validity",
            key: "validity",
            sorter: true,
            responsive: ["lg"],
            render: (text) => <Text strong>{text} Days</Text>,
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            sorter: true,
            responsive: ["md"],
            render: (text) => <Text strong>{text} Tk</Text>,
        },
        {
            title: "Features",
            dataIndex: "features",
            key: "features",
            width: 220,
            responsive: ["lg"],
            render: (features) => (
                <div className="flex flex-wrap gap-1">
                    {Array.isArray(features) &&
                        features.map((value, index) => (
                            <Tag key={index}>{value}</Tag>
                        ))}
                </div>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            fixed: "right",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Popconfirm
                        title="Delete Plan"
                        description="Are you sure to delete this plan?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Plan">
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Authenticated user={auth.user} header="Plan Management">
            <Card className="rounded-xl shadow-sm border-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mb-6">
                    <div className="text-center sm:text-left">
                        <Title level={3} className="!mb-1">
                            Plans
                        </Title>
                        <Text type="secondary">
                            Manage your application plans
                        </Text>
                    </div>

                    <Link href={route("admin.plans.create")}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            className="w-full sm:w-auto"
                        >
                            Add New Plan
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card size="small" className="mb-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <FilterOutlined />
                        <Text strong>Filters & Search</Text>
                    </div>

                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={10}>
                            <Search
                                placeholder="Search by name, description..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>

                        <Col xs={24} sm={12} md={5}>
                            <Select
                                placeholder="Status"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.status || null}
                                onChange={(value) =>
                                    handleFilter("status", value)
                                }
                            >
                                <Option value="1">Active</Option>
                                <Option value="0">Inactive</Option>
                            </Select>
                        </Col>

                        <Col xs={24} sm={12} md={5}>
                            <Select
                                placeholder="Plan Type"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.plan_type || null}
                                onChange={(value) =>
                                    handleFilter("plan_type", value)
                                }
                            >
                                <Option value="1">Free</Option>
                                <Option value="2">Paid</Option>
                            </Select>
                        </Col>

                        <Col xs={24} md={4}>
                            <Button
                                icon={<ReloadOutlined />}
                                size="large"
                                onClick={resetFilters}
                                className="w-full"
                            >
                                Reset Filters
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Mobile Card View */}
                <div className="block md:hidden space-y-4">
                    {plans?.data?.length > 0 ? (
                        plans.data.map((plan) => (
                            <Card
                                key={plan.id}
                                size="small"
                                className="rounded-2xl shadow-sm border border-gray-100"
                            >
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <Title level={5} className="!mb-1">
                                            {plan.name}
                                        </Title>
                                        <Text type="secondary">
                                            Plan ID: #{plan.id}
                                        </Text>
                                    </div>

                                    <Tag color={plan.status ? "green" : "red"}>
                                        {plan.status ? "Active" : "Inactive"}
                                    </Tag>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <Text strong className="block">
                                            {planTypes[plan.plan_type]?.text ||
                                                "Unknown"}
                                        </Text>
                                        <Text type="secondary" className="text-xs">
                                            Type
                                        </Text>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <Text strong className="block">
                                            {plan.validity} Days
                                        </Text>
                                        <Text type="secondary" className="text-xs">
                                            Validity
                                        </Text>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-3 text-center col-span-2">
                                        <Text strong className="block">
                                            {plan.price} Tk
                                        </Text>
                                        <Text type="secondary" className="text-xs">
                                            Price
                                        </Text>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <Text strong className="block mb-2">
                                        Features
                                    </Text>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(plan.features) &&
                                        plan.features.length > 0 ? (
                                            plan.features.map((feature, index) => (
                                                <Tag
                                                    key={index}
                                                    className="m-0"
                                                >
                                                    {feature}
                                                </Tag>
                                            ))
                                        ) : (
                                            <Text type="secondary">
                                                No features available
                                            </Text>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Popconfirm
                                        title="Delete Plan"
                                        description="Are you sure to delete this plan?"
                                        onConfirm={() => handleDelete(plan.id)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            size="middle"
                                            className="w-full"
                                        >
                                            Delete
                                        </Button>
                                    </Popconfirm>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="text-center rounded-xl">
                            <Text type="secondary">No plans found</Text>
                        </Card>
                    )}

                    {/* Mobile Pagination */}
                    {plans?.data?.length > 0 && (
                        <div className="pt-2 flex justify-center">
                            <Pagination
                                current={plans.current_page}
                                pageSize={plans.per_page}
                                total={plans.total}
                                showSizeChanger={false}
                                onChange={(page, pageSize) =>
                                    handleTableChange(
                                        { current: page, pageSize },
                                        {},
                                        {}
                                    )
                                }
                            />
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <Table
                        columns={columns}
                        dataSource={plans.data.map((plan) => ({
                            ...plan,
                            key: plan.id,
                        }))}
                        pagination={{
                            current: plans.current_page,
                            pageSize: plans.per_page,
                            total: plans.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} plans`,
                            pageSizeOptions: ["10", "20", "50", "100"],
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1000 }}
                        loading={plans.data.length === 0 && !filters.search}
                    />
                </div>
            </Card>
        </Authenticated>
    );
}