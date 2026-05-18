import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Link, router } from "@inertiajs/react";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

import {
    CommentOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    FilterOutlined,
    FireOutlined,
    LikeOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    UserOutlined,
} from "@ant-design/icons";
import {
    Badge,
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

export default function Index({ posts, filters, auth }) {
    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = (id) => {
        router.delete(route("admin.communities.destroy", id), {
            preserveScroll: true,
            onSuccess: () => {
                message.success("Community post deleted successfully");
            },
            onError: () => {
                message.error("Error deleting community post");
            },
        });
    };

    // Search handler
    const handleSearch = (value) => {
        router.get(
            route("admin.communities.index"),
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
            route("admin.communities.index"),
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
            route("admin.communities.index"),
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
            route("admin.communities.index"),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case "published":
                return "green";
            case "draft":
                return "orange";
            case "archived":
                return "red";
            default:
                return "default";
        }
    };

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case "published":
                return "Published";
            case "draft":
                return "Draft";
            case "archived":
                return "Archived";
            default:
                return status;
        }
    };

    const columns = [
        {
            title: "ID",
            key: "id",
            render: (text, record, index) => index + 1,
            width: 80,
        },

        {
            title: "Post Title",
            dataIndex: "title",
            key: "title",
            sorter: true,
            sortOrder:
                filters.sort_field === "title"
                    ? filters.sort_direction === "asc"
                        ? "ascend"
                        : "descend"
                    : false,
            render: (text, record) => (
                <Space direction="vertical" size={2}>
                    <Text strong className="text-base">
                        {text}
                    </Text>
                    <Text type="secondary" className="text-xs">
                        by {record.user?.name}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Content Preview",
            dataIndex: "content",
            key: "content",
            render: (text) => (
                <Text type="secondary" ellipsis={{ tooltip: text }}>
                    {text?.substring(0, 100)}...
                </Text>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            sorter: true,
            sortOrder:
                filters.sort_field === "status"
                    ? filters.sort_direction === "asc"
                        ? "ascend"
                        : "descend"
                    : false,
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
        },
        {
            title: "Author",
            key: "author",
            render: (_, record) => (
                <Space>
                    <UserOutlined />
                    <Text>{record.user?.name}</Text>
                </Space>
            ),
        },
        {
            title: "Stats",
            key: "stats",
            width: 200,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Views">
                        <Badge count={record.views} showZero>
                            <EyeOutlined
                                style={{ fontSize: "16px", color: "#08c" }}
                            />
                        </Badge>
                    </Tooltip>
                    <Tooltip title="Likes">
                        <Badge count={record.likes_count} showZero>
                            <LikeOutlined
                                style={{ fontSize: "16px", color: "#eb2f96" }}
                            />
                        </Badge>
                    </Tooltip>
                    <Tooltip title="Comments">
                        <Badge count={record.comments_count} showZero>
                            <CommentOutlined
                                style={{ fontSize: "16px", color: "#52c41a" }}
                            />
                        </Badge>
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: "Featured Image",
            dataIndex: "image",
            key: "image",
            width: 100,
            render: (image) =>
                image ? (
                    <img
                        src={getS3PublicUrl(image)}
                        alt="Post"
                        style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "contain",
                            borderRadius: "4px",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "50px",
                            height: "50px",
                            backgroundColor: "#f0f0f0",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text type="secondary" className="text-xs">
                            No Image
                        </Text>
                    </div>
                ),
        },
        {
            title: "Created At",
            dataIndex: "created_at",
            key: "created_at",
            sorter: true,
            sortOrder:
                filters.sort_field === "created_at"
                    ? filters.sort_direction === "asc"
                        ? "ascend"
                        : "descend"
                    : false,
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: "Actions",
            key: "actions",
            fixed: "right",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Post">
                        <Link href={route("admin.communities.edit", record.id)}>
                            <Button
                                icon={<EditOutlined />}
                                size="small"
                                type="primary"
                                ghost
                            />
                        </Link>
                    </Tooltip>

                    <Popconfirm
                        title="Delete Post"
                        description="Are you sure to delete this post? This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                        okType="danger"
                    >
                        <Tooltip title="Delete Post">
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

    // Calculate total stats for the header
    const totalStats = {
        totalPosts: posts.total,
        totalViews: posts.data.reduce((sum, post) => sum + post.views, 0),
        totalLikes: posts.data.reduce((sum, post) => sum + post.likes_count, 0),
        totalComments: posts.data.reduce(
            (sum, post) => sum + post.comments_count,
            0,
        ),
    };

    return (
        <Authenticated user={auth.user} header="Community Management">
            <Card>
                {/* Header Section */}
                <div className="flex sm:flex-row flex-col gap-3 justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <FireOutlined className="mr-2" />
                            Community
                        </Title>
                        <Text type="secondary">
                            Manage and moderate community posts and discussions
                        </Text>
                    </div>

                    <Link href={route("admin.communities.create")}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                        >
                            Create Post
                        </Button>
                    </Link>
                </div>

                {/* Stats Overview */}
                <Row gutter={16} className="mb-6">
                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#1890ff", margin: 0 }}
                            >
                                {totalStats.totalPosts}
                            </Title>
                            <Text type="secondary">Total Posts</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#52c41a", margin: 0 }}
                            >
                                {totalStats.totalViews}
                            </Title>
                            <Text type="secondary">Total Views</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#eb2f96", margin: 0 }}
                            >
                                {totalStats.totalLikes}
                            </Title>
                            <Text type="secondary">Total Likes</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#fa8c16", margin: 0 }}
                            >
                                {totalStats.totalComments}
                            </Title>
                            <Text type="secondary">Total Comments</Text>
                        </Card>
                    </Col>
                </Row>

                {/* Filters Section */}
                <Card size="small" className="mb-4">
                    <div className="flex items-center mb-4">
                        <FilterOutlined className="mr-2" />
                        <Text strong>Filters & Search</Text>
                    </div>

                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search by title or content..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4}>
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
                                <Option value="published">Published</Option>
                                <Option value="draft">Draft</Option>
                                <Option value="archived">Archived</Option>
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

                {/* Posts Table */}
                <Table
                    columns={columns}
                    dataSource={posts.data.map((post) => ({
                        ...post,
                        key: post.id,
                    }))}
                    pagination={{
                        current: posts.current_page,
                        pageSize: posts.per_page,
                        total: posts.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} posts`,
                        pageSizeOptions: ["10", "20", "50", "100"],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    loading={posts.data.length === 0 && !filters.search}
                />
            </Card>
        </Authenticated>
    );
}
