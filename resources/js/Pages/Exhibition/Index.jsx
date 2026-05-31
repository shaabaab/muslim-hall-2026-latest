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
    Image,
    Modal,
    Form,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined,
    ReloadOutlined,
    ShoppingOutlined,
    FileTextOutlined,
    PictureOutlined,
    EditFilled,
    CameraOutlined,
    StarOutlined,
    StarFilled,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

export default function Index({ exhibitions, filters = {}, auth }) {
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedExhibition, setSelectedExhibition] = useState(null);
    const [rejectNote, setRejectNote] = useState("");

    const getImageUrl = (record) => {
        if (!record) {
            return "/placeholder-image.jpg";
        }

        if (record.image_url) {
            return record.image_url;
        }

        if (record.image) {
            if (
                record.image.startsWith("http://") ||
                record.image.startsWith("https://")
            ) {
                return record.image;
            }

            if (record.image.startsWith("/storage/")) {
                return record.image;
            }

            if (record.image.startsWith("storage/")) {
                return `/${record.image}`;
            }

            return `/storage/${record.image}`;
        }

        return "/placeholder-image.jpg";
    };

    const handleDelete = (id) => {
        router.delete(route("admin.exhibitions.destroy", id), {
            preserveScroll: true,
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
            route("admin.exhibitions.index"),
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
            route("admin.exhibitions.index"),
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

    const resetFilters = () => {
        router.get(
            route("admin.exhibitions.index"),
            {},
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const approveExhibition = (id) => {
        router.post(
            route("admin.exhibitions.approve", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Exhibition approved successfully");
                },
                onError: () => {
                    message.error("Failed to approve exhibition");
                },
            }
        );
    };

    const openRejectModal = (record) => {
        setSelectedExhibition(record);
        setRejectNote("");
        setRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setSelectedExhibition(null);
        setRejectNote("");
        setRejectModalOpen(false);
    };

    const submitRejectExhibition = () => {
        if (!selectedExhibition) {
            return;
        }

        router.post(
            route("admin.exhibitions.reject", selectedExhibition.id),
            {
                admin_note: rejectNote,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Exhibition rejected successfully");
                    closeRejectModal();
                },
                onError: () => {
                    message.error("Failed to reject exhibition");
                },
            }
        );
    };

    const toggleFeatured = (id, currentStatus) => {
        router.post(
            route("admin.exhibitions.toggle-featured", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success(
                        `Item ${currentStatus ? "unfeatured" : "featured"} successfully`
                    );
                },
                onError: () => {
                    message.error("Failed to update featured status");
                },
            }
        );
    };

    const markAsSold = (id) => {
        router.post(
            route("admin.exhibitions.mark-sold", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Item marked as sold");
                },
                onError: () => {
                    message.error("Failed to mark item as sold");
                },
            }
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

    const getApprovalColor = (status) => {
        switch (status) {
            case "approved":
                return "green";
            case "rejected":
                return "red";
            case "pending":
                return "orange";
            default:
                return "default";
        }
    };

    const getApprovalIcon = (status) => {
        switch (status) {
            case "approved":
                return <CheckCircleOutlined />;
            case "rejected":
                return <CloseCircleOutlined />;
            case "pending":
                return <ClockCircleOutlined />;
            default:
                return <ClockCircleOutlined />;
        }
    };

    const stripHtml = (html) => {
        if (!html) {
            return "";
        }

        return String(html).replace(/<[^>]*>/g, "");
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
                        alt={stripHtml(record.title) || "Item"}
                        style={{
                            borderRadius: "4px",
                            objectFit: "cover",
                        }}
                        fallback="/placeholder-image.jpg"
                    />

                    <Space direction="vertical" size={2}>
                        <Space align="start">
                            <Text strong>
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: record.title || "",
                                    }}
                                />
                            </Text>

                            {record.is_featured && (
                                <Tooltip title="Featured">
                                    <StarFilled style={{ color: "#faad14" }} />
                                </Tooltip>
                            )}
                        </Space>

                        <Text type="secondary" className="text-xs">
                            by {record.user?.name || "Unknown"}
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
                        {type
                            ? type.charAt(0).toUpperCase() + type.slice(1)
                            : "N/A"}
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
                <Space direction="vertical" size={2}>
                    <Badge
                        status={record.is_available ? "success" : "default"}
                        text={record.is_available ? "Available" : "Not Available"}
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
                        👁️ {record.views || 0} views
                    </Text>

                    <Text type="secondary" className="text-xs">
                        ❤️ {record.likes_count || 0} likes
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
                    {status
                        ? status.charAt(0).toUpperCase() + status.slice(1)
                        : "N/A"}
                </Tag>
            ),
        },
        {
            title: "Approval",
            dataIndex: "approval_status",
            key: "approval_status",
            render: (status) => (
                <Tag color={getApprovalColor(status)} icon={getApprovalIcon(status)}>
                    {status ? status.toUpperCase() : "PENDING"}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 150,
            fixed: "right",
            render: (_, record) => (
                <Space size="small" wrap>
                    <Tooltip title="View">
                        <Link href={route("admin.exhibitions.show", record.id)}>
                            <Button icon={<EyeOutlined />} size="small" />
                        </Link>
                    </Tooltip>

                    <Tooltip title="Edit">
                        <Link href={route("admin.exhibitions.edit", record.id)}>
                            <Button icon={<EditOutlined />} size="small" />
                        </Link>
                    </Tooltip>

                    {record.approval_status !== "approved" && (
                        <Popconfirm
                            title="Approve this exhibition?"
                            description="After approval, this item will be approved."
                            okText="Approve"
                            cancelText="Cancel"
                            onConfirm={() => approveExhibition(record.id)}
                        >
                            <Tooltip title="Approve">
                                <Button
                                    icon={<CheckCircleOutlined />}
                                    size="small"
                                    type="primary"
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}

                    {record.approval_status !== "rejected" && (
                        <Tooltip title="Reject">
                            <Button
                                icon={<CloseCircleOutlined />}
                                size="small"
                                danger
                                onClick={() => openRejectModal(record)}
                            />
                        </Tooltip>
                    )}

                    {/* <Tooltip
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
                    )} */}

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

    const exhibitionData = exhibitions?.data || [];

    const stats = {
        total: exhibitions?.total || 0,
        published: exhibitionData.filter((item) => item.status === "published").length,
        sold: exhibitionData.filter((item) => item.status === "sold").length,
        featured: exhibitionData.filter((item) => item.is_featured).length,
        pending: exhibitionData.filter(
            (item) => !item.approval_status || item.approval_status === "pending"
        ).length,
        approved: exhibitionData.filter(
            (item) => item.approval_status === "approved"
        ).length,
        rejected: exhibitionData.filter(
            (item) => item.approval_status === "rejected"
        ).length,
        totalValue: exhibitionData.reduce(
            (sum, item) => sum + (parseFloat(item.price) || 0),
            0
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
                            Manage products, art, photography, documents and crafts
                        </Text>
                    </div>

                    <Link href={route("admin.exhibitions.create")}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                        >
                            Add Item
                        </Button>
                    </Link>
                </div>

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
                                {stats.approved}
                            </Title>
                            <Text type="secondary">Approved</Text>
                        </Card>
                    </Col>

                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#faad14", margin: 0 }}
                            >
                                {stats.pending}
                            </Title>
                            <Text type="secondary">Pending</Text>
                        </Card>
                    </Col>

                    <Col xs={24} sm={6}>
                        <Card size="small" className="text-center">
                            <Title
                                level={3}
                                style={{ color: "#ff4d4f", margin: 0 }}
                            >
                                {stats.rejected}
                            </Title>
                            <Text type="secondary">Rejected</Text>
                        </Card>
                    </Col>
                </Row>

                <Card size="small" className="mb-4">
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={7}>
                            <Search
                                placeholder="Search by title, description..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search || ""}
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
                                onChange={(value) => handleFilter("type", value)}
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
                                onChange={(value) => handleFilter("status", value)}
                            >
                                <Option value="published">Published</Option>
                                <Option value="draft">Draft</Option>
                                <Option value="sold">Sold</Option>
                                <Option value="archived">Archived</Option>
                            </Select>
                        </Col>

                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Approval"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.approval_status || null}
                                onChange={(value) =>
                                    handleFilter("approval_status", value)
                                }
                            >
                                <Option value="pending">Pending</Option>
                                <Option value="approved">Approved</Option>
                                <Option value="rejected">Rejected</Option>
                            </Select>
                        </Col>

                        <Col xs={12} sm={6} md={3}>
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

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={exhibitionData.map((item) => ({
                        ...item,
                        key: item.id,
                    }))}
                    pagination={{
                        current: exhibitions?.current_page || 1,
                        pageSize: exhibitions?.per_page || 12,
                        total: exhibitions?.total || 0,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`,
                        onChange: (page, pageSize) => {
                            router.get(
                                route("admin.exhibitions.index"),
                                {
                                    ...filters,
                                    page,
                                    per_page: pageSize,
                                },
                                {
                                    preserveState: true,
                                    replace: true,
                                }
                            );
                        },
                    }}
                    scroll={{ x: 1300 }}
                />
            </Card>

            <Modal
                title="Reject Exhibition"
                open={rejectModalOpen}
                onCancel={closeRejectModal}
                onOk={submitRejectExhibition}
                okText="Reject"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
            >
                <Form layout="vertical">
                    <Form.Item label="Exhibition">
                        <Input
                            value={stripHtml(selectedExhibition?.title || "")}
                            disabled
                        />
                    </Form.Item>

                    <Form.Item label="Admin Note">
                        <TextArea
                            rows={4}
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Write rejection reason or admin note..."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Authenticated>
    );
}