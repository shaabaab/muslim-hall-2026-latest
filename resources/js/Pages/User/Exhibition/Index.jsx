import { Link, router } from "@inertiajs/react";
import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
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
    Image,
    Switch,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    ShoppingOutlined,
    FileTextOutlined,
    PictureOutlined,
    EditFilled,
    CameraOutlined,
    StarOutlined,
    StarFilled,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ exhibitions, filters, auth }) {
    const getImageUrl = (record) => {
        if (!record) {
            return "/placeholder-image.jpg";
        }

        if (record.image_url) {
            return record.image_url;
        }

        if (record.image) {
            if (record.image.startsWith("http")) {
                return record.image;
            }

            return `/storage/${record.image}`;
        }

        return "/placeholder-image.jpg";
    };
    const handleDelete = (id) => {
        router.delete(route("user.exhibitions.destroy", id), {
            onSuccess: () => {
                message.success("Exhibition item deleted successfully");
            },
            onError: () => {
                message.error("Error deleting exhibition item");
            },
        });
    };

    const handleSearch = (value) => {
        router.get(
            route("user.exhibitions.index"),
            {
                ...filters,
                search: value,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleFilter = (key, value) => {
        router.get(
            route("user.exhibitions.index"),
            {
                ...filters,
                [key]: value,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        router.get(
            route("user.exhibitions.index"),
            {},
            { preserveState: true, replace: true },
        );
    };

    const toggleFeatured = (id, currentStatus) => {
        router.post(
            route("user.exhibitions.toggle-featured", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success(
                        `Item ${currentStatus ? "unfeatured" : "featured"} successfully`,
                    );
                },
            },
        );
    };

    const markAsSold = (id) => {
        router.post(
            route("user.exhibitions.mark-sold", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Item marked as sold");
                },
            },
        );
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "product":
                return <ShoppingOutlined style={{ color: "#1890ff" }} />;
            case "document":
                return <FileTextOutlined style={{ color: "#52c41a" }} />;
            case "art":
                return <PictureOutlined style={{ color: "#fa8c16" }} />;
            case "photography":
                return <CameraOutlined style={{ color: "#eb2f96" }} />;
            case "craft":
                return <EditFilled style={{ color: "#722ed1" }} />;
            default:
                return <ShoppingOutlined />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "product":
                return "blue";
            case "document":
                return "green";
            case "art":
                return "orange";
            case "photography":
                return "pink";
            case "craft":
                return "purple";
            default:
                return "default";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "published":
                return "green";
            case "draft":
                return "orange";
            case "sold":
                return "red";
            case "archived":
                return "gray";
            default:
                return "default";
        }
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
        },
        {
            title: "Item",
            key: "item",
            render: (_, record) => (
                <Space>
                    <Image
                        width={50}
                        height={50}
                        src={getImageUrl(record)}
                        alt={
                            record.title
                                ? record.title.replace(/<[^>]*>/g, "")
                                : "Item"
                        }
                        style={{ borderRadius: "4px", objectFit: "cover" }}
                        fallback="/placeholder-image.jpg"
                    />

                    <Space direction="vertical" size={2}>
                        <Space align="start">
                            <div
                                style={{
                                    fontWeight: 600,
                                    lineHeight: "20px",
                                    maxWidth: "260px",
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: record.title || "",
                                }}
                            />

                            {record.is_featured && (
                                <Tooltip title="Featured">
                                    <StarFilled style={{ color: "#faad14" }} />
                                </Tooltip>
                            )}
                        </Space>

                        <Text type="secondary" className="text-xs">
                            by {record.user?.name}
                        </Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (type) => (
                <Space>
                    {getTypeIcon(type)}
                    <Tag color={getTypeColor(type)}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Tag>
                </Space>
            ),
        },
        {
            title: "Price",
            key: "price",
            render: (_, record) =>
                record.price ? (
                    <Text strong>
                        {record.currency}{" "}
                        {parseFloat(record.price).toLocaleString()}
                    </Text>
                ) : (
                    <Text type="secondary">Free</Text>
                ),
        },
        {
            title: "Availability",
            key: "availability",
            render: (_, record) => (
                <Space>
                    <Badge
                        status={record.is_available ? "success" : "default"}
                        text={
                            record.is_available ? "Available" : "Not Available"
                        }
                    />
                    {record.status === "sold" && <Tag color="red">Sold</Tag>}
                </Space>
            ),
        },
        {
            title: "Stats",
            key: "stats",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text type="secondary" className="text-xs">
                        👁️ {record.views} views
                    </Text>
                    <Text type="secondary" className="text-xs">
                        ❤️ {record.likes_count} likes
                    </Text>
                </Space>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 200,
            render: (_, record) => (
                <Space size="small">
                    {/* <Tooltip title="View">
                        <Link href={route("user.exhibitions.show", record.id)}>
                            <Button icon={<EyeOutlined />} size="small" />
                        </Link>
                    </Tooltip> */}

                    <Tooltip title="Edit">
                        <Link href={route("user.exhibitions.edit", record.id)}>
                            <Button icon={<EditOutlined />} size="small" />
                        </Link>
                    </Tooltip>

                    <Tooltip
                        title={record.is_featured ? "Unfeature" : "Feature"}
                    >
                        <Button
                            icon={
                                record.is_featured ? (
                                    <StarFilled />
                                ) : (
                                    <StarOutlined />
                                )
                            }
                            size="small"
                            type={record.is_featured ? "primary" : "default"}
                            onClick={() =>
                                toggleFeatured(record.id, record.is_featured)
                            }
                        />
                    </Tooltip>

                    {record.is_available && record.status !== "sold" && (
                        <Tooltip title="Mark as Sold">
                            <Button
                                type="dashed"
                                size="small"
                                onClick={() => markAsSold(record.id)}
                            >
                                Sold
                            </Button>
                        </Tooltip>
                    )}

                    <Popconfirm
                        title="Delete Item"
                        description="Are you sure to delete this exhibition item?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete">
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

    // Calculate statistics
    const stats = {
        total: exhibitions.total,
        published: exhibitions.data.filter(
            (item) => item.status === "published",
        ).length,
        sold: exhibitions.data.filter((item) => item.status === "sold").length,
        featured: exhibitions.data.filter((item) => item.is_featured).length,
        totalValue: exhibitions.data.reduce(
            (sum, item) => sum + (parseFloat(item.price) || 0),
            0,
        ),
    };

    return (
        <Authenticated user={auth.user} header="Exhibition Management">
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between items-center mb-6">
                    <div className="sm:text-left text-center">
                        <Title level={2} className="mb-2">
                            Exhibition Gallery
                        </Title>
                        <Text type="secondary">
                            Manage products, art, photography, documents and
                            crafts
                        </Text>
                    </div>
                    <Link href={route("user.exhibitions.create")}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                        >
                            Add Item
                        </Button>
                    </Link>
                </div>

                {/* Statistics */}
                <Row gutter={16} className="mb-6">
                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#1890ff", margin: 0 }}
                            >
                                {stats.total}
                            </Title>
                            <Text type="secondary">Total Items</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#52c41a", margin: 0 }}
                            >
                                {stats.published}
                            </Title>
                            <Text type="secondary">Published</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#faad14", margin: 0 }}
                            >
                                {stats.featured}
                            </Title>
                            <Text type="secondary">Featured</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#ff4d4f", margin: 0 }}
                            >
                                {stats.sold}
                            </Title>
                            <Text type="secondary">Sold</Text>
                        </Card>
                    </Col>
                </Row>

                {/* Filters */}
                <Card size="small" className="mb-4">
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
                                placeholder="Type"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.type || null}
                                onChange={(value) =>
                                    handleFilter("type", value)
                                }
                            >
                                <Option value="product">Product</Option>
                                <Option value="document">Document</Option>
                                <Option value="art">Art</Option>
                                <Option value="photography">Photography</Option>
                                <Option value="craft">Craft</Option>
                            </Select>
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
                                <Option value="sold">Sold</Option>
                                <Option value="archived">Archived</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Button
                                icon={<ReloadOutlined />}
                                size="large"
                                onClick={resetFilters}
                                style={{ width: "100%" }}
                            >
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Table */}
                <Table
                    columns={columns}
                    dataSource={exhibitions.data.map((item) => ({
                        ...item,
                        key: item.id,
                    }))}
                    pagination={{
                        current: exhibitions.current_page,
                        pageSize: exhibitions.per_page,
                        total: exhibitions.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`,
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>
        </Authenticated>
    );
}
