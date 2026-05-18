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
    Badge,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    MailOutlined,
    UserOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { getS3PublicUrl } from "../../Utils/s3Helpers";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ sponsors, filters, auth }) {
    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = (id) => {
        router.delete(route("admin.sponsors.destroy", id), {
            onSuccess: () => {
                message.success("Sponsor deleted successfully");
            },
            onError: () => {
                message.error("Error deleting sponsor");
            },
        });
    };

    // Verify/Unverify email
    const handleEmailVerification = (id, verify = true) => {
        const url = verify
            ? route("admin.sponsors.verify-email", id)
            : route("admin.sponsors.unverify-email", id);

        router.post(
            url,
            {},
            {
                onSuccess: () => {
                    message.success(
                        `Sponsor email ${verify ? "verified" : "unverified"} successfully`,
                    );
                },
                onError: () => {
                    message.error("Error updating email verification");
                },
            },
        );
    };

    // Search handler
    const handleSearch = (value) => {
        router.get(
            route("admin.sponsors.index"),
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
            route("admin.sponsors.index"),
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
            route("admin.sponsors.index"),
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
            route("admin.sponsors.index"),
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
            sorter: true,
            sortOrder:
                filters.sort_field === "id"
                    ? filters.sort_direction === "asc"
                        ? "ascend"
                        : "descend"
                    : false,
            width: 80,
        },
        {
            title: "Photo",
            dataIndex: "photo",
            key: "photo",
            width: 80,
            render: (photo) =>
                photo ? (
                    <img
                        src={getS3PublicUrl(photo)}
                        alt="Sponsor"
                        style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "50%",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            backgroundColor: "#f0f0f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <UserOutlined />
                    </div>
                ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: true,
            sortOrder:
                filters.sort_field === "name"
                    ? filters.sort_direction === "asc"
                        ? "ascend"
                        : "descend"
                    : false,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            sorter: true,
            sortOrder:
                filters.sort_field === "email"
                    ? filters.sort_direction === "asc"
                        ? "ascend"
                        : "descend"
                    : false,
            render: (email, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{email}</Text>
                    <Badge
                        dot
                        color={record.email_verified_at ? "green" : "red"}
                        text={
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                                {record.email_verified_at
                                    ? "Verified"
                                    : "Unverified"}
                            </Text>
                        }
                    />
                </Space>
            ),
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
            render: (phone, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{phone || "N/A"}</Text>
                    {record.phone_alternative && (
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                            Alt: {record.phone_alternative}
                        </Text>
                    )}
                </Space>
            ),
        },

        {
            title: "Website",
            dataIndex: "website",
            key: "website",
            render: (text) =>
                text ? (
                    <a href={text} target="_blank" rel="noopener noreferrer">
                        <EyeOutlined /> Visit
                    </a>
                ) : (
                    <Text type="secondary">N/A</Text>
                ),
        },
        {
            title: "Email Verified",
            dataIndex: "email_verified_at",
            key: "email_verified_at",
            sorter: true,
            sortOrder:
                filters.sort_field === "email_verified_at"
                    ? filters.sort_direction === "asc"
                        ? "ascend"
                        : "descend"
                    : false,
            render: (date) => (
                <Tag
                    icon={
                        date ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                    }
                    color={date ? "green" : "red"}
                >
                    {date ? "Verified" : "Unverified"}
                </Tag>
            ),
        },
        {
            title: "Created At",
            dataIndex: "created_at",
            key: "created_at",
            sorter: true,
            render: (date) => (
                <Text>{new Date(date).toLocaleDateString()}</Text>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            fixed: "right",
            width: 100,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Sponsor">
                        <Link href={route("admin.sponsors.edit", record.id)}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>
                    <Popconfirm
                        title="Delete Sponsor"
                        description="Are you sure to delete this sponsor? This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                        okType="danger"
                    >
                        <Tooltip title="Delete Sponsor">
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
        <Authenticated user={auth.user} header="Sponsors Management">
            <Card>
                {/* Header Section */}
                <div className="flex sm:flex-row flex-col gap-3 justify-between items-center mb-6">
                    <div className="sm:text-left text-center">
                        <Title level={2} className="mb-2">
                            Sponsors
                        </Title>
                        <Text type="secondary">
                            Manage your application sponsors and their accounts
                        </Text>
                    </div>

                    <Link href={route("admin.sponsors.create")}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                        >
                            Add Sponsor
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
                                placeholder="Search by name, email, or phone..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Email Verified"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.email_verified || null}
                                onChange={(value) =>
                                    handleFilter("email_verified", value)
                                }
                            >
                                <Option value="verified">Verified</Option>
                                <Option value="unverified">Unverified</Option>
                            </Select>
                        </Col>
                        <Col xs={12} sm={6} md={4}>
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

                {/* Sponsors Table */}
                <Table
                    columns={columns}
                    dataSource={sponsors.data.map((sponsor) => ({
                        ...sponsor,
                        key: sponsor.id,
                    }))}
                    pagination={{
                        current: sponsors.current_page,
                        pageSize: sponsors.per_page,
                        total: sponsors.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} sponsors`,
                        pageSizeOptions: ["10", "20", "50", "100"],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </Card>
        </Authenticated>
    );
}
