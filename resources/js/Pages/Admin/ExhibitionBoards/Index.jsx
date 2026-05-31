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
    EyeOutlined,
    DeleteOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    AppstoreOutlined,
    UserOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

export default function Index({ boards, filters = {}, auth }) {
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [rejectNote, setRejectNote] = useState("");

    const getImageUrl = (recordOrPath) => {
    if (!recordOrPath) {
        return "/placeholder-image.jpg";
    }

    if (typeof recordOrPath === "object") {
        if (recordOrPath.image_url) {
            return recordOrPath.image_url;
        }

        if (recordOrPath.image) {
            if (recordOrPath.image.startsWith("http")) {
                return recordOrPath.image;
            }

            return `/storage/${recordOrPath.image}`;
        }

        return "/placeholder-image.jpg";
    }

    if (recordOrPath.startsWith("http")) {
        return recordOrPath;
    }

    return `/storage/${recordOrPath}`;
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

    const handleSearch = (value) => {
        router.get(
            route("admin.exhibition-boards.index"),
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
            route("admin.exhibition-boards.index"),
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
            route("admin.exhibition-boards.index"),
            {},
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const approveBoard = (id) => {
        router.post(
            route("admin.exhibition-boards.approve", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Board approved successfully");
                },
                onError: () => {
                    message.error("Failed to approve board");
                },
            }
        );
    };

    const openRejectModal = (board) => {
        setSelectedBoard(board);
        setRejectNote("");
        setRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setSelectedBoard(null);
        setRejectNote("");
    };

    const submitRejectBoard = () => {
        if (!selectedBoard) return;

        router.post(
            route("admin.exhibition-boards.reject", selectedBoard.id),
            {
                admin_note: rejectNote,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Board rejected successfully");
                    closeRejectModal();
                },
                onError: () => {
                    message.error("Failed to reject board");
                },
            }
        );
    };

    const handleDelete = (id) => {
        router.delete(route("admin.exhibition-boards.destroy", id), {
            preserveScroll: true,
            onSuccess: () => {
                message.success("Board deleted successfully");
            },
            onError: () => {
                message.error("Failed to delete board");
            },
        });
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 70,
        },
        {
            title: "Board",
            key: "board",
            render: (_, record) => (
                <Space>
                    <Image
                        width={64}
                        height={54}
                        src={getImageUrl(record)}
                        fallback="/placeholder-image.jpg"
                        style={{
                            borderRadius: 8,
                            objectFit: "cover",
                            border: "1px solid #eee",
                        }}
                    />

                    <Space direction="vertical" size={0}>
                        <Text strong>{record.title}</Text>

                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Slug: {record.slug || "N/A"}
                        </Text>

                        {record.admin_note && (
                            <Tooltip title={record.admin_note}>
                                <Text type="danger" style={{ fontSize: 12 }}>
                                    Note:{" "}
                                    {record.admin_note.length > 30
                                        ? `${record.admin_note.slice(0, 30)}...`
                                        : record.admin_note}
                                </Text>
                            </Tooltip>
                        )}
                    </Space>
                </Space>
            ),
        },
        {
            title: "Owner",
            key: "owner",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>
                        <UserOutlined /> {record.owner?.name || "Unknown"}
                    </Text>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.owner?.email || ""}
                    </Text>
                </Space>
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
            title: "Active",
            dataIndex: "is_active",
            key: "is_active",
            render: (isActive) => (
                <Badge
                    status={isActive ? "success" : "default"}
                    text={isActive ? "Active" : "Inactive"}
                />
            ),
        },
        {
            title: "Stats",
            key: "stats",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>
                        <AppstoreOutlined /> Total Exhibitions:{" "}
                        <strong>{record.exhibitions_count || 0}</strong>
                    </Text>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Approved Exhibitions: {record.approved_exhibitions_count || 0}
                    </Text>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <TeamOutlined /> Member Requests:{" "}
                        {record.member_requests_count || 0}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Approved By",
            key: "approved_by",
            render: (_, record) =>
                record.approved_by ? (
                    <Space direction="vertical" size={0}>
                        <Text>{record.approved_by?.name || "Admin"}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.approved_at
                                ? new Date(record.approved_at).toLocaleString()
                                : ""}
                        </Text>
                    </Space>
                ) : (
                    <Text type="secondary">N/A</Text>
                ),
        },
        {
            title: "Action",
            key: "action",
            fixed: "right",
            width: 310,
            render: (_, record) => (
                <Space wrap>
                    {/* <Link href={route("admin.exhibition-boards.show", record.id)}>
                        <Button size="small" icon={<EyeOutlined />}>
                            View
                        </Button>
                    </Link> */}

                    {record.approval_status !== "approved" && (
                        <Popconfirm
                            title="Approve this board?"
                            description="After approval, this board can be used for exhibition posts."
                            okText="Approve"
                            cancelText="Cancel"
                            onConfirm={() => approveBoard(record.id)}
                        >
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                            >
                                Approve
                            </Button>
                        </Popconfirm>
                    )}

                    {record.approval_status !== "rejected" && (
                        <Button
                            size="small"
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => openRejectModal(record)}
                        >
                            Reject
                        </Button>
                    )}

                    <Popconfirm
                        title="Delete this board?"
                        description="This action cannot be undone."
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const boardData = boards?.data || [];

    return (
        <Authenticated user={auth.user} header="Exhibition Boards">
            <Card>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 16,
                        marginBottom: 24,
                    }}
                >
                    <div>
                        <Title level={3} style={{ marginBottom: 4 }}>
                            Exhibition Boards
                        </Title>

                        <Text type="secondary">
                            Admin can approve/reject boards and manage board requests.
                        </Text>
                    </div>
                </div>

                <Card size="small" style={{ marginBottom: 20 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={10}>
                            <Search
                                placeholder="Search by board title or description"
                                allowClear
                                enterButton={<SearchOutlined />}
                                defaultValue={filters.search || ""}
                                onSearch={handleSearch}
                            />
                        </Col>

                        <Col xs={24} md={6}>
                            <Select
                                style={{ width: "100%" }}
                                placeholder="Approval Status"
                                value={filters.approval_status || "all"}
                                onChange={(value) =>
                                    handleFilter("approval_status", value)
                                }
                            >
                                <Option value="all">All Status</Option>
                                <Option value="pending">Pending</Option>
                                <Option value="approved">Approved</Option>
                                <Option value="rejected">Rejected</Option>
                            </Select>
                        </Col>

                        <Col xs={24} md={4}>
                            <Button
                                icon={<FilterOutlined />}
                                block
                                onClick={() => {
                                    router.get(
                                        route("admin.exhibition-boards.index"),
                                        filters,
                                        {
                                            preserveState: true,
                                            replace: true,
                                        }
                                    );
                                }}
                            >
                                Filter
                            </Button>
                        </Col>

                        <Col xs={24} md={4}>
                            <Button
                                icon={<ReloadOutlined />}
                                block
                                onClick={resetFilters}
                            >
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card>

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={boardData}
                    pagination={{
                        current: boards?.current_page || 1,
                        pageSize: boards?.per_page || 15,
                        total: boards?.total || 0,
                        showSizeChanger: false,
                        onChange: (page) => {
                            router.get(
                                route("admin.exhibition-boards.index"),
                                {
                                    ...filters,
                                    page,
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
                title="Reject Board"
                open={rejectModalOpen}
                onCancel={closeRejectModal}
                onOk={submitRejectBoard}
                okText="Reject"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
            >
                <Form layout="vertical">
                    <Form.Item label="Board">
                        <Input value={selectedBoard?.title || ""} disabled />
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