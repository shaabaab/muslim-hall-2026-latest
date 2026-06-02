import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Link, router } from "@inertiajs/react";

import {
    DeleteOutlined,
    EditOutlined,
    EyeFilled,
    EyeOutlined,
    FilterOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {
    Button,
    Card,
    Col,
    Input,
    message,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const STATUS_PENDING = "pending";
const STATUS_APPROVED = "approved";
const STATUS_REJECTED = "rejected";

const statusOptions = [
    { label: "Pending", value: STATUS_PENDING, color: "blue" },
    { label: "Approved", value: STATUS_APPROVED, color: "green" },
    { label: "Rejected", value: STATUS_REJECTED, color: "red" },
];

export default function Index({ entries, filters, auth }) {
    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };
    console.log(entries);
    // Search handler
    const handleSearch = (value) => {
        router.get(
            route("admin.entries.index"),
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

    // Filter handler
    const handleFilter = (key, value) => {
        router.get(
            route("admin.entries.index"),
            {
                ...filters,
                [key]: value,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Table change handler (pagination, sorting)
    const handleTableChange = (pagination, filters, sorter) => {
        router.get(
            route("admin.entries.index"),
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
            },
        );
    };

    // Reset all filters
    const resetFilters = () => {
        router.get(
            route("admin.entries.index"),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = (id) => {
        router.delete(route("admin.entries.destroy", id), {
            onBefore: () => {
                console.log(id);
            },
            onConfirm: () => {
                console.log("Confirmed");
            },
            onSuccess: () => {
                message.success("Language deleted successfully");
            },
            onError: () => {
                message.error("Error deleting language");
            },
        });
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
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
            title: "Total Vote",
            dataIndex: "total_votes",
            key: "total_votes",
            render: (text) => <Text>{text}</Text>,
        },

        {
            title: " Status",
            dataIndex: "status",
            key: "status",
            render: (text) => (
                <Space size="small">
                    {statusOptions.map((option) =>
                        option.value === text ? (
                            <Tag color={option.color} key={option.value}>
                                {option.label}
                            </Tag>
                        ) : null,
                    )}
                </Space>
            ),
        },
        {
            title: "Disqualified",
            dataIndex: "is_disqualified",
            key: "is_disqualified",
            render: (value) => (
                <Tag color={value === 1 ? "red" : "green"}>
                    {value === 1 ? "Disqualified" : "No"}
                </Tag>
            ),
        },
        {
            title: "Contest title",
            key: "title",
            render: (_, record) => (
                <Text>
                    {record.contest ? `${record.contest.title}` : "N/A"}
                </Text>
            ),
        },

        {
            title: "User Info",
            key: "user_id",
            render: (_, record) => (
                <Text>
                    {record.user
                        ? `${record.user.name} (${record.user.email})`
                        : "N/A"}
                </Text>
            ),
        },

        {
            title: "Media",
            dataIndex: "media_path",
            key: "media_path",
            render: (text) => {
                if (!text) return "N/A";

                const fileUrl = `/storage/${text}`;
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(text);
                const isVideo = /\.(mp4|webm|ogg)$/i.test(text);

                return (
                    <>
                        {isImage ? (
                            <img
                                src={fileUrl}
                                alt="Entry Media"
                                style={{
                                    width: 60,
                                    height: 60,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                                }}
                            />
                        ) : isVideo ? (
                            <video
                                src={fileUrl}
                                controls
                                style={{
                                    width: 60,
                                    height: 60,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                }}
                            />
                        ) : (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download File
                            </a>
                        )}
                    </>
                );
            },
        },

        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Entry Reviews">
                        <Link href={route("admin.entry.reviews", record.id)}>
                            <Button
                                type="default"
                                icon={<EyeFilled />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>

                    <Tooltip title="Edit Entry">
                        <Link href={route("admin.entries.edit", record.id)}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>

                    <Tooltip title="View Entry">
                        <Link href={route("admin.entries.show", record.id)}>
                            <Button
                                type="default"
                                icon={<EyeOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>

                    <Popconfirm
                        title="Delete Entry"
                        description="Are you sure to delete this Entry?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Entry">
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
        <Authenticated user={auth.user} header="Entry Management">
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Entries
                        </Title>
                        <Text type="secondary">
                            Manage your application entries admin
                        </Text>
                    </div>

                    <Link href={route("admin.entries.create")}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                        >
                            Add Entry
                        </Button>
                    </Link>
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

                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Select Status"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.status || null}
                                onChange={(value) =>
                                    handleFilter("status", value)
                                }
                                optionLabelProp="label"
                            >
                                {statusOptions.map((status) => (
                                    <Option
                                        key={status.value}
                                        value={status.value}
                                        label={status.label}
                                    >
                                        <span
                                            style={{
                                                color: status.color,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {status.label}
                                        </span>
                                    </Option>
                                ))}
                            </Select>
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
                    dataSource={entries.data.map((entry) => ({
                        ...entry,
                        key: entry.id,
                    }))}
                    pagination={{
                        current: entries.current_page,
                        pageSize: entries.per_page,
                        total: entries.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} entries`,
                        pageSizeOptions: ["10", "20", "50", "100"],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                    loading={entries.data.length === 0 && !filters.search}
                />
            </Card>
        </Authenticated>
    );
}
